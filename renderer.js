const fs = require('fs');
const path = require('path');
const { ipcRenderer } = require('electron');

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();
let selectedDate = new Date(); // Add this to track selected date
let timetableData = {};
let currentTimetableName = null;

// Make CLASSES_DIR variable modifiable
let CLASSES_DIR = path.join(__dirname, 'classes');

// Load saved directory path on startup
try {
  const settings = JSON.parse(fs.readFileSync(path.join(__dirname, 'settings.json')));
  if (settings.classesDir) {
    CLASSES_DIR = settings.classesDir;
  }
} catch (error) {
  // If settings file doesn't exist, use default path
  console.log('No settings file found, using default path');
}

// Create classes directory if it doesn't exist
if (!fs.existsSync(CLASSES_DIR)) {
  fs.mkdirSync(CLASSES_DIR, { recursive: true });
}

function showNotification(message) {
  const notification = document.createElement('div');
  notification.className = 'notification';
  notification.textContent = message;
  document.body.appendChild(notification);
  
  // Trigger animation
  setTimeout(() => notification.classList.add('show'), 10);
  
  // Remove notification after 3 seconds
  setTimeout(() => {
    notification.classList.remove('show');
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function updateCalendar(month, year, calendarId, titleId) {
  const calendarElement = document.getElementById(calendarId);
  const calendarTitle = document.getElementById(titleId);

  // Update the calendar title
  const monthNames = [
    'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
    'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
  ];
  calendarTitle.textContent = `${monthNames[month]} ${year}`;

  // Clear the existing calendar
  calendarElement.innerHTML = '';

  // Generate the new calendar
  const now = new Date(year, month);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfWeek = new Date(year, month, 1).getDay();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  const table = document.createElement('table');
  const tableBody = document.createElement('tbody');

  // Add the weekday headers (starting from Monday)
  const weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
  const headerRow = document.createElement('tr');
  weekdays.forEach(weekday => {
    const headerCell = document.createElement('th');
    headerCell.textContent = weekday;
    headerRow.appendChild(headerCell);
  });
  tableBody.appendChild(headerRow);

  // Adjust the first day of the week to start on Monday
  const adjustedFirstDayOfWeek = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);

  // Generate the days of the month
  let row = document.createElement('tr');

  // Add cells for the days from the previous month
  for (let i = adjustedFirstDayOfWeek; i > 0; i--) {
    const prevMonthDay = daysInPrevMonth - i + 1;
    const cell = document.createElement('td');
    cell.textContent = prevMonthDay;
    cell.classList.add('prev-month', 'month-dates');
    row.appendChild(cell);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const cell = document.createElement('td');
    cell.textContent = day;
    
    // Add hover interactions
    cell.classList.add('hoverable');
    
    // Check if this date is in the selected week
    const cellDate = new Date(year, month, day);
    const mondayOfSelected = new Date(selectedDate);
    const selectedDay = selectedDate.getDay();
    mondayOfSelected.setDate(selectedDate.getDate() - (selectedDay === 0 ? 6 : selectedDay - 1));
    
    // Calculate end of week (Friday)
    const fridayOfSelected = new Date(mondayOfSelected);
    fridayOfSelected.setDate(mondayOfSelected.getDate() + 4);
    
    // Highlight if date is between Monday and Friday of selected week
    if (cellDate >= mondayOfSelected && cellDate <= fridayOfSelected) {
      cell.classList.add('week-highlight');
    }

    // Add click handler to calendar dates
    cell.addEventListener('click', () => {
      const selectedDate = new Date(year, month, day);
      updateTimetableForWeek(selectedDate);
    });

    // Fix the logic for highlighting the current date
    const today = new Date();
    if (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    ) {
      cell.classList.add('current-date');
    } else {
      cell.classList.add('dates');
    }

    row.appendChild(cell);

    // Append the row only if it's full
    if ((adjustedFirstDayOfWeek + day) % 7 === 0) {
      tableBody.appendChild(row);
      row = document.createElement('tr');
    }
  }

  // Add cells for the days from the next month only if the last row is incomplete
  if (row.children.length > 0 && row.children.length < 7) {
    let nextMonthDay = 1;
    while (row.children.length < 7) {
      const cell = document.createElement('td');
      cell.textContent = nextMonthDay++;
      cell.classList.add('next-month', 'month-dates');
      row.appendChild(cell);
    }
    tableBody.appendChild(row); // Append the last row
  }

  // Append the table body to the table
  table.appendChild(tableBody);

  // Append the table to the calendar element
  calendarElement.appendChild(table);
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
    
    // Clear and update all cells in the row
    const cells = row.querySelectorAll('td:not(:first-child)');
    cells.forEach((cell, colIndex) => {
      // Remove old event listeners
      cell.replaceWith(cell.cloneNode(true));
      const newCell = row.querySelectorAll('td:not(:first-child)')[colIndex];
      
      // Set content from storage for this specific date and timetable
      const content = getCellContent(currentDate, colIndex);
      newCell.textContent = content;
      
      // Check if this is a permanent hour for the current timetable
      const dateKey = formatDateKey(currentDate);
      const isPermanent = checkIfPermanentHour(index, colIndex, content);
      if (isPermanent) {
        newCell.classList.add('permanent-hour');
      } else {
        newCell.classList.remove('permanent-hour');
      }
      
      // Add new event listener
      newCell.addEventListener('input', () => {
        saveCellContent(currentDate, colIndex, newCell.textContent);
      });
    });
  });
  
  // Show timetable if not visible
  const timeTable = document.querySelector('.time-table');
  timeTable.style.display = 'block';
  
  highlightCurrentDay();
}

