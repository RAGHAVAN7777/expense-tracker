

// ---------- Navigation logic ----------
const links = document.querySelectorAll(".sidebar nav a");
const pages = document.querySelectorAll(".page");

links.forEach(link => {
    link.addEventListener("click", () => {

        // 🔴 NEW: BLOCK PAGES UNTIL INCOME CONFIRMED
        if (
            !incomeConfirmedThisMonth &&
            ["add", "analytics", "statements", "ai"].includes(link.dataset.page)
        ) {
            alert("Please confirm income for this month first.");
            return;
        }

        links.forEach(l => l.classList.remove("active"));
        link.classList.add("active");

        const pageId = link.dataset.page;
        pages.forEach(p => p.classList.remove("active"));
        document.getElementById(pageId).classList.add("active");

        if (pageId === "statements") {
            renderStatements();
        }
    });
});

// ---------- LOGOUT ----------
document.getElementById("logoutBtn").addEventListener("click", () => {
    window.location.href = "index.html";
});

// ---------- EXPENSE STORAGE ----------
let expenses = JSON.parse(localStorage.getItem("expenses")) || [];
// 🔵 YEARLY MONTHLY HISTORY (DO NOT RESET THIS)
let monthlyHistory =
    JSON.parse(localStorage.getItem("monthlyHistory")) || {};


// 🔴 NEW: SAVINGS + INCOME CONFIRM FLAG
let savings = Number(localStorage.getItem("savings")) || 0;
let incomeConfirmedThisMonth =
    localStorage.getItem("incomeConfirmedThisMonth") === "true";

// 🔊 NEW: ALARM BEEP FUNCTION (2 Seconds)
function playAlarmBeep() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();

        oscillator.type = "sine";
        oscillator.frequency.setValueAtTime(440, audioCtx.currentTime); // A4 note
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);

        // Start playing
        oscillator.start();
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);

        // Fade out at exactly 2 seconds to avoid clicking
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 2);
        oscillator.stop(audioCtx.currentTime + 2);
    } catch (e) {
        console.error("Audio beep failed:", e);
    }
}

// 🔊 NEW: VOICE ALERT FUNCTION
function speakMessage(text) {
    if ('speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        window.speechSynthesis.speak(utterance);
    }
}

const gateTriggers = {
    fifty: false,
    eighty: false,
    ninety: false
};

// ---------- ADD EXPENSE ----------
document.getElementById("addExpenseBtn").addEventListener("click", () => {

    // 🔴 NEW: HARD BLOCK
    if (!incomeConfirmedThisMonth) {
        alert("Please confirm income first.");
        return;
    }

    const category = document.getElementById("category").value;
    const amount = document.getElementById("amount").value;
    const label = document.getElementById("label").value;
    const expenseAmount = Number(amount);

    // 🔴 CALCULATE CURRENT STATE
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    const limit = monthlyIncome + savings;
    const availableBalance = limit - totalSpent;

    // 🚫 BLOCK IF USAGE IS ALREADY 100%
    if (totalSpent >= limit && limit > 0) {
        playAlarmBeep();
        speakMessage("Attention: Usage Limit Reached 100%. Budget Exhausted.");
        showUsageLimitPopup("Usage Limit Reached", "Cannot spend more until income added!", true);
        return;
    }

    // 🚫 BLOCK IF EXPENSE EXCEEDS BALANCE
    if (expenseAmount > availableBalance) {
        speakMessage("This expense is not possible because it is exceeding your balance.");
        showUsageLimitPopup("Exceeding Balance", "This expense exceeds your available balance of ₹" + availableBalance, false);
        return;
    }

    if (!expenseAmount || expenseAmount <= 0 || label.trim() === "") {
        alert("Please enter valid amount and description");
        return;
    }


    const expense = {
        category,
        label,
        amount: Number(amount),
        date: simulatedDate.toISOString()
    };

    expenses.push(expense);
    localStorage.setItem("expenses", JSON.stringify(expenses));
    // 🔵 STEP 2.5: LIVE UPDATE CURRENT MONTH IN YEARLY HISTORY
    const liveKey =
        `${simulatedDate.getFullYear()}-${simulatedDate.getMonth()}`;

    monthlyHistory[liveKey] =
        (monthlyHistory[liveKey] || 0) + expense.amount;

    localStorage.setItem(
        "monthlyHistory",
        JSON.stringify(monthlyHistory)
    );


    alert("Expense added successfully!");

    // � CLEAR FORM
    document.getElementById("amount").value = "";
    document.getElementById("label").value = "";

    // �🚨 CHECK IF NEW TOTAL REACHES 100%
    const newTotalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    if (newTotalSpent >= limit && limit > 0) {
        playAlarmBeep();
        speakMessage("Attention: Usage Limit Reached 100%. Budget Exhausted.");
        showUsageLimitPopup("Usage Limit Reached (100%)", "You have exhausted your budget. Cannot spend more until income is added.", true);
    }

    renderStatements();
    updateDashboard();
    renderProgressScale();
    checkAlerts();
    updateExpenseProgressBar();

});

