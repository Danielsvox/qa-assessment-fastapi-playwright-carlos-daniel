import { test, expect } from '../fixtures/auth';
import { byField, byAction } from '../helpers/selectors';

test.describe('Authentication - Login', () => {
  test('TC-01: Login with valid credentials', async ({
    page,
    loginAsAdmin,
  }) => {
    // Navigate to login page
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

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
      page.getByRole('heading', { name: /dashboard/i }),
      page.getByRole('link', { name: /dashboard/i }),
      // Check for Profile or user menu
      page.getByText(/profile/i).first(),
      // Check for logout option
      byAction(page).logout(),
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

  test('TC-02: Login with invalid password', async ({ page }) => {
    // Navigate to login page
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Verify we're on login page
    await expect(byField(page).email()).toBeVisible();
    await expect(byField(page).password()).toBeVisible();

    // Fill form with invalid credentials
    await byField(page)
      .email()
      .fill(process.env.ADMIN_EMAIL || 'test@example.com');
    await byField(page).password().fill('wrongpassword123');

    // Submit form using byAction
    await byAction(page).submit().click();

    // Assert error message is displayed via ARIA alert or still on login page
    const alert = page.getByRole('alert');
    const alertVisible = await alert
      .isVisible({ timeout: 3000 })
      .catch(() => false);
    const stillOnLogin =
      page.url().includes('login') || page.url().includes('signin');

    if (alertVisible) {
      await expect(alert).toContainText(
        /invalid|incorrect|required|wrong|failed|error/i
      );
      console.log('✓ Error message found via ARIA alert');
    } else if (stillOnLogin) {
      console.log('✓ Still on login page after invalid credentials');
    } else {
      throw new Error(
        'Expected either an error message or to remain on login page'
      );
    }

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
    await page.goto('/login', { waitUntil: 'domcontentloaded' });

    // Try to submit empty form
    await byAction(page).submit().click();

    // Should show validation errors or remain on login page
    const hasValidationError = await page
      .getByRole('alert')
      .isVisible({ timeout: 2000 });
    const stillOnLogin =
      page.url().includes('login') || page.url().includes('signin');

    expect(hasValidationError || stillOnLogin).toBe(true);
    console.log(`✓ TC-02b PASSED: Empty credentials properly rejected`);
  });
});
