const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'https://sahanalr23.github.io/', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(express.json());

// Verify GOOGLE_CREDENTIALS_BASE64 exists
if (!process.env.GOOGLE_CREDENTIALS_BASE64) {
  console.error('Error: GOOGLE_CREDENTIALS_BASE64 environment variable is missing!');
  process.exit(1);
}

// Decode Base64 credentials and create a temporary JSON file (same as before)

// Google APIs setup (same as before)

// Define constants
const SPREADSHEET_ID = '17xp08DNwal5DTc2pd8I8x-a1TQCQZZr_Oy882MIu_TU'; // Replace with your actual spreadsheet ID
const SHEET_NAME = 'Timesheet';

// Function to append data to Google Sheet
const appendToSheet = async (spreadsheetId, data) => {
  try {
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A:F`,
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: [data],
      },
    });
    console.log('Data appended successfully!');
  } catch (error) {
    console.error('Error appending data to Google Sheet:', error.response?.data || error.message);
    throw new Error('Failed to append data to Google Sheet');
  }
};

// API Endpoint to handle form submission
app.post('/submit-timesheet', async (req, res) => {
  try {
    const { userName, propertyName, description, timeIn, timeOut, date } = req.body;

    // Validate input (same as before)

    const data = [userName, propertyName, description, timeIn, timeOut, date];

    // Append data to the existing Google Sheet
    await appendToSheet(SPREADSHEET_ID, data);

    res.json({
      message: 'Form submitted successfully!',
      spreadsheetId: SPREADSHEET_ID,
    });
  } catch (error) {
    console.error('Error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Clean up temporary credentials file on exit (same as before)

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
