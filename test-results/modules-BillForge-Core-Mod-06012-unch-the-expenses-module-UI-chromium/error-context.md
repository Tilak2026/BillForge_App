# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modules.spec.js >> BillForge Core Modules Integrity >> should safely launch the [expenses] module UI
- Location: tests\modules.spec.js:40:9

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#page-expenses')
Expected pattern: /failed-version-control-demo-class/
Received string:  "page content active"
Timeout: 3000ms

Call log:
  - Expect "toHaveClass" with timeout 3000ms
  - waiting for locator('#page-expenses')
    6 × locator resolved to <div id="page-expenses" class="page content active">…</div>
      - unexpected value "page content active"

```

# Page snapshot

```yaml
- generic [ref=e2]:
  - complementary [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e5]: 🧾
      - generic [ref=e6]:
        - generic [ref=e7]: BillForge
        - generic [ref=e8]: Professional Edition
    - textbox "Quick search." [ref=e10]
    - navigation [ref=e11]:
      - generic [ref=e12]: Overview
      - generic [ref=e13] [cursor=pointer]:
        - generic [ref=e14]: 📊
        - text: Dashboard
      - generic [ref=e15]: Sales
      - generic [ref=e16] [cursor=pointer]:
        - generic [ref=e17]: 🛒
        - text: POS Billing
      - generic [ref=e18] [cursor=pointer]:
        - generic [ref=e19]: 🧾
        - text: Invoices
        - generic [ref=e20]: "0"
      - generic [ref=e21] [cursor=pointer]:
        - generic [ref=e22]: 👥
        - text: Customers
      - generic [ref=e23] [cursor=pointer]:
        - generic [ref=e24]: 📋
        - text: Quotations
      - generic [ref=e25]: Inventory
      - generic [ref=e26] [cursor=pointer]:
        - generic [ref=e27]: 📦
        - text: Products
      - generic [ref=e28] [cursor=pointer]:
        - generic [ref=e29]: 🏭
        - text: Stock
        - generic [ref=e30]: "0"
      - generic [ref=e31] [cursor=pointer]:
        - generic [ref=e32]: 🚛
        - text: Purchases
      - generic [ref=e33]: Finance
      - generic [ref=e34] [cursor=pointer]:
        - generic [ref=e35]: 📈
        - text: Reports
      - generic [ref=e36] [cursor=pointer]:
        - generic [ref=e37]: 🏛️
        - text: GST Returns
        - generic [ref=e38]: Due
      - generic [ref=e39] [cursor=pointer]:
        - generic [ref=e40]: 💳
        - text: Expenses
      - generic [ref=e42] [cursor=pointer]:
        - generic [ref=e43]: ⚙️
        - text: Settings
      - generic [ref=e44] [cursor=pointer]:
        - generic [ref=e45]: ↩️
        - text: Sign Out
    - generic [ref=e46]:
      - generic [ref=e47] [cursor=pointer]:
        - generic [ref=e48]: AD
        - generic [ref=e49]:
          - generic [ref=e50]: Admin User
          - generic [ref=e51]: Super Admin
        - generic [ref=e52]: ⟄
      - generic [ref=e53]:
        - generic [ref=e54]: Professional Plan
        - generic [ref=e55]: Unlimited invoices · GST filing · Priority support
  - generic [ref=e56]:
    - generic [ref=e57]:
      - generic [ref=e58]: BillForge
      - generic [ref=e59]: ">"
      - generic [ref=e60]: Expenses
    - generic [ref=e61]:
      - button "🔔" [ref=e63] [cursor=pointer]: 🔔
      - button "📥 Export" [ref=e65] [cursor=pointer]
      - button "+ Add Expense" [ref=e66] [cursor=pointer]
  - main [ref=e67]:
    - generic [ref=e68]:
      - generic [ref=e69]:
        - generic [ref=e70]:
          - generic [ref=e71]: Expenses
          - generic [ref=e72]: Track business expenses and operating costs
        - button "+ Add Expense" [ref=e73] [cursor=pointer]
      - generic [ref=e74]:
        - generic [ref=e75]:
          - generic [ref=e76]: 💳
          - generic [ref=e77]: This Month
          - generic [ref=e78]: ₹0
          - generic [ref=e79]: ↑ 4.2% vs last
        - generic [ref=e80]:
          - generic [ref=e81]: 🏭
          - generic [ref=e82]: Rent & Utilities
          - generic [ref=e83]: ₹0
          - generic [ref=e84]: Fixed cost
        - generic [ref=e85]:
          - generic [ref=e86]: 👷
          - generic [ref=e87]: Staff Salaries
          - generic [ref=e88]: ₹0
          - generic [ref=e89]: 3 employees
        - generic [ref=e90]:
          - generic [ref=e91]: 🚛
          - generic [ref=e92]: Logistics
          - generic [ref=e93]: ₹0
          - generic [ref=e94]: ↓ 8% vs last
      - table [ref=e96]:
        - rowgroup [ref=e97]:
          - row "Date Category Description Vendor Amount GST Paid By Receipt" [ref=e98]:
            - columnheader "Date" [ref=e99]
            - columnheader "Category" [ref=e100]
            - columnheader "Description" [ref=e101]
            - columnheader "Vendor" [ref=e102]
            - columnheader "Amount" [ref=e103]
            - columnheader "GST" [ref=e104]
            - columnheader "Paid By" [ref=e105]
            - columnheader "Receipt" [ref=e106]
        - rowgroup
