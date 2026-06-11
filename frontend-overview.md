# WSO2 Notifier Dashboard (Frontend)

## 📌 Project Summary
The WSO2 Notifier Dashboard is a React-based web application providing a user interface for the WSO2 Notifier V2 backend. It allows administrators to manage notification rules, view and resolve incidents, configure notification targets, and analyze system metrics.

## 🛠 Technology Stack
- **Framework**: React 19, React Router DOM
- **Build Tool**: Vite
- **Styling**: Vanilla CSS with utility helpers (`clsx`, `tailwind-merge`)
- **Data Visualization**: Recharts
- **Icons**: Lucide React
- **HTTP Client**: Axios

## 📁 Architecture & Key Components
1. **Pages (`src/pages`)**:
   - `Dashboard.jsx`: High-level overview of system status.
   - `IncidentsPage.jsx`: Interface for viewing, filtering, and resolving security/operational incidents.
   - `SettingsPage.jsx`: Configuration of notification targets (Email, Teams, etc.).
   - `CustomRulesPage.jsx`: Interface for creating and editing custom detection rules.
   - `AnalyticsPage.jsx` & `RuleAnalyticsPage.jsx`: Visualizations of system data using Recharts.
   - `AuditLogPage.jsx`: Table showing who made what changes to the rules.
   - `UserManagementPage.jsx`: Admin-only page to manage users.
   - Auth pages (`LoginPage.jsx`, `RegisterPage.jsx`).
2. **Components (`src/components`)**:
   - Reusable UI elements such as `Sidebar.jsx`, `UseCaseCard.jsx`, and various Modals (`CustomRuleModal.jsx`, `EditModal.jsx`, `TargetModal.jsx`).
3. **API Layer (`src/api`)**:
   - Modularized Axios wrappers (`axiosInstance.js`, `authApi.js`, `incidentsApi.js`, `rulesApi.js`, etc.) handling all HTTP communication with the backend.
4. **Context (`src/context`)**:
   - `AuthContext.jsx` manages user authentication state and JWT tokens.

## ⚙️ How It Works
- The application uses `react-router-dom` to handle navigation between public (login/register) and protected routes.
- The `AuthContext` ensures that users are authenticated before accessing protected pages. Specific routes are additionally guarded by role checks (e.g., ADMIN role for user management).
- API calls to the backend are authenticated using JWT tokens sent in the `Authorization` header via the configured `axiosInstance.js`.
- The UI features real-time visualizations using `recharts` for rule analytics and incident tracking.
