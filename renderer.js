function updateClock() {
  const clockElement = document.getElementById('clock');
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  clockElement.textContent = `${hours} | ${minutes} | ${seconds}`;
}

// Update the clock every second
setInterval(updateClock, 1000);

// Initialize the clock immediately
updateClock();

let currentMonth = new Date().getMonth();
let currentYear = new Date().getFullYear();

function updateCalendar(month, year) {
  const calendarElement = document.getElementById('calendar');
  const calendarTitle = document.getElementById('calendar-title');

  // Update the calendar title
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
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
  const weekdays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
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

// Example: Open the pop-up when the page loads (or attach to a button/event)
document.addEventListener('DOMContentLoaded', () => {
  toggleCalendarPopup(); // Remove this line if you want to control it manually
});

// Add event listener to the open-cal button
document.querySelector('.open-cal').addEventListener('click', () => {
  toggleCalendarPopup();
});

// Add event listener to the close button
document.getElementById('close-button').addEventListener('click', () => {
  toggleCalendarPopup();
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

// Initialize the calendar
updateCalendar(currentMonth, currentYear);