// Add helper function to check if a cell contains a permanent hour
function checkIfPermanentHour(dayIndex, colIndex, content) {
  if (!currentTimetableName || !content) return false;
  
  const dayKey = `${dayIndex + 1}`; // +1 because Monday is 1, Sunday is 0
  const permanentContent = timetableData[currentTimetableName]?.permanentHours?.[dayKey]?.[colIndex];
  
  return permanentContent === content;
}

document.addEventListener('DOMContentLoaded', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'none'; // Ensure the select screen is hidden on startup
});

// Add event listener to the open-cal button if it exists
const openCalButton = document.querySelector('.open-cal');
if (openCalButton) {
  openCalButton.addEventListener('click', () => {
    const popup = document.getElementById('pop-up');
    popup.classList.toggle('active');
    const selectScreen = document.getElementById('select-screen');
    selectScreen.style.display = 'none'; // Close the select screen when opening the calendar
  });
}

// Add event listener to the close button
document.getElementById('close-button').addEventListener('click', () => {
  const popup = document.getElementById('pop-up');
  popup.classList.toggle('active');
});

// Add event listener to the "create-new" button
document.getElementById('create-new').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'flex';
  selectScreen.classList.add('active');
  document.getElementById('name-input').value = '';
  document.getElementById('name-input').focus();
});

// Add event listener to the close button in the select window
document.getElementById('close-select').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'none';
  selectScreen.classList.remove('active');
});

// Add event listener to the submit button
document.getElementById('submit-button').addEventListener('click', () => {
  const name = document.getElementById('name-input').value;
  const type = document.getElementById('type-select').value;
  console.log(`Name: ${name}, Type: ${type}`);
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'none'; // Close the select screen after submission
});

// Add functionality to create a button dynamically when submitting the form in the select screen
document.getElementById('submit-button').addEventListener('click', () => {
  const nameInput = document.getElementById('name-input').value.trim();
  if (nameInput) {
    // Initialize data structure for new timetable
    if (!timetableData[nameInput]) {
      timetableData[nameInput] = {};
    }

    const dynamicLinksContainer = document.getElementById('dynamic-links-container');
    const newButton = createClassButton(nameInput);
    dynamicLinksContainer.appendChild(newButton);

    // Clear the input and hide the select screen
    document.getElementById('name-input').value = '';
    const selectScreen = document.getElementById('select-screen');
    selectScreen.style.display = 'none';
  }
});

// Initialize only one calendar
document.addEventListener('DOMContentLoaded', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'none';
  
  // Initialize only the timetable calendar
  updateCalendar(currentMonth, currentYear, 'timetable-calendar', 'timetable-calendar-title');
  
  // Update event listeners for timetable calendar buttons
  const timetableContainer = document.querySelector('.timetable-calendar');
  if (timetableContainer) {
    const prevButton = timetableContainer.querySelector('.prev-button');
    const nextButton = timetableContainer.querySelector('.next-button');
    
    if (prevButton) {
      prevButton.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
          currentMonth = 11;
          currentYear--;
        }
        updateCalendar(currentMonth, currentYear, 'timetable-calendar', 'timetable-calendar-title');
        updateTimetableForWeek(selectedDate);
      });
    }
    
    if (nextButton) {
      nextButton.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
          currentMonth = 0;
          currentYear++;
        }
        updateCalendar(currentMonth, currentYear, 'timetable-calendar', 'timetable-calendar-title');
        updateTimetableForWeek(selectedDate);
      });
    }
  }

  document.getElementById('create-new').addEventListener('click', () => {
    const selectScreen = document.getElementById('select-screen');
    selectScreen.style.display = 'flex';
    const nameInput = document.getElementById('name-input');
    nameInput.value = '';
    nameInput.focus();
  });

  document.getElementById('close-select').addEventListener('click', () => {
    document.getElementById('select-screen').style.display = 'none';
  });

  updateTableDates();
  highlightCurrentDay();
});

