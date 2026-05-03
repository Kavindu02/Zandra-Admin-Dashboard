const nodemailer = require('nodemailer');

const sendEmailInternal = async (customer, delayInfo = null, customStatus = null) => {
  if (!customer || !customer.email) {
    throw new Error('Customer email is required');
  }

  // Extract segments
  let segments = customer.segments;
  if (typeof segments === 'string') {
    try {
      segments = JSON.parse(segments);
    } catch (e) {
      segments = [];
    }
  }

  let returnSegments = customer.returnSegments;
  if (typeof returnSegments === 'string') {
    try {
      returnSegments = JSON.parse(returnSegments);
    } catch (e) {
      returnSegments = [];
    }
  }

  const outbound = (Array.isArray(segments) ? segments : []).filter(s => s && (s.from || s.to));
  const inbound = (Array.isArray(returnSegments) ? returnSegments : []).filter(s => s && (s.from || s.to));

  let firstOut = outbound[0] || {};
  let lastOut = outbound[outbound.length - 1] || firstOut;
  let firstIn = inbound[0] || {};
  let lastIn = inbound[inbound.length - 1] || firstIn;
  
  const affected = delayInfo?.affectedSegment;

  // Extract airport codes
  const getCode = (str) => {
    if (!str) return '---';
    const match = str.match(/\(([^)]+)\)/);
    return match ? match[1] : str.substring(0, 3).toUpperCase();
  };

  const getName = (str) => {
    if (!str) return 'Unknown';
    return str.split(' (')[0] || str;
  };

  // Logic for Origin and Destination (Fixing Round Trip title logic)
  let originCode = getCode(firstOut.from || customer.from);
  let originName = getName(firstOut.from || customer.from);
  let destCode = getCode(lastOut.to || customer.to);
  let destName = getName(lastOut.to || customer.to);

  if (affected) {
    originCode = getCode(affected.from);
    originName = getName(affected.from);
    destCode = getCode(affected.to);
    destName = getName(affected.to);
  } else {
    // Round Trip logic: If it's a round trip, the destination is the turnaround point.
    // Case 1: Split into outbound and inbound tables
    const currentLastOutCode = getCode(lastOut.to);
    const currentFirstInCode = getCode(firstIn.from);
    
    if (inbound.length > 0 && currentLastOutCode === currentFirstInCode && currentLastOutCode !== '---') {
      destCode = currentLastOutCode;
      destName = getName(lastOut.to);
    } 
    // Case 2: All segments in one table (e.g. from Word import with more than 2 legs)
    else if (inbound.length === 0 && outbound.length > 1) {
      const firstCode = getCode(outbound[0].from);
      const lastCode = getCode(outbound[outbound.length - 1].to);
      if (firstCode === lastCode && firstCode !== '---') {
        // It's a round trip in one list. Find the turnaround.
        for (let i = 0; i < outbound.length - 1; i++) {
          if (outbound[i].to === outbound[i+1].from && i >= (outbound.length / 2) - 1) {
            destCode = getCode(outbound[i].to);
            destName = getName(outbound[i].to);
            break;
          }
        }
      }
    }
  }

  // Format date
  const flightDate = affected ? (affected.departureDate || delayInfo.newDepartureDate) : (firstOut.departureDate || customer.departureDate || '');
  const dateObj = new Date(flightDate);
  const formattedDate = !isNaN(dateObj.getTime()) 
    ? dateObj.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
    : 'Upcoming Date';

  const originalDepTime = affected ? (affected.departureTime || '--:--') : (firstOut.departureTime || customer.departureTime || '--:--');
  const originalArrTime = affected ? (affected.arrivalTime || '--:--') : (lastOut.arrivalTime || '--:--');
  
  const depTime = delayInfo?.newDepartureTime || originalDepTime;
  const arrTime = delayInfo?.newArrivalTime || originalArrTime;
  
  const airline = affected ? (affected.airline || 'Airline') : (firstOut.airline || customer.airline || 'Airline');
  const flightNo = affected ? (affected.flightNo || '--') : (firstOut.flightNo || customer.flightNo || '--');
  const pnr = customer.pnr || customer.bookingRef || 'N/A';

  const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
        
        body { font-family: 'Inter', -apple-system, sans-serif; background-color: #f0f2f5; margin: 0; padding: 0; }
        .wrapper { background-color: #f0f2f5; padding: 40px 10px; }
        
        /* The Pass / Ticket Container */
        .pass-card { 
            max-width: 500px; 
            margin: 0 auto; 
            background: #ffffff; 
            border-radius: 20px; 
            overflow: hidden; 
            box-shadow: 0 10px 40px rgba(16, 29, 66, 0.08);
            border: 1px solid #e5e7eb;
        }
        
        /* Header Section */
        .pass-header { 
            background-color: #101d42; 
            padding: 20px 25px; 
            color: #ffffff;
            display: table;
            width: 100%;
            box-sizing: border-box;
        }
        .header-left { display: table-cell; vertical-align: middle; }
        .header-right { display: table-cell; vertical-align: middle; text-align: right; }
        .brand-name { font-size: 16px; font-weight: 900; letter-spacing: -0.5px; }
        .brand-name span { color: #f59e0b; }
        .status-text { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: rgba(255,255,255,0.7); }
        
        /* Main Itinerary Section */
        .pass-body { padding: 30px 25px; color: #1f2937; }
        
        .route-title { font-size: 14px; font-weight: 600; color: #6b7280; margin-bottom: 20px; }
        
        .route-grid { width: 100%; border-collapse: collapse; table-layout: fixed; }
        .code { font-size: 32px; font-weight: 900; color: #101d42; line-height: 1; margin: 0; white-space: nowrap; }
        .city-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; margin-bottom: 4px; white-space: nowrap; }
        .time-label { font-size: 13px; font-weight: 700; color: #4b5563; margin-top: 8px; white-space: nowrap; }
        
        .old-time { text-decoration: line-through; color: #cbd5e1; font-weight: 400; font-size: 11px; margin-right: 5px; }
        .new-time { color: #f59e0b; }
        
        /* Sublte Arc Animation */
        .arc-container { position: relative; height: 70px; width: 100%; min-width: 120px; vertical-align: middle; overflow: visible; }
        .arc-line { 
            position: absolute; 
            width: 100px; 
            height: 40px; 
            border: 2px solid ${delayInfo ? '#fef3c7' : '#f3f4f6'}; 
            border-bottom: none; 
            border-radius: 100px 100px 0 0; 
            top: 20px; 
            left: 50%; 
            margin-left: -50px;
            z-index: 1; 
        }
        
        .plane-box { 
            position: absolute; 
            width: 30px; 
            height: 30px; 
            top: 20px;
            left: 50%;
            margin-left: -15px;
            z-index: 2; 
            -webkit-animation: movePlane 4s infinite ease-in-out;
            animation: movePlane 4s infinite ease-in-out;
        }
        
        @-webkit-keyframes movePlane {
            0% { -webkit-transform: translateX(-120px) translateY(10px) rotate(25deg); transform: translateX(-120px) translateY(10px) rotate(25deg); opacity: 0; }
            15% { opacity: 1; }
            50% { -webkit-transform: translateX(0) translateY(-35px) rotate(0deg); transform: translateX(0) translateY(-35px) rotate(0deg); }
            85% { opacity: 1; }
            100% { -webkit-transform: translateX(120px) translateY(10px) rotate(-25deg); transform: translateX(120px) translateY(10px) rotate(-25deg); opacity: 0; }
        }
        @keyframes movePlane {
            0% { transform: translateX(-120px) translateY(10px) rotate(25deg); opacity: 0; }
            15% { opacity: 1; }
            50% { transform: translateX(0) translateY(-35px) rotate(0deg); }
            85% { opacity: 1; }
            100% { transform: translateX(120px) translateY(10px) rotate(-25deg); opacity: 0; }
        }
        
        /* Responsive Tweaks */
        @media screen and (max-width: 480px) {
            .wrapper { padding: 20px 10px; }
            .pass-body { padding: 20px 15px; }
            .code { font-size: 28px; }
            .arc-container { min-width: 80px; height: 65px; }
            @-webkit-keyframes movePlane {
                0% { -webkit-transform: translateX(-80px) translateY(10px) rotate(25deg); opacity: 0; }
                50% { -webkit-transform: translateX(0) translateY(-30px) rotate(0deg); }
                100% { -webkit-transform: translateX(80px) translateY(10px) rotate(-25deg); opacity: 0; }
            }
            @keyframes movePlane {
                0% { transform: translateX(-80px) translateY(10px) rotate(25deg); opacity: 0; }
                50% { transform: translateX(0) translateY(-30px) rotate(0deg); }
                100% { transform: translateX(80px) translateY(10px) rotate(-25deg); opacity: 0; }
            }
        }
        
        .plane-icon { font-size: 24px; }
        
        /* Separator Perforation */
        .perforation { 
            height: 1px; 
            border-top: 1px dashed #e5e7eb; 
            margin: 25px 0; 
            position: relative;
        }
        .perforation::before, .perforation::after {
            content: ''; position: absolute; top: -8px; width: 16px; height: 16px; background: #f0f2f5; border-radius: 50%; border: 1px solid #e5e7eb;
        }
        .perforation::before { left: -34px; }
        .perforation::after { right: -34px; }
        
        /* Footer Info */
        .info-row { width: 100%; border-collapse: collapse; }
        .info-label { font-size: 10px; font-weight: 700; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.5px; padding-bottom: 2px; }
        .info-val { font-size: 14px; font-weight: 700; color: #374151; padding-bottom: 20px; }
        
        .social-footer {
            padding: 30px 25px;
            text-align: center;
            background-color: #ffffff;
            border-top: 1px solid #f3f4f6;
        }
        .social-text {
            font-size: 11px;
            font-weight: 800;
            color: #9ca3af;
            margin-bottom: 15px;
            text-transform: uppercase;
            letter-spacing: 2px;
        }
        .social-icons a {
            text-decoration: none;
            margin: 0 10px;
            display: inline-block;
        }
        
        .footer-note { 
            background-color: #f9fafb; 
            padding: 20px 25px; 
            border-top: 1px solid #f3f4f6; 
            text-align: center; 
            color: #9ca3af; 
            font-size: 11px; 
            line-height: 1.6;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="pass-card">
            <div class="pass-header">
                <div class="header-left">
                    <div class="brand-name">ZANDRA<span>TRAVELS</span></div>
                </div>
                <div class="header-right">
                    <div class="status-text">${delayInfo ? 'Flight Update' : (customStatus || 'Booking Confirm')}</div>
                </div>
            </div>
            
            <div class="pass-body">
                <div class="route-title">${formattedDate} • ${originName} to ${destName}</div>
                
                <table class="route-grid">
                    <tr>
                        <td width="80" align="left">
                            <div class="city-label">${originCode}</div>
                            <div class="code">${originCode}</div>
                            <div class="time-label">
                                ${delayInfo ? `<span class="old-time">${originalDepTime}</span><span class="new-time">${depTime}</span>` : depTime}
                            </div>
                        </td>
                        <td align="center">
                            <div class="arc-container">
                                <div class="arc-line"></div>
                                <div class="plane-box">
                                    <span class="plane-icon">✈️</span>
                                </div>
                            </div>
                            <div style="font-size: 10px; font-weight: 700; color: #9ca3af; margin-top: 25px;">
                                ${firstOut.duration || 'NON-STOP'}
                            </div>
                        </td>
                        <td width="80" align="right">
                            <div class="city-label">${destCode}</div>
                            <div class="code">${destCode}</div>
                            <div class="time-label">
                                ${delayInfo ? `<span class="old-time">${originalArrTime}</span><span class="new-time">${arrTime}</span>` : arrTime}
                            </div>
                        </td>
                    </tr>
                </table>
                
                <div class="perforation"></div>
                
                <table class="info-row">
                    <tr>
                        <td width="50%">
                            <div class="info-label">Passenger</div>
                            <div class="info-val">${customer.passenger}</div>
                        </td>
                        <td width="50%">
                            <div class="info-label">Confirmation</div>
                            <div class="info-val">#${pnr}</div>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <div class="info-label">Carrier</div>
                            <div class="info-val">${airline}</div>
                        </td>
                        <td>
                            <div class="info-label">Flight</div>
                            <div class="info-val">${flightNo}</div>
                        </td>
                    </tr>
                </table>
            </div>

            <div class="social-footer">
                <div class="social-text">Follow our Journey</div>
                <div class="social-icons">
                    <a href="https://www.facebook.com/share/185X2yqwVK/?mibextid=wwXIfr" target="_blank">
                        <img src="https://cdn-icons-png.flaticon.com/512/733/733547.png" width="22" height="22" alt="Facebook">
                    </a>
                    <a href="https://www.tiktok.com/@zandra.travelers?_r=1&_t=ZS-960DdjFX3xg" target="_blank">
                        <img src="https://cdn-icons-png.flaticon.com/512/3046/3046121.png" width="22" height="22" alt="TikTok">
                    </a>
                    <a href="https://www.linkedin.com/in/zandra-travelers-052415407?utm_source=share_via&utm_content=profile&utm_medium=member_ios" target="_blank">
                        <img src="https://cdn-icons-png.flaticon.com/512/3536/3536505.png" width="22" height="22" alt="LinkedIn">
                    </a>
                    <a href="https://wa.me/818098700622" target="_blank">
                        <img src="https://cdn-icons-png.flaticon.com/512/733/733585.png" width="22" height="22" alt="WhatsApp">
                    </a>
                    <a href="http://www.zandratravelers.com" target="_blank">
                        <img src="https://cdn-icons-png.flaticon.com/512/1006/1006771.png" width="22" height="22" alt="Website">
                    </a>
                </div>
            </div>
            
            <div class="footer-note">
                Ticket issued by Zandra Travels Administration.<br>
                Please find your e-ticket PDF attached to this email.<br>
                Please arrive at the airport 3 hours before departure.
            </div>
        </div>
    </div>
</body>
</html>
  `;

  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
    port: process.env.EMAIL_PORT || 587,
    secure: process.env.EMAIL_SECURE === 'true',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  const subject = delayInfo 
    ? `🚨 Flight Delay Notification: ${originCode} - ${destCode}`
    : `✈️ Flight Itinerary: ${originName} to ${destName}`;

  // Generate PDF Attachment
  let attachments = [];
  try {
    const { generateTicketPDFBuffer } = require('../utils/ticketPdfGenerator');
    const pdfBuffer = await generateTicketPDFBuffer(customer);
    attachments.push({
      filename: `${customer.passenger || 'Ticket'}_Flight_Itinerary.pdf`,
      content: pdfBuffer
    });
  } catch (pdfErr) {
    console.error('Failed to generate PDF for attachment:', pdfErr);
  }

  return await transporter.sendMail({
    from: `"Zandra Travels" <${process.env.EMAIL_USER || 'no-reply@zandra.com'}>`,
    to: customer.email,
    subject: subject,
    html: html,
    attachments: attachments
  });
};

const sendItineraryEmail = async (req, res) => {
  const { customer, delayInfo } = req.body;
  
  try {
    await sendEmailInternal(customer, delayInfo);
    res.json({ message: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ error: error.message || 'Failed to send email. Check SMTP settings in .env file.' });
  }
};

const sendInvoiceEmail = async (req, res) => {
  const { invoiceId } = req.body;
  const pool = require('../models/db');
  
  try {
    // 1. Fetch Invoice
    const [invRows] = await pool.query('SELECT * FROM invoices WHERE id = ?', [invoiceId]);
    const invoice = invRows[0];
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    if (invoice.email_sent) return res.status(400).json({ error: 'Email already sent for this status' });

    // 2. Find Customer Email
    let flightIds = [];
    try {
      flightIds = JSON.parse(invoice.customerFlightIds || '[]');
    } catch (e) {
      flightIds = [];
    }

    if (flightIds.length === 0) {
      console.log('No flight IDs found in invoice:', invoice.invoiceNo);
      return res.status(400).json({ error: 'No flight associated with this invoice' });
    }

    const [flightRows] = await pool.query('SELECT email, passenger FROM customersflights WHERE id = ?', [flightIds[0]]);
    const flight = flightRows[0];
    if (!flight) {
      console.log('Flight record not found for ID:', flightIds[0]);
      return res.status(400).json({ error: 'Customer flight record not found in database' });
    }
    if (!flight.email) {
      console.log('Email is empty for flight ID:', flightIds[0]);
      return res.status(400).json({ error: 'Customer email is empty in flight record' });
    }

    // 3. Generate PDF
    const showBankInfo = invoice.status !== 'Approve';
    console.log(`Generating PDF for invoice: ${invoice.invoiceNo} (Show Bank Info: ${showBankInfo})`);
    const { generateInvoicePDFBuffer } = require('../utils/invoicePdfGenerator');
    const pdfBuffer = await generateInvoicePDFBuffer(invoice, showBankInfo);
    console.log('PDF generated successfully, size:', pdfBuffer.length);

    // 4. Send Email
    console.log('Sending email to:', flight.email);
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.ethereal.email',
      port: process.env.EMAIL_PORT || 587,
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      }
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #101D42; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
        <div style="background: #101D42; padding: 20px; color: #fff; text-align: center;">
          <h1 style="margin: 0; font-size: 20px;">INVOICE RECEIVED</h1>
        </div>
        <div style="padding: 30px;">
          <p>Dear <strong>${invoice.billToName || flight.passenger}</strong>,</p>
          <p>Please find the attached invoice <strong>#${invoice.invoiceNo}</strong> for your travel booking with Zandra Travelers.</p>
          <div style="margin: 30px 0; padding: 20px; background: #f9f9f9; border-radius: 8px;">
            <p style="margin: 0 0 10px 0;"><strong>Invoice Summary:</strong></p>
            <p style="margin: 5px 0;">Invoice No: ${invoice.invoiceNo}</p>
            <p style="margin: 5px 0;">Amount: LKR ${Number(invoice.amount).toLocaleString()}</p>
          </div>
          <p>If you have any questions, please feel free to contact us.</p>
          <p>Best Regards,<br><strong>Zandra Travelers Team</strong></p>
        </div>
        <div style="background: #f4f4f4; padding: 15px; text-align: center; font-size: 11px; color: #777;">
          This is an automated email. Please do not reply directly to this message.
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Zandra Travelers" <${process.env.EMAIL_USER || 'no-reply@zandra.com'}>`,
      to: flight.email,
      subject: `Invoice from Zandra Travelers: ${invoice.invoiceNo}`,
      html: html,
      attachments: [
        {
          filename: `Invoice_${invoice.invoiceNo}.pdf`,
          content: pdfBuffer
        }
      ]
    });

    // 5. Update Status
    await pool.query('UPDATE invoices SET email_sent = TRUE WHERE id = ?', [invoiceId]);

    res.json({ message: 'Invoice email sent successfully' });
  } catch (error) {
    console.error('CRITICAL: Invoice Email Error Details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    res.status(500).json({ 
      error: 'Server Error: ' + (error.message || 'Failed to send invoice email'),
      details: error.code || 'NO_CODE'
    });
  }
};

module.exports = {
  sendItineraryEmail,
  sendEmailInternal,
  sendInvoiceEmail
};
