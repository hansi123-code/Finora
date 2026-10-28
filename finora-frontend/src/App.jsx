import { useState, useEffect } from "react";
import "./App.css";
import Auth from "./Auth";
import { apiRequest, logoutUser } from "./api";

const initialTransactions = [
  {
    id: 1,
    title: "Monthly Salary",
    type: "Income",
    category: "Salary",
    amount: 150000,
    date: "2026-10-20",
  },
  {
    id: 2,
    title: "Grocery Shopping",
    type: "Expense",
    category: "Food",
    amount: 8500,
    date: "2026-10-19",
  },
  {
    id: 3,
    title: "Electricity Bill",
    type: "Expense",
    category: "Utilities",
    amount: 4200,
    date: "2026-10-17",
  },
];

function loadTransactions() {
  try {
    const saved = localStorage.getItem("finora-transactions");
    return saved ? JSON.parse(saved) : initialTransactions;
  } catch {
    return initialTransactions;
  }
}

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [transactions, setTransactions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const [budgets, setBudgets] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("finora-budgets")) || [];
  } catch {
    return [];
  }
});

const [budgetForm, setBudgetForm] = useState({
  category: "Food",
  amount: "",
});

const [goals, setGoals] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("finora-goals")) || [];
  } catch {
    return [];
  }
});

