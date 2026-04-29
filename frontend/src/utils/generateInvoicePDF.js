import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Generates an Invoice PDF for Zandra Travelers.
 * @param {Object} invoiceData - Data for the invoice
 * @param {boolean} showBankInfo - Whether to show bank details
 */
export const generateInvoicePDF = async (invoiceData, showBankInfo = true) => {
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
  const { width, height } = page.getSize();
  
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  // Load images
  // Load images helper
  const loadImage = async (url) => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const buffer = await res.arrayBuffer();
      // Check magic numbers: PNG starts with 89 50 4E 47, JPG with FF D8
      const uint8 = new Uint8Array(buffer);
      if (uint8[0] === 0x89 && uint8[1] === 0x50) {
        return await pdfDoc.embedPng(buffer);
      } else if (uint8[0] === 0xFF && uint8[1] === 0xD8) {
        return await pdfDoc.embedJpg(buffer);
      }
      return null;
    } catch (e) {
      console.warn(`Failed to load image at ${url}:`, e);
      return null;
    }
  };

  const logoImage = await loadImage('/zandralogo.png');
  const sign1Image = await loadImage('/sign1.png') || await loadImage('/sign 1.jpeg') || await loadImage('/sign1.jpeg');
  const sign2Image = await loadImage('/sign2.png') || await loadImage('/sign 2.jpeg') || await loadImage('/sign2.jpeg');
  
  // Header - Logo
  const logoWidth = 120;
  const logoScale = logoWidth / logoImage.width;
  const logoDims = {
    width: logoWidth,
    height: logoImage.height * logoScale
  };
  const logoMargin = 20;
  
  if (logoImage) {
    page.drawImage(logoImage, {
      x: 30,
      y: height - logoDims.height - logoMargin,
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
    color: rgb(0.96, 0.62, 0.04), // Orange #F59E0B
  });
  
  // Zandra Address
  let y = height - 130;
  const addressLines = [
    '353/4 NELIGAMA, RAGAMA',
    'zandratravelers@gmail.com',
    'info@zandratravelers.com',
    '+94 78 666 0656 · +81 80 9870 0622'
  ];
  addressLines.forEach(line => {
    page.drawText(line, {
      x: 50,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 15;
  });
  
  // Horizontal Line
  page.drawLine({
    start: { x: 50, y: height - 180 },
    end: { x: width - 50, y: height - 180 },
    thickness: 1,
    color: rgb(0.9, 0.9, 0.9),
  });
  
  // Bill To Section
  y = height - 210;
  page.drawText('BILL TO', {
    x: 50,
    y,
    size: 12,
    font: fontBold,
    color: rgb(0, 0, 0),
  });
  
  y -= 25;
  page.drawText(invoiceData.billToName || 'Valued Customer', {
    x: 50,
    y,
    size: 14,
    font: fontBold,
    color: rgb(0.1, 0.1, 0.4),
  });
  
  y -= 20;
  const formatDate = (d) => d && typeof d === 'string' && d.includes('T') ? d.split('T')[0] : d;
  
  const billDetails = [
    `Travel Date: ${formatDate(invoiceData.travelDate) || '-'}`,
    `Destination: ${invoiceData.destination || '-'}`
  ];
  billDetails.forEach(line => {
    page.drawText(line, {
      x: 50,
      y,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    y -= 15;
  });
  
  // Invoice Metadata (Top Right relative to Bill To)
  let yMeta = height - 210;
  const metaLabels = ['Tour Executive:', 'Phone Number:', 'Date Issued:', 'Invoice No:'];
  const metaValues = [
    invoiceData.handledBy || '-',
    invoiceData.phone || '-',
    formatDate(invoiceData.dateIssued) || '-',
    invoiceData.invoiceNo || '-'
  ];
  
  metaLabels.forEach((label, i) => {
    page.drawText(label, {
      x: width - 250,
      y: yMeta,
      size: 10,
      font: fontBold,
      color: rgb(0, 0, 0),
    });
    page.drawText(metaValues[i], {
      x: width - 150,
      y: yMeta,
      size: 10,
      font: fontRegular,
      color: rgb(0.3, 0.3, 0.3),
    });
    yMeta -= 15;
  });
  
  // Items Table
  y = height - 320;
  // Table Header
  page.drawRectangle({
    x: 50,
    y: y - 10,
    width: width - 100,
    height: 30,
    color: rgb(0.06, 0.11, 0.26), // Dark Blue #101D42
  });
  
  page.drawText('Description', {
    x: 55,
    y: y + 5,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  
  page.drawText('Amount', {
    x: width - 110,
    y: y + 5,
    size: 10,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  
  // Table Row
  y -= 40;
  // Background for row (light gray)
  page.drawRectangle({
    x: 50,
    y: y - 10,
    width: width - 100,
    height: 30,
    color: rgb(0.98, 0.98, 0.99),
  });

  const description = `${invoiceData.itemService || 'Cost for the air ticket'} (QTY: ${invoiceData.qty})`;
  const amountStr = `LKR ${Number(invoiceData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  page.drawText(description, {
    x: 55,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });

  // Right align amount
  const amountWidth = fontRegular.widthOfTextAtSize(amountStr, 10);
  page.drawText(amountStr, {
    x: width - 50 - amountWidth - 5,
    y,
    size: 10,
    font: fontRegular,
    color: rgb(0.2, 0.2, 0.2),
  });
  
  // Total Row (Matching the screenshot style)
  y -= 40;
  page.drawRectangle({
    x: 50,
    y: y - 10,
    width: width - 100,
    height: 40,
    color: rgb(0.06, 0.11, 0.26), // Dark Blue #101D42
  });
  
  page.drawText('TOTAL', {
    x: 55,
    y: y + 5,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  
  const totalStr = `LKR ${Number(invoiceData.amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const totalWidth = fontBold.widthOfTextAtSize(totalStr, 16);
  page.drawText(totalStr, {
    x: width - 50 - totalWidth - 5,
    y: y + 3,
    size: 16,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  
  // Bank Info
  if (showBankInfo) {
    y -= 50; // Moved up from 80
    page.drawText('BANK INFORMATION', {
      x: 50,
      y,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.4),
    });
    
    y -= 20;
    const bankLines = [
      'BANK NAME : Nations Trust Bank',
      'Account Name: ZANDRA TRAVELERS',
      'Account No: 200160125696',
      'Branch: Kiribathgoda',
      'Bank Address: No. 69 Makola Rd, Kiribathgoda, Sri Lanka',
      'Bank Code: 7162',
      'Branch Code: 16',
      'SWIFT Code: NTBCLKLX'
    ];
    bankLines.forEach(line => {
      page.drawText(line, {
        x: 50,
        y,
        size: 9,
        font: fontRegular,
        color: rgb(0.3, 0.3, 0.3),
      });
      y -= 13;
    });
  }
  
  // Boxed Disclaimer (New Design)
  y = 260;
  const disclaimerText = 'Kindly be advised that airfares are subject to change at the time of ticket issuance. Our company shall not be liable for any fare increase. Any additional charges required for ticket issuance must be settled by the client. Failing which, the total amount paid will be refunded to the respective agency.';
  
  const boxWidth = width - 100;
  const boxPadding = 10;
  const fontSize = 8;
  
  // Wrap text
  const maxTextWidth = boxWidth - (boxPadding * 2);
  const words = disclaimerText.split(' ');
  let line = '';
  const lines = [];
  
  for (const word of words) {
    const testLine = line ? line + ' ' + word : word;
    const testWidth = fontRegular.widthOfTextAtSize(testLine, fontSize);
    if (testWidth > maxTextWidth) {
      lines.push(line);
      line = word;
    } else {
      line = testLine;
    }
  }
  lines.push(line);
  
  const boxHeight = (lines.length * 10) + (boxPadding * 2);
  
  // Draw Rectangle Border
  page.drawRectangle({
    x: 50,
    y: y - boxHeight,
    width: boxWidth,
    height: boxHeight,
    borderWidth: 1,
    borderColor: rgb(0.2, 0.2, 0.2),
    color: rgb(1, 1, 1),
  });
  
  // Draw Wrapped Text inside the box
  let textY = y - boxPadding - 8;
  lines.forEach(l => {
    page.drawText(l, {
      x: 50 + boxPadding,
      y: textY,
      size: fontSize,
      font: fontRegular,
      color: rgb(0, 0, 0),
    });
    textY -= 10;
  });
  
  // Signatures
  y = 130;
  // Sign 1
  if (sign1Image) {
    page.drawImage(sign1Image, {
      x: 50,
      y: y + 20,
      width: 80,
      height: 40,
    });
  }
  page.drawText('..........................................', { x: 50, y: y + 10, size: 10 });
  page.drawText('S.A.S.P Bandara', { x: 50, y: y - 5, size: 9, font: fontBold });
  page.drawText('Founder & CEO', { x: 50, y: y - 15, size: 8, font: fontRegular });
  
  // Sign 2
  if (sign2Image) {
    page.drawImage(sign2Image, {
      x: width - 150,
      y: y + 20,
      width: 80,
      height: 40,
    });
  }
  page.drawText('..........................................', { x: width - 150, y: y + 10, size: 10 });
  page.drawText('N.M.Y. Nawanjana', { x: width - 150, y: y - 5, size: 9, font: fontBold });
  page.drawText('Director', { x: width - 150, y: y - 15, size: 8, font: fontRegular });
  
  // QR Code and Footer Text
  y = 20;
  try {
    const qrText = invoiceData.invoiceNo || 'INV-UNKNOWN';
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(qrText)}`;
    const qrBytes = await fetch(qrUrl).then(res => res.arrayBuffer());
    const qrImage = await pdfDoc.embedPng(qrBytes);
    
    page.drawImage(qrImage, {
      x: 50,
      y: y,
      width: 50,
      height: 50,
    });
    
    page.drawText('INVOICE QR', {
      x: 50,
      y: y + 55,
      size: 8,
      font: fontBold,
      color: rgb(0.6, 0.6, 0.7),
    });
    page.drawText(qrText, {
      x: 50,
      y: y - 10,
      size: 7,
      font: fontRegular,
      color: rgb(0.6, 0.6, 0.7),
    });
  } catch (err) {
    console.error('Failed to load QR code', err);
  }
  
  // Footer Messages (Right Side)
  page.drawText('Thank you for choosing ZANDRA TRAVELERS', {
    x: width - 260,
    y: y + 25,
    size: 10,
    font: fontBold,
    color: rgb(0.1, 0.2, 0.4),
  });
  page.drawText('This is a computer-generated invoice', {
    x: width - 205,
    y: y + 10,
    size: 8,
    font: fontRegular,
    color: rgb(0.6, 0.6, 0.7),
  });

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Invoice_${invoiceData.invoiceNo}.pdf`;
  link.click();
};
