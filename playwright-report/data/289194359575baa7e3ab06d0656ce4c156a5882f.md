# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: modules.spec.js >> BillForge Core Modules Integrity >> should safely launch the [gst] module UI
- Location: tests\modules.spec.js:40:9

# Error details

```
Error: expect(locator).toHaveClass(expected) failed

Locator: locator('#page-gst')
Expected pattern: /failed-version-control-demo-class/
Received string:  "page content active"
Timeout: 3000ms

Call log:
  - Expect "toHaveClass" with timeout 3000ms
  - waiting for locator('#page-gst')
    7 × locator resolved to <div id="page-gst" class="page content active">…</div>
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
      - generic [ref=e60]: GST Returns
    - generic [ref=e61]:
      - button "🔔" [ref=e63] [cursor=pointer]: 🔔
      - button "📥 Export" [ref=e65] [cursor=pointer]
      - button "+ New Invoice" [ref=e66] [cursor=pointer]
  - main [ref=e67]:
    - generic [ref=e68]:
      - generic [ref=e69]:
        - generic [ref=e70]:
          - generic [ref=e71]: GST Returns
          - generic [ref=e72]: GSTR-1 & GSTR-3B filing — live data from your invoices
        - generic [ref=e73]:
          - combobox [ref=e74]:
            - option "Current Month" [selected]
            - option "April 2026"
            - option "March 2026"
            - option "February 2026"
            - option "January 2026"
            - option "December 2025"
            - option "November 2025"
            - option "October 2025"
            - option "September 2025"
            - option "August 2025"
            - option "July 2025"
            - option "June 2025"
            - option "May 2025"
          - button "📥 Export GSTR" [ref=e75] [cursor=pointer]
      - generic [ref=e77]:
        - text: 🏛
        - generic [ref=e78]:
          - generic [ref=e79]: GSTR-1 due in 17 days
          - generic [ref=e80]: "For the period Apr 2026. Due: 11 May 2026. Est. liability: ₹0.00"
      - generic [ref=e81]:
        - generic [ref=e82]:
          - generic [ref=e83]: GSTR-1 Status
          - generic [ref=e84]: Pending
          - generic [ref=e85]: "Due: 11 May 2026"
          - button "File GSTR-1" [ref=e86] [cursor=pointer]
        - generic [ref=e87]:
          - generic [ref=e88]: GSTR-3B Status
          - generic [ref=e89]: Pending
          - generic [ref=e90]: "Due: 20th of next month"
          - button "File GSTR-3B" [ref=e91] [cursor=pointer]
        - generic [ref=e92]:
          - generic [ref=e93]: ITC Available
          - generic [ref=e94]: ₹0.00
          - generic [ref=e95]: Input Tax Credit (Est.)
      - generic [ref=e96]:
        - generic [ref=e98]: GST Liability Breakup — Mar 2026
        - table [ref=e99]:
          - rowgroup [ref=e100]:
            - row "GST Rate Taxable Amount CGST SGST Total GST Invoices" [ref=e101]:
              - columnheader "GST Rate" [ref=e102]
              - columnheader "Taxable Amount" [ref=e103]
              - columnheader "CGST" [ref=e104]
              - columnheader "SGST" [ref=e105]
              - columnheader "Total GST" [ref=e106]
              - columnheader "Invoices" [ref=e107]
          - rowgroup [ref=e108]:
            - row "No paid invoices for Mar 2026" [ref=e109]:
              - cell "No paid invoices for Mar 2026" [ref=e110]
          - rowgroup [ref=e111]:
            - row "TOTAL ₹0.00 ₹0.00 ₹0.00 ₹0.00 0" [ref=e112]:
              - cell "TOTAL" [ref=e113]
              - cell "₹0.00" [ref=e114]
              - cell "₹0.00" [ref=e115]
              - cell "₹0.00" [ref=e116]
              - cell "₹0.00" [ref=e117]
              - cell "0" [ref=e118]
      - generic [ref=e119]:
        - generic [ref=e120]:
          - generic [ref=e121]: B2B / B2C Invoice Ledger (GSTR-1 Data)
          - generic [ref=e122]: 0 invoices
        - table [ref=e123]:
          - rowgroup [ref=e124]:
            - row "Invoice No. Customer Date Taxable CGST SGST Total GST Invoice Total Type" [ref=e125]:
              - columnheader "Invoice No." [ref=e126]
              - columnheader "Customer" [ref=e127]
              - columnheader "Date" [ref=e128]
              - columnheader "Taxable" [ref=e129]
              - columnheader "CGST" [ref=e130]
              - columnheader "SGST" [ref=e131]
              - columnheader "Total GST" [ref=e132]
              - columnheader "Invoice Total" [ref=e133]
              - columnheader "Type" [ref=e134]
          - rowgroup [ref=e135]:
            - row "No paid invoices for Mar 2026" [ref=e136]:
              - cell "No paid invoices for Mar 2026" [ref=e137]
      - generic [ref=e138]:
        - generic [ref=e139]:
          - generic [ref=e140]: Filing History
          - button "+ Record Filing" [ref=e141] [cursor=pointer]
        - table [ref=e142]:
          - rowgroup [ref=e143]:
            - row "Period Return Type Taxable Amount Tax Payable ITC Claimed Net Payable Filed On Status Action" [ref=e144]:
              - columnheader "Period" [ref=e145]
              - columnheader "Return Type" [ref=e146]
              - columnheader "Taxable Amount" [ref=e147]
              - columnheader "Tax Payable" [ref=e148]
              - columnheader "ITC Claimed" [ref=e149]
              - columnheader "Net Payable" [ref=e150]
              - columnheader "Filed On" [ref=e151]
              - columnheader "Status" [ref=e152]
              - columnheader "Action" [ref=e153]
          - rowgroup [ref=e154]:
            - row "Feb 2026 GSTR-1 ₹2,94,200.00 ₹36,800.00 ₹11,200.00 ₹25,600.00 2026-03-11 Filed Submitted" [ref=e155]:
              - cell "Feb 2026" [ref=e156]
              - cell "GSTR-1" [ref=e157]
              - cell "₹2,94,200.00" [ref=e158]
              - cell "₹36,800.00" [ref=e159]
              - cell "₹11,200.00" [ref=e160]
              - cell "₹25,600.00" [ref=e161]
              - cell "2026-03-11" [ref=e162]
              - cell "Filed" [ref=e163]:
                - generic [ref=e164]: Filed
              - cell "Submitted" [ref=e165]
            - row "Feb 2026 GSTR-3B ₹2,94,200.00 ₹36,800.00 ₹11,200.00 ₹25,600.00 2026-03-18 Filed Submitted" [ref=e166]:
              - cell "Feb 2026" [ref=e167]
              - cell "GSTR-3B" [ref=e168]
              - cell "₹2,94,200.00" [ref=e169]
              - cell "₹36,800.00" [ref=e170]
              - cell "₹11,200.00" [ref=e171]
              - cell "₹25,600.00" [ref=e172]
              - cell "2026-03-18" [ref=e173]
              - cell "Filed" [ref=e174]:
                - generic [ref=e175]: Filed
              - cell "Submitted" [ref=e176]
            - row "Jan 2026 GSTR-1 ₹2,68,400.00 ₹32,400.00 ₹9,800.00 ₹22,600.00 2026-02-11 Filed Submitted" [ref=e177]:
              - cell "Jan 2026" [ref=e178]
              - cell "GSTR-1" [ref=e179]
              - cell "₹2,68,400.00" [ref=e180]
              - cell "₹32,400.00" [ref=e181]
              - cell "₹9,800.00" [ref=e182]
              - cell "₹22,600.00" [ref=e183]
              - cell "2026-02-11" [ref=e184]
              - cell "Filed" [ref=e185]:
                - generic [ref=e186]: Filed
              - cell "Submitted" [ref=e187]
            - row "Jan 2026 GSTR-3B ₹2,68,400.00 ₹32,400.00 ₹9,800.00 ₹22,600.00 2026-02-20 Filed Submitted" [ref=e188]:
              - cell "Jan 2026" [ref=e189]
              - cell "GSTR-3B" [ref=e190]
              - cell "₹2,68,400.00" [ref=e191]
              - cell "₹32,400.00" [ref=e192]
              - cell "₹9,800.00" [ref=e193]
              - cell "₹22,600.00" [ref=e194]
              - cell "2026-02-20" [ref=e195]
              - cell "Filed" [ref=e196]:
                - generic [ref=e197]: Filed
              - cell "Submitted" [ref=e198]
      - generic [ref=e199]:
        - generic [ref=e200]:
          - generic [ref=e201]: GST Return Payments
          - button "+ Record Payment" [ref=e202] [cursor=pointer]
        - table [ref=e203]:
          - rowgroup [ref=e204]:
            - row "Period Return Type Amount Due Amount Paid Paid To Payment Date Payment Method Reference Status Action" [ref=e205]:
              - columnheader "Period" [ref=e206]
              - columnheader "Return Type" [ref=e207]
              - columnheader "Amount Due" [ref=e208]
              - columnheader "Amount Paid" [ref=e209]
              - columnheader "Paid To" [ref=e210]
              - columnheader "Payment Date" [ref=e211]
              - columnheader "Payment Method" [ref=e212]
              - columnheader "Reference" [ref=e213]
              - columnheader "Status" [ref=e214]
              - columnheader "Action" [ref=e215]
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