const [selectedReportMonth, setSelectedReportMonth] = useState(() => {
  const now = new Date();

  return `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;
});

const [settings, setSettings] = useState(() => {
  try {
    return JSON.parse(localStorage.getItem("finora-settings")) || {
      profileName: "My Account",
      currency: "LKR",
      theme: "Light",
    };
  } catch {
    return {
      profileName: "My Account",
      currency: "LKR",
      theme: "Light",
    };
  }
});

const [currentUser, setCurrentUser] = useState(null);
const [authChecking, setAuthChecking] = useState(true);

useEffect(() => {
  const token = localStorage.getItem("finora-token");

  if (!token) {
    setAuthChecking(false);
    return;
  }

  apiRequest("/me")
    .then((data) => {
      setCurrentUser(data.user);
    })
    .catch(() => {
      localStorage.removeItem("finora-token");
      setCurrentUser(null);
    })
    .finally(() => {
      setAuthChecking(false);
    });
}, []);

useEffect(() => {
  if (!currentUser) return;

  let cancelled = false;

  async function loadFromDatabase() {
    try {
      const data = await apiRequest("/transactions");

      if (cancelled) return;

      const loadedTransactions = data.map((item) => ({
        ...item,
        type: item.type === "income" ? "Income" : "Expense",
        date: String(item.transaction_date).slice(0, 10),
        amount: Number(item.amount),
      }));

      setTransactions(loadedTransactions);
    } catch (error) {
      if (!cancelled) {
        alert(`Could not load transactions: ${error.message}`);
      }
    }
  }

  loadFromDatabase();

  return () => {
    cancelled = true;
  };
}, [currentUser]);


function handleAuthenticated(user) {
  setCurrentUser(user);
}

async function handleLogout() {
  await logoutUser();
  setCurrentUser(null);
}

function updateSettings(event) {
  event.preventDefault();

  localStorage.setItem("finora-settings", JSON.stringify(settings));

  alert("Settings saved successfully!");
}


const [goalForm, setGoalForm] = useState({
  title: "",
  target: "",
  saved: "",
});

  const [formData, setFormData] = useState({
    title: "",
    type: "Expense",
    category: "Food",
    amount: "",
    date: new Date().toISOString().slice(0, 10),
  });

  function saveTransactions(updatedTransactions) {
    setTransactions(updatedTransactions);
    localStorage.setItem(
      "finora-transactions",
      JSON.stringify(updatedTransactions)
    );
  }


  function saveBudgets(updatedBudgets) {
  setBudgets(updatedBudgets);
  localStorage.setItem("finora-budgets", JSON.stringify(updatedBudgets));
}


async function handleAddBudget(event) {
  event.preventDefault();

  const amount = Number(budgetForm.amount);

  if (!Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid budget amount.");
    return;
  }

  try {
    const existingBudget = budgets.find(
      (item) => item.category === budgetForm.category
    );

    let result;

    if (existingBudget) {
      result = await apiRequest(`/budgets/${existingBudget.id}`, {
        method: "PUT",
        body: JSON.stringify({ amount }),
      });
    } else {
      result = await apiRequest("/budgets", {
        method: "POST",
        body: JSON.stringify({
          category: budgetForm.category,
          amount,
          spent: 0,
          period: "monthly",
        }),
      });
    }

    const savedBudget = result.budget;

    const updatedBudgets = existingBudget
      ? budgets.map((item) =>
          item.id === savedBudget.id
            ? {
                ...item,
                ...savedBudget,
                amount: Number(savedBudget.amount),
                spent: Number(savedBudget.spent ?? 0),
              }
            : item
        )
      : [
          ...budgets,
          {
            ...savedBudget,
            amount: Number(savedBudget.amount),
            spent: Number(savedBudget.spent ?? 0),
          },
        ];

    saveBudgets(updatedBudgets);
    setBudgetForm({ category: "Food", amount: "" });

    alert("Budget saved successfully!");
  } catch (error) {
    alert(`Could not save budget: ${error.message}`);
  }
}


function deleteBudget(id) {
  if (window.confirm("Are you sure you want to delete this budget?")) {
    saveBudgets(budgets.filter((item) => item.id !== id));
  }
}

function saveGoals(updatedGoals) {
  setGoals(updatedGoals);
  localStorage.setItem("finora-goals", JSON.stringify(updatedGoals));
}


async function handleAddGoal(event) {
  event.preventDefault();

  const target = Number(goalForm.target);
  const saved = Number(goalForm.saved || 0);

  if (
    !goalForm.title.trim() ||
    !Number.isFinite(target) ||
    target <= 0 ||
    !Number.isFinite(saved) ||
    saved < 0 ||
    saved > target
  ) {
    alert("Please enter valid goal details.");
    return;
  }

  try {
    const result = await apiRequest("/savings-goals", {
      method: "POST",
      body: JSON.stringify({
        title: goalForm.title.trim(),
        target_amount: target,
        saved_amount: saved,
      }),
    });

    const savedGoal = result.goal;

    const newGoal = {
      ...savedGoal,
      id: savedGoal.id,
      title: savedGoal.title,
      target: Number(savedGoal.target_amount),
      saved: Number(savedGoal.saved_amount),
    };

    saveGoals([newGoal, ...goals]);

    setGoalForm({
      title: "",
      target: "",
      saved: "",
    });

    alert("Savings goal saved successfully!");
  } catch (error) {
    alert(`Could not save savings goal: ${error.message}`);
  }
}

function addSavings(id, amount) {
  const value = Number(amount);

  if (!Number.isFinite(value) || value <= 0) {
    alert("Please enter a valid savings amount.");
    return;
  }

  const updatedGoals = goals.map((goal) => {
    if (goal.id !== id) return goal;

    return {
      ...goal,
      saved: Math.min(goal.saved + value, goal.target),
    };
  });

  saveGoals(updatedGoals);
}

function deleteGoal(id) {
  if (window.confirm("Are you sure you want to delete this goal?")) {
    saveGoals(goals.filter((goal) => goal.id !== id));
  }
}

async function handleAddTransaction(event) {
  event.preventDefault();

  const amount = Number(formData.amount);

  if (!formData.title.trim() || !Number.isFinite(amount) || amount <= 0) {
    alert("Please enter a valid transaction name and amount.");
    return;
  }

  try {
    const data = await apiRequest("/transactions", {
      method: "POST",
      body: JSON.stringify({
        title: formData.title.trim(),
        amount,
        type: formData.type.toLowerCase(),
        category: formData.category,
        transaction_date: formData.date,
      }),
    });

    const savedTransaction = {
      ...data.transaction,
      type:
        data.transaction.type === "income" ? "Income" : "Expense",
      date: String(data.transaction.transaction_date).slice(0, 10),
      amount: Number(data.transaction.amount),
    };

    saveTransactions([savedTransaction, ...transactions]);

    setFormData({
      title: "",
      type: "Expense",
      category: "Food",
      amount: "",
      date: new Date().toISOString().slice(0, 10),
    });

    setShowForm(false);
  } catch (error) {
    alert(error.message || "Could not save the transaction.");
  }
}


  function deleteTransaction(id) {
    const confirmed = window.confirm(
      "Are you sure you want to delete this transaction?"
    );

    if (confirmed) {
      saveTransactions(transactions.filter((item) => item.id !== id));
    }
  }

  const income = transactions
    .filter((item) => item.type === "Income")
    .reduce((total, item) => total + item.amount, 0);

  const expenses = transactions
    .filter((item) => item.type === "Expense")
    .reduce((total, item) => total + item.amount, 0);

  const balance = income - expenses;

  const filteredTransactions = transactions.filter((item) => {
    const matchesFilter = filter === "All" || item.type === filter;
    const matchesSearch =
      item.title.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());

    return matchesFilter && matchesSearch;
  });

  function money(amount) {
    return `Rs. ${amount.toLocaleString("en-LK", {
      maximumFractionDigits: 2,
    })}`;
  }

  
const monthlyReportData = Array.from({ length: 6 }, (_, index) => {
  const date = new Date();
  date.setDate(1);
  date.setMonth(date.getMonth() - (5 - index));

  const monthKey = `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;

  const monthTransactions = transactions.filter(
    (item) => item.date.slice(0, 7) === monthKey
  );

  const monthIncome = monthTransactions
    .filter((item) => item.type === "Income")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const monthExpenses = monthTransactions
    .filter((item) => item.type === "Expense")
    .reduce((sum, item) => sum + Number(item.amount), 0);

  return {
    monthKey,
    label: date.toLocaleDateString("en-US", { month: "short" }),
    income: monthIncome,
    expenses: monthExpenses,
  };
});

