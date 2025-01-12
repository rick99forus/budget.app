// Global variables
let hourlyRate = 0;
let totalWeeklyIncome = 0;
let allShifts = []; // Array to store all shift details
let editingShiftIndex = null; // Tracks the index of the shift being edited

// Step 1: Save income details
function saveIncomeDetails() {
    hourlyRate = parseFloat(document.getElementById("hourlyRate").value);

    if (!hourlyRate || hourlyRate <= 0) {
        alert("Please enter a valid hourly rate.");
        return;
    }

    document.getElementById("income-details").style.display = "none";
    document.getElementById("shiftDetails").style.display = "block";
}

// Step 2: Toggle day selection
function toggleDay(day) {
    const dayButton = document.getElementById(day);
    dayButton.classList.toggle("active");
}

// Step 3: Save shift details for selected days
function saveShiftDetails() {
    const selectedDays = Array.from(document.querySelectorAll(".days button.active"))
        .map(button => button.id);

    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (!startTime || !endTime) {
        alert("Please enter valid shift times.");
        return;
    }

    if (selectedDays.length === 0) {
        alert("Please select at least one day.");
        return;
    }

    const workedHours = calculateHours(startTime, endTime);
    const unpaidBreak = workedHours > 6 ? 0.5 : 0.0;
    const actualWorkedHours = workedHours - unpaidBreak; // Deduct unpaid break
    const totalHoursIncludingBreak = workedHours;
    const overtimeHours = Math.max(0, totalHoursIncludingBreak - 8);
    const regularHours = Math.min(8, actualWorkedHours); // Reflect unpaid break in gross income calculation

    // Loop through selected days to handle penalty rates individually
    selectedDays.forEach(day => {
        let penaltyRate = 1.0; // Default penalty rate multiplier

        if (day === "Saturday" || day === "Sunday") {
            const applyPenalty = confirm(`Do you receive a penalty rate for ${day}?`);
            if (applyPenalty) {
                const rate = parseFloat(prompt(`Enter your penalty rate multiplier for ${day} (e.g., 1.5 for 150%):`));
                if (!isNaN(rate) && rate > 0) {
                    penaltyRate = rate;
                }
            }
        }

        const regularIncome = regularHours * hourlyRate * penaltyRate;
        const overtimeIncome = overtimeHours * hourlyRate * penaltyRate * 1.5;
        const dailyIncome = regularIncome + overtimeIncome;

        // Save shift details
        allShifts.push({
            day,
            workedHours,
            unpaidBreak,
            actualWorkedHours,
            regularHours,
            overtimeHours,
            dailyIncome,
            startTime,
            endTime,
            penaltyRate
        });

        totalWeeklyIncome += dailyIncome;
    });

    // Reset for new entries
    resetForm();
    renderShiftList();

    alert(`Shift saved for: ${selectedDays.join(", ")}. Add another shift or proceed to results.`);
}

// Step 4: Calculate and display all shifts
function calculateShifts() {
    if (allShifts.length === 0) {
        alert("No shifts have been entered.");
        return;
    }

    let shiftsSummary = "";
    allShifts.forEach(shift => {
        shiftsSummary += `
            <p>
                Day: ${shift.day} <br>
                Worked Hours: ${shift.workedHours.toFixed(2)} hrs <br>
                Unpaid Break: ${shift.unpaidBreak.toFixed(2)} hrs <br>
                Actual Paid Hours: ${shift.actualWorkedHours.toFixed(2)} hrs <br>
                Regular Hours (Paid): ${shift.regularHours.toFixed(2)} hrs <br>
                Overtime Hours: ${shift.overtimeHours.toFixed(2)} hrs <br>
                Penalty Rate: ${shift.penaltyRate.toFixed(2)}x <br>
                Daily Income: $${shift.dailyIncome.toFixed(2)}
            </p>
        `;
    });

    document.getElementById("shift-summary").innerHTML = `
        ${shiftsSummary}
        <p><strong>Total Weekly Gross Income:</strong> $${totalWeeklyIncome.toFixed(2)}</p>
    `;

    document.getElementById("shiftDetails").style.display = "none";
    document.getElementById("results").style.display = "block";
}

