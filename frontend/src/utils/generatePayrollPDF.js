import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export const generatePayrollPDF = async (payrollData, month) => {
  try {
    const templatePath = '/template.pdf';
    const existingPdfBytes = await fetch(templatePath).then(res => res.arrayBuffer());
    const pdfDoc = await PDFDocument.load(existingPdfBytes);
    
    const [templatePage] = await pdfDoc.copyPages(pdfDoc, [0]);
    const firstPage = pdfDoc.getPages()[0];
    const { width, height } = firstPage.getSize();
    
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    
    const primaryColor = rgb(0.06, 0.11, 0.26); // #101D42
    const grayColor = rgb(0.4, 0.4, 0.4);
    const lightGray = rgb(0.95, 0.96, 0.98);

    let currentY = height - 180;

    firstPage.drawText(`PAYROLL SUMMARY REPORT - ${month}`, {
      x: 50,
      y: currentY,
      size: 18,
      font: fontBold,
      color: primaryColor,
    });
    currentY -= 40;

    // Table Header
    const tableHeaderY = currentY;
    firstPage.drawRectangle({
       x: 50,
       y: tableHeaderY - 20,
       width: 500,
       height: 25,
       color: primaryColor,
    });

    const headers = ["Employee", "Gross", "EPF (Emp)", "EPF (Empr)", "ETF", "Net"];
    const colWidths = [120, 80, 70, 70, 60, 100];
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

    // Summary Totals
    let totalGross = 0;
    let totalNet = 0;

    // Table Rows
    payrollData.forEach((row, index) => {
      totalGross += Number(row.gross);
      totalNet += Number(row.netSalary);

      const rowY = currentY - (index * 20) - 20;
      
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
      firstPage.drawText(row.employeeName, { x: rowX, y: rowY, size: 8, font: fontBold, color: grayColor }); rowX += colWidths[0];
      firstPage.drawText(Number(row.gross).toLocaleString(), { x: rowX, y: rowY, size: 8, font }); rowX += colWidths[1];
      firstPage.drawText(Number(row.epfEmp).toLocaleString(), { x: rowX, y: rowY, size: 8, font }); rowX += colWidths[2];
      firstPage.drawText(Number(row.epfEmpr).toLocaleString(), { x: rowX, y: rowY, size: 8, font }); rowX += colWidths[3];
      firstPage.drawText(Number(row.etf).toLocaleString(), { x: rowX, y: rowY, size: 8, font }); rowX += colWidths[4];
      firstPage.drawText(Number(row.netSalary).toLocaleString(), { x: rowX, y: rowY, size: 8, font: fontBold, color: primaryColor });
    });

    const summaryY = currentY - (payrollData.length * 20) - 30;
    firstPage.drawRectangle({
        x: 50,
        y: summaryY - 30,
        width: 500,
        height: 40,
        color: lightGray,
    });

    firstPage.drawText(`TOTAL EMPLOYEES: ${payrollData.length}`, { x: 60, y: summaryY - 20, size: 10, font: fontBold, color: primaryColor });
    firstPage.drawText(`TOTAL PAYOUT: LKR ${totalNet.toLocaleString()}`, { x: 350, y: summaryY - 20, size: 10, font: fontBold, color: primaryColor });

    const pdfBytes = await pdfDoc.save();
    const blob = new Blob([pdfBytes], { type: 'application/pdf' });
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Payroll_Report_${month}.pdf`;
    link.click();
  } catch (error) {
    console.error("Error generating Payroll PDF:", error);
    alert("Failed to generate PDF Report.");
  }
};