// ---------- STATEMENTS ----------
const statementBody = document.getElementById("statementBody");

function renderStatements() {
    statementBody.innerHTML = "";

    if (expenses.length === 0) {
        statementBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; color:#888;">
                    No expenses recorded yet
                </td>
            </tr>
        `;
        return;
    }

    expenses.forEach((exp, index) => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${new Date(exp.date).toLocaleDateString()}</td>
            <td>${exp.category}</td>
            <td>${exp.label}</td>
            <td>₹${exp.amount}</td>
            <td>
                <button class="delete-btn" onclick="deleteExpense(${index})">
                    Delete
                </button>
            </td>
        `;

        statementBody.appendChild(row);
    });
}

// ---------- DELETE EXPENSE ----------
function deleteExpense(index) {
    const confirmDelete = confirm("Are you sure you want to delete this expense?");
    if (confirmDelete) {
        // 🔵 LIVE DECREASE FROM YEARLY HISTORY
        const exp = expenses[index];
        const key =
            `${new Date(exp.date).getFullYear()}-${new Date(exp.date).getMonth()}`;

        if (monthlyHistory[key]) {
            monthlyHistory[key] -= exp.amount;

            if (monthlyHistory[key] < 0) {
                monthlyHistory[key] = 0;
            }

            localStorage.setItem(
                "monthlyHistory",
                JSON.stringify(monthlyHistory)
            );
        }

        expenses.splice(index, 1);
        localStorage.setItem("expenses", JSON.stringify(expenses));
        renderStatements();
        updateDashboard();
        updateExpenseProgressBar();

    }
}

// ---------- INITIAL LOAD ----------
renderStatements();
function printStatements() {
    window.print();
}

// ---------- MONTHLY INCOME ----------
let monthlyIncome = Number(localStorage.getItem("monthlyIncome")) || 0;

const incomeInput = document.getElementById("incomeInput");
const incomeDisplay = document.getElementById("incomeDisplay");
const totalSpentEl = document.getElementById("totalSpent");
const remainingEl = document.getElementById("remaining");

// 🔴 NEW: SAVINGS DISPLAY
const savingsDisplay = document.getElementById("savingsDisplay");

// Set income
document.getElementById("setIncomeBtn").addEventListener("click", () => {
    const value = Number(incomeInput.value || 0);

    monthlyIncome += value;
    incomeConfirmedThisMonth = true;

    localStorage.setItem("monthlyIncome", monthlyIncome);
    localStorage.setItem("incomeConfirmedThisMonth", "true");

    incomeInput.value = "";
    updateDashboard();
});
// ---------- DASHBOARD ----------
function updateDashboard() {
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);

    incomeDisplay.textContent = "₹" + monthlyIncome;
    savingsDisplay.textContent = "₹" + savings;
    totalSpentEl.textContent = "₹" + totalSpent;

    const available = monthlyIncome + savings - totalSpent;
    remainingEl.textContent = "₹" + available;
}

updateDashboard();
const originalUpdateDashboardProgress = updateDashboard;
updateDashboard = function () {
    originalUpdateDashboardProgress();
    updateExpenseProgressBar();
};

function updateExpenseProgressBar() {
    const fill = document.getElementById("expenseProgressFill");
    const text = document.getElementById("expenseProgressText");

    if (!fill || !text) return;

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const limit = monthlyIncome + savings;

    if (limit <= 0) {
        fill.style.width = "0%";
        text.textContent = "₹0 spent";
        return;
    }

    const percent = (totalSpent / limit) * 100;

    fill.style.width = Math.min(percent, 100) + "%";
    text.textContent = `₹${totalSpent} spent of ₹${limit}`;

    // ⛩️ GATE & VOICE + BEEP LOGIC (PRIORITIZED)
    const milestones = [
        { threshold: 90, id: "expenseGate90", key: "ninety", msg: "90% salary over, critical limit reached" },
        { threshold: 80, id: "expenseGate80", key: "eighty", msg: "80% salary over, stop spending now" },
        { threshold: 50, id: "expenseGate", key: "fifty", msg: "50% salary over, spend accordingly" }
    ];

    let highestPlayed = false;

    // 🟢 NEW: If usage reaches 100%, skip all lower audio milestones
    // (The 100% alert is handled separately in addExpenseBtn)
    if (percent >= 100) {
        highestPlayed = true;
    }

    milestones.forEach(m => {
        const gate = document.getElementById(m.id);
        if (!gate) return;

        if (percent >= m.threshold) {
            // Only play audio for the HIGHEST threshold reached in this update
            if (!highestPlayed && !gateTriggers[m.key]) {
                playAlarmBeep();
                speakMessage(m.msg);
                highestPlayed = true;
            }
            // Mark this and all lower gates as "triggered" so they don't fire late
            gateTriggers[m.key] = true;
            gate.classList.add("open");
        } else {
            // RESET logic if bar falls back below threshold
            gateTriggers[m.key] = false;
            gate.classList.remove("open");
        }
    });
}




