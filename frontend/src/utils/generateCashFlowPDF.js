import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generateCashFlowPDF = async (cashFlowData, year) => {
  try {
    // 1. Load Template
    const templatePath = '/template.pdf';
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    // Use the first page of the template as background
    const [templatePage] = await pdfDoc.copyPages(pdfDoc, [0]);
    
    // Create a new PDF or use the first page of the template
    const pages = pdfDoc.getPages();
    const firstPage = pages[0];
    const { width, height } = firstPage.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    // Colors
    const primaryColor = rgb(0.06, 0.11, 0.26); // #101D42
    const emeraldColor = rgb(0.06, 0.72, 0.5); // #10b981
    const roseColor = rgb(0.94, 0.27, 0.27); // #ef4444
    const blueColor = rgb(0.23, 0.51, 0.96); // #3b82f6
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.96, 0.98);

    let currentY = height - 180; // Start below the template header

    // Report Title
    firstPage.drawText(`CASH FLOW STATEMENT - ${year}`, {
      x: 50,
      y: currentY,
      size: 18,
      font: fontBold,
      color: primaryColor,
    });
    currentY -= 40;

    // Summary Section
    const drawSummaryCard = (label, value, color, x) => {
      firstPage.drawRectangle({
        x: x,
        y: currentY - 50,
        width: 160,
        height: 60,
        color: lightGray,
        borderColor: color,
        borderWidth: 1,
      });
      
      firstPage.drawText(label.toUpperCase(), {
        x: x + 10,
        y: currentY - 15,
        size: 8,
        font: fontBold,
        color: grayColor,
      });
      
      const valText = `LKR ${Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
      firstPage.drawText(valText, {
        x: x + 10,
        y: currentY - 35,
        size: 10,
        font: fontBold,
        color: color,
      });
    };

    drawSummaryCard("Total Cash In", cashFlowData.summary.totalCashIn, emeraldColor, 50);
    drawSummaryCard("Total Cash Out", cashFlowData.summary.totalCashOut, roseColor, 220);
    drawSummaryCard("Net Cash Flow", cashFlowData.summary.netCashFlow, blueColor, 390);
    
    currentY -= 80;

    // Table Header
    const tableHeaderY = currentY;
    firstPage.drawRectangle({
       x: 50,
       y: tableHeaderY - 20,
       width: 500,
       height: 25,
       color: primaryColor,
    });

    const headers = ["Month", "Cash In (LKR)", "Cash Out (LKR)", "Net (LKR)", "Running Bal"];
    const colWidths = [100, 100, 100, 100, 100];
    let currentX = 60;

    headers.forEach((h, i) => {
      firstPage.drawText(h, {
        x: currentX,
        y: tableHeaderY - 13,
        size: 9,
        font: fontBold,
        color: rgb(1, 1, 1),
      });
      currentX += colWidths[i];
    });

    currentY -= 20;

    // Table Rows
    cashFlowData.monthlyData.forEach((row, index) => {
      const rowY = currentY - (index * 20) - 20;
      
      // Zebra striping
      if (index % 2 === 0) {
        firstPage.drawRectangle({
          x: 50,
          y: rowY - 5,
          width: 500,
          height: 20,
          color: rgb(0.98, 0.98, 0.99),
        });
      }

      let rowX = 60;
      
      // Month
      firstPage.drawText(row.monthName, { x: rowX, y: rowY, size: 9, font: fontBold, color: grayColor });
      rowX += colWidths[0];

      // Cash In
      firstPage.drawText(row.cashIn.toLocaleString(), { x: rowX, y: rowY, size: 9, font, color: emeraldColor });
      rowX += colWidths[1];

      // Cash Out
      firstPage.drawText(row.cashOut.toLocaleString(), { x: rowX, y: rowY, size: 9, font, color: roseColor });
      rowX += colWidths[2];

      // Net
      firstPage.drawText(row.net.toLocaleString(), { x: rowX, y: rowY, size: 9, font: fontBold, color: row.net >= 0 ? blueColor : roseColor });
      rowX += colWidths[3];

      // Running Balance
      firstPage.drawText(row.runningBalance.toLocaleString(), { x: rowX, y: rowY, size: 9, font: fontBold, color: primaryColor });
    });

    // Total Row
    const totalY = currentY - (cashFlowData.monthlyData.length * 20) - 30;
    firstPage.drawRectangle({
        x: 50,
        y: totalY - 5,
        width: 500,
        height: 25,
        color: lightGray,
    });
    
    firstPage.drawText("TOTAL", { x: 60, y: totalY, size: 10, font: fontBold, color: primaryColor });
    firstPage.drawText(cashFlowData.summary.totalCashIn.toLocaleString(), { x: 60 + colWidths[0], y: totalY, size: 10, font: fontBold, color: emeraldColor });
    firstPage.drawText(cashFlowData.summary.totalCashOut.toLocaleString(), { x: 60 + colWidths[0] + colWidths[1], y: totalY, size: 10, font: fontBold, color: roseColor });
    firstPage.drawText(cashFlowData.summary.netCashFlow.toLocaleString(), { x: 60 + colWidths[0] + colWidths[1] + colWidths[2], y: totalY, size: 10, font: fontBold, color: blueColor });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Cash_Flow_Report_${year}_${Date.now()}.pdf`;
    link.click();

  } catch (error) {
    console.error("Error generating Cash Flow PDF:", error);
    alert("Failed to generate PDF Report. Please check the console for details.");
  }
};
