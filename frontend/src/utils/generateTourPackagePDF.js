import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generateTourPackagePDF = async (pkgData) => {
  try {
    const pdfDoc = await PDFDocument.create();

    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const hexToRgbO = (hex) => {
      if(!hex) return rgb(1,1,1);
      const hexStr = hex.replace('#', '');
      const r = parseInt(hexStr.slice(0, 2), 16) / 255;
      const g = parseInt(hexStr.slice(2, 4), 16) / 255;
      const b = parseInt(hexStr.slice(4, 6), 16) / 255;
      return rgb(r, g, b);
    };

    // Styling Palette
    const primaryColor = rgb(0.18, 0.28, 0.38); // Dark grey/blue
    const amberColor = rgb(0.7, 0.4, 0); // close to #b45309 roughly
    const goldColor = rgb(0.85, 0.65, 0.13); // #DAA520 roughly for duration
    const redColor = pkgData.accentColor ? hexToRgbO(pkgData.accentColor) : rgb(0.8, 0.1, 0.1); 
    const linkColor = rgb(0.1, 0.3, 0.6); // blueish

    const stripB64 = (str) => {
      if(!str) return null;
      const idx = str.indexOf('base64,');
      if(idx !== -1) return str.substring(idx + 7);
      return str;
    };

    const parseHTMLToTextBlocks = (html) => {
      if (!html) return [];
      const element = document.createElement('div');
      element.innerHTML = html;
      const parsedBlocks = [];
      const TEXT_NODE = 3;
      const ELEMENT_NODE = 1;
      
      const walkNode = (node, currentBlock, metadata = {}) => {
        if (node.nodeType === TEXT_NODE) {
           const text = node.textContent;
           if (text && text.trim() !== '') {
             currentBlock.push({ text, bold: metadata.bold, italic: metadata.italic });
           } else if (text === ' ') {
             currentBlock.push({ text: ' ', bold: metadata.bold, italic: metadata.italic });
           }
        } else if (node.nodeType === ELEMENT_NODE) {
           const tag = node.tagName.toLowerCase();
           if (tag === 'p') {
              const blk = { type: 'paragraph', items: [] };
              parsedBlocks.push(blk);
              node.childNodes.forEach(c => walkNode(c, blk.items, metadata));
           } else if (tag === 'ul') {
              node.childNodes.forEach(c => walkNode(c, null, { ...metadata, inUl: true }));
           } else if (tag === 'ol') {
              let idx = 1;
              node.childNodes.forEach(c => {
                 if (c.tagName && c.tagName.toLowerCase() === 'li') {
                    const blk = { type: 'bullet', bulletText: `${idx}. `, items: [] };
                    parsedBlocks.push(blk);
                    c.childNodes.forEach(child => walkNode(child, blk.items, metadata));
                    idx++;
                 }
              });
           } else if (tag === 'li') {
              if (metadata.inUl) {
                 const blk = { type: 'bullet', bulletText: "• ", items: [] };
                 parsedBlocks.push(blk);
                 node.childNodes.forEach(c => walkNode(c, blk.items, metadata));
              }
           } else if (tag === 'br') {
              currentBlock.push({ text: '\n', break: true });
           } else if (tag === 'strong' || tag === 'b') {
              node.childNodes.forEach(c => walkNode(c, currentBlock, { ...metadata, bold: true }));
           } else if (tag === 'em' || tag === 'i') {
              node.childNodes.forEach(c => walkNode(c, currentBlock, { ...metadata, italic: true }));
           } else {
              node.childNodes.forEach(c => walkNode(c, currentBlock, metadata));
           }
        }
      };
      
      Array.from(element.childNodes).forEach(c => walkNode(c, null));
      return parsedBlocks;
    };

    const brandColor = pkgData.themeColor ? hexToRgbO(pkgData.themeColor) : rgb(0.8, 0.1, 0.15); // Reddish default

    // Load Zandra Logo early
    let logoImg;
    let logoW = 150;
    let logoH = 50; // default height
    try {
      const logoBytes = await fetch('/zandralogo.png').then(res => res.arrayBuffer());
      logoImg = await pdfDoc.embedPng(logoBytes);
      logoH = (logoImg.height / logoImg.width) * logoW;
    } catch(e) { console.warn("Cover logo error", e); }


    // --- COVER PAGE GENERATION ---
    const coverPage = pdfDoc.addPage([595, 842]);
    const { width: coverW, height: coverH } = coverPage.getSize();
    
    // 1. Cover background (bottom half)
    if (pkgData.bgColor && pkgData.bgColor !== '#ffffff') {
      coverPage.drawRectangle({ x: 0, y: 0, width: coverW, height: coverH / 2, color: hexToRgbO(pkgData.bgColor) });
    } else {
      coverPage.drawRectangle({ x: 0, y: 0, width: coverW, height: coverH, color: rgb(1,1,1) });
    }

    // 2. Hero Image
    if (pkgData.coverHeroImageb64) {
      try {
        let heroImg;
        if (pkgData.coverHeroImageb64.includes('image/png')) {
          heroImg = await pdfDoc.embedPng(stripB64(pkgData.coverHeroImageb64));
        } else {
          heroImg = await pdfDoc.embedJpg(stripB64(pkgData.coverHeroImageb64));
        }
        coverPage.drawImage(heroImg, { x: 0, y: coverH / 2 - 20, width: coverW, height: coverH / 2 + 20 });
        } catch(e) { 
          console.warn("Failed to embed cover image", e); 
          coverPage.drawText("Error: " + e.message, { x: 20, y: coverH / 2 + 50, size: 12, font: fontBold, color: redColor });
        }
      }

    // 3. Cover Title (e.g. CHINA)
    if (pkgData.coverTitle) {
      const tSize = 72;
      const tWidth = fontBold.widthOfTextAtSize(pkgData.coverTitle.toUpperCase(), tSize);
      coverPage.drawText(pkgData.coverTitle.toUpperCase(), { 
        x: (coverW - tWidth) / 2 + 3, y: coverH / 2, size: tSize, font: fontBold, color: rgb(0,0,0), opacity: 0.6 
      });
      coverPage.drawText(pkgData.coverTitle.toUpperCase(), { 
        x: (coverW - tWidth) / 2, y: coverH / 2 + 3, size: tSize, font: fontBold, color: rgb(1,1,1) 
      });
    }

    // 4. Black Strip & Subtitle
    const stripH = 30;
    coverPage.drawRectangle({
      x: 0, y: coverH / 2 - 20 - stripH, width: coverW, height: stripH, color: rgb(0,0,0), opacity: 0.8
    });
    
    if (pkgData.coverSubtitle) {
      const subSize = 16;
      const subTxt = pkgData.coverSubtitle.toUpperCase();
      const subWidth = fontBold.widthOfTextAtSize(subTxt, subSize);
      coverPage.drawText(subTxt, { 
        x: (coverW - subWidth) / 2, y: coverH / 2 - 20 - stripH + 8, size: subSize, font: fontBold, color: rgb(1,1,1) 
      });
    }

    // 5. Duration & Location
    if (pkgData.coverDuration) {
      const dSize = 24;
      const dTxt = pkgData.coverDuration.toUpperCase();
      const dWidth = fontBold.widthOfTextAtSize(dTxt, dSize);
      coverPage.drawText(dTxt, {
        x: (coverW - dWidth) / 2, y: coverH / 2 - 120, size: dSize, font: fontBold, color: brandColor
      });
    }

    if (pkgData.coverLocation) {
      const lSize = 18;
      const lTxt = pkgData.coverLocation.toUpperCase();
      const lWidth = fontBold.widthOfTextAtSize(lTxt, lSize);
      coverPage.drawText(lTxt, {
        x: (coverW - lWidth) / 2, y: coverH / 2 - 150, size: lSize, font: fontBold, color: brandColor
      });
    }

    // 6. Zandra Logo (Moved further down as requested)
    if (logoImg) {
      coverPage.drawImage(logoImg, {
        x: (coverW - logoW) / 2, y: 70, width: logoW, height: logoH // y: 70 is near the bottom
      });
    }

    // 7. Bottom bar
    coverPage.drawRectangle({
       x: 0, y: 0, width: coverW, height: 40, color: brandColor
    });


    // --- INNER PAGES LOGIC ---
    let page;
    let currentY;

    // Helper to add a new inner page with custom header
    const addNewPage = () => {
      page = pdfDoc.addPage([595, 842]);
      if (pkgData.bgColor && pkgData.bgColor !== '#ffffff') {
        page.drawRectangle({
          x: 0, y: 0, width: 595, height: 842, color: hexToRgbO(pkgData.bgColor),
        });
      } else {
        page.drawRectangle({ x: 0, y: 0, width: 595, height: 842, color: rgb(1,1,1) });
      }

      // Draw custom beautiful header
      if (logoImg) {
         page.drawImage(logoImg, { x: (595 - logoW) / 2, y: 842 - logoH - 30, width: logoW, height: logoH });
         page.drawLine({ start: { x: 40, y: 842 - logoH - 45 }, end: { x: 555, y: 842 - logoH - 45 }, thickness: 1, color: brandColor });
         currentY = 842 - logoH - 70; // 70px gap below the header line
      } else {
         currentY = 780; 
      }
    };

    // Helper to calculate exact required height for a block of text
    const calculateSectionHeight = (title, items) => {
       let h = 30 + 15; // Title space + Title Margin + Bottom Margin
       if (!items) return h;
       for (const item of items) {
         if (!item.trim()) continue;
         h += 15; // margin before item
         const words = String(item.trim()).split(' ');
         let line = '';
         for (let i = 0; i < words.length; i++) {
            const testLine = line + words[i] + ' ';
            const testW = font.widthOfTextAtSize(testLine, 10.5);
            if (testW > 485 && i > 0) {
               h += 16; 
               line = words[i] + ' ';
            } else {
               line = testLine;
            }
         }
         if (line.trim().length > 0) h += 16;
       }
       return h;
    };

    const checkSpace = (neededSpace) => {
      if (currentY - neededSpace < 60) {
        addNewPage();
      }
    };

    const drawWrappedText = (text, rectOptions) => {
      const { x, maxWidth, size, fontToUse, color, lineHeight } = rectOptions;
      if (!text) return;
      
      const words = String(text).split(' ');
      let line = '';
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const testWidth = fontToUse.widthOfTextAtSize(testLine, size);
        
        if (testWidth > maxWidth && i > 0) {
          checkSpace(lineHeight);
          page.drawText(line.trim(), { x, y: currentY, size, font: fontToUse, color });
          currentY -= lineHeight;
          line = words[i] + ' ';
        } else {
          line = testLine;
        }
      }
      
      if (line.trim().length > 0) {
        checkSpace(lineHeight);
        page.drawText(line.trim(), { x, y: currentY, size, font: fontToUse, color });
        currentY -= lineHeight;
      }
    };

    // Embed an image if provided (handles base64 data URLs)
    const drawImageBlock = async (img1b64, img2b64) => {
      if (!img1b64 && !img2b64) return;
      checkSpace(170); // need ~150px height
      
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
        } catch (e) { 
           console.warn("Failed to embed image 1", e); 
           page.drawText("Error loading image 1: " + e.message, { x: 40, y: yPos + 70, size: 10, font: fontBold, color: redColor });
        }
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
        } catch (e) { 
           console.warn("Failed to embed image 2", e); 
           page.drawText("Error loading image 2: " + e.message, { x: 300, y: yPos + 70, size: 10, font: fontBold, color: redColor });
        }
      }
      
      currentY -= 170;
    };


    /** START DRAWING CONTENT **/
    addNewPage(); // start the first inner page

    checkSpace(50);
    page.drawText("Greetings from Zandra Travelers !!", { x: 40, y: currentY, size: 13, font: fontBold, color: linkColor });
    currentY -= 22;
    page.drawText("I appreciate your inquiry and am pleased to submit the details of travel itinerary herewith.", { x: 40, y: currentY, size: 10.5, font: fontBold, color: primaryColor });
    currentY -= 28;

    await drawImageBlock(pkgData.image1b64, pkgData.image2b64);

    // Quick Facts
    const quickFactsBlocks = parseHTMLToTextBlocks(pkgData.quickFacts);
    if (quickFactsBlocks.length > 0) {
        page.drawText("Quick Facts & Overview:", { x: 40, y: currentY, size: 11, font: fontBold, color: brandColor });
        currentY -= 20;

        for (const block of quickFactsBlocks) {
          if (block.items.length === 0) {
            currentY -= 14; 
            continue;
          }
          
          let initX = 40;
          let initMaxWidth = 515;
          let standardSize = 10.5;

          if (block.type === 'bullet') {
             page.drawText(block.bulletText, { x: 45, y: currentY, size: 10, font: fontBold, color: primaryColor });
             initX = 55;
             initMaxWidth = 500;
          }

          let x = initX;
          let lineRemainingW = initMaxWidth;
          let lineTextFragments = [];
          
          const finishLine = () => {
             checkSpace(16); // check BEFORE drawing
             let drawX = initX;
             for (const frag of lineTextFragments) {
                page.drawText(frag.text, { x: drawX, y: currentY, size: standardSize, font: frag.font, color: primaryColor });
                drawX += frag.width;
             }
             currentY -= 16; 
             lineRemainingW = initMaxWidth;
             lineTextFragments = [];
             x = initX;
          };

          for (const item of block.items) {
             if (item.break) {
                finishLine();
                continue;
             }
             const fontToUse = item.bold ? fontBold : font;
             
             const words = item.text.split(' ');
             for (let i = 0; i < words.length; i++) {
               const word = words[i] + (i < words.length - 1 ? ' ' : '');
               if (!word) continue;
               
               const wWidth = fontToUse.widthOfTextAtSize(word, standardSize);
               if (wWidth > lineRemainingW && lineTextFragments.length > 0) {
                  finishLine();
               }
               lineTextFragments.push({ text: word, font: fontToUse, width: wWidth });
               lineRemainingW -= wWidth;
               x += wWidth;
             }
          }
          if (lineTextFragments.length > 0) finishLine();
          currentY -= 6;
        }
        currentY -= 10;
    }

    // Duration Block (Centered)
    if (pkgData.duration) {
      checkSpace(30);
      const durWidth = fontBold.widthOfTextAtSize(pkgData.duration, 14);
      page.drawText(pkgData.duration, { x: (595 - durWidth) / 2, y: currentY, size: 14, font: fontBold, color: goldColor });
      currentY -= 25;
    }

    // Costs
    if (pkgData.landPackageCost) {
      checkSpace(20);
      page.drawText(`Land Package: Cost: ${pkgData.landPackageCost} per adult on a twin/ triple sharing basis`, { x: 40, y: currentY, size: 10.5, font, color: amberColor });
      currentY -= 22;
    }

    if (pkgData.airFareCost) {
      checkSpace(20);
      page.drawText(`Air fare: Cost: ${pkgData.airFareCost} per adult `, { x: 40, y: currentY, size: 10.5, font, color: amberColor });
      const mainW = font.widthOfTextAtSize(`Air fare: Cost: ${pkgData.airFareCost} per adult `, 10.5);
      page.drawText("(Subject to change according to Availability)", { x: 40 + mainW, y: currentY, size: 10.5, font: fontBold, color: redColor });
      currentY -= 32;
    }

    // Hotels
    if (pkgData.hotels && pkgData.hotels.length > 0) {
      const hotelsHeight = pkgData.hotels.length * 15 + 40;
      checkSpace(hotelsHeight); // Ensure all hotels fit, or push entirely to next page

      page.drawText("Hotels to be Provided or Similar", { x: 40, y: currentY, size: 10, font: fontBold, color: primaryColor });
      const hw = fontBold.widthOfTextAtSize("Hotels to be Provided or Similar", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + hw, y: currentY - 2 }, thickness: 1, color: primaryColor });
      currentY -= 20;

      for (const h of pkgData.hotels) {
        page.drawText(`${h.city} = ${h.name}`, { x: 40, y: currentY, size: 10.5, font: fontBold, color: primaryColor });
        if (h.nights || h.rating) {
           const rightTxt = `( ${h.nights} Nights) ${h.rating} Hotel`.trim();
           page.drawText(rightTxt, { x: 340, y: currentY, size: 10.5, font: fontBold, color: primaryColor });
        }
        currentY -= 17;
      }
      currentY -= 20;
    }

    // Inclusions
    if (pkgData.includes && pkgData.includes.length > 0) {
      const neededHeight = calculateSectionHeight("Package includes:", pkgData.includes);
      checkSpace(neededHeight); // Push entire section if it doesn't fit

      page.drawText("Package includes:", { x: 40, y: currentY, size: 10, font: fontBold, color: brandColor });
      const iw = fontBold.widthOfTextAtSize("Package includes:", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + iw, y: currentY - 2 }, thickness: 1, color: brandColor });
      currentY -= 15;

      for (const item of pkgData.includes) {
        if (!item.trim()) continue;
        currentY -= 13; 
        page.drawText("•", { x: 55, y: currentY, size: 10, font: fontBold, color: primaryColor });
        drawWrappedText(item.trim(), { x: 70, maxWidth: 485, size: 10.5, fontToUse: font, color: primaryColor, lineHeight: 12.5 });
      }
      currentY -= 15;
    }

    // Exclusions
    if (pkgData.excludes && pkgData.excludes.length > 0) {
      const neededHeight = calculateSectionHeight("Package Excludes:", pkgData.excludes);
      checkSpace(neededHeight); // Push entire section if it doesn't fit

      page.drawText("Package Excludes:", { x: 40, y: currentY, size: 10, font: fontBold, color: brandColor });
      const iw = fontBold.widthOfTextAtSize("Package Excludes:", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + iw, y: currentY - 2 }, thickness: 1, color: brandColor });
      currentY -= 15;

      for (const item of pkgData.excludes) {
        if (!item.trim()) continue;
        currentY -= 13; 
        page.drawText("•", { x: 55, y: currentY, size: 10, font: fontBold, color: primaryColor });
        drawWrappedText(item.trim(), { x: 70, maxWidth: 485, size: 10.5, fontToUse: font, color: primaryColor, lineHeight: 12.5 });
      }
      currentY -= 15;
    }

    // Secondary Images
    await drawImageBlock(pkgData.image3b64, pkgData.image4b64);
    currentY -= 15;

    // Notice
    if (pkgData.notice && pkgData.notice.length > 0) {
      const neededHeight = calculateSectionHeight("Important Notice", pkgData.notice);
      checkSpace(neededHeight); // Push entire section if it doesn't fit

      page.drawText("Important Notice", { x: 40, y: currentY, size: 10, font: fontBold, color: brandColor });
      const iw = fontBold.widthOfTextAtSize("Important Notice", 10);
      page.drawLine({ start: { x: 40, y: currentY - 2 }, end: { x: 40 + iw, y: currentY - 2 }, thickness: 1, color: brandColor });
      currentY -= 15;

      for (const item of pkgData.notice) {
        if (!item.trim()) continue;
        currentY -= 13; 
        page.drawText("•", { x: 40, y: currentY, size: 10, font: fontBold, color: primaryColor });
        drawWrappedText(item.trim(), { x: 48, maxWidth: 507, size: 10.5, fontToUse: fontBold, color: primaryColor, lineHeight: 12.5 });
      }
      currentY -= 15;
    }

    // Footer Block
    checkSpace(100);
    currentY -= 10;
    page.drawText("For Further Clarification Please", { x: 40, y: currentY, size: 10, font: fontBold, color: brandColor });
    currentY -= 12;
    page.drawText("feel free to contact me at:", { x: 40, y: currentY, size: 10, font: fontBold, color: brandColor });
    currentY -= 20;

    page.drawText("Mobile: +94 75 315 6058 Yasindu Nawanjana", { x: 40, y: currentY, size: 10.5, font: fontBold, color: brandColor });
    currentY -= 14;
    page.drawText("Email: info@zandratravels.com", { x: 40, y: currentY, size: 10.5, font: fontBold, color: brandColor });
    const underlineLength = fontBold.widthOfTextAtSize("info@zandratravels.com", 10.5);
    page.drawLine({ start: { x: 72, y: currentY - 1 }, end: { x: 72 + underlineLength, y: currentY - 1 }, thickness: 0.5, color: brandColor });
    currentY -= 30;

    page.drawText("Zandra Travelers happy to assist with any questions or additional information you may need.", { x: 40, y: currentY, size: 10.5, font: fontBold, color: brandColor });


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
