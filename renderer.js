const Calendar = require('./modules/calendar.js');

// Function to toggle the pop-up
function toggleCalendarPopup() {
  const popup = document.getElementById('pop-up');
  popup.classList.toggle('active');
}

// Function to toggle thze select screen
function toggleSelectScreen() {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.classList.toggle('active');
}

// Remove the calendar popup toggle on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const calendar = new Calendar();
  calendar.init();

  // Initialize select screen
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'none'; // Ensure the select screen is hidden on startup
});

// Add event listener to the open-cal button if it exists
const openCalButton = document.querySelector('.open-cal');
if (openCalButton) {
  openCalButton.addEventListener('click', () => {
    toggleCalendarPopup();
    toggleSelectScreen(); // Close the select screen when opening the calendar
  });
}

// Add event listener to the close button
document.getElementById('close-button').addEventListener('click', () => {
  toggleCalendarPopup();
});

// Add event listener to the "create-new" button
document.getElementById('create-new').addEventListener('click', () => {
  toggleSelectScreen();
  document.getElementById('select-screen').style.display = 'block'; // Show the select screen
});

// Add event listener to the close button in the select window
document.getElementById('close-select').addEventListener('click', () => {
  toggleSelectScreen();
});

// Add event listener to the submit button
document.getElementById('submit-button').addEventListener('click', () => {
  const name = document.getElementById('name-input').value;
  const type = document.getElementById('type-select').value;
  console.log(`Name: ${name}, Type: ${type}`);
  toggleSelectScreen(); // Close the select screen after submission
});

// Add functionality to create a button dynamically when submitting the form in the select screen
document.getElementById('submit-button').addEventListener('click', () => {
  const nameInput = document.getElementById('name-input').value.trim();
  if (nameInput) {
    // Create class button
    const dynamicLinksContainer = document.getElementById('dynamic-links-container');
    const newButton = document.createElement('button');
    newButton.textContent = nameInput;
    newButton.className = "dynamic-button";
    
    // Create and show calendar container immediately
    const calendarContainer = document.createElement('div');
    calendarContainer.className = 'class-calendar';
    calendarContainer.innerHTML = `
      <div class="calendar-header">
        <button class="prev-button">←</button>
        <h2 id="calendar-title-${nameInput}"></h2>
        <button class="next-button">→</button>
      </div>
      <div id="calendar-${nameInput}"></div>
      <div class="calendar-controls" style="display: none;">
        <button class="confirm-date-button">Create Timetable</button>
      </div>
    `;
    
    document.body.appendChild(calendarContainer);
    
    // Initialize and show calendar immediately
    const classCalendar = new Calendar({
      calendarId: `calendar-${nameInput}`,
      titleId: `calendar-title-${nameInput}`,
      onDateSelect: () => {
        calendarContainer.querySelector('.calendar-controls').style.display = 'block';
      }
    });
    
    // Show this calendar and hide others
    document.querySelectorAll('.class-calendar').forEach(cal => cal.style.display = 'none');
    calendarContainer.style.display = 'block';
    classCalendar.init();
    
    // Add click handler for the confirm date button
    calendarContainer.querySelector('.confirm-date-button').addEventListener('click', () => {
      const selectedDate = classCalendar.getSelectedDate();
      if (selectedDate) {
        const timeTable = document.querySelector('.time-table');
        const timeTableTitle = timeTable.querySelector('h2');
        const dateStr = selectedDate.toLocaleDateString('cs-CZ', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
        timeTableTitle.textContent = `${nameInput} - ${dateStr}`;
        
        // Hide calendar and show timetable
        calendarContainer.style.display = 'none';
        timeTable.style.display = 'block';
      }
    });
    
    // Add click handler for the class button
    newButton.addEventListener('click', () => {
      // Hide all calendars and timetables
      document.querySelectorAll('.class-calendar').forEach(cal => cal.style.display = 'none');
      document.querySelector('.time-table').style.display = 'none';
      
      // Show this class's calendar and initialize it
      calendarContainer.style.display = 'block';
      classCalendar.init();
    });
    
    dynamicLinksContainer.appendChild(newButton);

    // Clear input and hide select screen
    document.getElementById('name-input').value = '';
    document.getElementById('select-screen').style.display = 'none';
  }
});

// Event listeners for the buttons
document.querySelector('.prev-button').addEventListener('click', () => {
  currentMonth--;
  if (currentMonth < 0) {
    currentMonth = 11;
    currentYear--;
  }
  updateCalendar(currentMonth, currentYear);
});

document.querySelector('.next-button').addEventListener('click', () => {
  currentMonth++;
  if (currentMonth > 11) {
    currentMonth = 0;
    currentYear++;
  }
  updateCalendar(currentMonth, currentYear);
});

document.getElementById('create-new').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'flex'; // Show the select screen
});

document.getElementById('close-select').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'none'; // Hide the select screen
});

document.querySelector('.operator-button').addEventListener('click', () => {
  const verificationWindow = document.getElementById('verification-window');
  verificationWindow.style.display = 'flex'; // Show the verification window
});

document.getElementById('close-verification').addEventListener('click', () => {
  const verificationWindow = document.getElementById('verification-window');
  verificationWindow.style.display = 'none'; // Hide the verification window
});

document.getElementById('confirm-verification').addEventListener('click', () => {
  const codeInput = document.getElementById('verification-code').value.trim();
  if (codeInput === '1918') {
    const verificationWindow = document.getElementById('verification-window');
    verificationWindow.style.display = 'none';

    const tableCells = document.querySelectorAll('.week-table td:not(:first-child)');
    tableCells.forEach(cell => {
      cell.contentEditable = 'true';
      cell.style.backgroundColor = '#555';
    });

    // Add save button if it doesn't exist
    const timeTableButtons = document.querySelector('.time-table-buttons');
    if (!document.querySelector('.save-button')) {
      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save';
      saveButton.className = 'save-button';
      saveButton.addEventListener('click', handleSave);
      timeTableButtons.appendChild(saveButton);
    }
  } else {
    alert('Invalid code. Please try again.');
  }
});

// Update operator verification to support Return key
document.getElementById('verification-code').addEventListener('keyup', (event) => {
  if (event.key === 'Enter') {
    document.getElementById('confirm-verification').click();
  }
});

// Separate handlers for better organization
function cellClickHandler(event) {
  event.stopPropagation();
  this.focus();
}

function handleSave() {
  const tableCells = document.querySelectorAll('.week-table td:not(:first-child)');
  tableCells.forEach(cell => {
    cell.contentEditable = 'false';
    cell.style.backgroundColor = '';
  });
  alert('Changes saved!');
}

// Ensure the "create-new" button remains functional
document.getElementById('create-new').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'flex'; // Show the select screen
  document.getElementById('name-input').focus(); // Focus on the input field
});