// Remove duplicate event listeners and consolidate into one handler
document.getElementById('create-new').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.classList.add('active');
  const nameInput = document.getElementById('name-input');
  nameInput.value = '';
  nameInput.focus();
});

document.getElementById('close-select').addEventListener('click', () => {
  document.getElementById('select-screen').classList.remove('active');
});

document.getElementById('submit-button').addEventListener('click', () => {
  const nameInput = document.getElementById('name-input').value.trim();
  if (nameInput) {
    const dynamicLinksContainer = document.getElementById('dynamic-links-container');
    const newButton = createClassButton(nameInput);
    dynamicLinksContainer.appendChild(newButton);

    // Clear the input and hide the select screen
    document.getElementById('name-input').value = '';
    const selectScreen = document.getElementById('select-screen');
    selectScreen.style.display = 'none';
  }
});

// Replace operator/admin button event listener
document.querySelector('.operator-button').addEventListener('click', () => {
  const verificationWindow = document.getElementById('verification-window');
  if (verificationWindow) {
    verificationWindow.style.display = 'flex';
    const codeInput = document.getElementById('verification-code');
    if (codeInput) {
      codeInput.value = ''; // Clear previous input
      codeInput.focus(); // Focus the input field
    }
  } else {
    console.error('Verification window element not found');
  }
});

// Add keypress event listener for the verification code input
document.getElementById('verification-code').addEventListener('keypress', (event) => {
  if (event.key === 'Enter') {
    event.preventDefault();
    document.getElementById('confirm-verification').click();
  }
});

document.getElementById('confirm-verification').addEventListener('click', () => {
  const codeInput = document.getElementById('verification-code').value.trim();
  if (codeInput === '1918') {
    showNotification('Access granted!');
    const verificationWindow = document.getElementById('verification-window');
    verificationWindow.style.display = 'none';

    if (!currentTimetableName) {
      showNotification('Please select a timetable first');
      return;
    }

    // Show clear data button in admin mode
    const clearDataButton = document.querySelector('.clear-data-button');
    if (clearDataButton) {
      clearDataButton.style.display = 'block';
    }

    // Simple table editing with focus management
    const tableCells = document.querySelectorAll('.week-table td:not(:first-child)');
    tableCells.forEach(cell => {
      cell.contentEditable = 'true';
      cell.style.backgroundColor = '#555';
      
      // Modified input handler for operator mode
      cell.addEventListener('input', function() {
        const content = this.textContent.trim();
        if (content !== '') {
          this.classList.add('permanent-hour');
          // Get position in timetable
          const row = this.parentElement;
          const rowIndex = Array.from(row.parentElement.children).indexOf(row);
          const colIndex = Array.from(row.children).indexOf(this) - 1;
          
          // Save to all weeks for current timetable only
          saveToAllWeeksForCurrentTimetable(rowIndex, colIndex, content);
        } else {
          this.classList.remove('permanent-hour');
        }
      });
      
      // Add focus handling
      cell.addEventListener('click', function() {
        this.focus();
      });
    });
  } else {
    showNotification('Invalid code. Please try again.');
  }
});

// Add clear data button event listener
document.querySelector('.clear-data-button').addEventListener('click', () => {
  if (!currentTimetableName) {
    showNotification('Please select a timetable first');
    return;
  }

  // First confirmation dialog
  const firstDialog = document.createElement('div');
  firstDialog.className = 'verification-window';
  firstDialog.style.display = 'flex';
  firstDialog.innerHTML = `
    <div class="verification-content">
      <h3>Clear Data</h3>
      <p>Are you sure you want to clear all data from "${currentTimetableName}"?</p>
      <div class="verification-buttons">
        <button id="first-confirm-clear">Yes</button>
        <button id="first-cancel-clear">No</button>
      </div>
    </div>
  `;

  document.body.appendChild(firstDialog);

  firstDialog.querySelector('#first-confirm-clear').addEventListener('click', () => {
    firstDialog.remove();
    
    // Second confirmation dialog
    const secondDialog = document.createElement('div');
    secondDialog.className = 'verification-window';
    secondDialog.style.display = 'flex';
    secondDialog.innerHTML = `
      <div class="verification-content">
        <h3>Final Confirmation</h3>
        <p>Are you absolutely sure? This cannot be undone!</p>
        <div class="verification-buttons">
          <button id="final-confirm-clear">Yes, Clear Data</button>
          <button id="final-cancel-clear">No, Keep Data</button>
        </div>
      </div>
    `;

    document.body.appendChild(secondDialog);

    secondDialog.querySelector('#final-confirm-clear').addEventListener('click', () => {
      const filePath = path.join(CLASSES_DIR, `${currentTimetableName}.timtbl`);
      try {
        // Clear the data
        const emptyData = { permanentHours: {} };
        fs.writeFileSync(filePath, JSON.stringify(emptyData, null, 2));
        showNotification('Timetable data cleared successfully!');

        // Reset the data in memory
        timetableData[currentTimetableName] = emptyData;
        
        // Refresh the timetable display
        updateTimetableForWeek(selectedDate);

        // Exit admin mode
        const tableCells = document.querySelectorAll('.week-table td:not(:first-child)');
        tableCells.forEach(cell => {
          cell.contentEditable = 'false';
          cell.style.backgroundColor = '';
        });
        document.querySelector('.clear-data-button').style.display = 'none';
        showNotification('Exited admin mode');

      } catch (error) {
        console.error('Error clearing timetable data:', error);
        showNotification('Error clearing timetable data!');
      }
      secondDialog.remove();
    });

    secondDialog.querySelector('#final-cancel-clear').addEventListener('click', () => {
      secondDialog.remove();
    });
  });

  firstDialog.querySelector('#first-cancel-clear').addEventListener('click', () => {
    firstDialog.remove();
  });
});

