const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
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

// Decode Base64 credentials and set up Google Auth
const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
const credentials = JSON.parse(Buffer.from(credentialsBase64, 'base64').toString('utf8'));

const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

const SPREADSHEET_ID = '1Pxb8VfflfVp9MtYY4wlEwhuBpWY2ozva'; // Replace with your spreadsheet ID
const SHEET_NAME = 'timesheet'; // Replace with your sheet name

// Endpoint to handle form submission
app.post('/submit-timesheet', async (req, res) => {
    try {
        const { propertyName, description, timeIn, timeOut, date } = req.body;

        // Validate input
        if (!propertyName || !description || !timeIn || !timeOut || !date) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        // Prepare data to append
        const values = [[propertyName, description, timeIn, timeOut, date]];

        // Append data to Google Sheet
        await sheets.spreadsheets.values.append({
            spreadsheetId: SPREADSHEET_ID,
            range: `${SHEET_NAME}!A:E`, // Adjust range as needed
            valueInputOption: 'USER_ENTERED', // Allows user-like input (e.g., date formatting)
            resource: { values },
        });

        console.log('Data appended successfully to Google Sheet.');

        res.status(200).json({
            message: 'Form submitted successfully!',
            sheetLink: `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}`,
        });
    } catch (error) {
        console.error('Error appending data to Google Sheet:', error.message);
        res.status(500).json({ error: 'Failed to append data to Google Sheet' });
    }
});

app.listen(port, () => {
    console.log(`Server running on http://localhost:${port}`);
});
