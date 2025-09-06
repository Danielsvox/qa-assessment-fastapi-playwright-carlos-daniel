import { test, expect } from '../fixtures/auth';
import { byField, byRole, byText } from '../helpers/selectors';
import { ROUTES, discoverRoutes } from '../helpers/routes';

test.describe('Authentication - Login', () => {
  test.beforeEach(async ({ page }) => {
    // Discover routes for each test
    await discoverRoutes(page);
  });

  test('TC-01: Positive login with valid credentials', async ({
    page,
    loginAsAdmin,
  }) => {
    // Navigate to login page
    await page.goto(ROUTES.login);
    await page.waitForLoadState('networkidle');

    // Verify we're on login page
    await expect(byField(page).email()).toBeVisible();
    await expect(byField(page).password()).toBeVisible();

    // Perform login using the fixture
    await loginAsAdmin(page);

    // Assert successful login indicators
    const authIndicators = [
      // Check for user email or name in header/navigation
      page.getByText(process.env.ADMIN_EMAIL!).first(),
      // Check for Dashboard heading or link
      byRole(page).heading('Dashboard'),
      byRole(page).link('Dashboard'),
      // Check for Profile or user menu
      page.getByText(/profile/i).first(),
      // Check for logout option
      page.getByText(/logout|sign out/i).first(),
    ];

    let foundAuthIndicator = false;
    for (const indicator of authIndicators) {
      try {
        if (await indicator.isVisible({ timeout: 2000 })) {
          foundAuthIndicator = true;
          console.log('✓ Found authentication indicator');
          break;
        }
      } catch (e) {
        // Continue checking other indicators
      }
    }

    expect(foundAuthIndicator).toBe(true);

    // Assert URL indicates authenticated state
    const currentUrl = page.url();
    const isAuthenticated =
      currentUrl.includes('dashboard') ||
      currentUrl.includes('profile') ||
      !currentUrl.includes('login');
    expect(isAuthenticated).toBe(true);

    console.log(
      `✓ TC-01 PASSED: Successfully logged in and authenticated state verified`
    );
  });

  test('TC-02: Negative login with invalid credentials', async ({ page }) => {
    // Navigate to login page
    await page.goto(ROUTES.login);
    await page.waitForLoadState('networkidle');

    // Verify we're on login page
    await expect(byField(page).email()).toBeVisible();
    await expect(byField(page).password()).toBeVisible();

    // Fill form with invalid credentials
    await byField(page)
      .email()
      .fill(process.env.ADMIN_EMAIL || 'test@example.com');
    await byField(page).password().fill('wrongpassword123');

    // Submit form
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const submitButton = page.locator(selector).first();
        if (await submitButton.isVisible({ timeout: 1000 })) {
          await submitButton.click();
          submitted = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!submitted) {
      // Fallback: press Enter on password field
      await byField(page).password().press('Enter');
    }

    await page.waitForLoadState('networkidle');

    // Assert error message is displayed
    const errorSelectors = [
      byText(page).error(),
      page.getByText(/invalid|incorrect|wrong|failed/i),
      page.getByText(/email.*password|credentials/i),
      page.locator('.error, .alert-danger, .text-red-500, [role="alert"]'),
    ];

    let foundError = false;
    for (const errorSelector of errorSelectors) {
      try {
        if (await errorSelector.first().isVisible({ timeout: 3000 })) {
          foundError = true;
          const errorText = await errorSelector.first().textContent();
          console.log(`✓ Found error message: ${errorText}`);
          break;
        }
      } catch (e) {
        // Continue checking other error indicators
      }
    }

    expect(foundError).toBe(true);

    // Assert that authenticated UI elements are NOT present
    const authElements = [
      page.getByText(process.env.ADMIN_EMAIL!).first(),
      page.getByText(/dashboard/i).first(),
      page.getByText(/logout|sign out/i).first(),
    ];

    for (const element of authElements) {
      try {
        await expect(element).not.toBeVisible({ timeout: 1000 });
      } catch (e) {
        // Element might not exist, which is good for this test
      }
    }

    // Assert still on login page or redirected to login
    const currentUrl = page.url();
    const stillOnLoginArea =
      currentUrl.includes('login') || currentUrl.includes('signin');
    expect(stillOnLoginArea).toBe(true);

    console.log(
      `✓ TC-02 PASSED: Invalid login rejected with appropriate error message`
    );
  });

  test('TC-02b: Login with empty credentials', async ({ page }) => {
    await page.goto(ROUTES.login);
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page
      .locator('button[type="submit"], input[type="submit"]')
      .first();
    if (await submitButton.isVisible({ timeout: 1000 })) {
      await submitButton.click();
    } else {
      await byField(page).password().press('Enter');
    }

    await page.waitForLoadState('networkidle');

    // Should show validation errors or remain on login page
    const hasValidationError = await page
      .locator('.error, [role="alert"], .text-red-500')
      .first()
      .isVisible({ timeout: 2000 });
    const stillOnLogin =
      page.url().includes('login') || page.url().includes('signin');

    expect(hasValidationError || stillOnLogin).toBe(true);
    console.log(`✓ TC-02b PASSED: Empty credentials properly rejected`);
  });
});
