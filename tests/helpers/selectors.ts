import { Page, Locator } from '@playwright/test';

/**
 * Stable locator helpers using semantic selectors.
 * Prefer getByRole, getByLabel, getByPlaceholder over brittle CSS selectors.
 */

export const byRole = (page: Page) => ({
  button: (name: string): Locator =>
    page.getByRole('button', { name, exact: false }),

  link: (name: string): Locator =>
    page.getByRole('link', { name, exact: false }),

  heading: (name: string, level?: number): Locator =>
    level
      ? page.getByRole('heading', { name, level })
      : page.getByRole('heading', { name }),

  textbox: (name: string): Locator =>
    page.getByRole('textbox', { name, exact: false }),

  navigation: (): Locator => page.getByRole('navigation'),

  main: (): Locator => page.getByRole('main'),

  dialog: (): Locator => page.getByRole('dialog'),

  alert: (): Locator => page.getByRole('alert'),
});

export const byField = (page: Page) => ({
  email: (): Locator =>
    page
      .getByRole('textbox', { name: /email/i })
      .or(page.getByPlaceholder(/email/i)),

  // Only the actual password input
  password: (): Locator =>
    page
      .locator('input[name="password"]')
      .or(page.getByRole('textbox', { name: /^password$/i })),

  // Confirm password for signup screens
  confirmPassword: (): Locator =>
    page
      .locator('input[name="confirm_password"]')
      .or(page.getByRole('textbox', { name: /^confirm password$/i })),

  fullName: (): Locator =>
    page
      .getByRole('textbox', { name: /full name|name/i })
      .or(page.getByPlaceholder(/full name|name/i)),
});

export const byAction = (page: Page) => ({
  submit: () =>
    page
      .getByRole('button', {
        name: /log in|sign in|submit|continue|sign up|create account|register/i,
      })
      .or(page.locator('button[type="submit"]')),
  logout: () => page.getByRole('button', { name: /logout|sign out/i }),
});

export const byText = (page: Page) => ({
  exact: (text: string): Locator => page.getByText(text, { exact: true }),

  contains: (text: string): Locator => page.getByText(text, { exact: false }),

  error: (): Locator =>
    page
      .locator(
        '.error, .alert-error, [role="alert"], .text-red-500, .text-danger'
      )
      .or(page.getByText(/error|invalid|required|must be/i)),

  success: (): Locator =>
    page
      .locator('.success, .alert-success, .text-green-500, .text-success')
      .or(page.getByText(/success|created|updated|saved/i)),

  loading: (): Locator =>
    page
      .locator('.loading, .spinner, [aria-busy="true"]')
      .or(page.getByText(/loading|please wait/i)),
});

export const byData = (page: Page) => ({
  testId: (testId: string): Locator => page.getByTestId(testId),

  cy: (selector: string): Locator => page.locator(`[data-cy="${selector}"]`),

  qa: (selector: string): Locator => page.locator(`[data-qa="${selector}"]`),
});

/**
 * Common UI patterns and composite selectors
 */
export const patterns = (page: Page) => ({
  loginForm: (): Locator =>
    page
      .locator('form')
      .filter({ has: byField(page).email() })
      .filter({ has: byField(page).password() }),

  signupForm: (): Locator =>
    page
      .locator('form')
      .filter({ has: byField(page).email() })
      .filter({ has: byField(page).password() })
      .filter({ has: byField(page).confirmPassword() }),

  navigationMenu: (): Locator =>
    byRole(page).navigation().or(page.locator('nav, .navbar, .navigation')),

  userMenu: (): Locator =>
    page
      .locator(
        '[aria-label*="user"], [aria-label*="account"], [aria-label*="profile"]'
      )
      .or(page.locator('.user-menu, .account-menu, .profile-menu')),

  modal: (): Locator =>
    byRole(page).dialog().or(page.locator('.modal, .dialog, .overlay')),

  confirmDialog: (): Locator =>
    patterns(page)
      .modal()
      .filter({ hasText: /confirm|delete|remove|are you sure/i }),

  dataTable: (): Locator => page.locator('table, .table, [role="table"]'),

  dataRow: (index?: number): Locator =>
    index !== undefined
      ? page.locator('tr, [role="row"]').nth(index)
      : page.locator('tr, [role="row"]'),

  pagination: (): Locator =>
    page.locator('.pagination, .pager, [aria-label*="pagination"]'),
});
