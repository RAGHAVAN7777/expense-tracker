# Monthly Expense Tracker - Premium Suite

A state-of-the-art, glassmorphic personal finance management application designed for precision tracking, intelligent analysis, and automated financial advice. This project combines a high-end UI with complex data logic to provide a professional-grade budgeting experience.

---

## Key Features

### Premium User Interface
- **Ultra-Glassmorphism**: A sleek, modern design with real-time backdrop filtering, vibrant gradients, and ambient glows.
- **Dynamic Animations**: Includes "Money Vaporize" effects on spending limits, sliding page transitions, and bouncing interaction cues.
- **Dual Theme Engine**: Seamlessly switch between a deep Navy Dark mode and a Frosted Lavender Light mode.
- **Responsive Layout**: Optimized for various screen sizes with a professional sidebar navigation.

### AI Intelligence and Pacing
- **AI Smart Balancer**: Tracks your "Financial Velocity" by comparing your spending percentage against the time elapsed in the current month.
- **Goal-Based Planner**: Set monthly savings targets. The AI calculates required monthly savings and provides a "Zen Zone" vs. "Economic Zone" status.
- **Investment Insights**: Automatic generation of financial strategies based on your current budget and goals.

### Advanced Calendar and Month Management
- **Simulated Timeline**: A manual advances-day calendar allowing for "what-if" testing and historical data entry.
- **Automated Month-End**: Handles the transition between months, calculates carry-over savings, and clears current expenses while preserving long-term history.
- **PDF Generation**: One-click professional expense statements exportable to PDF.

### Smart Alert System
- **Voice Notifications**: Interactive text-to-speech alerts for critical spending milestones (50%, 80%, 90%).
- **Visual Flash Alerts**: Screen-edge flashing for upcoming reminders.
- **Smart Reminders**: A full task-management engine within the dashboard to track bills and financial deadlines.

---

## Project Architecture

| File | Responsibility |
| :--- | :--- |
| `index.html` | Premium landing page and features overview. |
| `home.html` | Secure entry point with Password Visibility Toggle and verification. |
| `dashboard.html` | Core UI structure housing the Dashboard, Analytics, and AI modules. |
| `dashboard.js` | The "Brain"—1,200+ lines of logic for data persistence, AI calculations, and UX effects. |
| `dashboard.css` | The design system, including layout, theme variables, and complex CSS animations. |

---

##  Technical Implementation

### Data Persistence
The app uses `localStorage` for all data, ensuring your financial records remain local to your browser.
- **Session Safety**: The "Reset App" logic is custom-engineered to clear global data while keeping the user account logged in.
- **Historical Integrity**: Monthly history is archived in a structured JSON object to power the 12-month analytics trend.

### Visualization Engine
- **Canvas-Powered Analytics**: High-performance rendering of spending categories and 12-month trends without external library bloat.
- **Liquid Progress Bars**: Smoothly transitioning progress bars with staggered "Gate" opening animations.

### User Security and UX
- **Secure Login**: Includes a multi-step verification process with a built-in "eye" toggle for sensitive key entry.
- **Interactive Feedback**: Audio-visual cues for every major action, including a specialized "Money Vaporize" animation when spending limits are breached.

---

## Developed By
**RAGHAVAN S**

*Mini Project | Web Programming | 2026*
