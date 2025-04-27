const fs = require('fs');
const path = require('path');

let selectedDate = new Date();
let timetableData = {};
let currentTimetableName = null;
let CLASSES_DIR = path.join(__dirname, 'classes');

// Create classes directory if it doesn't exist
if (!fs.existsSync(CLASSES_DIR)) {
  fs.mkdirSync(CLASSES_DIR, { recursive: true });
}

function updateTimetableForWeek(newSelectedDate) {
  selectedDate = newSelectedDate;
  const monday = new Date(selectedDate);
  const dayOfWeek = selectedDate.getDay();
  monday.setDate(selectedDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Update day cells with dates and content
  const dayRows = document.querySelectorAll('.week-table tbody tr');
  dayRows.forEach((row, index) => {
    const firstCell = row.querySelector('td:first-child');
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + index);
    
    // Update day name and date
    const dayName = firstCell.textContent.split(' ')[0];
    firstCell.textContent = `${dayName} (${formatDate(currentDate)})`;
    
    // Update content cells
    const cells = row.querySelectorAll('td:not(:first-child)');
    cells.forEach((cell, colIndex) => {
      cell.replaceWith(cell.cloneNode(true));
      const newCell = row.querySelectorAll('td:not(:first-child)')[colIndex];
      
      const content = getCellContent(currentDate, colIndex);
      newCell.textContent = content;
      
      const dateKey = formatDateKey(currentDate);
      const isPermanent = checkIfPermanentHour(index, colIndex, content);
      if (isPermanent) {
        newCell.classList.add('permanent-hour');
      } else {
        newCell.classList.remove('permanent-hour');
      }
      
      newCell.addEventListener('input', () => {
        saveCellContent(currentDate, colIndex, newCell.textContent);
      });
    });
  });
  
  // Show timetable
  const timeTable = document.querySelector('.time-table');
  timeTable.style.display = 'block';
  
  highlightCurrentDay();
}

// Helper functions
function formatDate(date) {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

function checkIfPermanentHour(dayIndex, colIndex, content) {
  if (!currentTimetableName || !content) return false;
  const dayKey = `${dayIndex + 1}`;
  const permanentContent = timetableData[currentTimetableName]?.permanentHours?.[dayKey]?.[colIndex];
  return permanentContent === content;
}

// Storage functions
function saveTimeTableToFile(timetableName) {
  const filePath = path.join(CLASSES_DIR, `${timetableName}.json`);
  try {
    const data = timetableData[timetableName] || {};
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving timetable:', error);
    return false;
  }
}

function loadTimeTableFromFile(timetableName) {
  const filePath = path.join(CLASSES_DIR, `${timetableName}.json`);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      timetableData[timetableName] = data;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error loading timetable:', error);
    return false;
  }
}

// Export functions and variables needed by renderer
module.exports = {
  updateTimetableForWeek,
  saveTimeTableToFile,
  loadTimeTableFromFile,
  CLASSES_DIR,
  selectedDate,
  timetableData,
  currentTimetableName
};