// ================= SIMULATED CALENDAR =================
let simulatedDate = localStorage.getItem("simulatedDate")
    ? new Date(localStorage.getItem("simulatedDate"))
    : new Date("2026-01-01");

const calendarGrid = document.getElementById("calendarGrid");
const currentDateText = document.getElementById("currentDateText");
const nextDayBtn = document.getElementById("nextDayBtn");

function renderCalendar() {
    calendarGrid.innerHTML = "";

    const year = 2026;
    const month = simulatedDate.getMonth();
    const today = simulatedDate.getDate();

    const monthNames = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
    ];

    currentDateText.textContent = `${today} ${monthNames[month]} ${year}`;

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarGrid.appendChild(document.createElement("div"));
    }

    for (let d = 1; d <= daysInMonth; d++) {
        const dayDiv = document.createElement("div");
        dayDiv.textContent = d;
        dayDiv.classList.add("calendar-day");

        if (d < today) dayDiv.classList.add("past");
        else if (d === today) dayDiv.classList.add("today");
        else dayDiv.classList.add("future");

        calendarGrid.appendChild(dayDiv);
    }
}
// =====================================================
// 📄 MONTH END PDF CONFIRMATION (ADD-ONLY)
// =====================================================
function confirmMonthEndPDF() {
    return new Promise(resolve => {

        const wantsPDF = confirm(
            "📄 Month End Summary\n\n" +
            "This month's expense statements will be cleared.\n\n" +
            "Do you want to download the statements as PDF for future use?\n\n" +
            "Press OK to Download PDF\n" +
            "Press Cancel to Continue Without Download"
        );

        if (wantsPDF) {
            // Delay slightly so print renders properly
            setTimeout(() => {
                // 🔵 FORCE OPEN STATEMENTS PAGE BEFORE PRINT
                links.forEach(l => l.classList.remove("active"));
                pages.forEach(p => p.classList.remove("active"));

                document.querySelector('[data-page="statements"]').classList.add("active");
                document.getElementById("statements").classList.add("active");

                // Give DOM time to render printArea
                setTimeout(() => {
                    window.print();
                    resolve(true);
                }, 400);

            }, 300);
        } else {
            resolve(false);
        }
    });
}

// 🔴 NEW: MONTH CHANGE HANDLER
function handleMonthChange(oldDate, newDate) {
    if (oldDate.getMonth() !== newDate.getMonth()) {
        // 🔵 ASK USER TO SAVE STATEMENTS BEFORE RESET
        confirmMonthEndPDF().then(() => {


            // 🔵 STEP 2: ARCHIVE PREVIOUS MONTH TOTAL (YEAR DATA SAFE)
            const archiveKey =
                `${oldDate.getFullYear()}-${oldDate.getMonth()}`;

            const monthTotalSpent =
                expenses.reduce((sum, e) => sum + e.amount, 0);

            monthlyHistory[archiveKey] = monthTotalSpent;

            localStorage.setItem(
                "monthlyHistory",
                JSON.stringify(monthlyHistory)
            );


            const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
            const lastMonthSavings = monthlyIncome - totalSpent;

            savings += lastMonthSavings;

            monthlyIncome = 0;
            expenses = [];
            incomeConfirmedThisMonth = false;

            localStorage.setItem("savings", savings);
            localStorage.setItem("monthlyIncome", 0);
            localStorage.setItem("expenses", JSON.stringify([]));
            localStorage.setItem("incomeConfirmedThisMonth", "false");

            alert("New month started. Please confirm income.");
            window.location.reload();

        }); // end month-end PDF confirmation
        // 🔵 AUTO NAVIGATE TO DASHBOARD FOR INCOME ENTRY
        links.forEach(l => l.classList.remove("active"));
        pages.forEach(p => p.classList.remove("active"));

        document.querySelector('[data-page="dashboard"]').classList.add("active");
        document.getElementById("dashboard").classList.add("active");


    }

}

// Advance day
nextDayBtn.addEventListener("click", () => {
    const oldDate = new Date(simulatedDate);

    simulatedDate.setDate(simulatedDate.getDate() + 1);
    localStorage.setItem("simulatedDate", simulatedDate);

    handleMonthChange(oldDate, simulatedDate);

    renderCalendar();
    updateDashboard();
});

renderCalendar();