// Add new function for timetable-specific permanent hours
function saveToAllWeeksForCurrentTimetable(dayIndex, colIndex, content) {
  if (!currentTimetableName) return;

  // Use a more compact format for permanent hours
  if (!timetableData[currentTimetableName]) {
    timetableData[currentTimetableName] = {};
  }
  
  if (!timetableData[currentTimetableName].permanentHours) {
    timetableData[currentTimetableName].permanentHours = {};
  }

  // Store by day and column instead of by date
  const dayKey = `${dayIndex + 1}`; // +1 because Monday is 1, Sunday is 0
  if (!timetableData[currentTimetableName].permanentHours[dayKey]) {
    timetableData[currentTimetableName].permanentHours[dayKey] = {};
  }
  
  timetableData[currentTimetableName].permanentHours[dayKey][colIndex] = content;
  
  // Save changes to file
  saveTimeTableToFile(currentTimetableName);
}

// Update the getCellContent function to check permanent hours first
function getCellContent(date, columnIndex) {
  if (!currentTimetableName) return '';
  
  // First check if there's a permanent hour for this day
  const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7
  const permanentContent = timetableData[currentTimetableName]?.permanentHours?.[dayOfWeek]?.[columnIndex];
  if (permanentContent) {
    return permanentContent;
  }
  
  // If no permanent hour, check for specific date content
  const dateKey = formatDateKey(date);
  return timetableData[currentTimetableName]?.[dateKey]?.[columnIndex] || '';
}

// Update the checkIfPermanentHour function to use the new format
function checkIfPermanentHour(dayIndex, colIndex, content) {
  if (!currentTimetableName || !content) return false;
  
  const dayKey = `${dayIndex + 1}`; // +1 because Monday is 1, Sunday is 0
  const permanentContent = timetableData[currentTimetableName]?.permanentHours?.[dayKey]?.[colIndex];
  
  return permanentContent === content;
}

document.querySelector('.edit-button').addEventListener('click', () => {
  const tableCells = document.querySelectorAll('.week-table td:not(:first-child)');
  tableCells.forEach(cell => {
    // Skip cells with permanent-hours
    if (!cell.classList.contains('permanent-hour')) {
      const newCell = cell.cloneNode(true); // Create fresh cell
      newCell.contentEditable = 'true';
      newCell.style.backgroundColor = '#555';
      
      // Add click handler
      newCell.addEventListener('click', function() {
        this.focus();
      });

      // Add input handler for regular edits only
      newCell.addEventListener('input', function() {
        const row = this.parentElement;
        const rowIndex = Array.from(row.parentElement.children).indexOf(row);
        const colIndex = Array.from(row.children).indexOf(this) - 1;
        const monday = new Date(selectedDate);
        const dayOfWeek = selectedDate.getDay();
        monday.setDate(selectedDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
        const cellDate = new Date(monday);
        cellDate.setDate(monday.getDate() + rowIndex);
        
        // Save only to specific date
        saveCellContent(cellDate, colIndex, this.textContent);
      });

      cell.parentNode.replaceChild(newCell, cell);
    }
  });
});

function saveToAllWeeks(dayIndex, colIndex, content) {
  // Calculate dates for the whole year
  const startDate = new Date(currentYear, 0, 1);
  const endDate = new Date(currentYear + 1, 0, 1);
  
  for (let d = startDate; d < endDate; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === dayIndex + 1) { // +1 because Monday is 1, Sunday is 0
      saveCellContent(new Date(d), colIndex, content);
    }
  }
}

// Add event listener for the save button
document.querySelector('.save-button').addEventListener('click', handleSave);

