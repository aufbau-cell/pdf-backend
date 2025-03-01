const express = require('express');
const multer = require('multer');
const { PDFDocument } = require('pdf-lib');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

app.post('/merge', upload.array('pdfs'), async (req, res) => {
    try {
        if (!req.files || req.files.length < 2) {
            return res.status(400).json({ error: 'At least two PDF files are required' });
        }

        const mergedPdf = await PDFDocument.create();

        for (const file of req.files) {
            const pdfBytes = fs.readFileSync(file.path);
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const copiedPages = await mergedPdf.copyPages(pdfDoc, pdfDoc.getPageIndices());
            copiedPages.forEach(page => mergedPdf.addPage(page));
            fs.unlinkSync(file.path);
        }

        const mergedPdfBytes = await mergedPdf.save();
        const outputPath = path.join(__dirname, 'merged.pdf');
        fs.writeFileSync(outputPath, mergedPdfBytes);

        res.download(outputPath, 'merged.pdf', () => {
            fs.unlinkSync(outputPath);
        });

    } catch (error) {
        console.error('Error merging PDFs:', error);
        res.status(500).json({ error: 'Failed to merge PDFs' });
    }
});

app.listen(5000, () => {
    console.log('Server running on port 5000');
});