// ---------- RESET CURRENT MONTH ----------
document.getElementById("resetMonthBtn")?.addEventListener("click", () => {
    if (!confirm("This will reset the current month. Continue?")) return;

    expenses = [];
    // 🔵 FIX: CLEAR CURRENT MONTH FROM YEARLY HISTORY
    const currentKey =
        `${simulatedDate.getFullYear()}-${simulatedDate.getMonth()}`;

    monthlyHistory[currentKey] = 0;
    localStorage.setItem(
        "monthlyHistory",
        JSON.stringify(monthlyHistory)
    );

    highestAlertReached = 0;
    lastUsagePercent = 0;
    lastIncomeSnapshot = monthlyIncome;

    localStorage.setItem("expenses", JSON.stringify([]));
    localStorage.setItem("highestAlertReached", 0);
    localStorage.setItem("lastUsagePercent", 0);
    localStorage.setItem("lastIncomeSnapshot", monthlyIncome);

    simulatedDate.setDate(1);
    localStorage.setItem("simulatedDate", simulatedDate);

    renderCalendar();
    renderStatements();
    updateDashboard();
});

// ---------- RESET ENTIRE APP ----------
document.getElementById("resetAppBtn")?.addEventListener("click", () => {
    if (!confirm("This will reset EVERYTHING. Are you sure?")) return;

    // Clear everything EXCEPT currentUser to keep the logout header intact
    const user = localStorage.getItem("currentUser");
    localStorage.clear();
    if (user) localStorage.setItem("currentUser", user);

    window.location.reload();
});
// ---------- DARK MODE TOGGLE (FIX) ----------
const themeToggleBtn = document.getElementById("themeToggleBtn");

function applyTheme(theme) {
    if (theme === "light") {
        document.body.classList.add("light");
        if (themeToggleBtn) themeToggleBtn.innerHTML = "🌙 Switch to Dark Mode";
    } else {
        document.body.classList.remove("light");
        if (themeToggleBtn) themeToggleBtn.innerHTML = "☀️ Switch to Light Mode";
    }
    // Redraw charts when theme changes
    setTimeout(() => {
        drawCategoryChart();
        drawMonthlyTrendChart();
    }, 100);
}

// Load saved theme
const savedTheme = localStorage.getItem("theme") || "dark";
applyTheme(savedTheme);

// Button click
themeToggleBtn?.addEventListener("click", () => {
    const isLight = document.body.classList.contains("light");
    const newTheme = isLight ? "dark" : "light";

    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
});
// =====================================================
// ⌨️ KEYBOARD ENTER SUPPORT (ADDITION ONLY)
// =====================================================

// ---------- ENTER → ADD INCOME ----------
if (incomeInput) {
    incomeInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // stop accidental form behavior
            document.getElementById("setIncomeBtn").click();
        }
    });
}

// ---------- ENTER → ADD EXPENSE ----------
const labelInput = document.getElementById("label");

if (labelInput) {
    labelInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
            e.preventDefault(); // stop accidental reload
            document.getElementById("addExpenseBtn").click();
        }
    });
}
// =====================================================
// 📊 PHASE 1: CATEGORY-WISE SPENDING CHART (CANVAS)
// =====================================================

const categoryCanvas = document.getElementById("categoryChart");
const categoryCtx = categoryCanvas?.getContext("2d");

// Fixed colors per category (judge-friendly)
const CATEGORY_COLORS = {
    Living: "#4a6cf7",
    Food: "#10b981",
    Transport: "#f59e0b",
    Education: "#6366f1",
    Health: "#ef4444",
    Lifestyle: "#8b5cf6",
    Finance: "#14b8a6",
    Others: "#64748b"
};

// Draw pie chart
function drawCategoryChart() {
    if (!categoryCtx) return;

    // Clear canvas
    categoryCtx.clearRect(0, 0, categoryCanvas.width, categoryCanvas.height);

    // Calculate totals per category
    const categoryTotals = {};

    expenses.forEach(exp => {
        categoryTotals[exp.category] =
            (categoryTotals[exp.category] || 0) + exp.amount;
    });

    const values = Object.values(categoryTotals);
    const labels = Object.keys(categoryTotals);

    const total = values.reduce((a, b) => a + b, 0);

    // No data case
    if (total === 0) {
        categoryCtx.fillStyle = "#94a3b8";
        categoryCtx.font = "16px Segoe UI";
        categoryCtx.fillText("No expense data available", 90, 200);
        return;
    }

    let startAngle = 0;

    values.forEach((value, index) => {
        const sliceAngle = (value / total) * Math.PI * 2;

        // Draw slice
        categoryCtx.beginPath();
        categoryCtx.moveTo(200, 200);
        categoryCtx.arc(
            200,
            200,
            150,
            startAngle,
            startAngle + sliceAngle
        );
        categoryCtx.closePath();

        const category = labels[index];
        categoryCtx.fillStyle =
            CATEGORY_COLORS[category] || "#94a3b8";

        categoryCtx.fill();

        startAngle += sliceAngle;
    });

    // Draw legend
    let legendY = 20;
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim();

    labels.forEach(label => {
        categoryCtx.fillStyle =
            CATEGORY_COLORS[label] || "#94a3b8";
        categoryCtx.fillRect(10, legendY, 12, 12);

        categoryCtx.fillStyle = textColor;
        categoryCtx.font = "14px Inter";
        categoryCtx.fillText(label, 30, legendY + 11);

        legendY += 20;
    });
}

