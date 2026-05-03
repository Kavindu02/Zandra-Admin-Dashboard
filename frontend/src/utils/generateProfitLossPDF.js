import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { toast } from 'react-hot-toast';

export const generateProfitLossPDF = async (plData, year) => {
  try {
    // 1. Load Template
    const templatePath = '/template.pdf';
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
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
    const amberColor = rgb(0.96, 0.62, 0.04); // #f59e0b
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.96, 0.98);

    let currentY = height - 180; // Start below the template header

    // Report Title
    firstPage.drawText(`PROFIT & LOSS STATEMENT - ${year}`, {
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
        width: 120,
        height: 60,
        color: lightGray,
        borderColor: color,
        borderWidth: 1,
      });
      
      firstPage.drawText(label.toUpperCase(), {
        x: x + 10,
        y: currentY - 15,
        size: 7,
        font: fontBold,
        color: grayColor,
      });
      
      const valText = `LKR ${Number(value || 0).toLocaleString(undefined, { minimumFractionDigits: 0 })}`;
      firstPage.drawText(valText, {
        x: x + 10,
        y: currentY - 35,
        size: 9,
        font: fontBold,
        color: color,
      });
    };

    drawSummaryCard("Total Income", plData.summary.totalIncome, emeraldColor, 50);
    drawSummaryCard("Gross Profit", plData.summary.totalGrossProfit, amberColor, 180);
    drawSummaryCard("Total Expenses", plData.summary.totalExpenses, roseColor, 310);
    drawSummaryCard("Net Profit", plData.summary.totalNetProfit, primaryColor, 440);
    
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

    const headers = ["Month", "Income (LKR)", "COGS (LKR)", "Expenses (LKR)", "Net Profit (LKR)"];
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
    plData.monthlyData.forEach((row, index) => {
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

      // Income
      firstPage.drawText((row.income || 0).toLocaleString(), { x: rowX, y: rowY, size: 9, font, color: emeraldColor });
      rowX += colWidths[1];

      // COGS
      firstPage.drawText((row.cogs || 0).toLocaleString(), { x: rowX, y: rowY, size: 9, font, color: amberColor });
      rowX += colWidths[2];

      // Expenses
      firstPage.drawText((row.expenses || 0).toLocaleString(), { x: rowX, y: rowY, size: 9, font, color: roseColor });
      rowX += colWidths[3];

      // Net Profit
      firstPage.drawText((row.netProfit || 0).toLocaleString(), { x: rowX, y: rowY, size: 9, font: fontBold, color: (row.netProfit || 0) >= 0 ? primaryColor : roseColor });
    });

    // Total Row
    const totalY = currentY - (plData.monthlyData.length * 20) - 30;
    firstPage.drawRectangle({
        x: 50,
        y: totalY - 5,
        width: 500,
        height: 25,
        color: lightGray,
    });
    
    firstPage.drawText("TOTAL", { x: 60, y: totalY, size: 10, font: fontBold, color: primaryColor });
    firstPage.drawText(plData.summary.totalIncome.toLocaleString(), { x: 60 + colWidths[0], y: totalY, size: 10, font: fontBold, color: emeraldColor });
    firstPage.drawText(plData.summary.totalCogs.toLocaleString(), { x: 60 + colWidths[0] + colWidths[1], y: totalY, size: 10, font: fontBold, color: amberColor });
    firstPage.drawText(plData.summary.totalExpenses.toLocaleString(), { x: 60 + colWidths[0] + colWidths[1] + colWidths[2], y: totalY, size: 10, font: fontBold, color: roseColor });
    firstPage.drawText(plData.summary.totalNetProfit.toLocaleString(), { x: 60 + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3], y: totalY, size: 10, font: fontBold, color: primaryColor });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Profit_Loss_Report_${year}_${Date.now()}.pdf`;
    link.click();

  } catch (error) {
    console.error("Error generating Profit & Loss PDF:", error);
    toast.error("Failed to generate PDF Report. Please check the console for details.");
  }
};
