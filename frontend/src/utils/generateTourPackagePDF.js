import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generateTourPackagePDF = async (pkgData) => {
  try {
    // 1. Load Template
    const templatePath = '/packagetemplate.pdf';
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Styling Palette (Matches existing styles)
    const primaryColor = rgb(0.18, 0.28, 0.38); // Dark grey/blue
    const amberColor = rgb(0.7, 0.4, 0); // close to #b45309 roughly
    const goldColor = rgb(0.85, 0.65, 0.13); // #DAA520 roughly for duration
    const redColor = rgb(0.8, 0.1, 0.1); 
    const linkColor = rgb(0.1, 0.3, 0.6); // blueish

    const hexToRgbO = (hex) => {
      if(!hex) return rgb(1,1,1);
      const hexStr = hex.replace('#', '');
      const r = parseInt(hexStr.slice(0, 2), 16) / 255;
      const g = parseInt(hexStr.slice(2, 4), 16) / 255;
      const b = parseInt(hexStr.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    };

    let pageIdx = 0;
    let page = pdfDoc.getPages()[pageIdx];
    
    // Y-coordinate tracking
    let currentY = 700;

    if (pkgData.bgColor && pkgData.bgColor !== '#ffffff') {
      page.drawRectangle({
        x: 0, y: 0, width: page.getWidth(), height: 720,
        color: hexToRgbO(pkgData.bgColor),
      });
    }

    // Helper to add a new page if we run out of vertical space
    const checkSpace = async (neededSpace) => {
      if (currentY - neededSpace < 80) { // Keep 80 margin at bottom
        // Add new page
        pageIdx++;
        if (pageIdx < pdfDoc.getPageCount()) {
          page = pdfDoc.getPages()[pageIdx];
        } else {
          // clone the first page as background
          const doc2 = await PDFDocument.load(existingPdfBytes);
          const [newPage] = await pdfDoc.copyPages(doc2, [0]);
          pdfDoc.addPage(newPage);
          page = pdfDoc.getPages()[pdfDoc.getPageCount() - 1];
        }
        
        if (pkgData.bgColor && pkgData.bgColor !== '#ffffff') {
          page.drawRectangle({
            x: 0, y: 0, width: page.getWidth(), height: 720,
            color: hexToRgbO(pkgData.bgColor),
          });
        }
        
        currentY = 720; // reset to top (leaving room for top logo)
      }
    };

    // Helper: Draw wrapped text and update currentY
    const drawWrappedText = async (text, rectOptions) => {
      const { x, maxWidth, size, fontToUse, color, lineHeight } = rectOptions;
      if (!text) return;
      
      const words = String(text).split(' ');
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = fontToUse.widthOfTextAtSize(testLine, size);
        
        if (testWidth > maxWidth && i > 0) {
          await checkSpace(lineHeight);
          page.drawText(line.trim(), { x, y: currentY, size, font: fontToUse, color });
          currentY -= lineHeight;
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line.trim().length > 0) {
        await checkSpace(lineHeight);
        page.drawText(line.trim(), { x, y: currentY, size, font: fontToUse, color });
        currentY -= lineHeight;
      }
    };

    const drawHeader = async () => {
      await checkSpace(50);
      page.drawText("Greetings from Zandra Travelers !!", { x: 40, y: currentY, size: 12, font: fontBold, color: linkColor });
      currentY -= 20;
      page.drawText("I appreciate your inquiry and am pleased to submit the details of travel itinerary herewith.", { x: 40, y: currentY, size: 10, font: fontBold, color: primaryColor });
      currentY -= 20;
    };

    const stripB64 = (str) => {
      if(!str) return null;
      const idx = str.indexOf('base64,');
      if(idx !== -1) return str.substring(idx + 7);
      return str;
    };

    // Embed an image if provided (handles base64 data URLs)
    const drawImageBlock = async (img1b64, img2b64) => {
      if (!img1b64 && !img2b64) return;
      await checkSpace(170); // need ~150px height
      
      const yPos = currentY - 150;
      const height = 140;
      const width = 240;
      
      if (img1b64) {
        try {
          let image;
          if (img1b64.includes('image/png')) {
            image = await pdfDoc.embedPng(stripB64(img1b64));
          } else {
            image = await pdfDoc.embedJpg(stripB64(img1b64));
          }
          page.drawImage(image, { x: 40, y: yPos, width, height });
        } catch (e) { console.warn("Failed to embed image 1", e); }
      }

      if (img2b64) {
        try {
          let image;
          if (img2b64.includes('image/png')) {
            image = await pdfDoc.embedPng(stripB64(img2b64));
          } else {
            image = await pdfDoc.embedJpg(stripB64(img2b64));
          }
          page.drawImage(image, { x: 300, y: yPos, width, height });
        } catch (e) { console.warn("Failed to embed image 2", e); }
      }
      
      currentY -= 170;
    };

    /** START DRAWING CONTENT **/

    await drawHeader();

    await drawImageBlock(pkgData.image1b64, pkgData.image2b64);

    // Quick Facts
    if (pkgData.quickFacts) {
      await checkSpace(30);
      page.drawText("Quick Facts:", { x: 40, y: currentY, size: 11, font: fontBold, color: linkColor });
      currentY -= 20;
      
      // We might have multiple paragraphs split by \n
      const paragraphs = String(pkgData.quickFacts).split(/\n+/);
      for (const p of paragraphs) {
        if (!p.trim()) continue;
        await drawWrappedText(p, { x: 40, maxWidth: 515, size: 9, fontToUse: font, color: primaryColor, lineHeight: 14 });
        currentY -= 6; // paragraph spacing
      }
      currentY -= 10;
    }

    // Duration Block (Centered)
    if (pkgData.duration) {
      await checkSpace(30);
      const durWidth = fontBold.widthOfTextAtSize(pkgData.duration, 14);
      page.drawText(pkgData.duration, { x: (595 - durWidth) / 2, y: currentY, size: 14, font: fontBold, color: goldColor });
      currentY -= 25;
    }

    // Costs
    if (pkgData.landPackageCost) {
      await checkSpace(20);
      page.drawText(`Land Package: Cost: ${pkgData.landPackageCost} per adult on a twin/ triple sharing basis`, { x: 40, y: currentY, size: 9, font, color: amberColor });
      currentY -= 20;
    }

    if (pkgData.airFareCost) {
      await checkSpace(20);
      page.drawText(`Air fare: Cost: ${pkgData.airFareCost} per adult `, { x: 40, y: currentY, size: 9, font, color: amberColor });
      const mainW = font.widthOfTextAtSize(`Air fare: Cost: ${pkgData.airFareCost} per adult `, 9);
      page.drawText("(Subject to change according to Availability)", { x: 40 + mainW, y: currentY, size: 9, font: fontBold, color: redColor });
      currentY -= 30;
    }

    // Hotels
    if (pkgData.hotels && pkgData.hotels.length > 0) {
      await checkSpace(30);
      page.drawText("Hotels to be Provided or Similar", { x: 40, y: currentY, size: 10, font: fontBold, color: primaryColor });
      const hw = fontBold.widthOfTextAtSize("Hotels to be Provided or Similar", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + hw, y: currentY - 2 }, thickness: 1, color: primaryColor });
      currentY -= 20;

      for (const h of pkgData.hotels) {
        await checkSpace(15);
        page.drawText(`${h.city} = ${h.name}`, { x: 40, y: currentY, size: 9, font: fontBold, color: primaryColor });
        if (h.nights || h.rating) {
           const rightTxt = `( ${h.nights} Nights) ${h.rating} Hotel`.trim();
           page.drawText(rightTxt, { x: 340, y: currentY, size: 9, font: fontBold, color: primaryColor });
        }
        currentY -= 15;
      }
      currentY -= 20;
    }

    // Inclusions
    if (pkgData.includes && pkgData.includes.length > 0) {
      await checkSpace(30);
      page.drawText("Package includes:", { x: 40, y: currentY, size: 10, font: fontBold, color: linkColor });
      const iw = fontBold.widthOfTextAtSize("Package includes:", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + iw, y: currentY - 2 }, thickness: 1, color: linkColor });
      currentY -= 15;

      for (const item of pkgData.includes) {
        if (!item.trim()) continue;
        await checkSpace(15);
        page.drawText("•", { x: 55, y: currentY, size: 10, font: fontBold, color: primaryColor });
        await drawWrappedText(item.trim(), { x: 70, maxWidth: 485, size: 9, fontToUse: font, color: primaryColor, lineHeight: 14 });
      }
      currentY -= 15;
    }

    // Exclusions
    if (pkgData.excludes && pkgData.excludes.length > 0) {
      await checkSpace(30);
      page.drawText("Package Excludes:", { x: 40, y: currentY, size: 10, font: fontBold, color: linkColor });
      const iw = fontBold.widthOfTextAtSize("Package Excludes:", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + iw, y: currentY - 2 }, thickness: 1, color: linkColor });
      currentY -= 15;

      for (const item of pkgData.excludes) {
        if (!item.trim()) continue;
        await checkSpace(15);
        page.drawText("•", { x: 55, y: currentY, size: 10, font: fontBold, color: primaryColor });
        await drawWrappedText(item.trim(), { x: 70, maxWidth: 485, size: 9, fontToUse: font, color: primaryColor, lineHeight: 14 });
      }
      currentY -= 15;
    }

    // Secondary Images
    await drawImageBlock(pkgData.image3b64, pkgData.image4b64);
    currentY -= 15;

    // Notice
    if (pkgData.notice && pkgData.notice.length > 0) {
      await checkSpace(30);
      page.drawText("Important Notice", { x: 40, y: currentY, size: 10, font: fontBold, color: linkColor });
      const iw = fontBold.widthOfTextAtSize("Important Notice", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + iw, y: currentY - 2 }, thickness: 1, color: linkColor });
      currentY -= 15;

      for (const item of pkgData.notice) {
        if (!item.trim()) continue;
        await checkSpace(15);
        page.drawText("•", { x: 40, y: currentY, size: 10, font: fontBold, color: primaryColor });
        await drawWrappedText(item.trim(), { x: 48, maxWidth: 507, size: 9, fontToUse: fontBold, color: primaryColor, lineHeight: 14 });
      }
      currentY -= 15;
    }

    // Footer
    await checkSpace(100);
    currentY -= 10;
    page.drawText("For Further Clarification Please", { x: 40, y: currentY, size: 10, font: fontBold, color: linkColor });
    currentY -= 12;
    page.drawText("feel free to contact me at:", { x: 40, y: currentY, size: 10, font: fontBold, color: linkColor });
    currentY -= 20;

    page.drawText("Mobile: +94 75 315 6058 Yasindu Nawanjana", { x: 40, y: currentY, size: 9, font: fontBold, color: linkColor });
    currentY -= 12;
    page.drawText("Email: info@zandratravels.com", { x: 40, y: currentY, size: 9, font: fontBold, color: linkColor });
    const underlineLength = fontBold.widthOfTextAtSize("info@zandratravels.com", 9);
    page.drawLine({ start: { x: 72, y: currentY - 1 }, end: { x: 72 + underlineLength, y: currentY - 1 }, thickness: 0.5, color: linkColor });
    currentY -= 25;

    page.drawText("Zandra Travelers happy to assist with any questions or additional information you may need.", { x: 40, y: currentY, size: 9, font: fontBold, color: linkColor });


    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Tour_Package_${Date.now()}.pdf`;
    link.click();

  } catch (err) {
    console.error("Error generating Tour Package PDF:", err);
    alert(err.message || "Failed to generate PDF");
  }
};
