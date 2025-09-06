import { test as base, expect } from '@playwright/test';
import { byField, byRole } from '../helpers/selectors';
import { ROUTES, discoverRoutes } from '../helpers/routes';

type AuthFixtures = {
  authenticatedPage: any;
  loginAsAdmin: (page: any) => Promise<void>;
};

/**
 * Authentication fixtures that provide logged-in contexts and login helpers
 */
export const test = base.extend<AuthFixtures>({
  /**
   * Provides a fresh page with admin user logged in
   */
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext();
    const page = await context.newPage();

    // Perform login
    await loginUser(
      page,
      process.env.ADMIN_EMAIL!,
      process.env.ADMIN_PASSWORD!
    );

    await use(page);
    await context.close();
  },

  /**
   * Helper function to log in as admin user
   */
  loginAsAdmin: async ({ page }, use) => {
    const loginFn = async (targetPage: any) => {
      await loginUser(
        targetPage,
        process.env.ADMIN_EMAIL!,
        process.env.ADMIN_PASSWORD!
      );
    };

    await use(loginFn);
  },
});

/**
 * Performs UI login using provided credentials
 */
async function loginUser(
  page: any,
  email: string,
  password: string
): Promise<void> {
  if (!email || !password) {
    throw new Error(
      'ADMIN_EMAIL and ADMIN_PASSWORD must be set in environment variables. ' +
        'Copy .env.sample to .env and fill in the credentials.'
    );
  }

  console.log(`Attempting login for user: ${email}`);

  // Discover routes if needed
  await discoverRoutes(page);

  // Navigate to login page
  let loginUrl = ROUTES.login;

  // First try direct navigation to login route
  try {
    await page.goto(loginUrl);
    await page.waitForLoadState('networkidle');

    // Check if we're actually on a login page
    const hasEmailField = await byField(page)
      .email()
      .isVisible({ timeout: 2000 });
    const hasPasswordField = await byField(page)
      .password()
      .isVisible({ timeout: 2000 });

    if (!hasEmailField || !hasPasswordField) {
      throw new Error('Not on login page, trying alternative approach');
    }
  } catch (error) {
    console.log(
      'Direct login navigation failed, trying to find login link from home page'
    );

    // Go to home page and find login link
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    const loginSelectors = [
      'text=Sign in',
      'text=Log in',
      'text=Login',
      'a[href*="login"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
    ];

    let loginLinkFound = false;
    for (const selector of loginSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          await page.waitForLoadState('networkidle');
          loginLinkFound = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    if (!loginLinkFound) {
      throw new Error('Could not find login page or login link');
    }
  }

  // Fill login form
  try {
    const emailField = byField(page).email();
    const passwordField = byField(page).password();

    await expect(emailField).toBeVisible({ timeout: 5000 });
    await expect(passwordField).toBeVisible({ timeout: 5000 });

    await emailField.fill(email);
    await passwordField.fill(password);

    // Find and click submit button
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
      'button:has-text("Login")',
      'button:has-text("Submit")',
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
      // Try pressing Enter on password field as fallback
      await passwordField.press('Enter');
    }

    await page.waitForLoadState('networkidle');

    // Verify successful login by checking for authenticated UI elements
    const authenticationIndicators = [
      () => page.getByText(email).first(),
      () => page.getByText(/dashboard/i).first(),
      () => page.getByText(/profile/i).first(),
      () => page.getByText(/logout|sign out/i).first(),
      () =>
        page
          .locator('.user-menu, .account-menu, [data-testid*="user"]')
          .first(),
      () => byRole(page).button('Logout'),
      () => byRole(page).button('Sign out'),
      () => byRole(page).link('Dashboard'),
      () => byRole(page).link('Profile'),
    ];

    let loginVerified = false;
    for (const indicator of authenticationIndicators) {
      try {
        const element = indicator();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log('✓ Login verified - authenticated UI element found');
          loginVerified = true;
          break;
        }
      } catch (e) {
        // Continue trying other indicators
      }
    }

    // Additional check: ensure we're not still on login page
    const currentUrl = page.url();
    const isStillOnLogin =
      currentUrl.includes('login') || currentUrl.includes('signin');

    if (!loginVerified && isStillOnLogin) {
      // Check for error messages
      const errorElement = page
        .locator('.error, .alert-error, [role="alert"]')
        .first();
      if (await errorElement.isVisible({ timeout: 1000 })) {
        const errorText = await errorElement.textContent();
        throw new Error(`Login failed with error: ${errorText}`);
      }
      throw new Error(
        'Login appears to have failed - still on login page and no authenticated UI elements found'
      );
    }

    console.log(`✓ Successfully logged in as ${email}`);
  } catch (error) {
    console.error('Login process failed:', error);
    throw error;
  }
}

export { expect };