// 🔁 AUTO UPDATE CHART WHEN ANALYTICS PAGE OPENS
links.forEach(link => {
    link.addEventListener("click", () => {
        if (link.dataset.page === "analytics") {
            setTimeout(drawCategoryChart, 50);
        }
    });
});

// 🔁 UPDATE CHART WHEN DATA CHANGES
const originalUpdateDashboard = updateDashboard;
updateDashboard = function () {
    originalUpdateDashboard();
    drawCategoryChart();
};
// =====================================================
// 📊 PHASE 2: MONTHLY SPENDING TREND (CANVAS BAR CHART)
// =====================================================

const monthlyCanvas = document.getElementById("monthlyTrendChart");
const monthlyCtx = monthlyCanvas?.getContext("2d");

const MONTH_NAMES = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

// Draw monthly bar chart
function drawMonthlyTrendChart() {
    if (!monthlyCtx) return;

    // Clear canvas
    monthlyCtx.clearRect(
        0,
        0,
        monthlyCanvas.width,
        monthlyCanvas.height
    );

    // Prepare monthly totals
    const monthlyTotals = Array(12).fill(0);
    // 🔵 STEP 3: USE YEARLY ARCHIVED DATA (DO NOT RESET)
    Object.keys(monthlyHistory).forEach(key => {
        const [year, month] = key.split("-").map(Number);
        if (year === 2026) {
            monthlyTotals[month] += monthlyHistory[key];
        }
    });


    const maxValue = Math.max(...monthlyTotals, 1);

    const chartPadding = 50;
    const chartWidth =
        monthlyCanvas.width - chartPadding * 2;
    const chartHeight =
        monthlyCanvas.height - chartPadding * 2;

    const barWidth = chartWidth / 12 - 10;
    const textColor = getComputedStyle(document.body).getPropertyValue('--text-main').trim();

    // Draw axes
    monthlyCtx.strokeStyle = textColor;
    monthlyCtx.globalAlpha = 0.2;
    monthlyCtx.beginPath();
    monthlyCtx.moveTo(chartPadding, chartPadding);
    monthlyCtx.lineTo(chartPadding, chartPadding + chartHeight);
    monthlyCtx.lineTo(
        chartPadding + chartWidth,
        chartPadding + chartHeight
    );
    monthlyCtx.stroke();

    // Draw bars
    monthlyTotals.forEach((value, index) => {
        const barHeight =
            (value / maxValue) * chartHeight;

        const x =
            chartPadding +
            index * (barWidth + 10);

        const y =
            chartPadding +
            chartHeight -
            barHeight;

        // 🔵 HIGHLIGHT CURRENT MONTH BAR
        const currentMonth = simulatedDate.getMonth();

        monthlyCtx.fillStyle =
            index === currentMonth
                ? "#10b981"   // green for current month
                : "#4a6cf7";

        monthlyCtx.fillRect(
            x,
            y,
            barWidth,
            barHeight
        );

        // Month label
        monthlyCtx.globalAlpha = 1.0;
        monthlyCtx.fillStyle = textColor;
        monthlyCtx.font = "12px Inter";
        monthlyCtx.fillText(
            MONTH_NAMES[index],
            x + 4,
            chartPadding + chartHeight + 15
        );

        // Value label (if > 0)
        if (value > 0) {
            monthlyCtx.fillText(
                "₹" + value,
                x,
                y - 5
            );
        }
    });

    // Clear alpha for text
    monthlyCtx.globalAlpha = 1.0;

    // Title
    monthlyCtx.fillStyle = textColor;
    monthlyCtx.font = "16px Inter";
    monthlyCtx.fillText(
        "Monthly Spending Trend (2026)",
        chartPadding,
        25
    );
}

// 🔁 AUTO DRAW WHEN ANALYTICS PAGE OPENS
links.forEach(link => {
    link.addEventListener("click", () => {
        if (link.dataset.page === "analytics") {
            setTimeout(drawMonthlyTrendChart, 80);
        }
    });
});

// 🔁 AUTO UPDATE WHEN DATA CHANGES
const originalUpdateDashboardPhase2 = updateDashboard;
updateDashboard = function () {
    originalUpdateDashboardPhase2();
    drawMonthlyTrendChart();
};
// =====================================================
// 🧠 AI INSIGHTS – GOAL BASED SAVINGS PLANNER
// =====================================================

const goalAmountInput = document.getElementById("goalAmount");
const goalMonthSelect = document.getElementById("goalMonth");
const setGoalBtn = document.getElementById("setGoalBtn");
const aiInsightsBox = document.getElementById("aiInsights");

// Load saved goal
let savingsGoal = Number(localStorage.getItem("savingsGoal")) || 0;
let goalMonth = Number(localStorage.getItem("goalMonth"));