function handleSave() {
  if (!currentTimetableName) {
    showNotification('Please select a timetable first');
    return;
  }

  const dayRows = document.querySelectorAll('.week-table tbody tr');
  dayRows.forEach((row, index) => {
    const currentDate = new Date(selectedDate);
    const dayOfWeek = selectedDate.getDay();
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    currentDate.setDate(monday.getDate() + index);

    const cells = row.querySelectorAll('td:not(:first-child)');
    cells.forEach((cell, colIndex) => {
      if (cell.textContent.trim()) {
        saveCellContent(currentDate, colIndex, cell.textContent);
      }
      
      // Create fresh cell without event listeners
      const newCell = cell.cloneNode(true);
      newCell.contentEditable = 'false';
      newCell.style.backgroundColor = '';
      if (cell.classList.contains('permanent-hour')) {
        newCell.classList.add('permanent-hour');
      }
      cell.parentNode.replaceChild(newCell, cell);
    });
  });
  showNotification('Changes saved!');
  saveTimeTableToFile(currentTimetableName);
}

// Ensure the "create-new" button remains functional
document.getElementById('create-new').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'flex'; // Show the select screen
  document.getElementById('name-input').focus(); // Focus on the input field
});

function formatDate(date) {
  return `${date.getDate()}.${date.getMonth() + 1}.`;
}

function updateTableDates() {
  const today = new Date();
  const monday = new Date(today);
  const dayOfWeek = today.getDay();
  
  // Adjust to Monday (1) of current week
  monday.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
  
  // Update day cells with dates
  const dayRows = document.querySelectorAll('.week-table tbody tr');
  dayRows.forEach((row, index) => {
    const firstCell = row.querySelector('td:first-child');
    const currentDate = new Date(monday);
    currentDate.setDate(monday.getDate() + index);
    firstCell.textContent = `${firstCell.textContent} (${formatDate(currentDate)})`;
  });
}

function highlightCurrentDay() {
  const days = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
  const currentDay = days[new Date().getDay()];
  
  // Remove highlight from all cells first
  document.querySelectorAll('.week-table td:first-child').forEach(cell => {
    cell.classList.remove('current-day');
  });
  
  // Add highlight to current day
  document.querySelectorAll('.week-table td:first-child').forEach(cell => {
    if (cell.textContent.includes(currentDay)) {
      cell.classList.add('current-day');
    }
  });
}

function saveCellContent(date, columnIndex, content) {
  if (!currentTimetableName) return; // Don't save if no timetable is selected
  
  const dateKey = formatDateKey(date);
  if (!timetableData[currentTimetableName]) {
    timetableData[currentTimetableName] = {};
  }
  if (!timetableData[currentTimetableName][dateKey]) {
    timetableData[currentTimetableName][dateKey] = {};
  }
  timetableData[currentTimetableName][dateKey][columnIndex] = content;
}

function getCellContent(date, columnIndex) {
  if (!currentTimetableName) return '';
  
  // First check if there's a permanent hour for this day
  const dayOfWeek = date.getDay() || 7; // Convert Sunday (0) to 7
  const permanentContent = timetableData[currentTimetableName]?.permanentHours?.[dayOfWeek]?.[columnIndex];
  if (permanentContent) {
    return permanentContent;
  }
  
  // If no permanent hour, check for specific date content
  const dateKey = formatDateKey(date);
  return timetableData[currentTimetableName]?.[dateKey]?.[columnIndex] || '';
}

function formatDateKey(date) {
  return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
}

document.getElementById('close-app').addEventListener('click', () => {
  window.close();
});

// Update fullscreen toggle handler to manage icons
document.getElementById('fullscreen-toggle').addEventListener('click', () => {
  const button = document.getElementById('fullscreen-toggle');
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen();
    button.textContent = '□'; // Fullscreen icon (when in fullscreen)
  } else {
    document.exitFullscreen();
    button.textContent = '❐'; // Windowed icon (when in windowed)
  }
});

// Add fullscreen change event listener to update button when using Esc key
document.addEventListener('fullscreenchange', () => {
  const button = document.getElementById('fullscreen-toggle');
  button.textContent = document.fullscreenElement ? '□' : '❐';
});

function saveTimeTableToFile(timetableName) {
  const filePath = path.join(CLASSES_DIR, `${timetableName}.timtbl`);
  try {
    const data = timetableData[timetableName] || {};
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    showNotification('Timetable saved successfully!');
  } catch (error) {
    console.error('Error saving timetable:', error);
    showNotification('Error saving timetable!');
  }
}

