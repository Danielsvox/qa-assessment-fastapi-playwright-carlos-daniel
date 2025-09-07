import { test as base, expect } from '@playwright/test';
import { byField, byAction } from '../helpers/selectors';

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

  // Navigate directly to login page with light wait
  await page.goto('/login', { waitUntil: 'domcontentloaded' });

  // Use the new byField helpers
  const emailField = byField(page).email();
  const pwdField = byField(page).password();

  await emailField.waitFor({ state: 'visible', timeout: 5000 });
  await pwdField.waitFor({ state: 'visible', timeout: 5000 });

  console.log('✓ Login form fields are visible');

  await emailField.fill(email);
  await pwdField.fill(password);

  console.log('✓ Filled login form');

  // Click via role
  const submitButton = byAction(page).submit();
  await submitButton.waitFor({ state: 'visible', timeout: 5000 });
  await submitButton.click();

  console.log('✓ Clicked submit button');

  // Wait a bit for the form to process
  await page.waitForTimeout(2000);

  // Check if we're still on login page
  const currentUrl = page.url();
  console.log(`Current URL after submit: ${currentUrl}`);

  // Verify success with a race, without guessing a dashboard route
  const successByUrl = page
    .waitForURL((url) => !/\/login(\b|\/)/.test(url.pathname), {
      timeout: 10000,
    })
    .catch(() => null);
  const successByUi = byAction(page)
    .logout()
    .waitFor({ state: 'visible', timeout: 10000 })
    .catch(() => null);
  const success = await Promise.race([successByUrl, successByUi]);

  if (!success) {
    // If there is an ARIA alert, surface the message
    const alert = page.getByRole('alert');
    if (await alert.isVisible().catch(() => false)) {
      const msg = (await alert.textContent()) || '';
      throw new Error(`Login failed with error: ${msg.trim()}`);
    }

    // Check if we can find any authenticated indicators
    const authIndicators = [
      page.getByText(email).first(),
      page.getByText(/dashboard/i).first(),
      page.getByText(/profile/i).first(),
      page.locator('[data-testid*="user"], .user-menu, .account-menu').first(),
    ];

    let foundAuth = false;
    for (const indicator of authIndicators) {
      if (await indicator.isVisible({ timeout: 2000 }).catch(() => false)) {
        console.log('✓ Found authenticated UI element');
        foundAuth = true;
        break;
      }
    }

    if (foundAuth) {
      console.log('✓ Login successful - found authenticated UI element');
      return;
    }

    throw new Error(
      'Login appears to have failed - still on login page and no authenticated UI elements found'
    );
  }

  console.log(`✓ Successfully logged in as ${email}`);
}

export { expect };
