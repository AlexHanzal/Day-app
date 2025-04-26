class Calendar {
    constructor(config = {}) {
        this.currentMonth = new Date().getMonth();
        this.currentYear = new Date().getFullYear();
        this.calendarId = config.calendarId || 'calendar';
        this.titleId = config.titleId || 'calendar-title';
        this.monthNames = [
            'Leden', 'Únor', 'Březen', 'Duben', 'Květen', 'Červen',
            'Červenec', 'Srpen', 'Září', 'Říjen', 'Listopad', 'Prosinec'
        ];
        this.weekdays = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];
        this.selectedDate = null;
        this.onDateSelect = config.onDateSelect || null;
        this.selectedDateDisplay = null;
    }

    updateCalendar() {
        const calendarElement = document.getElementById(this.calendarId);
        const calendarTitle = document.getElementById(this.titleId);
        
        // Update title with just month and year
        calendarTitle.textContent = `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
        
        // Update selected date display if exists
        if (this.selectedDateDisplay && this.selectedDate) {
            this.selectedDateDisplay.textContent = this.selectedDate.toLocaleDateString('cs-CZ', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        }

        calendarElement.innerHTML = '';
        const table = this._createCalendarTable();
        calendarElement.appendChild(table);
    }

    _createCalendarTable() {
        const table = document.createElement('table');
        const tableBody = document.createElement('tbody');

        // Add header row
        tableBody.appendChild(this._createHeaderRow());

        // Add date cells
        this._addDateCells(tableBody);

        table.appendChild(tableBody);
        return table;
    }

    _createHeaderRow() {
        const headerRow = document.createElement('tr');
        this.weekdays.forEach(weekday => {
            const headerCell = document.createElement('th');
            headerCell.textContent = weekday;
            headerRow.appendChild(headerCell);
        });
        return headerRow;
    }

    _addDateCells(tableBody) {
        const firstDayOfWeek = new Date(this.currentYear, this.currentMonth, 1).getDay();
        const daysInMonth = new Date(this.currentYear, this.currentMonth + 1, 0).getDate();
        const daysInPrevMonth = new Date(this.currentYear, this.currentMonth, 0).getDate();
        
        const adjustedFirstDayOfWeek = (firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1);
        let row = document.createElement('tr');

        // Previous month days
        for (let i = adjustedFirstDayOfWeek; i > 0; i--) {
            const cell = this._createDateCell(daysInPrevMonth - i + 1, 'prev-month');
            row.appendChild(cell);
        }

        // Current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const cell = this._createDateCell(day, this._isToday(day) ? 'current-date' : 'dates');
            row.appendChild(cell);

            if ((adjustedFirstDayOfWeek + day) % 7 === 0) {
                tableBody.appendChild(row);
                row = document.createElement('tr');
            }
        }

        // Next month days
        if (row.children.length > 0) {
            let nextMonthDay = 1;
            while (row.children.length < 7) {
                const cell = this._createDateCell(nextMonthDay++, 'next-month');
                row.appendChild(cell);
            }
            tableBody.appendChild(row);
        }
    }

    _createDateCell(day, className) {
        const cell = document.createElement('td');
        cell.textContent = day;
        cell.classList.add(className, 'month-dates');
        
        // Make current month dates clickable
        if (className === 'dates' || className === 'current-date') {
            cell.classList.add('selectable');
            cell.addEventListener('click', () => this._handleDateClick(day));
        }
        
        return cell;
    }

    _handleDateClick(day) {
        // Remove previous selection
        const allCells = document.querySelectorAll(`#${this.calendarId} td`);
        allCells.forEach(cell => cell.classList.remove('selected-date'));
        
        // Add selection to clicked date and store the full date
        event.target.classList.add('selected-date');
        this.selectedDate = new Date(this.currentYear, this.currentMonth, day);
        
        if (this.onDateSelect) {
            this.onDateSelect(this.selectedDate);
        }
    }

    _isToday(day) {
        const today = new Date();
        return day === today.getDate() &&
               this.currentMonth === today.getMonth() &&
               this.currentYear === today.getFullYear();
    }

    nextMonth() {
        this.currentMonth++;
        if (this.currentMonth > 11) {
            this.currentMonth = 0;
            this.currentYear++;
        }
        this.updateCalendar();
    }

    prevMonth() {
        this.currentMonth--;
        if (this.currentMonth < 0) {
            this.currentMonth = 11;
            this.currentYear--;
        }
        this.updateCalendar();
    }

    getSelectedDate() {
        return this.selectedDate;
    }

    init() {
        this.updateCalendar();
        
        // Create selected date display element
        this.selectedDateDisplay = document.createElement('div');
        this.selectedDateDisplay.className = 'selected-date-display';
        document.getElementById(this.calendarId).parentNode.insertBefore(
            this.selectedDateDisplay,
            document.getElementById(this.calendarId)
        );
        
        // Update navigation buttons for month navigation only
        const container = document.getElementById(this.calendarId).closest('.class-calendar');
        container.querySelector('.prev-button').addEventListener('click', () => this.prevMonth());
        container.querySelector('.next-button').addEventListener('click', () => this.nextMonth());
    }
}

module.exports = Calendar;
