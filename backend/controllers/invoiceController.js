const invoiceModel = require('../models/invoiceModel');
const profitTrackerModel = require('../models/profitTrackerModel');
const customerFlightModel = require('../models/customersFlightsModel');

exports.getInvoices = async (req, res) => {
  try {
    const invoices = await invoiceModel.getAllInvoices();
    
    // Dynamically update amounts and QTY for Pending invoices
    const updatedInvoices = await Promise.all(invoices.map(async (inv) => {
      if (inv.status === 'Pending' && inv.customerFlightIds) {
        let currentTotal = 0;
        let currentQty = 0;

        // Try to find a group profit record for this invoice number first
        const groupProfit = await profitTrackerModel.getProfitByInvoiceNo(inv.invoiceNo);
        if (groupProfit && groupProfit.isManual) {
            return { ...inv, amount: Number(groupProfit.sell || 0), qty: Number(groupProfit.qty || 1) };
        }

        // Fallback: Sum individual CF IDs
        try {
          const ids = typeof inv.customerFlightIds === 'string' ? JSON.parse(inv.customerFlightIds) : inv.customerFlightIds;
          for (const id of ids) {
            const profit = await profitTrackerModel.getProfitByCustomerFlightId(id);
            if (profit) {
              currentTotal += Number(profit.sell || 0);
              currentQty += Number(profit.qty || 1);
            }
          }
        } catch (e) {
          console.error(`Error parsing customerFlightIds for invoice ${inv.id}:`, e);
        }
        return { ...inv, amount: currentTotal, qty: currentQty };
      }
      return inv;
    }));

    res.json(updatedInvoices);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.getInvoiceNo = async (req, res) => {
  try {
    const nextNo = await invoiceModel.getNextInvoiceNo();
    res.json({ invoiceNo: nextNo });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.generateInvoice = async (req, res) => {
  try {
    const { customerFlightIds, status } = req.body;
    
    if (!customerFlightIds || !Array.isArray(customerFlightIds)) {
      return res.status(400).json({ error: 'customerFlightIds array is required' });
    }

    // Fetch details from records
    const customers = await Promise.all(customerFlightIds.map(id => customerFlightModel.getCustomerFlightById(id)));
    const firstCustomer = customers[0];
    if (!firstCustomer) {
      return res.status(404).json({ error: 'Customer record not found' });
    }

    const invoiceNo = await invoiceModel.getNextInvoiceNo();
    
    // Create a group profit record first
    const passengers = customers.length > 1 ? 'Agency' : firstCustomer.passenger;
    const initialAmount = 0; // User will edit this in Profit Tracker
    const totalQty = customers.length;

    try {
        await profitTrackerModel.createProfitRecord({
            invoiceNo: invoiceNo,
            passenger: passengers,
            sellAmount: initialAmount,
            costAmount: 0,
            qty: totalQty,
            status: 'Pending',
            handledBy: firstCustomer.handledBy,
            isManual: 1
        });
    } catch (profitErr) {
        console.error('Failed to create group profit record:', profitErr);
        // We continue anyway, the invoice is primary. User can manually add profit row if needed.
    }

    const invoiceData = {
      invoiceNo,
      amount: initialAmount,
      qty: totalQty,
      status: status || 'Pending',
      customerFlightIds,
      handledBy: firstCustomer.handledBy,
      phone: customers.length > 1 ? '' : firstCustomer.phone,
      dateIssued: new Date().toISOString().split('T')[0],
      travelDate: firstCustomer.travelDate,
      destination: firstCustomer.destination,
      billToName: passengers,
      itemService: 'Cost for the air ticket'
    };

    const newInvoice = await invoiceModel.createInvoice(invoiceData);

    // Update customers' invoiceStatus
    for (const id of customerFlightIds) {
      await customerFlightModel.updateInvoiceStatus(id, status || 'Pending');
    }

    res.json(newInvoice);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    let amount = undefined;
    let qty = undefined;

    if (status === 'Approve') {
      const inv = await invoiceModel.getInvoiceById(id);
      if (inv) {
        // Re-calculate or fetch from group profit
        const groupProfit = await profitTrackerModel.getProfitByInvoiceNo(inv.invoiceNo);
        if (groupProfit && groupProfit.isManual) {
            amount = Number(groupProfit.sell || 0);
            qty = Number(groupProfit.qty || 1);
        } else if (inv.customerFlightIds) {
            let currentTotal = 0;
            let currentQty = 0;
            const ids = typeof inv.customerFlightIds === 'string' ? JSON.parse(inv.customerFlightIds) : inv.customerFlightIds;
            for (const cid of ids) {
              const profit = await profitTrackerModel.getProfitByCustomerFlightId(cid);
              if (profit) {
                currentTotal += Number(profit.sell || 0);
                currentQty += Number(profit.qty || 1);
              }
            }
            amount = currentTotal;
            qty = currentQty;
        }
      }
    }

    await invoiceModel.updateInvoiceStatus(id, status, amount, qty);
    
    // Also update customers' invoiceStatus
    if (status === 'Approve') {
        const inv = await invoiceModel.getInvoiceById(id);
        if (inv && inv.customerFlightIds) {
            const ids = typeof inv.customerFlightIds === 'string' ? JSON.parse(inv.customerFlightIds) : inv.customerFlightIds;
            for (const cid of ids) {
                await customerFlightModel.updateInvoiceStatus(cid, 'Approve');
            }
        }
    }

    res.json({ message: 'Status updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

exports.deleteInvoice = async (req, res) => {
  try {
    const { id } = req.params;
    await invoiceModel.deleteInvoice(id);
    res.json({ message: 'Invoice deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
