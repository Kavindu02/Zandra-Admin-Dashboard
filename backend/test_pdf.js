const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs');

async function createPDF() {
    try {
        const existingPdfBytes = fs.readFileSync('../frontend/public/template.pdf');
        const pdfDoc = await PDFDocument.load(existingPdfBytes);
        
        let page = pdfDoc.getPages()[0];
        page.drawText('Test Text Page 1', { x: 50, y: 500, size: 20 });
        
        // Copy page like in my code
        const doc2 = await PDFDocument.load(existingPdfBytes);
        const [newPage] = await pdfDoc.copyPages(doc2, [0]);
        pdfDoc.addPage(newPage);
        
        let page2 = pdfDoc.getPages()[1];
        page2.drawText('Test Text Page 2', { x: 50, y: 500, size: 20 });
        
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync('test_output.pdf', pdfBytes);
        console.log('PDF generated! Check test_output.pdf');
    } catch (err) {
        console.error(err);
    }
}

createPDF();
