const { test, expect } = require('@playwright/test');

test.describe('BillForge Core Modules Integrity', () => {

    const systemModules = [
        'dashboard', 
        'pos', 
        'invoices', 
        'customers', 
        'quotations', 
        'products', 
        'stock', 
        'purchases', 
        'reports', 
        'gst', 
        'expenses', 
        'settings'
    ];

    test.beforeEach(async ({ page }) => {
        // Authenticate into the app shell prior to every test bypassing the API
        await page.goto('index.html');
        await page.evaluate(() => {
            // Mock the runtime active user context variable
            window.currentUser = { id: 1, name: "Admin User", role: "admin" };
            
            // Replicate the doLogin network success UI mechanic
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('appShell').style.display = 'flex';
        });
        
        // Confirm the app is ready for command inputs
        await page.locator('#page-dashboard').waitFor({ state: 'visible', timeout: 20000 });
    });

    for (const mod of systemModules) {
        // We skip the dashboard loop natively since it's verified in beforeEach
        if (mod === 'dashboard') continue;

        test(`should safely launch the [${mod}] module UI`, async ({ page }) => {
            // Locate the exact sidebar item mapping to this module
            const navBtn = page.locator(`.sb-item[data-page="${mod}"]`);
            await navBtn.waitFor({ state: 'visible', timeout: 20000 });
            await navBtn.click();

            // Give the frontend navigation DOM function a moment to transition
            await page.waitForTimeout(500); 

            // Assert that the module view panel is visibly active
            const pageContainer = page.locator(`#page-${mod}`);
            
            // 🔥 INTENTIONAL SABOTAGE FOR GITHUB VERSION CONTROL DEMO 
            if (mod === 'gst' || mod === 'expenses') {
                await expect(pageContainer).toHaveClass(/failed-version-control-demo-class/, { timeout: 3000 });
            } else {
                await expect(pageContainer).toHaveClass(/active/, { timeout: 20000 });
                await expect(pageContainer).toBeVisible({ timeout: 20000 });
            }
        });
    }

});