const selectedMonthTransactions = transactions.filter(
  (item) => item.date.slice(0, 7) === selectedReportMonth
);

const reportIncome = selectedMonthTransactions
  .filter((item) => item.type === "Income")
  .reduce((sum, item) => sum + Number(item.amount), 0);

const reportExpenses = selectedMonthTransactions
  .filter((item) => item.type === "Expense")
  .reduce((sum, item) => sum + Number(item.amount), 0);

const reportCategories = Object.entries(
  selectedMonthTransactions
    .filter((item) => item.type === "Expense")
    .reduce((totals, item) => {
      totals[item.category] =
        (totals[item.category] || 0) + Number(item.amount);

      return totals;
    }, {})
).sort((a, b) => b[1] - a[1]);

const maxMonthlyAmount = Math.max(
  1,
  ...monthlyReportData.flatMap((item) => [
    item.income,
    item.expenses,
  ])
);

const maxCategoryAmount = Math.max(
  1,
  ...reportCategories.map((item) => item[1])
);


function exportTransactionsToCSV() {
  if (transactions.length === 0) {
    alert("No transactions available to export.");
    return;
  }

  const headers = [
    "Date",
    "Description",
    "Category",
    "Type",
    "Amount",
  ];

  const escapeCSV = (value) => {
    const text = String(value ?? "");
    return `"${text.replace(/"/g, '""')}"`;
  };

  const rows = transactions.map((transaction) => [
    transaction.date,
    transaction.description,
    transaction.category,
    transaction.type,
    transaction.amount,
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF" + csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "finora-transactions.csv";

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}




  const menuItems = [
    { name: "Dashboard", icon: "⌂" },
    { name: "Transactions", icon: "⇄" },
    { name: "Budgets", icon: "▤" },
    { name: "Reports", icon: "▥" },
    { name: "Savings Goals", icon: "◎" },
    { name: "Settings", icon: "⚙" },
  ];

if (authChecking) {
  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">Finora<span>.</span></div>
        <p>Checking your account...</p>
      </div>
    </div>
  );
}

if (!currentUser) {
  return <Auth onAuthenticated={handleAuthenticated} />;
}

  return (
    <div className={`finora-app ${settings.theme === "Dark" ? "dark-mode" : ""}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-icon">F</div>
          <span>finora</span>
        </div>

        <p className="menu-label">MENU</p>

        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <button
              key={item.name}
              className={`menu-item ${
                activePage === item.name ? "active" : ""
              }`}
              onClick={() => setActivePage(item.name)}
            >
              <span className="menu-icon">{item.icon}</span>
              <span>{item.name}</span>
            </button>
          ))}

          <button
  type="button"
  onClick={handleLogout}
  className="logout-button"
>
  Logout
</button>

        </nav>

        <div className="sidebar-bottom">
          <div className="help-icon">?</div>
          <div>
            <strong>Need help?</strong>
            <p>We're here to help you.</p>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="breadcrumb">Pages / {activePage}</p>
            <h2>{activePage}</h2>
          </div>

          <div className="profile">
            <div className="notification">♧</div>
            <div className="avatar">{(currentUser?.name || settings.profileName || "U")
  .trim()
  .charAt(0)
  .toUpperCase()}</div>
            <div className="profile-info">
              <strong>My Account</strong>
              <span>Personal Finance</span>
            </div>  
          </div>
        </header>



{activePage === "Reports" && (
  <section className="reports-page">
    <div className="transactions-title">
      <div>
        <p className="eyebrow">UNDERSTAND YOUR FINANCES</p>
        <h1>Monthly Reports</h1>
        <p className="welcome-description">
          Review your income, expenses and spending habits.
        </p>
      </div>

      <label className="report-month-select">
        Select Month
        <select
          value={selectedReportMonth}
          onChange={(event) =>
            setSelectedReportMonth(event.target.value)
          }
        >
          {monthlyReportData.map((month) => (
            <option key={month.monthKey} value={month.monthKey}>
              {new Date(
                Number(month.monthKey.slice(0, 4)),
                Number(month.monthKey.slice(5, 7)) - 1,
                1
              ).toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
      </label>
    </div>

    <div className="summary-grid report-summary-grid">
      <div className="summary-card">
        <div className="card-top">
          <span>Monthly Income</span>
          <span className="card-icon income-icon">↗</span>
        </div>
        <h2>{money(reportIncome)}</h2>
        <p className="card-note">Income for selected month</p>
      </div>

      <div className="summary-card">
        <div className="card-top">
          <span>Monthly Expenses</span>
          <span className="card-icon expense-icon">↘</span>
        </div>
        <h2>{money(reportExpenses)}</h2>
        <p className="card-note">Expenses for selected month</p>
      </div>

      <div className="summary-card">
        <div className="card-top">
          <span>Net Savings</span>
          <span className="card-icon savings-icon">◎</span>
        </div>
        <h2>{money(reportIncome - reportExpenses)}</h2>
        <p className="card-note">Income minus expenses</p>
      </div>
    </div>

    <div className="panel report-chart-panel">
      <div className="panel-heading">
        <div>
          <h3>Income vs Expenses</h3>
          <p>Monthly comparison for the last 6 months</p>
        </div>
      </div>

      <div className="monthly-chart">
        {monthlyReportData.map((month) => (
          <div className="monthly-chart-column" key={month.monthKey}>
            <div className="monthly-bars">
              <div
                className="monthly-bar income-bar"
                title={`Income: ${money(month.income)}`}
                style={{
                  height: `${(month.income / maxMonthlyAmount) * 100}%`,
                }}
              />

              <div
                className="monthly-bar expense-bar"
                title={`Expenses: ${money(month.expenses)}`}
                style={{
                  height: `${(month.expenses / maxMonthlyAmount) * 100}%`,
                }}
              />
            </div>

            <span className="monthly-chart-label">
              {month.label}
            </span>
          </div>
        ))}
      </div>

      <div className="chart-legend">
        <span><i className="legend-dot income-dot" /> Income</span>
        <span><i className="legend-dot expense-dot" /> Expenses</span>
      </div>
    </div>

    <div className="panel report-category-panel">
      <div className="panel-heading">
        <div>
          <h3>Spending by Category</h3>
          <p>Expenses for the selected month</p>
        </div>
      </div>

      {reportCategories.length === 0 ? (
        <div className="empty-state">
          <h3>No expenses recorded</h3>
          <p>
            There are no expenses for this month yet.
            Add transactions to see your spending breakdown.
          </p>
        </div>
      ) : (
        reportCategories.map(([category, amount]) => (
          <div className="report-category-row" key={category}>
            <div className="report-category-heading">
              <span>{category}</span>
              <strong>{money(amount)}</strong>
            </div>

            <div className="progress-track report-progress-track">
              <div
                className="progress-fill report-category-fill"
                style={{
                  width: `${(amount / maxCategoryAmount) * 100}%`,
                }}
              />
            </div>

            <p className="report-category-percent">
              {reportExpenses > 0
                ? `${Math.round((amount / reportExpenses) * 100)}% of expenses`
                : "0% of expenses"}
            </p>
          </div>
        ))
      )}
    </div>
  </section>
)}

        {activePage === "Dashboard" && (
          <>
            <section className="welcome-section">
              <div>
                <p className="eyebrow">YOUR FINANCIAL OVERVIEW</p>
                <h1>Welcome back! 👋</h1>
                <p className="welcome-description">
                  Here's what's happening with your money today.
                </p>
              </div>
              <button className="date-button">▦ This Month⌄</button>
            </section>

            <section className="summary-grid">
              <div className="summary-card balance-card">
                <div className="card-top">
                  <span>Total Balance</span>
                  <span className="card-icon">◈</span>
                </div>
                <h2>{money(balance)}</h2>
                <p className="card-note">Income minus expenses</p>
                <div className="balance-decoration">FINORA</div>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Total Income</span>
                  <span className="card-icon income-icon">↗</span>
                </div>
                <h2>{money(income)}</h2>
                <p className="card-note">All recorded income</p>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Total Expenses</span>
                  <span className="card-icon expense-icon">↘</span>
                </div>
                <h2>{money(expenses)}</h2>
                <p className="card-note">All recorded expenses</p>
              </div>

              <div className="summary-card">
                <div className="card-top">
                  <span>Net Savings</span>
                  <span className="card-icon savings-icon">◎</span>
                </div>
                <h2>{money(balance)}</h2>
                <p className="card-note">Income less expenses</p>
              </div>
            </section>

            <section className="dashboard-grid">
              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Financial Overview</h3>
                    <p>Your current financial position</p>
                  </div>
                </div>

                <div className="overview-stats">
                  <div>
                    <span>Income</span>
                    <strong className="positive">{money(income)}</strong>
                  </div>
                  <div>
                    <span>Expenses</span>
                    <strong className="negative">{money(expenses)}</strong>
                  </div>
                  <div>
                    <span>Transactions</span>
                    <strong>{transactions.length}</strong>
                  </div>
                </div>

                <div className="simple-income-bar">
                  <div
                    className="simple-income-fill"
                    style={{
                      width: `${income + expenses > 0 ? (income / (income + expenses)) * 100 : 0}%`,
                    }}
                  />
                </div>
                <p className="chart-footnote">
                  Green represents income compared with total recorded activity.
                </p>
              </div>

              <div className="panel">
                <div className="panel-heading">
                  <div>
                    <h3>Spending Summary</h3>
                    <p>Expenses by category</p>
                  </div>
                </div>

                {["Food", "Transport", "Shopping", "Utilities"].map(
                  (category) => {
                    const total = transactions
                      .filter(
                        (item) =>
                          item.type === "Expense" &&
                          item.category === category
                      )
                      .reduce((sum, item) => sum + item.amount, 0);

                    return (
                      <div className="category-summary" key={category}>
                        <div>
                          <span>{category}</span>
                          <strong>{money(total)}</strong>
                        </div>
                        <div className="progress-track">
                          <div
                            className="progress-fill food-fill"
                            style={{
                              width: `${expenses > 0 ? (total / expenses) * 100 : 0}%`,
                            }}
                          />
                        </div>
                      </div>
                    );
                  }
                )}
              </div>
            </section>

            <section className="panel transactions-panel">
              <div className="panel-heading">
                <div>
                  <h3>Recent Transactions</h3>
                  <p>Your latest financial activity</p>
                </div>
                <button
                  className="view-all-button"
                  onClick={() => setActivePage("Transactions")}
                >
                  View all →
                </button>
              </div>

              {transactions.slice(0, 4).map((item) => (
                <div className="transaction-row" key={item.id}>
                  <div className="transaction-name">
                    <span className="transaction-symbol salary">
                      {item.type === "Income" ? "↗" : "↘"}
                    </span>
                    <div>
                      <strong>{item.title}</strong>
                      <small>{item.type}</small>
                    </div>
                  </div>
                  <span>{item.category}</span>
                  <span>{item.date}</span>
                  <strong
                    className={item.type === "Income" ? "positive" : "negative"}
                  >
                    {item.type === "Income" ? "+" : "−"} {money(item.amount)}
                  </strong>
                </div>
              ))}
            </section>
          </>
        )}

        {activePage === "Transactions" && (
          <section className="transactions-page">
            <div className="transactions-title">
              <div>
                <p className="eyebrow">MANAGE YOUR MONEY</p>
                <h1>Transactions</h1>
                <p className="welcome-description">
                  Track and manage your income and expenses.
                </p>
              </div>

              
<div className="transaction-header-actions">
  <button
    className="export-button"
    onClick={exportTransactionsToCSV}
  >
    ↓ Export CSV
  </button>

  <button
    className="primary-button"
    onClick={() => setShowForm(!showForm)}
  >
    {showForm ? "Cancel" : "+ Add Transaction"}
  </button>
</div>

            </div>

            {showForm && (
              <form className="transaction-form panel" onSubmit={handleAddTransaction}>
                <h3>Add New Transaction</h3>

                <label>
                  Transaction Name
                  <input
                    type="text"
                    placeholder="e.g. Grocery Shopping"
                    value={formData.title}
                    onChange={(event) =>
                      setFormData({ ...formData, title: event.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Transaction Type
                  <select
                    value={formData.type}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        type: event.target.value,
                        category: event.target.value === "Income" ? "Salary" : "Food",
                      })
                    }
                  >
                    <option value="Expense">Expense</option>
                    <option value="Income">Income</option>
                  </select>
                </label>

                <label>
                  Category
                  <select
                    value={formData.category}
                    onChange={(event) =>
                      setFormData({ ...formData, category: event.target.value })
                    }
                  >
                    {(
                      formData.type === "Income"
                        ? ["Salary", "Freelance", "Business", "Other"]
                        : ["Food", "Transport", "Shopping", "Utilities", "Health", "Education", "Other"]
                    ).map((category) => (
                      <option value={category} key={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label>
                  Amount (LKR)
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="Enter amount"
                    value={formData.amount}
                    onChange={(event) =>
                      setFormData({ ...formData, amount: event.target.value })
                    }
                    required
                  />
                </label>

                <label>
                  Date
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(event) =>
                      setFormData({ ...formData, date: event.target.value })
                    }
                    required
                  />
                </label>

                <button className="primary-button" type="submit">
                  Save Transaction
                </button>
              </form>
            )}

            <div className="summary-grid transaction-summary">
              <div className="summary-card">
                <span className="form-muted">Total Income</span>
                <h2 className="positive">{money(income)}</h2>
              </div>
              <div className="summary-card">
                <span className="form-muted">Total Expenses</span>
                <h2 className="negative">{money(expenses)}</h2>
              </div>
              <div className="summary-card">
                <span className="form-muted">Net Balance</span>
                <h2>{money(balance)}</h2>
              </div>
              <div className="summary-card">
                <span className="form-muted">Transactions</span>
                <h2>{transactions.length}</h2>
              </div>
            </div>

            <div className="panel transaction-list-panel">
              <div className="transaction-tools">
                <input
                  type="search"
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />

                <select
                  value={filter}
                  onChange={(event) => setFilter(event.target.value)}
                  aria-label="Filter transactions"
                >
                  <option value="All">All Transactions</option>
                  <option value="Income">Income Only</option>
                  <option value="Expense">Expenses Only</option>
                </select>
              </div>

              <div className="transaction-row transaction-header">
                <span>TRANSACTION</span>
                <span>CATEGORY</span>
                <span>DATE</span>
                <span>AMOUNT / ACTION</span>
              </div>

              {filteredTransactions.length === 0 ? (
                <p className="empty-state">No transactions found.</p>
              ) : (
                filteredTransactions.map((item) => (
                  <div className="transaction-row" key={item.id}>
                    <div className="transaction-name">
                      <span className="transaction-symbol salary">
                        {item.type === "Income" ? "↗" : "↘"}
                      </span>
                      <div>
                        <strong>{item.title}</strong>
                        <small>{item.type}</small>
                      </div>
                    </div>

                    <span>{item.category}</span>
                    <span>{item.date}</span>

                    <div className="transaction-action">
                      <strong
                        className={item.type === "Income" ? "positive" : "negative"}
                      >
                        {item.type === "Income" ? "+" : "−"} {money(item.amount)}
                      </strong>
                      <button
                        className="delete-button"
                        onClick={() => deleteTransaction(item.id)}
                        aria-label={`Delete ${item.title}`}
                        title="Delete transaction"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

       {activePage === "Budgets" && (
  <section className="budgets-page">
    <div className="transactions-title">
      <div>
        <p className="eyebrow">PLAN YOUR SPENDING</p>
        <h1>Monthly Budgets</h1>
        <p className="welcome-description">
          Set spending limits and keep your finances on track.
        </p>
      </div>
    </div>

    <div className="budget-total-card">
      <div>
        <span>Total Budget</span>
        <h2>
          {money(
            budgets.reduce((sum, item) => sum + item.amount, 0)
          )}
        </h2>
      </div>

      <div>
        <span>Total Spent</span>
        <h2>
          {money(
            budgets.reduce((sum, budget) => {
              const spent = transactions
                .filter(
                  (item) =>
                    item.type === "Expense" &&
                    item.category === budget.category &&
                    item.date.slice(0, 7) ===
                      new Date().getFullYear() +
                        "-" +
                        String(new Date().getMonth() + 1).padStart(2, "0")
                )
                .reduce((total, item) => total + item.amount, 0);

              return sum + spent;
            }, 0)
          )}
        </h2>
      </div>
    </div>

    <form className="panel budget-form" onSubmit={handleAddBudget}>
      <h3>Set a Category Budget</h3>

      <label>
        Category
        <select
          value={budgetForm.category}
          onChange={(event) =>
            setBudgetForm({
              ...budgetForm,
              category: event.target.value,
            })
          }
        >
          {[
            "Food",
            "Transport",
            "Shopping",
            "Utilities",
            "Health",
            "Education",
            "Other",
          ].map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label>
        Monthly Limit (LKR)
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="e.g. 20000"
          value={budgetForm.amount}
          onChange={(event) =>
            setBudgetForm({
              ...budgetForm,
              amount: event.target.value,
            })
          }
          required
        />
      </label>

      <button className="primary-button" type="submit">
        Save Budget
      </button>
    </form>

    <div className="budget-cards">
      {budgets.length === 0 ? (
        <div className="panel empty-state">
          <h3>No budgets yet</h3>
          <p>Add your first category budget above.</p>
        </div>
      ) : (
        budgets.map((budget) => {
          const currentMonth =
            new Date().getFullYear() +
            "-" +
            String(new Date().getMonth() + 1).padStart(2, "0");

          const spent = transactions
            .filter(
              (item) =>
                item.type === "Expense" &&
                item.category === budget.category &&
                item.date.slice(0, 7) === currentMonth
            )
            .reduce((sum, item) => sum + item.amount, 0);

          const remaining = budget.amount - spent;
          const percentage = (spent / budget.amount) * 100;
          const progress = Math.min(percentage, 100);

          return (
            <div className="panel budget-card" key={budget.id}>
              <div className="budget-card-heading">
                <div>
                  <span className="budget-category-icon">▤</span>
                  <h3>{budget.category}</h3>
                </div>

                <button
                  className="delete-button"
                  onClick={() => deleteBudget(budget.id)}
                  type="button"
                >
                  Delete
                </button>
              </div>

              <p className="budget-muted">Monthly spending limit</p>
              <h2>{money(budget.amount)}</h2>

              <div className="budget-progress-label">
                <span>Spent: {money(spent)}</span>
                <strong>{Math.round(percentage)}%</strong>
              </div>

              <div className="progress-track budget-progress-track">
                <div
                  className={`progress-fill ${
                    percentage > 100 ? "budget-over-limit" : ""
                  }`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              <p
                className={
                  remaining < 0
                    ? "budget-warning"
                    : "budget-remaining"
                }
              >
                {remaining < 0
                  ? `Over budget by ${money(Math.abs(remaining))}`
                  : `${money(remaining)} remaining`}
              </p>
            </div>
          );
        })
      )}
    </div>
  </section>
)}

{activePage === "Savings Goals" && (
  <section className="savings-page">
    <div className="transactions-title">
      <div>
        <p className="eyebrow">SAVE FOR YOUR FUTURE</p>
        <h1>Savings Goals</h1>
        <p className="welcome-description">
          Turn your financial dreams into achievable goals.
        </p>
      </div>
    </div>

    <div className="budget-total-card">
      <div>
        <span>Total Saved</span>
        <h2>
          {money(goals.reduce((sum, goal) => sum + goal.saved, 0))}
        </h2>
      </div>

      <div>
        <span>Total Target</span>
        <h2>
          {money(goals.reduce((sum, goal) => sum + goal.target, 0))}
        </h2>
      </div>
    </div>

    <form className="panel goal-form" onSubmit={handleAddGoal}>
      <h3>Create a Savings Goal</h3>

      <label>
        Goal Name
        <input
          type="text"
          placeholder="e.g. New Laptop"
          value={goalForm.title}
          onChange={(event) =>
            setGoalForm({ ...goalForm, title: event.target.value })
          }
          required
        />
      </label>

      <label>
        Target Amount (LKR)
        <input
          type="number"
          min="0.01"
          step="0.01"
          placeholder="e.g. 150000"
          value={goalForm.target}
          onChange={(event) =>
            setGoalForm({ ...goalForm, target: event.target.value })
          }
          required
        />
      </label>

      <label>
        Already Saved (LKR)
        <input
          type="number"
          min="0"
          step="0.01"
          placeholder="e.g. 10000"
          value={goalForm.saved}
          onChange={(event) =>
            setGoalForm({ ...goalForm, saved: event.target.value })
          }
        />
      </label>

      <button className="primary-button" type="submit">
        + Create Goal
      </button>
    </form>

    <div className="goal-cards">
      {goals.length === 0 ? (
        <div className="panel empty-state">
          <h3>No savings goals yet</h3>
          <p>Create your first goal using the form above.</p>
        </div>
      ) : (
        goals.map((goal) => {
          const percentage = (goal.saved / goal.target) * 100;
          const remaining = goal.target - goal.saved;

          return (
            <div className="panel goal-card" key={goal.id}>
              <div className="goal-card-heading">
                <div>
                  <span className="goal-icon">◎</span>
                  <h3>{goal.title}</h3>
                </div>

                <button
                  type="button"
                  className="delete-button"
                  onClick={() => deleteGoal(goal.id)}
                >
                  Delete
                </button>
              </div>

              <p className="budget-muted">Savings target</p>
              <h2>{money(goal.target)}</h2>

              <div className="budget-progress-label">
                <span>Saved: {money(goal.saved)}</span>
                <strong>{Math.round(percentage)}%</strong>
              </div>

              <div className="progress-track budget-progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${Math.min(percentage, 100)}%` }}
                />
              </div>

              <p className="budget-remaining">
                {remaining === 0
                  ? "🎉 Goal completed!"
                  : `${money(remaining)} left to reach your goal`}
              </p>

              {remaining > 0 && (
                <form
                  className="add-savings-form"
                  onSubmit={(event) => {
                    event.preventDefault();

                    const form = event.currentTarget;
                    const input = form.elements.savingsAmount;

                    addSavings(goal.id, input.value);
                    input.value = "";
                  }}
                >
                  <input
                    type="number"
                    name="savingsAmount"
                    min="0.01"
                    step="0.01"
                    placeholder="Amount to save"
                    aria-label={`Amount to save for ${goal.title}`}
                    required
                  />

                  <button className="primary-button" type="submit">
                    Add Savings
                  </button>
                </form>
              )}
            </div>
          );
        })
      )}
    </div>
  </section>
)}


