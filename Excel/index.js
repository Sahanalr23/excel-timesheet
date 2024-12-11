// const express = require('express');
// const cors = require('cors');
// const xlsx = require('xlsx');
// const fs = require('fs');
// const path = require('path');
// const { google } = require('googleapis');
// require('dotenv').config();

// const app = express();
// const PORT = process.env.PORT || 3000;

// // Middleware
// app.use(cors({ origin: 'https://sahanalr23.github.io', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
// app.use(express.json());

// // Verify GOOGLE_CREDENTIALS_BASE64 exists
// if (!process.env.GOOGLE_CREDENTIALS_BASE64) {
//     console.error('Error: GOOGLE_CREDENTIALS_BASE64 environment variable is missing!');
//     process.exit(1);
// }

// // Decode Base64 credentials and create a temporary JSON file
// const credentialsBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
// const credentialsPath = path.join(__dirname, 'credentials.json');
// try {
//     fs.writeFileSync(credentialsPath, Buffer.from(credentialsBase64, 'base64').toString('utf8'));
// } catch (err) {
//     console.error('Error writing credentials file:', err.message);
//     process.exit(1);
// }

// // Google Drive and Sheets setup
// const auth = new google.auth.GoogleAuth({
//     keyFile: credentialsPath,
//     scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
// });
// const drive = google.drive({ version: 'v3', auth });
// const sheets = google.sheets({ version: 'v4', auth });

// const SPREADSHEET_ID = '1ShahDd5R8zjz8j5IKNfuI3MwhLjztSM6'; // Replace with your Google Sheet ID
// const SHEET_NAME = 'timesheet'; // Replace with your sheet name
// const DRIVE_FOLDER_ID = '1gmOgHwekz3DPJR-nbrJXo527MEJ0V4mv'; // Replace with your Google Drive folder ID

// // Append data to the Google Sheet
// const appendToSheet = async (data) => {
//     const sheets = google.sheets({ version: 'v4', auth });

//     try {
//         await sheets.spreadsheets.values.append({
//             spreadsheetId: 'SPREADSHEET_ID', // Replace with your Google Sheet ID
//             range: 'timesheet!A:F', // Adjust the range to match your sheet
//             valueInputOption: 'USER_ENTERED',
//             resource: {
//                 values: [data],
//             },
//         });
//         console.log('Data appended successfully!');
//     } catch (error) {
//         console.error('Error appending data to Google Sheet:', error.message);
//         throw new Error('Failed to append data to Google Sheet');
//     }
// };


// // Download Google Sheet as Excel file
// const downloadSheetAsExcel = async (filePath) => {
//     const response = await sheets.spreadsheets.get({
//         spreadsheetId: SPREADSHEET_ID,
//         includeGridData: false,
//     });

//     const sheetTitle = response.data.sheets[0].properties.title;

//     const rows = await sheets.spreadsheets.values.get({
//         spreadsheetId: SPREADSHEET_ID,
//         range: `${sheetTitle}!A:F`,
//     });

//     const workbook = xlsx.utils.book_new();
//     const worksheet = xlsx.utils.aoa_to_sheet(rows.data.values);
//     xlsx.utils.book_append_sheet(workbook, worksheet, 'Timesheet');
//     xlsx.writeFile(workbook, filePath);
// };

// // Upload file to Google Drive
// const uploadToGoogleDrive = async (filePath, fileName) => {
//     const fileMetadata = {
//         name: fileName,
//         parents: [DRIVE_FOLDER_ID],
//     };
//     const media = {
//         mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
//         body: fs.createReadStream(filePath),
//     };

//     const response = await drive.files.create({
//         resource: fileMetadata,
//         media,
//         fields: 'id, webViewLink',
//     });
//     return response.data;
// };

// // API Endpoint to handle form submission
// app.post('/submit-timesheet', async (req, res) => {
//     try {
//         const { userName, propertyName, description, timeIn, timeOut, date } = req.body;

//         // Validate input
//         if (!userName || !propertyName || !description || !timeIn || !timeOut || !date) {
//             return res.status(400).json({ error: 'All fields are required!' });
//         }

//         const data = [userName, propertyName, description, timeIn, timeOut, date];

//         // Append data to Google Sheet
//         await appendToSheet(data);

//         // Generate Excel file locally
//         const filePath = path.join(__dirname, 'timesheet.xlsx');
//         await downloadSheetAsExcel(filePath);

//         // Upload Excel file to Google Drive
//         const driveResponse = await uploadToGoogleDrive(filePath, 'timesheet.xlsx');
//         console.log(`File uploaded to Google Drive: ${driveResponse.webViewLink}`);

//         // Clean up local file
//         fs.unlinkSync(filePath);