if (goalAmountInput) goalAmountInput.value = savingsGoal || "0";
if (goalMonthSelect && goalMonth >= 0) goalMonthSelect.value = goalMonth;

// Save goal
setGoalBtn?.addEventListener("click", () => {
    savingsGoal = Number(goalAmountInput.value);
    goalMonth = Number(goalMonthSelect.value);

    if (savingsGoal <= 0) {
        alert("Enter a valid savings goal");
        return;
    }

    localStorage.setItem("savingsGoal", savingsGoal);
    localStorage.setItem("goalMonth", goalMonth);

    generateAIInsights();
});

// Generate AI insights
function generateAIInsights() {
    if (!aiInsightsBox) return;

    aiInsightsBox.innerHTML = "";

    if (!savingsGoal || goalMonth === undefined) {
        aiInsightsBox.innerHTML = "🧠 Set a savings goal to get insights.";
        return;
    }

    const currentMonth = simulatedDate.getMonth();
    const monthsRemaining = goalMonth - currentMonth + 1;

    if (monthsRemaining <= 0) {
        aiInsightsBox.innerHTML =
            "⛔ Target month already passed. Please set a future month.";
        return;
    }

    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const currentSavings = savings;

    const remainingSavings = savingsGoal - currentSavings;
    const requiredMonthlySavings =
        remainingSavings > 0
            ? Math.ceil(remainingSavings / monthsRemaining)
            : 0;

    const availableBudget = monthlyIncome + savings;
    const allowedSpending =
        monthlyIncome - requiredMonthlySavings;

    let statusMessage = "";
    if (remainingSavings <= 0) {
        statusMessage = "🎉 You already achieved your savings goal!";
    } else if (allowedSpending < totalSpent) {
        statusMessage = "🚨 You are overspending and may miss your savings goal.";
    } else {
        statusMessage = "✅ You are on track to reach your savings goal.";
    }

    aiInsightsBox.innerHTML = `
        <div class="insight-content">
            <p><strong>🎯 Savings Goal:</strong> ₹${savingsGoal.toLocaleString()}</p>
            <p><strong>📆 Months Remaining:</strong> ${monthsRemaining}</p>
            <p><strong>💰 Goal Savings / Month:</strong> ₹${requiredMonthlySavings.toLocaleString()}</p>
            <p><strong>💸 Recommended Spending Limit:</strong> ₹${allowedSpending.toLocaleString()}</p>
            <div class="insight-status ${statusMessage.includes('🚨') ? 'status-danger' : 'status-success'}">
                ${statusMessage}
            </div>
        </div>
    `;
}

// Auto update AI when data changes
const originalUpdateDashboardAI = updateDashboard;
updateDashboard = function () {
    originalUpdateDashboardAI();
    generateAIInsights();
};

// Update when AI page opens
links.forEach(link => {
    link.addEventListener("click", () => {
        if (link.dataset.page === "ai") {
            setTimeout(generateAIInsights, 100);
        }
    });
});
// =====================================================
// 🎯 AI GOAL PROGRESS BAR LOGIC (ADD-ONLY)
// =====================================================

const progressFill = document.getElementById("progressFill");
const progressPercentText = document.getElementById("progressPercent");
const progressText = document.getElementById("progressText");

function updateGoalProgress() {
    if (
        !progressFill ||
        !progressPercentText ||
        !progressText ||
        !savingsGoal ||
        savingsGoal <= 0
    ) {
        return;
    }

    const progress =
        Math.min((savings / savingsGoal) * 100, 100);

    progressFill.style.width = progress + "%";
    progressPercentText.textContent =
        Math.floor(progress) + "%";

    progressText.textContent =
        `₹${savings} saved of ₹${savingsGoal} goal`;

    // Color logic
    if (progress >= 100) {
        progressFill.style.background =
            "linear-gradient(90deg, #10b981, #22c55e)";
    } else if (progress >= 50) {
        progressFill.style.background =
            "linear-gradient(90deg, #f59e0b, #facc15)";
    } else {
        progressFill.style.background =
            "linear-gradient(90deg, #ef4444, #f97316)";
    }
}

