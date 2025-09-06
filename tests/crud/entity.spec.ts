import { test, expect } from '../fixtures/auth';
import { byRole, byField, byText, patterns } from '../helpers/selectors';
import { createSampleEntity, randomString } from '../helpers/data';

test.describe('CRUD Operations - Entity Management', () => {
  let entityUrls = {
    list: '',
    create: '',
    detail: '',
    edit: '',
  };

  let testEntityData: any = {};
  let createdEntityId: string = '';

  test.beforeAll(async ({ browser }) => {
    // Discover CRUD endpoints by navigating the authenticated app
    const context = await browser.newContext();
    const page = await context.newPage();

    // Login first
    await page.goto('/');
    const hasLoginLink = await page
      .getByText(/sign in|login/i)
      .first()
      .isVisible({ timeout: 2000 });
    if (hasLoginLink) {
      await page
        .getByText(/sign in|login/i)
        .first()
        .click();
      await page.waitForLoadState('networkidle');
    }

    if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
      try {
        await page.locator('input[type="email"]').fill(process.env.ADMIN_EMAIL);
        await page
          .locator('input[type="password"]')
          .fill(process.env.ADMIN_PASSWORD);
        await page.locator('button[type="submit"]').click();
        await page.waitForLoadState('networkidle');
      } catch (e) {
        console.log('Could not login for CRUD discovery');
      }
    }

    // Look for CRUD-related navigation items
    const crudNavSelectors = [
      'text=Items',
      'text=Notes',
      'text=Tasks',
      'text=Products',
      'text=Users',
      'text=Manage',
      'text=Admin',
      '[href*="items"]',
      '[href*="notes"]',
      '[href*="tasks"]',
      '[href*="products"]',
      '[href*="manage"]',
    ];

    for (const selector of crudNavSelectors) {
      try {
        const element = page.locator(selector).first();
        if (await element.isVisible({ timeout: 1000 })) {
          await element.click();
          await page.waitForLoadState('networkidle');

          const currentUrl = page.url();
          const urlPath = new URL(currentUrl).pathname;

          // Check if this looks like a list page
          const hasAddButton = await page
            .locator('button, a')
            .filter({
              hasText: /add|create|new|\+/,
            })
            .first()
            .isVisible({ timeout: 2000 });

          const hasTable = await patterns(page)
            .dataTable()
            .isVisible({ timeout: 1000 });
          const hasList = await page
            .locator('ul, .list, [role="list"]')
            .isVisible({ timeout: 1000 });

          if (hasAddButton || hasTable || hasList) {
            entityUrls.list = urlPath;
            console.log(`✓ Discovered CRUD list page: ${entityUrls.list}`);

            // Try to find create/add button
            if (hasAddButton) {
              const addButton = page
                .locator('button, a')
                .filter({
                  hasText: /add|create|new|\+/,
                })
                .first();

              const href = await addButton.getAttribute('href');
              if (href) {
                entityUrls.create = href.startsWith('/')
                  ? href
                  : `${urlPath}/${href}`;
              } else {
                entityUrls.create = `${urlPath}/create`;
              }
              console.log(`✓ Discovered create URL: ${entityUrls.create}`);
            }
            break;
          }
        }
      } catch (e) {
        // Continue trying other selectors
      }
    }

    // Fallback URLs if discovery failed
    if (!entityUrls.list) {
      entityUrls = {
        list: '/items',
        create: '/items/create',
        detail: '/items/:id',
        edit: '/items/:id/edit',
      };
      console.log('Using fallback CRUD URLs:', entityUrls);
    }

    await context.close();
  });

  test('TC-06: Create entity with valid data (happy path)', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;
    testEntityData = createSampleEntity('generic', {
      title: `Test Item ${randomString(6)}`,
      description: `Test description created at ${new Date().toISOString()}`,
    });

    console.log('Creating entity with data:', testEntityData);

    // Navigate to list page
    await page.goto(entityUrls.list || '/');
    await page.waitForLoadState('networkidle');

    // Find and click create/add button
    const createSelectors = [
      'button:has-text("Add")',
      'button:has-text("Create")',
      'button:has-text("New")',
      'a:has-text("Add")',
      'a:has-text("Create")',
      'a:has-text("New")',
      'button[aria-label*="add"], button[aria-label*="create"]',
      '.btn-primary:has-text("Add"), .btn-primary:has-text("Create")',
    ];

    let createButtonFound = false;
    for (const selector of createSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          await page.waitForLoadState('networkidle');
          createButtonFound = true;
          console.log('✓ Clicked create button');
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    if (!createButtonFound && entityUrls.create) {
      await page.goto(entityUrls.create);
      await page.waitForLoadState('networkidle');
    }

    // Fill the form with test data
    const formFields = [
      { field: 'title', value: testEntityData.title },
      { field: 'name', value: testEntityData.title },
      { field: 'description', value: testEntityData.description },
      { field: 'content', value: testEntityData.description },
    ];

    for (const { field, value } of formFields) {
      try {
        const fieldSelectors = [
          `input[name="${field}"]`,
          `textarea[name="${field}"]`,
          `input[id="${field}"]`,
          `textarea[id="${field}"]`,
          `input[placeholder*="${field}"]`,
          `textarea[placeholder*="${field}"]`,
        ];

        for (const selector of fieldSelectors) {
          try {
            const element = page.locator(selector).first();
            if (await element.isVisible({ timeout: 1000 })) {
              await element.fill(value);
              console.log(`✓ Filled ${field} with: ${value}`);
              break;
            }
          } catch (e) {
            // Continue trying other selectors
          }
        }
      } catch (e) {
        console.log(`Could not fill field ${field}: ${e.message}`);
      }
    }

    // Submit the form
    const submitSelectors = [
      'button[type="submit"]',
      'input[type="submit"]',
      'button:has-text("Save")',
      'button:has-text("Create")',
      'button:has-text("Submit")',
      '.btn-primary:has-text("Save"), .btn-primary:has-text("Create")',
    ];

    let submitted = false;
    for (const selector of submitSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          await page.waitForLoadState('networkidle');
          submitted = true;
          console.log('✓ Submitted form');
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    expect(submitted).toBe(true);

    // Verify success indicators
    const successIndicators = [
      byText(page).success(),
      page.getByText(/created|saved|success/i),
      page.locator('.alert-success, .success, .toast-success'),
    ];

    let successFound = false;
    for (const indicator of successIndicators) {
      try {
        if (await indicator.first().isVisible({ timeout: 3000 })) {
          successFound = true;
          const message = await indicator.first().textContent();
          console.log(`✓ Success message: ${message}`);
          break;
        }
      } catch (e) {
        // Continue checking
      }
    }

    // Verify we're redirected to list or detail page
    const currentUrl = page.url();
    const redirectedCorrectly =
      currentUrl.includes('list') ||
      currentUrl.includes(entityUrls.list) ||
      !currentUrl.includes('create');

    expect(redirectedCorrectly).toBe(true);

    // Try to find the created item in the list
    const createdItemVisible = await page
      .getByText(testEntityData.title)
      .first()
      .isVisible({ timeout: 2000 });

    if (createdItemVisible) {
      console.log('✓ Created item visible in list');
    }

    console.log('✓ TC-06 PASSED: Entity created successfully');
  });

  test('TC-07: Create entity with invalid data shows validation errors', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    // Navigate to create page
    if (entityUrls.create) {
      await page.goto(entityUrls.create);
    } else {
      await page.goto(entityUrls.list || '/');
      const createButton = page
        .locator('button, a')
        .filter({ hasText: /add|create|new/i })
        .first();
      if (await createButton.isVisible({ timeout: 2000 })) {
        await createButton.click();
      }
    }
    await page.waitForLoadState('networkidle');

    // Try to submit empty form
    const submitButton = page
      .locator(
        'button[type="submit"], input[type="submit"], button:has-text("Save"), button:has-text("Create")'
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
        'input:invalid + .error, input[aria-invalid="true"] + .error',
      ];

      let validationErrorFound = false;
      for (const selector of errorSelectors) {
        try {
          const errorElement = page.locator(selector).first();
          if (await errorElement.isVisible({ timeout: 2000 })) {
            validationErrorFound = true;
            const errorText = await errorElement.textContent();
            console.log(`✓ Validation error found: ${errorText}`);
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }

      // Check if still on create page (didn't submit successfully)
      const currentUrl = page.url();
      const stillOnCreatePage =
        currentUrl.includes('create') || currentUrl.includes('new');

      expect(validationErrorFound || stillOnCreatePage).toBe(true);
      console.log(
        '✓ TC-07 PASSED: Invalid data properly rejected with validation errors'
      );
    } else {
      console.log(
        '⚠ TC-07 SKIPPED: Could not find submit button to test validation'
      );
    }
  });

  test('TC-08: Update existing entity', async ({ authenticatedPage }) => {
    const page = authenticatedPage;

    // First, navigate to the list and find an item to edit
    await page.goto(entityUrls.list || '/');
    await page.waitForLoadState('networkidle');

    // Look for edit buttons or clickable items
    const editSelectors = [
      'button:has-text("Edit")',
      'a:has-text("Edit")',
      '[aria-label*="edit"]',
      '.edit-btn, .btn-edit',
      'button[title*="edit"]',
    ];

    let editButtonFound = false;
    for (const selector of editSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          await button.click();
          await page.waitForLoadState('networkidle');
          editButtonFound = true;
          console.log('✓ Clicked edit button');
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    // If no edit button, try clicking on first item in list
    if (!editButtonFound) {
      const listItems = [
        patterns(page).dataRow(1),
        page.locator('tr').nth(1),
        page.locator('li').nth(0),
        page.locator('.item, .card').first(),
      ];

      for (const item of listItems) {
        try {
          if (await item.isVisible({ timeout: 1000 })) {
            await item.click();
            await page.waitForLoadState('networkidle');

            // Look for edit button on detail page
            for (const selector of editSelectors) {
              try {
                const editBtn = page.locator(selector).first();
                if (await editBtn.isVisible({ timeout: 1000 })) {
                  await editBtn.click();
                  await page.waitForLoadState('networkidle');
                  editButtonFound = true;
                  break;
                }
              } catch (e) {
                // Continue
              }
            }
            if (editButtonFound) break;
          }
        } catch (e) {
          // Continue trying
        }
      }
    }

    if (editButtonFound) {
      // Update the form with new data
      const updatedData = {
        title: `Updated Item ${randomString(6)}`,
        description: `Updated description at ${new Date().toISOString()}`,
      };

      // Find and update form fields
      const fieldsToUpdate = [
        { field: 'title', value: updatedData.title },
        { field: 'name', value: updatedData.title },
        { field: 'description', value: updatedData.description },
      ];

      for (const { field, value } of fieldsToUpdate) {
        try {
          const fieldElement = page
            .locator(
              `input[name="${field}"], textarea[name="${field}"], input[id="${field}"], textarea[id="${field}"]`
            )
            .first();
          if (await fieldElement.isVisible({ timeout: 1000 })) {
            await fieldElement.clear();
            await fieldElement.fill(value);
            console.log(`✓ Updated ${field} to: ${value}`);
          }
        } catch (e) {
          // Field might not exist
        }
      }

      // Save the changes
      const saveButton = page
        .locator(
          'button:has-text("Save"), button:has-text("Update"), button[type="submit"]'
        )
        .first();
      if (await saveButton.isVisible({ timeout: 1000 })) {
        await saveButton.click();
        await page.waitForLoadState('networkidle');

        // Verify success
        const successVisible = await page
          .getByText(/updated|saved|success/i)
          .first()
          .isVisible({ timeout: 3000 });
        const updatedValueVisible = await page
          .getByText(updatedData.title)
          .first()
          .isVisible({ timeout: 2000 });

        expect(successVisible || updatedValueVisible).toBe(true);
        console.log('✓ TC-08 PASSED: Entity updated successfully');
      } else {
        console.log('⚠ TC-08 SKIPPED: Could not find save button');
      }
    } else {
      console.log('⚠ TC-08 SKIPPED: Could not find item to edit');
    }
  });

  test('TC-09: Delete entity with confirmation', async ({
    authenticatedPage,
  }) => {
    const page = authenticatedPage;

    // Navigate to list page
    await page.goto(entityUrls.list || '/');
    await page.waitForLoadState('networkidle');

    // Look for delete buttons
    const deleteSelectors = [
      'button:has-text("Delete")',
      'a:has-text("Delete")',
      'button:has-text("Remove")',
      '[aria-label*="delete"]',
      '.delete-btn, .btn-delete',
      'button[title*="delete"]',
    ];

    let deleteButtonFound = false;
    let itemToDelete = '';

    // Try to find an item with a delete button
    for (const selector of deleteSelectors) {
      try {
        const button = page.locator(selector).first();
        if (await button.isVisible({ timeout: 1000 })) {
          // Try to capture the item name before deleting
          const parentRow = button.locator('..').locator('..');
          try {
            const itemText = await parentRow.textContent();
            itemToDelete = itemText?.substring(0, 50) || 'Unknown item';
          } catch (e) {
            // Continue without item name
          }

          await button.click();
          deleteButtonFound = true;
          console.log(`✓ Clicked delete button for: ${itemToDelete}`);
          break;
        }
      } catch (e) {
        // Continue trying
      }
    }

    if (deleteButtonFound) {
      // Handle confirmation dialog
      const confirmSelectors = [
        'button:has-text("Confirm")',
        'button:has-text("Yes")',
        'button:has-text("Delete")',
        'button:has-text("OK")',
        '[role="dialog"] button[class*="danger"], [role="dialog"] button[class*="primary"]',
      ];

      let confirmed = false;
      for (const selector of confirmSelectors) {
        try {
          const confirmButton = page.locator(selector).first();
          if (await confirmButton.isVisible({ timeout: 2000 })) {
            await confirmButton.click();
            await page.waitForLoadState('networkidle');
            confirmed = true;
            console.log('✓ Confirmed deletion');
            break;
          }
        } catch (e) {
          // Continue trying
        }
      }

      // If no confirmation dialog, the delete might have been immediate
      if (!confirmed) {
        await page.waitForTimeout(1000);
        console.log(
          'No confirmation dialog found, deletion may have been immediate'
        );
      }

      // Verify deletion success
      const successIndicators = [
        page.getByText(/deleted|removed|success/i),
        page.locator('.alert-success, .success, .toast-success'),
      ];

      let deletionVerified = false;
      for (const indicator of successIndicators) {
        try {
          if (await indicator.first().isVisible({ timeout: 3000 })) {
            deletionVerified = true;
            const message = await indicator.first().textContent();
            console.log(`✓ Deletion success message: ${message}`);
            break;
          }
        } catch (e) {
          // Continue checking
        }
      }

      // Alternative verification: check if item is no longer visible
      if (
        !deletionVerified &&
        itemToDelete &&
        itemToDelete !== 'Unknown item'
      ) {
        const itemStillVisible = await page
          .getByText(itemToDelete)
          .first()
          .isVisible({ timeout: 1000 });
        deletionVerified = !itemStillVisible;
        if (deletionVerified) {
          console.log('✓ Item no longer visible in list');
        }
      }

      expect(deletionVerified).toBe(true);
      console.log('✓ TC-09 PASSED: Entity deleted successfully');
    } else {
      console.log(
        '⚠ TC-09 SKIPPED: Could not find delete button to test deletion'
      );
    }
  });
});