//         res.json({
//             message: 'Form submitted successfully!',
//             driveLink: driveResponse.webViewLink,
//         });
//     } catch (error) {
//         console.error('Error:', error.message);
//         res.status(500).json({ error: error.message });
//     }
// });

// // Clean up temporary credentials file on exit
// process.on('exit', () => {
//     if (fs.existsSync(credentialsPath)) {
//         fs.unlinkSync(credentialsPath);
//     }
// });

// // Start server
// app.listen(PORT, () => {
//     console.log(`Server running on http://localhost:${PORT}`);
// });



const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'https://sahanalr23.github.io', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
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

// Google Drive and Sheets setup
const auth = new google.auth.GoogleAuth({
    keyFile: credentialsPath,
    scopes: ['https://www.googleapis.com/auth/drive.file', 'https://www.googleapis.com/auth/spreadsheets'],
});
const drive = google.drive({ version: 'v3', auth });
const sheets = google.sheets({ version: 'v4', auth });

// Define constants
const SPREADSHEET_ID = '1ShahDd5R8zjz8j5IKNfuI3MwhLjztSM6'; // Replace with your actual Google Sheet ID
const SHEET_NAME = 'timesheet'; // Replace with the correct sheet name
const DRIVE_FOLDER_ID = '1gmOgHwekz3DPJR-nbrJXo527MEJ0V4mv'; // Replace with your Google Drive folder ID

// Append data to the Google Sheet
const appendToSheet = async (data) => {
    try {
        // Fetch sheet details to get the sheet ID
        const sheetDetails = await sheets.spreadsheets.get({
            spreadsheetId: SPREADSHEET_ID,
        });

        // Get the first sheet ID
        const sheetId = sheetDetails.data.sheets.find(sheet => sheet.properties.title === SHEET_NAME)?.properties.sheetId;

        if (!sheetId) {
            throw new Error(`Sheet "${SHEET_NAME}" not found in the spreadsheet`);
        }

        // Prepare rows to insert
        const rows = data.map(value => ({ values: [{ userEnteredValue: { stringValue: value } }] }));

        // Use batchUpdate to insert rows
        await sheets.spreadsheets.batchUpdate({
            spreadsheetId: SPREADSHEET_ID,
            resource: {
                requests: [
                    {
                        appendCells: {
                            sheetId,
                            rows: [{ values: rows }],
                            fields: 'userEnteredValue',
                        },
                    },
                ],
            },
        });

        console.log('Data inserted successfully!');
    } catch (error) {
        console.error('Error inserting data to Google Sheet:', error.response?.data || error.message);
        throw new Error('Failed to insert data to Google Sheet');
    }
};


// Download Google Sheet as Excel file
const downloadSheetAsExcel = async (filePath) => {
    const response = await sheets.spreadsheets.get({
        spreadsheetId: SPREADSHEET_ID,
        includeGridData: false,
    });

    const sheetTitle = response.data.sheets[0].properties.title;

    const rows = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetTitle}!A:F`,
    });

    const workbook = xlsx.utils.book_new();
    const worksheet = xlsx.utils.aoa_to_sheet(rows.data.values);
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Timesheet');
    xlsx.writeFile(workbook, filePath);
};

// Upload file to Google Drive
const uploadToGoogleDrive = async (filePath, fileName) => {
    const fileMetadata = {
        name: fileName,
        parents: [DRIVE_FOLDER_ID],
    };
    const media = {
        mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        body: fs.createReadStream(filePath),
    };

    const response = await drive.files.create({
        resource: fileMetadata,
        media,
        fields: 'id, webViewLink',
    });
    return response.data;
};

// API Endpoint to handle form submission
app.post('/submit-timesheet', async (req, res) => {
    try {
        const { userName, propertyName, description, timeIn, timeOut, date } = req.body;

        // Validate input
        if (!userName || !propertyName || !description || !timeIn || !timeOut || !date) {
            return res.status(400).json({ error: 'All fields are required!' });
        }

        const data = [userName, propertyName, description, timeIn, timeOut, date];

        // Append data to Google Sheet
        await appendToSheet(data);

        // Generate Excel file locally
        const filePath = path.join(__dirname, 'timesheet.xlsx');
        await downloadSheetAsExcel(filePath);

        // Upload Excel file to Google Drive
        const driveResponse = await uploadToGoogleDrive(filePath, 'timesheet.xlsx');
        console.log(`File uploaded to Google Drive: ${driveResponse.webViewLink}`);

        // Clean up local file
        fs.unlinkSync(filePath);

        res.json({
            message: 'Form submitted successfully!',
            driveLink: driveResponse.webViewLink,
        });
    } catch (error) {
        console.error('Error:', error.message);
        res.status(500).json({ error: error.message });
    }
});

// Clean up temporary credentials file on exit
process.on('exit', () => {
    if (fs.existsSync(credentialsPath)) {
        fs.unlinkSync(credentialsPath);
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
