require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt'); // For password hashing

const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse form data
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

// Load environment variables securely (assuming hashed password is stored)
const email = process.env.EMAIL_USER;
const hashedPassword = process.env.HASHED_PASSWORD; // Use hashed password

// Function to compare plain-text password with hashed password (for future use)
async function comparePassword(plainTextPassword) {
  const isMatch = await bcrypt.compare(plainTextPassword, hashedPassword);
  return isMatch;
}

// Create Nodemailer transporter using Outlook (or another service)
const transporter = nodemailer.createTransport({
  service: 'outlook',
  auth: {
    user: email,
    pass: hashedPassword // Use hashed password here
  },
});

// POST route to handle form submission
app.post('/submit-timesheet', async (req, res) => {
  const { name, description, time_in, time_out, timedate } = req.body;

  try {
    const mailOptions = {
      from: 'sahana.lr@techunifi.com', // Your email
      to: 'admin@techunifi.com', // Recipient's email
      subject: 'New Timesheet Submission',
      text: `
        Property Name: ${name}
        Description: ${description}
        Time In: ${time_in}
        Time Out: ${time_out}
        Date: ${timedate}
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(200).send('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    res.status(500).send('Error sending email');
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});