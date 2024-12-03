const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const app = express();
const port = 3000;

require('dotenv').config();

app.use(cors());
app.use(express.json());

// Decode Base64 credentials and create a temporary JSON file
const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
const credentialsPath = path.join(__dirname, 'credentials.json');
fs.writeFileSync(credentialsPath, Buffer.from(credentialsBase64, 'base64').toString('utf8'));

const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

const uploadToGoogleDrive = async (filePath, fileName) => {
    const fileMetadata = {
        name: fileName,
        parents: ['1gmOgHwekz3DPJR-nbrJXo527MEJ0V4mv'], // Replace with your Google Drive folder ID
    };
    const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink',
    });
    return response.data;
};

app.post('/submit-timesheet', async (req, res) => {
    try {
        // Your existing logic for handling the request and saving Excel locally
        const filePath = path.join(__dirname, 'timesheet.xlsx');
        const fileName = 'timesheet.xlsx';

        // Upload the file to Google Drive
        const driveResponse = await uploadToGoogleDrive(filePath, fileName);
        console.log('File uploaded to Google Drive:', driveResponse);

        res.send({
            message: 'Form submitted successfully!',
            driveLink: driveResponse.webViewLink,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).send({ error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