function loadTimeTableFromFile(timetableName) {
  const filePath = path.join(CLASSES_DIR, `${timetableName}.timtbl`);
  try {
    if (fs.existsSync(filePath)) {
      const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      timetableData[timetableName] = data;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error loading timetable:', error);
    showNotification('Error loading timetable!');
    return false;
  }
}

// Replace the submit button event listener
document.getElementById('submit-button').addEventListener('click', () => {
  const nameInput = document.getElementById('name-input').value.trim();
  if (nameInput) {
    // Initialize data structure and create JSON file
    timetableData[nameInput] = {};
    saveTimeTableToFile(nameInput);

    const dynamicLinksContainer = document.getElementById('dynamic-links-container');
    const newButton = createClassButton(nameInput);
    dynamicLinksContainer.appendChild(newButton);

    document.getElementById('name-input').value = '';
    const selectScreen = document.getElementById('select-screen');
    selectScreen.style.display = 'none';
  }
});

// Replace the handleSave function
function handleSave() {
  if (!currentTimetableName) {
    showNotification('Please select a timetable first');
    return;
  }

  const dayRows = document.querySelectorAll('.week-table tbody tr');
  dayRows.forEach((row, index) => {
    const currentDate = new Date(selectedDate);
    const dayOfWeek = selectedDate.getDay();
    const monday = new Date(selectedDate);
    monday.setDate(selectedDate.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));
    currentDate.setDate(monday.getDate() + index);

    const cells = row.querySelectorAll('td:not(:first-child)');
    cells.forEach((cell, colIndex) => {
      if (cell.textContent.trim()) {
        saveCellContent(currentDate, colIndex, cell.textContent);
      }
      
      const newCell = cell.cloneNode(true);
      newCell.contentEditable = 'false';
      newCell.style.backgroundColor = '';
      if (cell.classList.contains('permanent-hour')) {
        newCell.classList.add('permanent-hour');
      }
      cell.parentNode.replaceChild(newCell, cell);
    });
  });

  // Save to JSON file
  saveTimeTableToFile(currentTimetableName);
}

// Add initialization code to load existing timetables
document.addEventListener('DOMContentLoaded', () => {
  // ...existing DOMContentLoaded code...

  // Load existing timetables
  try {
    const files = fs.readdirSync(CLASSES_DIR);
    files.forEach(file => {
      if (file.endsWith('.timtbl')) {
        const timetableName = path.basename(file, '.timtbl');
        const button = createClassButton(timetableName);
        document.getElementById('dynamic-links-container').appendChild(button);
      }
    });
  } catch (error) {
    console.error('Error loading timetables:', error);
  }
});

function updateEditMenu(container, className) {
  // Remove old menu if it exists
  const oldMenu = container.querySelector('.edit-menu');
  if (oldMenu) {
    oldMenu.remove();
  }

  // Create new menu
  const editMenu = document.createElement('div');
  editMenu.className = 'edit-menu';
  editMenu.innerHTML = `
    <button class="rename-button">Rename</button>
    <button class="delete-button">Delete</button>
  `;

  // Add click handlers
  editMenu.querySelector('.rename-button').addEventListener('click', () => {
    editMenu.classList.remove('active');
    showRenameDialog(className, container);
  });

  editMenu.querySelector('.delete-button').addEventListener('click', () => {
    showDeleteConfirmation(className, container);
    editMenu.classList.remove('active');
  });

  container.appendChild(editMenu);
  return editMenu;
}

function renameClass(oldName, newName, container) {
  const oldPath = path.join(CLASSES_DIR, `${oldName}.timtbl`);
  const newPath = path.join(CLASSES_DIR, `${newName}.timtbl`);

  try {
    // Read existing data
    const data = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
    
    // Write to new file
    fs.writeFileSync(newPath, JSON.stringify(data, null, 2));
    
    // Delete old file
    fs.unlinkSync(oldPath);
    
    // Update data structures
    timetableData[newName] = timetableData[oldName];
    delete timetableData[oldName];
    
    // Update UI elements
    const button = container.querySelector('.dynamic-button');
    button.textContent = newName;
    
    // Update the edit menu
    const editButton = container.querySelector('.edit-class-button');
    const editMenu = updateEditMenu(container, newName);
    
    editButton.onclick = (e) => {
      e.stopPropagation();
      editMenu.classList.toggle('active');
    };
    
    // Update timetable title and current name if this was the active timetable
    if (currentTimetableName === oldName) {
      currentTimetableName = newName;
      // Update both the h2 title and class title above timetable
      document.querySelectorAll('.time-table h2, .class-title').forEach(el => {
        if (el) el.textContent = newName;
      });
    }
    
    showNotification('Class renamed successfully!');
  } catch (error) {
    console.error('Error renaming class:', error);
    showNotification('Error renaming class!');
  }
}

function createClassButton(timetableName) {
  const container = document.createElement('div');
  container.className = 'class-button-container';

  const button = document.createElement('button');
  button.textContent = timetableName;
  button.className = 'dynamic-button';
  
  const editButton = document.createElement('button');
  editButton.innerHTML = '✎';
  editButton.className = 'edit-class-button';
  editButton.title = 'Edit class';

  container.appendChild(button);
  container.appendChild(editButton);

  // Add click handlers
  button.addEventListener('click', () => {
    const timeTable = document.querySelector('.time-table');
    const timeTableTitle = timeTable.querySelector('h2');
    timeTableTitle.textContent = timetableName;
    currentTimetableName = timetableName;
    loadTimeTableFromFile(timetableName);
    timeTable.style.display = 'block';
    updateTimetableForWeek(selectedDate);
  });

  // Create and setup edit menu
  const editMenu = updateEditMenu(container, timetableName);
  
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    editMenu.classList.toggle('active');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      editMenu.classList.remove('active');
    }
  });

  return container;
}

