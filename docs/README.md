# QA Assessment - E2E Test Suite

This repository contains the automated E2E test suite for the **FastAPI Full Stack Template** QA assessment. The tests are built using **Playwright** with **TypeScript** and target the locally running application.

## Purpose

This test suite validates the core functionality of the FastAPI Full Stack Template through UI-driven end-to-end tests, ensuring the backend is exercised indirectly through realistic user interactions.

**Target System:**

- Frontend: http://localhost:5173
- Backend: http://localhost:8000
- API docs: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- Adminer: http://localhost:8080
- MailCatcher: http://localhost:1080

## Prerequisites

Before running the tests, ensure:

1. **FastAPI Full Stack Template is running** via Docker with all services accessible at the URLs above
2. **Admin credentials configured** - you'll need the `FIRST_SUPERUSER` and `FIRST_SUPERUSER_PASSWORD` values used to launch the app
3. **Node.js 18+** installed on your system
4. **Git** for version control

## Setup and Installation

1. **Clone and navigate to the repository:**

   ```bash
   git clone <repository-url>
   cd qa-assessment-fastapi-playwright-carlos-daniel
   ```

2. **Install dependencies:**

   ```bash
   npm install
   npx playwright install
   ```

3. **Configure environment variables:**

   ```bash
   cp .env.sample .env
   ```

   Edit `.env` and fill in your admin credentials:

   ```env
   APP_BASE_URL=http://localhost:5173
   API_BASE_URL=http://localhost:8000
   ADMIN_EMAIL=your-admin@example.com
   ADMIN_PASSWORD=your-admin-password
   ```

## Running Tests

### Basic Test Execution

```bash
# Run all tests (headless)
npm test

# Run tests with browser UI visible
npm run test:headed

# Run tests with Playwright UI mode (interactive)
npm run test:ui

# Run specific test file
npx playwright test tests/auth/login.spec.ts

# Run tests in specific browser
npx playwright test --project=chromium
```

### Test Reports and Debugging

```bash
# View HTML test report
npm run report

# Run with debug mode
npx playwright test --debug

# Run with trace viewer
npx playwright test --trace on
```

### Code Quality

```bash
# Lint TypeScript files
npm run lint

# Format code with Prettier
npm run format
```

## Test Coverage

The test suite covers the following areas mapped to the original Test Plan:

| Test File                   | Test Cases                 | Description                               |
| --------------------------- | -------------------------- | ----------------------------------------- |
| `tests/auth/login.spec.ts`  | TC-01, TC-02               | Positive/negative login scenarios         |
| `tests/auth/guards.spec.ts` | TC-04, TC-05               | Route protection and logout functionality |
| `tests/crud/entity.spec.ts` | TC-06, TC-07, TC-08, TC-09 | CRUD operations on entities               |

### Test Case Details

- **TC-01**: Valid login with admin credentials
- **TC-02**: Invalid login attempts with wrong credentials
- **TC-04**: Unauthenticated access to protected routes
- **TC-05**: Logout functionality and session clearing
- **TC-06**: Create entity with valid data (happy path)
- **TC-07**: Create entity with invalid data (validation)
- **TC-08**: Update existing entity
- **TC-09**: Delete entity with confirmation

## Architecture

### Project Structure

```
├── docs/                    # Documentation
├── tests/
│   ├── auth/               # Authentication tests
│   ├── crud/               # CRUD operation tests
│   ├── helpers/            # Utility functions
│   │   ├── selectors.ts    # Stable UI selectors
│   │   ├── routes.ts       # Route discovery and mapping
│   │   └── data.ts         # Test data generators
│   └── fixtures/           # Test fixtures
│       └── auth.ts         # Authentication helpers
├── bug_reports/            # Bug report templates
└── .vscode/               # VS Code configuration
```

### Key Features

- **Route Discovery**: Automatically discovers frontend routes by navigating the UI
- **Stable Selectors**: Uses semantic selectors (getByRole, getByLabel) over brittle CSS
- **Flexible Authentication**: Handles various login UI patterns
- **CRUD Auto-Discovery**: Finds and tests CRUD operations dynamically
- **Cross-Browser Testing**: Runs on Chromium, Firefox, and WebKit
- **Rich Reporting**: HTML reports with screenshots, videos, and traces on failure

## Configuration

### Playwright Configuration

The test suite is configured for:

- **Headless execution** by default
- **Retry logic**: 1 retry in CI, 0 retries locally
- **Screenshots/videos** captured on failure
- **Traces** retained on failure for debugging
- **Viewport**: 1280x800 for consistent rendering

### Environment Variables

| Variable         | Description              | Default                 |
| ---------------- | ------------------------ | ----------------------- |
| `APP_BASE_URL`   | Frontend application URL | `http://localhost:5173` |
| `API_BASE_URL`   | Backend API URL          | `http://localhost:8000` |
| `ADMIN_EMAIL`    | Admin user email         | _(required)_            |
| `ADMIN_PASSWORD` | Admin user password      | _(required)_            |

## Troubleshooting

### Common Issues

1. **Tests fail with "Could not find login page"**
   - Verify the frontend is running at `http://localhost:5173`
   - Check that login routes are accessible

2. **Authentication failures**
   - Verify `ADMIN_EMAIL` and `ADMIN_PASSWORD` in `.env`
   - Ensure credentials match those used to start the FastAPI app

3. **CRUD tests skip with "Could not find..."**
   - The app may not have the expected CRUD interface
   - Check console output for route discovery results

4. **Flaky tests**
   - Increase timeout values in playwright.config.ts
   - Check network stability to the local services

### Debug Mode

For detailed debugging:

```bash
# Run with debug mode (pauses execution)
npx playwright test --debug tests/auth/login.spec.ts

# Run with headed mode to see browser
npx playwright test --headed tests/auth/login.spec.ts

# Generate and view trace
npx playwright test --trace on
npx playwright show-trace trace.zip
```

## CI/CD Integration

The repository includes a GitHub Actions workflow (`.github/workflows/ci.yml`) that:

- Runs on Node.js 20
- Installs dependencies and browsers
- Executes the full test suite
- Uploads HTML reports as artifacts

## Contributing

When adding new tests:

1. Follow the existing patterns in `helpers/` and `fixtures/`
2. Use semantic selectors from `helpers/selectors.ts`
3. Add test case mappings to this README
4. Run `npm run lint` and `npm run format` before committing

## Notes

- Tests run against the **UI only** - the backend is tested indirectly
- Route discovery adapts to different frontend implementations
- All tests use fresh browser contexts for isolation
- The test suite is designed to be resilient to minor UI changes
