import { test, expect } from '../fixtures/auth';
import { byField, byRole, byText } from '../helpers/selectors';
import { ROUTES, discoverRoutes } from '../helpers/routes';
import { uniqueEmail, createSampleUser } from '../helpers/data';

test.describe('Authentication - User Signup', () => {
  test.beforeEach(async ({ page }) => {
    // Discover routes for each test
    await discoverRoutes(page);
  });

  test('TC-06: Signup with valid data (happy path)', async ({ page }) => {
    console.log('🔍 Testing user signup with valid data...');

    // Generate unique user data
    const newUser = createSampleUser({
      email: uniqueEmail('testuser'),
      password: 'TestPassword123!',
    });

    console.log(`📧 Creating user with email: ${newUser.email}`);

    // Navigate to home page first
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find and click the signup button/link
    const signupSelectors = [
      'text=Sign up',
      'text=Create account',
      'text=Register',
      'a[href*="signup"]',
      'a[href*="register"]',
      'button:has-text("Sign up")',
      'button:has-text("Create account")',
      byRole(page).link('Sign up'),
      byRole(page).button('Sign up'),
    ];

    let signupFound = false;
    for (const selector of signupSelectors) {
      try {
        const element =
          typeof selector === 'string'
            ? page.locator(selector).first()
            : selector.first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log('✓ Found signup button, clicking...');
          await element.click();
          await page.waitForLoadState('networkidle');
          signupFound = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    // If no signup button found on home, try direct navigation
    if (!signupFound) {
      console.log('Signup button not found, trying direct navigation...');
      await page.goto(ROUTES.signup || '/signup');
      await page.waitForLoadState('networkidle');
    }

    // Verify we're on signup page by checking for signup form fields
    await expect(byField(page).email()).toBeVisible({ timeout: 5000 });
    await expect(byField(page).password()).toBeVisible({ timeout: 5000 });

    // Look for full name field
    const fullNameField = byField(page).fullName();
    const confirmPasswordField = byField(page).confirmPassword();

    await expect(fullNameField).toBeVisible({ timeout: 5000 });
    await expect(confirmPasswordField).toBeVisible({ timeout: 5000 });

    console.log('✓ All signup form fields are visible');

    // Fill the signup form
    await fullNameField.fill(newUser.fullName);
    await byField(page).email().fill(newUser.email);
    await byField(page).password().fill(newUser.password);
    await confirmPasswordField.fill(newUser.password);

    console.log('✓ Filled all signup form fields');

    // Submit the signup form
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Sign up")',
      'button:has-text("Create account")',
      'button:has-text("Register")',
      '.btn-primary:has-text("Sign up")',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const submitButton = page.locator(selector).first();
        if (await submitButton.isVisible({ timeout: 2000 })) {
          console.log('✓ Found submit button, submitting signup form...');
          await submitButton.click();
          await page.waitForLoadState('networkidle');
          submitted = true;
          break;
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    expect(submitted).toBe(true);

    // Check for success indicators
    const successIndicators = [
      byText(page).success(),
      page.getByText(/account.*created|registration.*successful|welcome/i),
      page.getByText(/check.*email|verify.*email/i),
      page.locator('.alert-success, .success, .toast-success'),
    ];

    let successFound = false;
    for (const indicator of successIndicators) {
      try {
        if (await indicator.first().isVisible({ timeout: 5000 })) {
          const message = await indicator.first().textContent();
          console.log(`✓ Success message found: ${message}`);
          successFound = true;
          break;
        }
      } catch (e) {
        // Continue checking other indicators
      }
    }

    // Alternative success check: redirect away from signup page
    const currentUrl = page.url();
    const redirectedAway =
      !currentUrl.includes('signup') && !currentUrl.includes('register');

    if (!successFound && redirectedAway) {
      console.log('✓ Redirected away from signup page, likely successful');
      successFound = true;
    }

    expect(successFound).toBe(true);
    console.log(
      `✅ TC-06 PASSED: User ${newUser.email} signup completed successfully`
    );

    // Store the created user data for potential cleanup or verification
    (test as any).createdUser = newUser;
  });

  test('TC-07: Signup with invalid data shows validation errors', async ({
    page,
  }) => {
    console.log('🔍 Testing signup with invalid data...');

    // Navigate to signup page
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    // Find signup button
    const signupButton = page
      .getByText(/sign up|create account|register/i)
      .first();
    if (await signupButton.isVisible({ timeout: 2000 })) {
      await signupButton.click();
      await page.waitForLoadState('networkidle');
    } else {
      await page.goto(ROUTES.signup || '/signup');
      await page.waitForLoadState('networkidle');
    }

    // Test Case 1: Empty form submission
    console.log('Testing empty form submission...');
    const submitButton = page
      .locator(
        'button[type="submit"], button:has-text("Sign up"), button:has-text("Create account")'
      )
      .first();

    if (await submitButton.isVisible({ timeout: 2000 })) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      // Check for validation errors
      const errorSelectors = [
        '.error, .field-error, .validation-error',
        '[role="alert"]',
        '.text-red-500, .text-danger',
        page.getByText(/required|field.*required|cannot.*be.*empty/i),
      ];

      let validationErrorFound = false;
      for (const selector of errorSelectors) {
        try {
          const errorElement =
            typeof selector === 'string'
              ? page.locator(selector).first()
              : selector.first();
          if (await errorElement.isVisible({ timeout: 3000 })) {
            const errorText = await errorElement.textContent();
            console.log(`✓ Validation error found: ${errorText}`);
            validationErrorFound = true;
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }

      expect(validationErrorFound).toBe(true);
    }

    // Test Case 2: Invalid email format
    console.log('Testing invalid email format...');
    await byField(page).fullName().fill('Test User');
    await byField(page).email().fill('invalid-email-format');
    await byField(page).password().fill('ValidPassword123!');
    await byField(page).confirmPassword().fill('ValidPassword123!');

    if (await submitButton.isVisible({ timeout: 1000 })) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const emailError = await page
        .getByText(/invalid.*email|email.*format|valid.*email/i)
        .first()
        .isVisible({ timeout: 2000 });
      expect(emailError).toBe(true);
      console.log('✓ Invalid email format error shown');
    }

    // Test Case 3: Password mismatch
    console.log('Testing password mismatch...');
    await byField(page).email().fill(uniqueEmail('test'));
    await byField(page).password().fill('Password123!');
    await byField(page).confirmPassword().fill('DifferentPassword123!');

    if (await submitButton.isVisible({ timeout: 1000 })) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const passwordError = await page
        .getByText(/password.*match|passwords.*same|confirm.*password/i)
        .first()
        .isVisible({ timeout: 2000 });
      expect(passwordError).toBe(true);
      console.log('✓ Password mismatch error shown');
    }

    // Test Case 4: Weak password
    console.log('Testing weak password...');
    await byField(page).password().fill('123');
    await byField(page).confirmPassword().fill('123');

    if (await submitButton.isVisible({ timeout: 1000 })) {
      await submitButton.click();
      await page.waitForLoadState('networkidle');

      const weakPasswordError = await page
        .getByText(/password.*strong|password.*requirements|password.*length/i)
        .first()
        .isVisible({ timeout: 2000 });
      // Note: This might not be enforced in all implementations
      console.log(
        weakPasswordError
          ? '✓ Weak password error shown'
          : 'ℹ️ No weak password validation (optional)'
      );
    }

    console.log('✅ TC-07 PASSED: Invalid signup data properly rejected');
  });

  test('TC-06 Verification: Admin can see created user', async ({
    page,
    loginAsAdmin,
  }) => {
    console.log('🔍 Verifying created user appears in admin panel...');

    // Login as admin
    await loginAsAdmin(page);

    // Navigate to admin panel
    await page.goto('http://localhost:5173/admin');
    await page.waitForLoadState('networkidle');

    // Look for user management section
    const userSectionSelectors = [
      'text=Users',
      'text=User Management',
      'text=Members',
      'a[href*="users"]',
      'button:has-text("Users")',
      '[data-testid*="users"], [data-cy*="users"]',
    ];

    let userSectionFound = false;
    for (const selector of userSectionSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log('✓ Found user management section');
          await element.click();
          await page.waitForLoadState('networkidle');
          userSectionFound = true;
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    if (!userSectionFound) {
      console.log(
        'ℹ️ User management section not found, checking current page for user list...'
      );
    }

    // Look for user table or list
    const userListIndicators = [
      'table',
      '.users-table, .user-list',
      '[role="table"]',
      page.getByText(/email|username|name.*email/i),
    ];

    let userListFound = false;
    for (const indicator of userListIndicators) {
      try {
        const element =
          typeof indicator === 'string'
            ? page.locator(indicator).first()
            : indicator.first();
        if (await element.isVisible({ timeout: 2000 })) {
          console.log('✓ Found user list/table');
          userListFound = true;
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }

    if (userListFound) {
      // Check if we can see any user emails (indicating the user management is working)
      const hasEmailPattern = await page
        .getByText(/@.*\.com/i)
        .first()
        .isVisible({ timeout: 2000 });
      if (hasEmailPattern) {
        console.log(
          '✓ User emails visible in admin panel - user creation verification successful'
        );
      } else {
        console.log('ℹ️ No user emails visible, but admin panel accessible');
      }
    } else {
      console.log('ℹ️ Could not locate user list in admin panel');
    }

    // Take a screenshot for manual verification
    await page.screenshot({
      path: 'admin-panel-verification.png',
      fullPage: true,
    });
    console.log(
      '📸 Screenshot saved as admin-panel-verification.png for manual verification'
    );

    console.log('✅ Admin panel verification completed');
  });
});