function showRenameDialog(oldName, container) {
  const dialog = document.createElement('div');
  dialog.className = 'verification-window';
  dialog.style.display = 'flex';
  dialog.innerHTML = `
    <div class="verification-content">
      <h3>Rename Class</h3>
      <input type="text" id="new-name-input" value="${oldName}">
      <div class="verification-buttons">
        <button id="confirm-rename">Save</button>
        <button id="cancel-rename">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);
  const input = dialog.querySelector('#new-name-input');
  input.focus();
  input.select();

  const handleRename = () => {
    const newName = input.value.trim();
    if (newName && newName !== oldName) {
      renameClass(oldName, newName, container);
    }
    dialog.remove();
  };

  // Add enter key handler
  input.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleRename();
    }
  });

  dialog.querySelector('#confirm-rename').addEventListener('click', handleRename);
  dialog.querySelector('#cancel-rename').addEventListener('click', () => {
    dialog.remove();
  });
}

function showDeleteConfirmation(timetableName, container) {
  const dialog = document.createElement('div');
  dialog.className = 'verification-window';
  dialog.style.display = 'flex';
  dialog.innerHTML = `
    <div class="verification-content">
      <h3>Delete Class</h3>
      <p>Are you sure you want to delete "${timetableName}"?</p>
      <p>This action cannot be undone.</p>
      <div class="verification-buttons">
        <button id="confirm-delete">Delete</button>
        <button id="cancel-delete">Cancel</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector('#confirm-delete').addEventListener('click', () => {
    showFinalDeleteConfirmation(timetableName, container);
    dialog.remove();
  });

  dialog.querySelector('#cancel-delete').addEventListener('click', () => {
    dialog.remove();
  });
}

function showFinalDeleteConfirmation(timetableName, container) {
  const dialog = document.createElement('div');
  dialog.className = 'verification-window';
  dialog.style.display = 'flex';
  dialog.innerHTML = `
    <div class="verification-content">
      <h3>Final Confirmation</h3>
      <p>Are you absolutely sure you want to delete "${timetableName}"?</p>
      <div class="verification-buttons">
        <button id="final-confirm-delete">Yes, Delete</button>
        <button id="final-cancel-delete">No, Keep</button>
      </div>
    </div>
  `;

  document.body.appendChild(dialog);

  dialog.querySelector('#final-confirm-delete').addEventListener('click', () => {
    deleteClass(timetableName, container);
    dialog.remove();
  });

  dialog.querySelector('#final-cancel-delete').addEventListener('click', () => {
    dialog.remove();
  });
}

function deleteClass(timetableName, container) {
  const filePath = path.join(CLASSES_DIR, `${timetableName}.timtbl`);
  try {
    // Delete the JSON file
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Remove from data structure
    delete timetableData[timetableName];
    
    // Remove from UI
    container.remove();
    
    // If this was the active timetable, hide and reset it
    if (currentTimetableName === timetableName) {
      currentTimetableName = null;
      const timeTable = document.querySelector('.time-table');
      timeTable.style.display = 'none';
      const timeTableTitle = timeTable.querySelector('h2');
      if (timeTableTitle) {
        timeTableTitle.textContent = '';
      }
    }
    
    showNotification('Class deleted successfully!');
  } catch (error) {
    console.error('Error deleting class:', error);
    showNotification('Error deleting class!');
  }
}

function renameClass(oldName, newName, container) {
  const oldPath = path.join(CLASSES_DIR, `${oldName}.timtbl`);
  const newPath = path.join(CLASSES_DIR, `${newName}.timtbl`);

  try {
    // Read existing data
    const data = JSON.parse(fs.readFileSync(oldPath, 'utf8'));
    
    // Write to new file
    fs.writeFileSync(newPath, JSON.stringify(data, null, 2));
    
    // Delete old file
    fs.unlinkSync(oldPath);
    
    // Update data structures
    timetableData[newName] = timetableData[oldName];
    delete timetableData[oldName];
    
    // Update UI
    const button = container.querySelector('.dynamic-button');
    button.textContent = newName;
    
    // Update the edit menu with new name
    const editButton = container.querySelector('.edit-class-button');
    const editMenu = updateEditMenu(container, newName);
    
    // Reconnect edit button click handler
    editButton.onclick = (e) => {
      e.stopPropagation();
      editMenu.classList.toggle('active');
    };
    
    // Update current timetable name if this was the active timetable
    if (currentTimetableName === oldName) {
      currentTimetableName = newName;
      const timeTableTitle = document.querySelector('.time-table h2');
      if (timeTableTitle) {
        timeTableTitle.textContent = newName;
      }
    }
    
    showNotification('Class renamed successfully!');
  } catch (error) {
    console.error('Error renaming class:', error);
    showNotification('Error renaming class!');
  }
}