```

# Test source

```ts
  1  | const { test, expect } = require('@playwright/test');
  2  | 
  3  | test.describe('BillForge Core Modules Integrity', () => {
  4  | 
  5  |     const systemModules = [
  6  |         'dashboard', 
  7  |         'pos', 
  8  |         'invoices', 
  9  |         'customers', 
  10 |         'quotations', 
  11 |         'products', 
  12 |         'stock', 
  13 |         'purchases', 
  14 |         'reports', 
  15 |         'gst', 
  16 |         'expenses', 
  17 |         'settings'
  18 |     ];
  19 | 
  20 |     test.beforeEach(async ({ page }) => {
  21 |         // Authenticate into the app shell prior to every test bypassing the API
  22 |         await page.goto('index.html');
  23 |         await page.evaluate(() => {
  24 |             // Mock the runtime active user context variable
  25 |             window.currentUser = { id: 1, name: "Admin User", role: "admin" };
  26 |             
  27 |             // Replicate the doLogin network success UI mechanic
  28 |             document.getElementById('loginScreen').style.display = 'none';
  29 |             document.getElementById('appShell').style.display = 'flex';
  30 |         });
  31 |         
  32 |         // Confirm the app is ready for command inputs
  33 |         await page.locator('#page-dashboard').waitFor({ state: 'visible', timeout: 20000 });
  34 |     });
  35 | 
  36 |     for (const mod of systemModules) {
  37 |         // We skip the dashboard loop natively since it's verified in beforeEach
  38 |         if (mod === 'dashboard') continue;
  39 | 
  40 |         test(`should safely launch the [${mod}] module UI`, async ({ page }) => {
  41 |             // Locate the exact sidebar item mapping to this module
  42 |             const navBtn = page.locator(`.sb-item[data-page="${mod}"]`);
  43 |             await navBtn.waitFor({ state: 'visible', timeout: 20000 });
  44 |             await navBtn.click();
  45 | 
  46 |             // Give the frontend navigation DOM function a moment to transition
  47 |             await page.waitForTimeout(500); 
  48 | 
  49 |             // Assert that the module view panel is visibly active
  50 |             const pageContainer = page.locator(`#page-${mod}`);
  51 |             
  52 |             // 🔥 INTENTIONAL SABOTAGE FOR GITHUB VERSION CONTROL DEMO 
  53 |             if (mod === 'gst' || mod === 'expenses') {
> 54 |                 await expect(pageContainer).toHaveClass(/failed-version-control-demo-class/, { timeout: 3000 });
     |                                             ^ Error: expect(locator).toHaveClass(expected) failed
  55 |             } else {
  56 |                 await expect(pageContainer).toHaveClass(/active/, { timeout: 20000 });
  57 |                 await expect(pageContainer).toBeVisible({ timeout: 20000 });
  58 |             }
  59 |         });
  60 |     }
  61 | 
  62 | });
  63 | 
```