// Step 5: Display income breakdown
function displayIncomeBreakdown() {
    const period = document.getElementById("period").value;
    const superRate = 0.115;

    let grossIncome;
    if (period === "weekly") grossIncome = totalWeeklyIncome;
    else if (period === "fortnightly") grossIncome = totalWeeklyIncome * 2;
    else if (period === "monthly") grossIncome = totalWeeklyIncome * 4;
    else grossIncome = totalWeeklyIncome * 52;

    const yearlyIncome = totalWeeklyIncome * 52;
    const yearlyTax = calculateTax(yearlyIncome);
    const tax = yearlyTax / { weekly: 52, fortnightly: 26, monthly: 12, yearly: 1 }[period];
    const superDeduction = grossIncome * superRate;
    const netIncome = grossIncome - tax;

    document.getElementById("income-breakdown").innerHTML = `
        <p>Gross Income (${period}): $${grossIncome.toFixed(2)}</p>
        <p>Tax Payable (${period}): $${tax.toFixed(2)}</p>
        <p>Super Deduction (${period}): $${superDeduction.toFixed(2)}</p>
        <p>Net Income After Tax (${period}): $${netIncome.toFixed(2)}</p>
        <p>Net Income After Tax and Super (${period}): $${(netIncome - superDeduction).toFixed(2)}</p>
    `;
}

// Step 6: Edit a shift
function editShift(index) {
    const shift = allShifts[index];
    editingShiftIndex = index;

    document.getElementById("startTime").value = shift.startTime;
    document.getElementById("endTime").value = shift.endTime;

    resetActiveDays();
    document.getElementById(shift.day).classList.add("active");

    document.getElementById("results").style.display = "none";
    document.getElementById("shiftDetails").style.display = "block";
}

// Step 7: Delete a shift
function deleteShift(index) {
    totalWeeklyIncome -= allShifts[index].dailyIncome;
    allShifts.splice(index, 1);
    renderShiftList();
}

// Helper function: Render the shift list
function renderShiftList() {
    const shiftList = document.getElementById("shiftList");
    shiftList.innerHTML = "";

    allShifts.forEach((shift, index) => {
        const shiftItem = document.createElement("div");
        shiftItem.classList.add("shift-item");
        shiftItem.innerHTML = `
            <p><strong>${shift.day}</strong>: ${shift.startTime} - ${shift.endTime}</p>
            <p>Daily Income: $${shift.dailyIncome.toFixed(2)}</p>
            <div class="shift-actions">
                <button id='edit-button' onclick="editShift(${index})">Edit</button>
                <button id='delete-button' onclick="deleteShift(${index})">Delete</button>
            </div>
        `;
        shiftList.appendChild(shiftItem);
    });
}

// Helper function: Calculate hours worked
function calculateHours(start, end) {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const difference = (endTime - startTime) / (1000 * 60 * 60);
    return difference > 0 ? difference : 24 + difference; // Handle overnight shifts
}

// Helper function: Calculate tax
function calculateTax(income) {
    if (income <= 18200) return 0;
    if (income <= 45000) return (income - 18200) * 0.16;
    if (income <= 135000) return 4288 + (income - 45000) * 0.30;
    if (income <= 190000) return 31288 + (income - 135000) * 0.37;
    return 51638 + (income - 190000) * 0.45;
}

// Helper function: Reset form fields
function resetForm() {
    document.querySelectorAll(".days button.active").forEach(button => button.classList.remove("active"));
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
}

// Helper function: Reset active days
function resetActiveDays() {
    document.querySelectorAll(".days button.active").forEach(button => button.classList.remove("active"));
}
// Global variables
let hourlyRate = 0;
let totalWeeklyIncome = 0;
let allShifts = []; // Array to store all shift details
let editingShiftIndex = null; // Tracks the index of the shift being edited