function createClassButton(timetableName) {
  const container = document.createElement('div');
  container.className = 'class-button-container';

  const button = document.createElement('button');
  button.textContent = timetableName;
  button.className = 'dynamic-button';
  
  const editButton = document.createElement('button');
  editButton.innerHTML = '✎';
  editButton.className = 'edit-class-button';
  editButton.title = 'Edit class';

  container.appendChild(button);
  container.appendChild(editButton);

  // Add click handlers
  button.addEventListener('click', () => {
    const timeTable = document.querySelector('.time-table');
    const timeTableTitle = timeTable.querySelector('h2');
    timeTableTitle.textContent = timetableName;
    currentTimetableName = timetableName;
    loadTimeTableFromFile(timetableName);
    timeTable.style.display = 'block';
    updateTimetableForWeek(selectedDate);
  });

  // Create and setup edit menu
  const editMenu = updateEditMenu(container, timetableName);
  
  editButton.addEventListener('click', (e) => {
    e.stopPropagation();
    editMenu.classList.toggle('active');
  });

  // Close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target)) {
      editMenu.classList.remove('active');
    }
  });

  return container;
}

document.addEventListener('DOMContentLoaded', () => {
  // Create the menu elements
  const { overlay, menu } = createCustomizationMenu();
  
  // Update click handler for sidebar preferences button
  document.querySelector('.sidebar-bottom .customization-button').addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.classList.add('active');
    menu.classList.add('active');
  });
  
  // Add click handler to close menu when clicking outside
  document.addEventListener('click', (e) => {
    if (!menu.contains(e.target)) {
      overlay.classList.remove('active');
      menu.classList.remove('active');
    }
  });
  
  // ...existing code...
});

function createCustomizationMenu() {
  // Create overlay
  const overlay = document.createElement('div');
  overlay.className = 'customization-overlay';
  
  // Create menu
  const menu = document.createElement('div');
  menu.className = 'customization-menu';
  menu.innerHTML = `
    <div class="menu-header">
      <h2>Preferences</h2>
      <button class="close-button" id="close-customization">x</button>
    </div>
    <div class="current-directory">
      <p>Current directory:</p>
      <p class="directory-path">${CLASSES_DIR}</p>
    </div>
    <button id="select-directory">Select new directory</button>
  `;
  
  document.body.appendChild(overlay);
  document.body.appendChild(menu);
  
  // Add click handlers
  overlay.addEventListener('click', () => {
    overlay.classList.remove('active');
    menu.classList.remove('active');
  });
  
  // Add close button handler
  menu.querySelector('#close-customization').addEventListener('click', () => {
    overlay.classList.remove('active');
    menu.classList.remove('active');
  });
  
  menu.querySelector('#select-directory').addEventListener('click', async () => {
    try {
      const result = await ipcRenderer.invoke('select-directory');
      
      if (!result.canceled && result.filePaths.length > 0) {
        const newPath = result.filePaths[0];
        CLASSES_DIR = newPath;
        
        // Update the displayed path immediately
        const dirPath = menu.querySelector('.directory-path');
        dirPath.textContent = newPath;
        
        // Save the new path to settings
        fs.writeFileSync(
          path.join(__dirname, 'settings.json'), 
          JSON.stringify({ classesDir: newPath }, null, 2)
        );
        
        // Create directory if it doesn't exist
        if (!fs.existsSync(newPath)) {
          fs.mkdirSync(newPath, { recursive: true });
        }
        
        showNotification('Directory updated successfully!');
      }
    } catch (error) {
      console.error('Directory selection error:', error);
      showNotification('Error selecting directory: ' + error.message);
    }
  });
  
  return { overlay, menu };
}

// Update the customization button click handler in the DOMContentLoaded event
document.addEventListener('DOMContentLoaded', () => {
  // ...existing code...
  const windowControls = document.querySelector('.window-controls');
  
  // Remove old preferences button creation code
  
  const { overlay, menu } = createCustomizationMenu();
  
  // Update click handler for new preferences button location
  document.querySelector('.customization-button').addEventListener('click', (e) => {
    e.stopPropagation();
    overlay.classList.add('active');
    menu.classList.add('active');
  });
  // ...existing code...
});

// Add close button functionality to verification window
document.getElementById('close-verification').addEventListener('click', () => {
  document.getElementById('verification-window').style.display = 'none';
});

