/**
 * AgniFounders Membership Card & QR Code Generator
 */

const fs = require('fs');
const path = require('path');
const QRCode = require('qrcode');
const PDFDocument = require('pdfkit');

// Helper to ensure folders exist
const ensureDirectoryExists = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

/**
 * Generate a dynamic QR Code image as a base64 string
 * @param {string} text - The verification link
 * @returns {Promise<string>} Base64 Data URL
 */
async function generateQRCode(text) {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      color: {
        dark: '#0A0A0F', // Dark purple/black theme
        light: '#FFFFFF' // Light background
      },
      width: 300,
      margin: 1
    });
    return dataUrl;
  } catch (err) {
    console.error('Error generating QR code:', err);
    throw err;
  }
}

/**
 * Generate a premium membership card PDF using PDFKit
 * Saves directly to server/public/cards/ directory.
 * @param {Object} member - The member details
 * @returns {Promise<Object>} File paths of generated assets
 */
async function generateMembershipCard(member) {
  const cardsDir = path.join(__dirname, '..', 'public', 'cards');
  ensureDirectoryExists(cardsDir);

  const pdfFileName = `${member.application_id}_card.pdf`;
  const pdfFilePath = path.join(cardsDir, pdfFileName);
  
  const verifyUrl = `http://localhost:8000/verify/${member.application_id}`;
  const qrBase64 = await generateQRCode(verifyUrl);

  try {
    // Generate valid, premium PDF layout using pdfkit
    const doc = new PDFDocument({
      size: [480, 300], // Premium ID Card Aspect Ratio
      margins: { top: 20, bottom: 20, left: 20, right: 20 }
    });

    const writeStream = fs.createWriteStream(pdfFilePath);
    doc.pipe(writeStream);

    // 1. Draw Background Fill
    doc.rect(0, 0, 480, 300).fill('#0A0A0F');

    // 2. Draw Accent Borders
    doc.rect(10, 10, 460, 280).lineWidth(1.5).stroke('#F5A623');

    // 3. Draw Brand header
    doc.fillColor('#FFFFFF')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('AgniFounders', 25, 25);
       
    doc.fillColor('#F5A623')
       .fontSize(20)
       .font('Helvetica-Bold')
       .text('.', 150, 25);

    doc.fillColor('#8A8A9A')
       .fontSize(7)
       .font('Helvetica')
       .text('POWERED BY THIRAN PRIVATE LTD', 25, 47);

    // 4. Draw Membership Tier Badge
    doc.rect(345, 22, 110, 24).fill('#1A1A24');
    doc.rect(345, 22, 110, 24).lineWidth(1).stroke('#F5A623');
    doc.fillColor('#F5A623')
       .fontSize(9)
       .font('Helvetica-Bold')
       .text(member.membership_type.toUpperCase(), 355, 29, { width: 90, align: 'center' });

    // 5. Draw Profile Data Columns
    doc.fillColor('#FFFFFF')
       .fontSize(14)
       .font('Helvetica-Bold')
       .text(member.member_name, 25, 85);

    doc.fillColor('#F5A623')
       .fontSize(9.5)
       .font('Courier-Bold')
       .text(member.application_id, 25, 103);

    // Details Grid lines
    let currentY = 135;
    const drawRow = (label, value) => {
      doc.fillColor('#8A8A9A').fontSize(7.5).font('Helvetica').text(label.toUpperCase(), 25, currentY);
      doc.fillColor('#FFFFFF').fontSize(8.5).font('Helvetica-Bold').text(value, 25, currentY + 11);
      currentY += 32;
    };

    drawRow('College', member.college_name || 'N/A');
    if (member.startup_name) {
      drawRow('Startup Name', member.startup_name);
    } else {
      drawRow('Status', 'Active Member');
    }

    // Expiry date info in footer
    const expiryStr = new Date(member.expiry_date).toLocaleDateString();
    doc.fillColor('#8A8A9A').fontSize(7.5).font('Helvetica').text('VALID UNTIL:', 25, 238);
    doc.fillColor('#F5A623').fontSize(8.5).font('Helvetica-Bold').text(expiryStr, 25, 249);

    // 6. Render and Embed QR code image from base64 string
    const base64Data = qrBase64.replace(/^data:image\/png;base64,/, '');
    const qrBuffer = Buffer.from(base64Data, 'base64');
    doc.image(qrBuffer, 325, 80, { width: 130 });

    // Footer Branding
    doc.fillColor('#8A8A9A')
       .fontSize(7.5)
       .font('Helvetica-Oblique')
       .text('Dream • Build • Launch', 325, 238, { width: 130, align: 'center' });

    doc.end();

    // Wait for the stream to fully finish writing
    await new Promise((resolve, reject) => {
      writeStream.on('finish', resolve);
      writeStream.on('error', reject);
    });

  } catch (err) {
    console.error('Error generating premium PDF card:', err);
    throw err;
  }

  return {
    qr_code_url: qrBase64,
    card_pdf_url: `/cards/${pdfFileName}`,
    card_png_url: `/cards/${member.application_id}_card.png`
  };
}

module.exports = {
  generateQRCode,
  generateMembershipCard
};