// ⚖️ AI SMART BALANCER LOGIC (PACING)
function updateAISmartBalancer() {
    const balancerStatus = document.getElementById("balancerStatus");
    const idealDaily = document.getElementById("idealDaily");
    const balancerFill = document.getElementById("balancerFill");
    const todayMarker = document.getElementById("todayMarker");
    const balancerAura = document.getElementById("balancerAura");
    const balancerTip = document.getElementById("balancerTip");

    if (!balancerStatus || !balancerFill || !todayMarker) return;

    // 1. DATE LOGIC
    const today = simulatedDate.getDate(); // 1-31
    const totalDays = new Date(simulatedDate.getFullYear(), simulatedDate.getMonth() + 1, 0).getDate();
    const datePercent = (today / totalDays) * 100;

    // 2. SPENDING LOGIC
    const totalSpent = expenses.reduce((s, e) => s + e.amount, 0);
    const limit = monthlyIncome + savings;
    const spendPercent = limit > 0 ? (totalSpent / limit) * 100 : 0;

    // 3. PACING CALCULATION
    const recommendedDaily = limit / totalDays;

    // UI UPDATES
    if (idealDaily) idealDaily.textContent = "₹" + Math.round(recommendedDaily);
    balancerFill.style.width = Math.min(spendPercent, 100) + "%";
    todayMarker.style.left = datePercent + "%";

    // 4. STATS & AURA LOGIC
    const diff = spendPercent - datePercent;

    if (limit <= 0) {
        balancerStatus.textContent = "No Budget Set";
        balancerTip.textContent = "Please add income to activate the Smart Balancer.";
    } else if (spendPercent > 95) {
        balancerStatus.textContent = "Critical Limit";
        balancerStatus.style.color = "#ef4444";
        balancerAura.className = "balancer-aura warning";
        balancerTip.textContent = "🚨 Economic Zone: You've exhausted nearly all funds. Total shutdown recommended.";
    } else if (diff > 15) {
        balancerStatus.textContent = "Over-speeding";
        balancerStatus.style.color = "#f59e0b";
        balancerAura.className = "balancer-aura warning";
        balancerTip.textContent = "⚠️ Spending Peak: You are spending much faster than the dates are passing. Slow down!";
    } else if (diff < -15) {
        balancerStatus.textContent = "Savings Peak";
        balancerStatus.style.color = "#10b981";
        balancerAura.className = "balancer-aura success";
        balancerTip.textContent = "💎 Zen Zone: Your spending is beautifully low. You're set for a massive savings bonus!";
    } else {
        balancerStatus.textContent = "Balanced";
        balancerStatus.style.color = "#3b82f6";
        balancerAura.className = "balancer-aura";
        balancerTip.textContent = "✅ Safe Zone: Your spending is perfectly in sync with the current date. Keep it up.";
    }
}

// Hook into existing AI update
const originalGenerateAIInsights = generateAIInsights;
generateAIInsights = function () {
    originalGenerateAIInsights();
    updateGoalProgress();
    updateAISmartBalancer();
};
// ================= PROGRESS BAR SCALE (0–100%) =================
const progressScale = document.getElementById("progressScale");

function renderProgressScale() {
    if (!progressScale) return;

    progressScale.innerHTML = "";

    const divisions = 10; // 0,10,20...100

    for (let i = 0; i <= divisions; i++) {
        const percent = (i / divisions) * 100;

        const span = document.createElement("span");
        span.textContent = percent + "%";

        progressScale.appendChild(span);
    }
}

// =====================================================
// 🔔 SMART REMINDERS ENGINE
// =====================================================
let smartReminders = JSON.parse(localStorage.getItem('smartReminders')) || [];

function saveReminders() {
    localStorage.setItem('smartReminders', JSON.stringify(smartReminders));
    renderReminders();
}

function addReminder() {
    const textInput = document.getElementById('reminderText');
    const dateInput = document.getElementById('reminderDate');

    if (!textInput.value || !dateInput.value) {
        alert("Please provide both a label and a date!");
        return;
    }

    smartReminders.push({
        id: Date.now(),
        text: textInput.value,
        date: dateInput.value,
        triggered: false
    });

    textInput.value = '';
    dateInput.value = '';
    saveReminders();
}

function removeReminder(id) {
    smartReminders = smartReminders.filter(r => r.id !== id);
    saveReminders();
}

function renderReminders() {
    const list = document.getElementById('reminderList');
    if (!list) return;

    if (smartReminders.length === 0) {
        list.innerHTML = '<p class="placeholder-text">No reminders set yet.</p>';
        return;
    }

    // Sort by date
    const sorted = [...smartReminders].sort((a, b) => new Date(a.date) - new Date(b.date));

    list.innerHTML = sorted.map(r => `
        <div class="reminder-item">
            <div class="reminder-info">
                <span class="reminder-text">${r.text}</span>
                <span class="reminder-date">${new Date(r.date).toLocaleDateString()}</span>
            </div>
            <button class="delete-reminder" onclick="removeReminder(${r.id})">🗑️</button>
        </div>
    `).join('');
}

