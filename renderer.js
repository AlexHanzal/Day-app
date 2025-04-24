let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function updateCalendar(month, year) {
  const calendarElement = document.getElementById('calendar');
  const calendarTitle = document.getElementById('calendar-title');

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

// Function to toggle the pop-up
function toggleCalendarPopup() {
  const popup = document.getElementById('pop-up');
  popup.classList.toggle('active');
}

// Function to toggle the select screen
function toggleSelectScreen() {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.classList.toggle('active');
}

// Remove the calendar popup toggle on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
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
    const dynamicLinksContainer = document.getElementById('dynamic-links-container');
    const newButton = document.createElement('button');
    newButton.textContent = nameInput;
    newButton.className = "dynamic-button";
    newButton.addEventListener('click', () => {
      const timeTable = document.querySelector('.time-table');
      const timeTableTitle = timeTable.querySelector('h2');
      timeTableTitle.textContent = nameInput; // Set the time table title
      timeTable.style.display = 'block'; // Show the time table
    });
    dynamicLinksContainer.appendChild(newButton);

    // Clear the input and hide the select screen
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

// Initialize the calendar only when needed
updateCalendar(currentMonth, currentYear);

document.getElementById('create-new').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'flex'; // Show the select screen
});

document.getElementById('close-select').addEventListener('click', () => {
  const selectScreen = document.getElementById('select-screen');
  selectScreen.style.display = 'none'; // Hide the select screen
});

document.getElementById('submit-button').addEventListener('click', () => {
  const nameInput = document.getElementById('name-input').value.trim();
  if (nameInput) {
    const dynamicLinksContainer = document.getElementById('dynamic-links-container');
    const newButton = document.createElement('button');
    newButton.textContent = nameInput;
    newButton.className = "dynamic-button";
    newButton.addEventListener('click', () => {
      const timeTable = document.querySelector('.time-table');
      if (timeTable) {
        timeTable.style.display = 'block'; // Show the time table div
      }
    });
    dynamicLinksContainer.appendChild(newButton);

    // Clear the input and hide the select screen
    document.getElementById('name-input').value = '';
    document.getElementById('select-screen').style.display = 'none';
  }
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
    alert('Access granted!');
    const verificationWindow = document.getElementById('verification-window');
    verificationWindow.style.display = 'none';

    // Simple table editing
    const tableCells = document.querySelectorAll('.week-table td:not(:first-child)');
    tableCells.forEach(cell => {
      cell.contentEditable = 'true';
      cell.style.backgroundColor = '#555';
    });

    // Add save button
    const timeTableButtons = document.querySelector('.time-table-buttons');
    if (!document.querySelector('.save-button')) {
      const saveButton = document.createElement('button');
      saveButton.textContent = 'Save';
      saveButton.className = 'save-button';
      saveButton.addEventListener('click', () => {
        tableCells.forEach(cell => {
          cell.contentEditable = 'false';
          cell.style.backgroundColor = '';
        });
        alert('Changes saved!');
      });
      timeTableButtons.appendChild(saveButton);
    }
  } else {
    alert('Invalid code. Please try again.');
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

