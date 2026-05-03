const { PDFDocument, rgb, StandardFonts } = require('pdf-lib');
const fs = require('fs');
const path = require('path');
const axios = require('axios');

/**
 * Server-side Invoice PDF generator.
 */
const generateInvoicePDFBuffer = async (invoiceData, showBankInfo = true) => {
  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    
    const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Load images helper (Internal Assets)
    const loadAsset = async (filename) => {
      try {
        const assetPath = path.join(__dirname, '../assets', filename);
        if (fs.existsSync(assetPath)) {
          const buffer = fs.readFileSync(assetPath);
          if (filename.toLowerCase().endsWith('.png')) return await pdfDoc.embedPng(buffer);
          if (filename.toLowerCase().endsWith('.jpg') || filename.toLowerCase().endsWith('.jpeg')) return await pdfDoc.embedJpg(buffer);
        }
        return null;
      } catch (e) {
        console.warn(`Failed to load asset ${filename}:`, e);
        return null;
      }
    };

    const logoImage = await loadAsset('zandralogo.png');
    const sign1Image = await loadAsset('sign1.png');
    const sign2Image = await loadAsset('sign2.png');
    
    // Header - Logo
    if (logoImage) {
      const logoWidth = 120;
      const logoScale = logoWidth / logoImage.width;
      const logoDims = {
        width: logoWidth,
        height: logoImage.height * logoScale
      };
      page.drawImage(logoImage, {
        x: 30,
        y: height - logoDims.height - 20,
        width: logoDims.width,
        height: logoDims.height,
      });
    }
    
    // Header - INVOICE Label
    page.drawText('INVOICE', {
      x: width - 150,
      y: height - 80,
      size: 28,
      font: fontBold,
      color: rgb(0.96, 0.62, 0.04), // Orange
    });
    
    // Address Section
    let y = height - 130;
    const addressLines = [
      '353/4 NELIGAMA, RAGAMA',
      'zandratravelers@gmail.com',
      'info@zandratravelers.com',
      '+94 78 666 0656 · +81 80 9870 0622'
    ];
    addressLines.forEach(line => {
      page.drawText(String(line), { x: 50, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      y -= 15;
    });
    
    // Line
    page.drawLine({
      start: { x: 50, y: height - 180 },
      end: { x: width - 50, y: height - 180 },
      thickness: 1,
      color: rgb(0.9, 0.9, 0.9),
    });
    
    // Bill To
    y = height - 210;
    page.drawText('BILL TO', { x: 50, y, size: 12, font: fontBold });
    y -= 25;
    page.drawText(String(invoiceData.billToName || 'Valued Customer'), { x: 50, y, size: 14, font: fontBold, color: rgb(0.1, 0.1, 0.4) });
    
    y -= 20;
    const formatDate = (d) => {
      if (!d) return '-';
      try {
        const dateObj = new Date(d);
        if (isNaN(dateObj.getTime())) return String(d);
        return dateObj.toISOString().split('T')[0];
      } catch (e) {
        return String(d);
      }
    };
    page.drawText(String(`Travel Date: ${formatDate(invoiceData.travelDate) || '-'}`), { x: 50, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    y -= 15;
    page.drawText(String(`Destination: ${invoiceData.destination || '-'}`), { x: 50, y, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    
    // Metadata
    let yMeta = height - 210;
    const metaData = [
      ['Tour Executive:', invoiceData.handledBy || '-'],
      ['Phone Number:', invoiceData.phone || '-'],
      ['Date Issued:', formatDate(invoiceData.dateIssued) || '-'],
      ['Invoice No:', invoiceData.invoiceNo || '-']
    ];
    metaData.forEach(([label, val]) => {
      page.drawText(String(label), { x: width - 250, y: yMeta, size: 10, font: fontBold });
      page.drawText(String(val), { x: width - 150, y: yMeta, size: 10, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
      yMeta -= 15;
    });
    
    // Table
    y = height - 320;
    page.drawRectangle({ x: 50, y: y - 10, width: width - 100, height: 30, color: rgb(0.06, 0.11, 0.26) });
    page.drawText('Description', { x: 55, y: y + 5, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    page.drawText('Amount', { x: width - 110, y: y + 5, size: 10, font: fontBold, color: rgb(1, 1, 1) });
    
    y -= 40;
    page.drawRectangle({ x: 50, y: y - 10, width: width - 100, height: 30, color: rgb(0.98, 0.98, 0.99) });
    const description = String(`${invoiceData.itemService || 'Cost for the air ticket'} (QTY: ${invoiceData.qty})`);
    const amountStr = String(`LKR ${Number(invoiceData.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
    page.drawText(description, { x: 55, y, size: 10, font: fontRegular, color: rgb(0.2, 0.2, 0.2) });
    const amountWidth = fontRegular.widthOfTextAtSize(amountStr, 10);
    page.drawText(amountStr, { x: width - 50 - amountWidth - 5, y, size: 10, font: fontRegular });
    
    y -= 40;
    page.drawRectangle({ x: 50, y: y - 10, width: width - 100, height: 40, color: rgb(0.06, 0.11, 0.26) });
    page.drawText('TOTAL', { x: 55, y: y + 5, size: 14, font: fontBold, color: rgb(1, 1, 1) });
    const totalWidth = fontBold.widthOfTextAtSize(amountStr, 16);
    page.drawText(amountStr, { x: width - 50 - totalWidth - 5, y: y + 3, size: 16, font: fontBold, color: rgb(1, 1, 1) });
    
    if (showBankInfo) {
      y -= 50;
      page.drawText('BANK INFORMATION', { x: 50, y, size: 11, font: fontBold, color: rgb(0.1, 0.1, 0.4) });
      y -= 20;
      const bankLines = [
        'BANK NAME : Nations Trust Bank',
        'Account Name: ZANDRA TRAVELERS',
        'Account No: 200160125696',
        'Branch: Kiribathgoda',
        'SWIFT Code: NTBCLKLX'
      ];
      bankLines.forEach(line => {
        page.drawText(String(line), { x: 50, y, size: 9, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
        y -= 13;
      });
    }

    // Disclaimer
    y = 260;
    const disclaimer = 'Kindly be advised that airfares are subject to change at the time of ticket issuance. Our company shall not be liable for any fare increase.';
    page.drawRectangle({ x: 50, y: y - 40, width: width - 100, height: 40, borderWidth: 1, borderColor: rgb(0.2, 0.2, 0.2) });
    page.drawText(String(disclaimer), { x: 60, y: y - 25, size: 8, font: fontRegular });
    
    // Signatures
    y = 130;
    if (sign1Image) page.drawImage(sign1Image, { x: 50, y: y + 20, width: 80, height: 40 });
    page.drawText('..........................................', { x: 50, y: y + 10, size: 10 });
    page.drawText('S.A.S.P Bandara', { x: 50, y: y - 5, size: 9, font: fontBold });
    
    if (sign2Image) page.drawImage(sign2Image, { x: width - 150, y: y + 20, width: 80, height: 40 });
    page.drawText('..........................................', { x: width - 150, y: y + 10, size: 10 });
    page.drawText('N.M.Y. Nawanjana', { x: width - 150, y: y - 5, size: 9, font: fontBold });
    
    // QR Code
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(invoiceData.invoiceNo || 'INV')}`;
      const qrResponse = await axios.get(qrUrl, { responseType: 'arraybuffer' });
      const qrImage = await pdfDoc.embedPng(qrResponse.data);
      page.drawImage(qrImage, { x: 50, y: 20, width: 50, height: 50 });
    } catch (e) {}

    const pdfBytes = await pdfDoc.save();
    return Buffer.from(pdfBytes);
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};

module.exports = { generateInvoicePDFBuffer };