function getSimulatedDateString() {
    const year = simulatedDate.getFullYear();
    const month = String(simulatedDate.getMonth() + 1).padStart(2, '0');
    const day = String(simulatedDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function checkReminders() {
    // ONLY trigger on Dashboard
    const dashboardPage = document.getElementById('dashboard');
    if (!dashboardPage || dashboardPage.classList.contains('active') === false) return;

    const todayStr = getSimulatedDateString();
    const activeReminders = smartReminders.filter(r => r.date === todayStr);

    if (activeReminders.length > 0) {
        const popup = document.getElementById('reminderPopupOverlay');
        const flash = document.getElementById('reminderFlash');
        const listContainer = document.getElementById('activeRemindersList');

        if (!popup || !flash || !listContainer) return;

        // Visual Effects
        flash.classList.add('flash-active');
        setTimeout(() => flash.classList.remove('flash-active'), 600);

        // Sound (existing alarm beep)
        playAlarmBeep();

        // Populate and Show Popup
        listContainer.innerHTML = activeReminders.map(r => `
            <div class="popup-item">
                <strong style="font-size: 18px; color: var(--primary);">${r.text}</strong>
                <p style="font-size: 12px; color: var(--text-dim); margin-top: 5px;">Scheduled for ${new Date(r.date).toLocaleDateString()}</p>
            </div>
        `).join('');

        popup.style.display = 'flex';
    }
}

// =====================================================
// 🛑 CUSTOM USAGE LIMIT POPUP LOGIC
// =====================================================
function showUsageLimitPopup(title, message, showAdvice = true) {
    const overlay = document.getElementById('usageLimitPopupOverlay');
    const card = overlay?.querySelector('.usage-limit-card');
    const titleEl = document.getElementById('usageLimitTitle');
    const msgEl = document.getElementById('usageLimitMsg');

    if (!overlay || !card || !titleEl || !msgEl) return;

    titleEl.textContent = title;
    msgEl.textContent = message;

    // Reset Advice UI
    const adviceContainer = document.getElementById('usageAdviceContainer');
    const showBtn = document.getElementById('showAdviceBtn');
    const skipBtn = document.getElementById('skipAdviceBtn');
    if (adviceContainer) adviceContainer.style.display = 'none';
    if (showBtn) showBtn.style.display = showAdvice ? 'block' : 'none';
    if (skipBtn) skipBtn.style.display = 'none';

    // Reset animation
    card.classList.remove('animate-vaporize');
    void card.offsetWidth; // force reflow
    card.classList.add('animate-vaporize');

    overlay.style.display = 'flex';
}

function hideUsageLimitPopup() {
    const overlay = document.getElementById('usageLimitPopupOverlay');
    const card = overlay?.querySelector('.usage-limit-card');
    if (overlay) overlay.style.display = 'none';
    if (card) card.classList.remove('animate-vaporize');
    window.speechSynthesis.cancel();
}

function handleShowAdvice() {
    const adviceText = `Income and savings are exhausted. Budgeting to the limit risks your financial health.
Please avoid spending to the zero-mark. Aim for a better balance next month.
Remember: "Savings is the shield that protects your tomorrow."`;

    const container = document.getElementById('usageAdviceContainer');
    const textEl = document.getElementById('usageAdviceText');
    const showBtn = document.getElementById('showAdviceBtn');
    const skipBtn = document.getElementById('skipAdviceBtn');

    if (container && textEl && showBtn && skipBtn) {
        textEl.innerText = adviceText;
        container.style.display = 'block';
        showBtn.style.display = 'none';
        skipBtn.style.display = 'block';
        speakMessage(adviceText);
    }
}

function handleSkipAdvice() {
    window.speechSynthesis.cancel();
    document.getElementById('showAdviceBtn').style.display = 'block';
    document.getElementById('skipAdviceBtn').style.display = 'none';
}

// Global dismiss/done logic
function dismissAllActiveReminders() {
    const todayStr = getSimulatedDateString();
    // Remove completed reminders from the system
    smartReminders = smartReminders.filter(r => r.date !== todayStr);
    saveReminders();
    document.getElementById('reminderPopupOverlay').style.display = 'none';
    speakMessage("Reminders acknowledged and marked as complete.");
}

// Event Listeners
document.getElementById('addReminderBtn')?.addEventListener('click', addReminder);
document.getElementById('dismissRemindersBtn')?.addEventListener('click', dismissAllActiveReminders);
document.getElementById('dismissUsageLimitBtn')?.addEventListener('click', hideUsageLimitPopup);
document.getElementById('showAdviceBtn')?.addEventListener('click', handleShowAdvice);
document.getElementById('skipAdviceBtn')?.addEventListener('click', handleSkipAdvice);

// Hook into Page Navigation
links.forEach(link => {
    link.addEventListener("click", () => {
        if (link.dataset.page === 'dashboard') {
            // Delay slightly to allow the active class to be added
            setTimeout(checkReminders, 50);
        }
    });
});

// Hook into Date Advance
nextDayBtn.addEventListener("click", () => {
    // This runs AFTER the original listener thanks to sequential binding
    setTimeout(checkReminders, 100);
});

// RUN ON LOAD
const currentUser = localStorage.getItem("currentUser") || "User";
const headerName = document.getElementById("headerUsername");
if (headerName) {
    headerName.textContent = `👤 ${currentUser}`;
}

renderProgressScale();
updateExpenseProgressBar();
updateAISmartBalancer();
renderReminders();
checkReminders();