// Step 1: Save income details
function saveIncomeDetails() {
    hourlyRate = parseFloat(document.getElementById("hourlyRate").value);

    if (!hourlyRate || hourlyRate <= 0) {
        alert("Please enter a valid hourly rate.");
        return;
    }

    document.getElementById("income-details").style.display = "none";
    document.getElementById("shiftDetails").style.display = "block";
}

// Step 2: Toggle day selection
function toggleDay(day) {
    const dayButton = document.getElementById(day);
    dayButton.classList.toggle("active");
}

// Step 3: Save shift details for selected days
function saveShiftDetails() {
    const selectedDays = Array.from(document.querySelectorAll(".days button.active"))
        .map(button => button.id);

    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;

    if (!startTime || !endTime) {
        alert("Please enter valid shift times.");
        return;
    }

    if (selectedDays.length === 0) {
        alert("Please select at least one day.");
        return;
    }

    const workedHours = calculateHours(startTime, endTime);
    const unpaidBreak = workedHours > 6 ? 0.5 : 0.0;
    const actualWorkedHours = workedHours - unpaidBreak; // Deduct unpaid break
    const totalHoursIncludingBreak = workedHours;
    const overtimeHours = Math.max(0, totalHoursIncludingBreak - 8);
    const regularHours = Math.min(8, actualWorkedHours); // Reflect unpaid break in gross income calculation

    // Loop through selected days to handle penalty rates individually
    selectedDays.forEach(day => {
        let penaltyRate = 1.0; // Default penalty rate multiplier

        if (day === "Saturday" || day === "Sunday") {
            const applyPenalty = confirm(`Do you receive a penalty rate for ${day}?`);
            if (applyPenalty) {
                const rate = parseFloat(prompt(`Enter your penalty rate multiplier for ${day} (e.g., 1.5 for 150%):`));
                if (!isNaN(rate) && rate > 0) {
                    penaltyRate = rate;
                }
            }
        }

        const regularIncome = regularHours * hourlyRate * penaltyRate;
        const overtimeIncome = overtimeHours * hourlyRate * penaltyRate * 1.5;
        const dailyIncome = regularIncome + overtimeIncome;

        // Save shift details
        allShifts.push({
            day,
            workedHours,
            unpaidBreak,
            actualWorkedHours,
            regularHours,
            overtimeHours,
            dailyIncome,
            startTime,
            endTime,
            penaltyRate
        });

        totalWeeklyIncome += dailyIncome;
    });

    // Reset for new entries
    resetForm();
    renderShiftList();

    alert(`Shift saved for: ${selectedDays.join(", ")}. Add another shift or proceed to results.`);
}

// Step 4: Calculate and display all shifts
function calculateShifts() {
    if (allShifts.length === 0) {
        alert("No shifts have been entered.");
        return;
    }

    let shiftsSummary = "";
    allShifts.forEach(shift => {
        shiftsSummary += `
            <p>
                Day: ${shift.day} <br>
                Worked Hours: ${shift.workedHours.toFixed(2)} hrs <br>
                Unpaid Break: ${shift.unpaidBreak.toFixed(2)} hrs <br>
                Actual Paid Hours: ${shift.actualWorkedHours.toFixed(2)} hrs <br>
                Regular Hours (Paid): ${shift.regularHours.toFixed(2)} hrs <br>
                Overtime Hours: ${shift.overtimeHours.toFixed(2)} hrs <br>
                Penalty Rate: ${shift.penaltyRate.toFixed(2)}x <br>
                Daily Income: $${shift.dailyIncome.toFixed(2)}
            </p>
        `;
    });

    document.getElementById("shift-summary").innerHTML = `
        ${shiftsSummary}
        <p><strong>Total Weekly Gross Income:</strong> $${totalWeeklyIncome.toFixed(2)}</p>
    `;

    document.getElementById("shiftDetails").style.display = "none";
    document.getElementById("results").style.display = "block";
}

