// const express = require('express');
// const cors = require('cors');
// const xlsx = require('xlsx');
// const fs = require('fs');
// const path = require('path');

// const app = express();
// const port = 3000;

// app.use(cors());
// app.use(express.json());

// // Utility function to validate dates
// const isValidDate = (dateString) => {
//     const date = new Date(dateString);
//     return !isNaN(date.getTime());
// };

// // Utility function to format time as HH:mm
// const formatTime = (date) => {
//     const hours = date.getHours().toString().padStart(2, '0');
//     const minutes = date.getMinutes().toString().padStart(2, '0');
//     return `${hours}:${minutes}`;
// };

// app.post('/submit-timesheet', (req, res) => {
//     try {
//         const formData = req.body;

//         // Validate the date
//         if (!isValidDate(formData.date)) {
//             throw new Error('Invalid date format. Expected YYYY-MM-DD.');
//         }

//         // Split and validate timeIn and timeOut
//         const timeInParts = formData.timeIn.split(':');
//         const timeOutParts = formData.timeOut.split(':');

//         if (timeInParts.length !== 2 || timeOutParts.length !== 2) {
//             throw new Error('Invalid time format. Expected HH:MM.');
//         }

//         // Create Date objects for timeIn and timeOut
//         const fullDate = new Date(formData.date);
//         const timeIn = new Date(fullDate);
//         const timeOut = new Date(fullDate);

//         timeIn.setHours(timeInParts[0], timeInParts[1]);
//         timeOut.setHours(timeOutParts[0], timeOutParts[1]);

//         // Format the times
//         const timeInFormatted = formatTime(timeIn);
//         const timeOutFormatted = formatTime(timeOut);

//         // Path for the Excel file
//         const filePath = path.join(__dirname, 'timesheet.xlsx');

//         let workbook, worksheet;

//         // Check if the file exists
//         if (fs.existsSync(filePath)) {
//             workbook = xlsx.readFile(filePath);

//             if (!workbook.Sheets['Timesheet']) {
//                 // If the sheet does not exist, create it with initial data
//                 const data = [
//                     ['Property Name', 'Description', 'Time In', 'Time Out', 'Date'],
//                     [formData.propertyName, formData.description, timeInFormatted, timeOutFormatted, fullDate.toISOString().split('T')[0]],
//                 ];
//                 worksheet = xlsx.utils.aoa_to_sheet(data);
//                 workbook.Sheets['Timesheet'] = worksheet;
//             } else {
//                 // Append data to existing sheet
//                 worksheet = workbook.Sheets['Timesheet'];
//                 const existingData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
//                 existingData.push([
//                     formData.propertyName,
//                     formData.description,
//                     timeInFormatted,
//                     timeOutFormatted,
//                     fullDate.toISOString().split('T')[0],
//                 ]);
//                 worksheet = xlsx.utils.aoa_to_sheet(existingData);
//                 workbook.Sheets['Timesheet'] = worksheet;
//             }
//         } else {
//             // Create a new workbook and worksheet if the file doesn't exist
//             workbook = xlsx.utils.book_new();
//             const data = [
//                 ['Property Name', 'Description', 'Time In', 'Time Out', 'Date'],
//                 [formData.propertyName, formData.description, timeInFormatted, timeOutFormatted, fullDate.toISOString().split('T')[0]],
//             ];
//             worksheet = xlsx.utils.aoa_to_sheet(data);
//             workbook.Sheets['Timesheet'] = worksheet;
//         }

//         // Save the workbook
//         xlsx.writeFile(workbook, filePath);

//         res.send('Form submitted successfully. Excel file updated.');
//     } catch (error) {
//         console.error('Error:', error.message);
//         res.status(400).send({ error: error.message });
//     }
// });

// app.listen(port, () => {
//     console.log(`Server running on http://localhost:${port}`);
// });

const { google } = require('googleapis');
const express = require('express');
const cors = require('cors');
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const credentials = require('./credentials.json'); 

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());



// Utility function to wait for a specified time (in ms)
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Function to read the Excel file with retry logic
const readFileWithRetry = async (filePath, retries = 5, delay = 1000) => {
    while (retries > 0) {
        try {
            return xlsx.readFile(filePath);  // Try reading the file
        } catch (error) {
            if (error.code === 'EBUSY' && retries > 0) {  // If file is busy, retry
                console.log(`File is busy, retrying... ${retries} attempts left`);
                await wait(delay);  // Wait before retrying
                retries -= 1;
            } else {
                throw error;  // Throw other errors immediately
            }
        }
    }
    throw new Error('Failed to read the file after multiple attempts');
};

const auth = new google.auth.GoogleAuth({
    keyFile: './credentials.json',
    scopes: SCOPES,
});

const drive = google.drive({ version: 'v3', auth });

const uploadToGoogleDrive = async (filePath, fileName) => {
    const fileMetadata = {
        name: fileName,
        parents: ['1vIkOdDxVgCzRjISU6itd0H6-4TWGcbBT'], // Replace 'your-folder-id' with the actual folder ID
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
        // Save Excel locally (your existing logic)
        const filePath = path.join(__dirname, 'timesheet.xlsx');
        const fileName = 'timesheet.xlsx';

        // Upload to Google Drive
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