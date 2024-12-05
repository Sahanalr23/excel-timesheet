const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

require('dotenv').config();

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

// Verify GOOGLE_CREDENTIALS_BASE64 exists
if (!process.env.GOOGLE_CREDENTIALS_BASE64) {
    console.error('Error: GOOGLE_CREDENTIALS_BASE64 environment variable is missing!');
    process.exit(1);
}

// Decode Base64 credentials and create a temporary JSON file
const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
const credentialsPath = path.join(__dirname, 'credentials.json');

try {
    fs.writeFileSync(credentialsPath, Buffer.from(credentialsBase64, 'base64').toString('utf8'));
} catch (err) {
    console.error('Error writing credentials file:', err.message);
    process.exit(1);
}

const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
});

const drive = google.drive({ version: 'v3', auth });

// File ID of the existing Google Drive file
const GOOGLE_DRIVE_FILE_ID = '1gmOgHwekz3DPJR-nbrJXo527MEJ0V4mv'; // Replace with the actual file ID of the sheet in Google Drive

const downloadFileFromDrive = async (fileId, destinationPath) => {
    const dest = fs.createWriteStream(destinationPath);
    await drive.files.get(
        { fileId, alt: 'media' },
        { responseType: 'stream' },
        (err, { data }) => {
            if (err) throw new Error(`Error downloading file: ${err.message}`);
            data.pipe(dest);
        }
    );
    return new Promise((resolve, reject) => {
        dest.on('finish', () => resolve());
        dest.on('error', (err) => reject(err));
    });
};

const uploadToGoogleDrive = async (filePath, fileId) => {
    const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fs.createReadStream(filePath),
    };

    const response = await drive.files.update({
        fileId: fileId,
        media: media,
    });

    return response.data;
};

app.post('/submit-timesheet', async (req, res) => {
    try {
        const { userName, propertyName, description, timeIn, timeOut, date } = req.body;

        // Validate input
        if (!userName || !propertyName || !description || !timeIn || !timeOut || !date) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        // Download the existing Excel file
        const filePath = path.join(__dirname, 'timesheet.xlsx');
        await downloadFileFromDrive(GOOGLE_DRIVE_FILE_ID, filePath);

        // Load the existing workbook and append the new data
        const workbook = xlsx.readFile(filePath);
        const worksheet = workbook.Sheets['Timesheet']; // Ensure the sheet name matches your actual sheet
        const newRow = [userName, propertyName, description, timeIn, timeOut, date];
        const existingData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
        existingData.push(newRow);
        const updatedWorksheet = xlsx.utils.aoa_to_sheet(existingData);
        workbook.Sheets['Timesheet'] = updatedWorksheet;

        // Save the updated workbook locally
        xlsx.writeFile(workbook, filePath);

        // Upload the updated file back to Google Drive
        const driveResponse = await uploadToGoogleDrive(filePath, GOOGLE_DRIVE_FILE_ID);

        // Clean up local file
        fs.unlinkSync(filePath);

        res.send({
            message: 'Form submitted successfully!',
            driveLink: `https://drive.google.com/file/d/${GOOGLE_DRIVE_FILE_ID}/view`,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send({ error: error.message });
    }
});

// Clean up temporary credentials file on exit
process.on('exit', () => {
    if (fs.existsSync(credentialsPath)) {
        fs.unlinkSync(credentialsPath);
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
