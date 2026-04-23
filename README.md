# BillForge

BillForge is a comprehensive web-based billing, inventory, and customer management system. It provides an intuitive interface to manage products, customers, invoices, purchases, quotations, and expenses.

## Features

- **Dashboard:** Overview of key metrics, recent invoices, and low stock alerts.
- **Product Management:** Add, edit, and track inventory for various products.
- **Customer Management:** Manage customer details, view their history, and update information.
- **Invoicing:** Generate, view, and print invoices.
- **Purchases:** Track purchases and update inventory stocks accordingly.
- **Quotations:** Create and manage estimates/quotations for customers.
- **Expenses:** Log and track business expenses.
- **Robust API:** A PHP-based backend to handle database operations securely.

## Tech Stack

- **Frontend:** HTML5, CSS3, Vanilla JavaScript
- **Backend:** PHP
- **Database:** MySQL

## Prerequisites

- Local web server such as XAMPP, WAMP, or MAMP.
- PHP version 7.4 or higher recommended.
- MySQL/MariaDB.

## Installation & Setup

1. **Clone the repository:**
   ```bash
   git clone <your-github-repo-url>
   ```

2. **Move to Server Directory:**
   Copy or move the repository folder to your local server's document root (e.g., `htdocs` for XAMPP, `www` for WAMP).

3. **Database Setup:**
   - Open your MySQL management tool (like phpMyAdmin).
   - Create a new database named `billforge` (or configure a name in `api/config.php`).
   - Import the `billforge.sql` file provided in the repository to create the required tables and initial structure.
   - Alternatively, you can use the built-in database initializer by visiting `http://localhost/BillForge_App/api/init_db.php`.

4. **Configuration:**
   - Navigate to `api/config.php`.
   - Update the database connection variables (`DB_HOST`, `DB_USER`, `DB_PASS`, `DB_NAME`) to match your local setup if necessary.

5. **Run the Application:**
   - Open your web browser.
   - Navigate to `http://localhost/BillForge_App/public/index.html` (or the equivalent path depending on your folder name).

## Usage
Once logged in, verify your dashboard. Start by adding some base products and customers before creating your first invoice or purchase record.

## License

This project is licensed under the MIT License.