// Step 5: Display income breakdown
function displayIncomeBreakdown() {
    const period = document.getElementById("period").value;
    const superRate = 0.115;

    let grossIncome;
    if (period === "weekly") grossIncome = totalWeeklyIncome;
    else if (period === "fortnightly") grossIncome = totalWeeklyIncome * 2;
    else if (period === "monthly") grossIncome = totalWeeklyIncome * 4;
    else grossIncome = totalWeeklyIncome * 52;

    const yearlyIncome = totalWeeklyIncome * 52;
    const yearlyTax = calculateTax(yearlyIncome);
    const tax = yearlyTax / { weekly: 52, fortnightly: 26, monthly: 12, yearly: 1 }[period];
    const superDeduction = grossIncome * superRate;
    const netIncome = grossIncome - tax;

    document.getElementById("income-breakdown").innerHTML = `
        <p>Gross Income (${period}): $${grossIncome.toFixed(2)}</p>
        <p>Tax Payable (${period}): $${tax.toFixed(2)}</p>
        <p>Super Deduction (${period}): $${superDeduction.toFixed(2)}</p>
        <p>Net Income After Tax (${period}): $${netIncome.toFixed(2)}</p>
        <p>Net Income After Tax and Super (${period}): $${(netIncome - superDeduction).toFixed(2)}</p>
    `;
}

// Step 6: Edit a shift
function editShift(index) {
    const shift = allShifts[index];
    editingShiftIndex = index;

    document.getElementById("startTime").value = shift.startTime;
    document.getElementById("endTime").value = shift.endTime;

    resetActiveDays();
    document.getElementById(shift.day).classList.add("active");

    document.getElementById("results").style.display = "none";
    document.getElementById("shiftDetails").style.display = "block";
}

// Step 7: Delete a shift
function deleteShift(index) {
    totalWeeklyIncome -= allShifts[index].dailyIncome;
    allShifts.splice(index, 1);
    renderShiftList();
}

// Helper function: Render the shift list
function renderShiftList() {
    const shiftList = document.getElementById("shiftList");
    shiftList.innerHTML = "";

    allShifts.forEach((shift, index) => {
        const shiftItem = document.createElement("div");
        shiftItem.classList.add("shift-item");
        shiftItem.innerHTML = `
            <p><strong>${shift.day}</strong>: ${shift.startTime} - ${shift.endTime}</p>
            <p>Daily Income: $${shift.dailyIncome.toFixed(2)}</p>
            <div class="shift-actions">
                <button id='edit-button' onclick="editShift(${index})">Edit</button>
                <button id='delete-button' onclick="deleteShift(${index})">Delete</button>
            </div>
        `;
        shiftList.appendChild(shiftItem);
    });
}

// Helper function: Calculate hours worked
function calculateHours(start, end) {
    const startTime = new Date(`1970-01-01T${start}:00`);
    const endTime = new Date(`1970-01-01T${end}:00`);
    const difference = (endTime - startTime) / (1000 * 60 * 60);
    return difference > 0 ? difference : 24 + difference; // Handle overnight shifts
}

// Helper function: Calculate tax
function calculateTax(income) {
    if (income <= 18200) return 0;
    if (income <= 45000) return (income - 18200) * 0.16;
    if (income <= 135000) return 4288 + (income - 45000) * 0.30;
    if (income <= 190000) return 31288 + (income - 135000) * 0.37;
    return 51638 + (income - 190000) * 0.45;
}

// Helper function: Reset form fields
function resetForm() {
    document.querySelectorAll(".days button.active").forEach(button => button.classList.remove("active"));
    document.getElementById("startTime").value = "";
    document.getElementById("endTime").value = "";
}

// Helper function: Reset active days
function resetActiveDays() {
    document.querySelectorAll(".days button.active").forEach(button => button.classList.remove("active"));
}

// Step 8: Handle navigation to previous section
function navigateBack(currentSection) {
    if (currentSection === "shiftDetails") {
        document.getElementById("shiftDetails").style.display = "none";
        document.getElementById("income-details").style.display = "block";
    } else if (currentSection === "results") {
        document.getElementById("results").style.display = "none";
        document.getElementById("shiftDetails").style.display = "block";
    }
}