{activePage === "Settings" && (
  <section className="settings-page">
    <div className="transactions-title">
      <div>
        <p className="eyebrow">PERSONALIZE YOUR EXPERIENCE</p>
        <h1>Settings</h1>
        <p className="welcome-description">
          Manage your profile and dashboard preferences.
        </p>
      </div>
    </div>

    <form className="panel settings-form" onSubmit={updateSettings}>
      <h3>Profile Settings</h3>

      <label>
        Profile Name
        <input
          type="text"
          value={settings.profileName}
          onChange={(event) =>
            setSettings({
              ...settings,
              profileName: event.target.value,
            })
          }
          required
        />
      </label>

      <label>
        Currency
        <select
          value={settings.currency}
          onChange={(event) =>
            setSettings({
              ...settings,
              currency: event.target.value,
            })
          }
        >
          <option value="LKR">Sri Lankan Rupee (LKR)</option>
          <option value="USD">US Dollar (USD)</option>
          <option value="EUR">Euro (EUR)</option>
          <option value="GBP">British Pound (GBP)</option>
        </select>
      </label>

      <label>
        Dashboard Theme
        <select
          value={settings.theme}
          onChange={(event) =>
            setSettings({
              ...settings,
              theme: event.target.value,
            })
          }
        >
          <option value="Light">Light</option>
          <option value="Dark">Dark</option>
        </select>
      </label>

      <button className="primary-button" type="submit">
        Save Settings
      </button>
    </form>
  </section>
)}


{activePage !== "Dashboard" &&
  activePage !== "Transactions" &&
  activePage !== "Budgets" &&
  activePage !== "Reports" &&
  activePage !== "Savings Goals" && (
    

    
    <section className="panel page-placeholder">
      <div className="placeholder-icon">✦</div>
      <h2>{activePage}</h2>
      <p>This section will be developed in the next steps.</p>
      <button
        className="primary-button"
        onClick={() => setActivePage("Dashboard")}
      >
        Back to Dashboard
      </button>
    </section>
  )}
      </main>
    </div>
  );
}

export default App;

