const express = require('express');
const path = require('path');

const app = express();
const PORT = 3000;

// Serve static files from the current directory
app.use(express.static(path.join(__dirname)));

// Serve the index.html file
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Main JavaScript for the web application
document.addEventListener('DOMContentLoaded', () => {
    // Load saved timetables from localStorage
    const timetables = Object.keys(localStorage).filter(key => !key.startsWith('settings'));
    timetables.forEach(timetableName => {
        try {
            const data = JSON.parse(localStorage.getItem(timetableName));
            if (data) {
                console.log(`Loaded timetable: ${timetableName}`);
            }
        } catch (error) {
            console.error(`Error loading timetable ${timetableName}:`, error);
        }
    });
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
});