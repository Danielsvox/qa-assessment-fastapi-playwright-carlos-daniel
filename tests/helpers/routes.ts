/**
 * Canonical paths used by the frontend.
 * These routes will be auto-discovered during test execution if they differ from defaults.
 */
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  dashboard: '/dashboard',
};

/**
 * Discovers actual routes by navigating the application and clicking visible links.
 * Updates ROUTES object with discovered paths and logs the route map.
 */
export async function discoverRoutes(page: any) {
  const discoveredRoutes = { ...ROUTES };

  try {
    // Navigate to home page
    await page.goto('/');

    // Try to find login link
    const loginSelectors = [
      'text=Sign in',
      'text=Log in',
      'text=Login',
      'a[href*="login"]',
      'button:has-text("Sign in")',
      'button:has-text("Log in")',
    ];

    for (const selector of loginSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          await page.waitForLoadState('networkidle');
          discoveredRoutes.login = new URL(page.url()).pathname;
          console.log(`✓ Discovered login route: ${discoveredRoutes.login}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    // Navigate back to home and try to find signup link
    await page.goto('/');

    const signupSelectors = [
      'text=Sign up',
      'text=Create account',
      'text=Register',
      'a[href*="signup"]',
      'a[href*="register"]',
      'button:has-text("Sign up")',
      'button:has-text("Create account")',
    ];

    for (const selector of signupSelectors) {
      try {
        const element = await page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          await page.waitForLoadState('networkidle');
          discoveredRoutes.signup = new URL(page.url()).pathname;
          console.log(`✓ Discovered signup route: ${discoveredRoutes.signup}`);
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }
  } catch (error) {
    console.log('Route discovery encountered issues:', error.message);
  }

  // Update the ROUTES object
  Object.assign(ROUTES, discoveredRoutes);

  console.log('Final discovered route map:', ROUTES);
  return discoveredRoutes;
}
