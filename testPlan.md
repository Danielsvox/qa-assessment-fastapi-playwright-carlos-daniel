# Test Plan • FastAPI Full Stack Template

## 1. Project picked and why

I chose the [FastAPI Full Stack Template](https://github.com/fastapi/full-stack-fastapi-template) because it provides a complete but lean stack with:

- React + TypeScript frontend
- FastAPI backend
- SQLModel with PostgreSQL
- Authentication
- Built-in testing scaffolds

It runs locally with Docker Compose and has clear documentation and recent releases. This lets me focus on test design and automation rather than heavy setup:contentReference[oaicite:0]{index=0}.

---

## 2. Scope and objectives

**In scope**

- Validate core user journeys end to end through the UI
- Confirm authentication and session behavior
- Verify CRUD flows on at least one entity in the sample app
- Exercise client-to-server integration and API error surfacing
- Produce a small but maintainable TypeScript automation suite

**Out of scope**

- Performance and load
- Security penetration testing
- Multi-locale and visual regression beyond basic checks:contentReference[oaicite:1]{index=1}

---

## 3. Test approach

**Manual**

- Short exploratory passes to map flows, states, and edge cases
- Targeted checks for input validation and navigation

**Automated**

- Tooling: Playwright with TypeScript
- Strategy: lightweight page objects, data builders, fixtures for auth
- Coverage: three critical flows with positive and negative paths
- CI-ready: headless run and concise HTML report:contentReference[oaicite:2]{index=2}

---

## 4. Environment

- Local Docker Compose as provided by the template
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:8000` with Swagger docs (`/docs`) and ReDoc (`/redoc`)
- Database via Adminer (`http://localhost:8080`)
- Email testing via MailCatcher (`http://localhost:1080`)
- Reverse proxy via Traefik

**Test user**: seeded from environment variables for first superuser

**Assumptions**

- Fresh containers and volumes before runs when needed
- Stable ports and default seed data available:contentReference[oaicite:3]{index=3}

---

## 5. Test data

- One admin user created from env values
- One regular user created via UI during tests
- Synthetic records for CRUD flows created and cleaned per test:contentReference[oaicite:4]{index=4}

---

## 6. Entry and exit criteria

**Entry**

- App builds and all services report healthy
- Test user credentials available

**Exit**

- Planned scenarios executed
- Zero open critical or high blockers in covered areas
- Automation green in headless mode:contentReference[oaicite:5]{index=5}

---

## 7. Risks and mitigations

- **Flaky selectors** due to dynamic UI → Mitigation: role-based/text-based locators and explicit waits
- **Data coupling across tests** → Mitigation: isolated users and ID-based cleanup
- **Auth state leakage** → Mitigation: per-test context and storage state reset:contentReference[oaicite:6]{index=6}

---

## 8. Prioritization

- **High**: Sign up, login, logout, protected route access control, CRUD happy path
- **Medium**: Validation errors, API error surfacing, session persistence/expiry
- **Low**: Non-critical UI details and layout:contentReference[oaicite:7]{index=7}

---

## 9. Test cases for critical flows

- ## 9. Test cases for critical flows

- **TC-01**: Login with valid credentials
  - Precondition: first superuser exists
  - Steps: open login, enter valid email and password, submit
  - Expected: redirected to dashboard and user name visible
  - Priority: High

- **TC-02**: Login with invalid password
  - Steps: valid email, wrong password, submit
  - Expected: clear error message, no session created
  - Priority: High

- **TC-03**: Sign up new user
  - Steps: open sign up, enter unique email and strong password, submit, then login
  - Expected: account created and login succeeds
  - Priority: High

- **TC-04**: Access protected page without auth
  - Steps: open a protected route in a fresh context
  - Expected: redirected to login or access denied
  - Priority: High

- **TC-05**: Logout clears session
  - Steps: login, trigger logout, navigate back to protected route
  - Expected: redirected to login
  - Priority: High

### User Management

- **TC-06**: Prevent duplicate user registration
  - Steps: attempt to sign up again with the same email
  - Expected: clear error message shown, account not created
  - Priority: High

- **TC-07**: Update user profile
  - Precondition: user logged in
  - Steps: navigate to profile/settings, edit fields (e.g., name, email), save
  - Expected: success confirmation, changes persist after reload
  - Priority: Medium

- **TC-08**: Delete user account
  - Precondition: user logged in
  - Steps: navigate to account settings, trigger delete, confirm action
  - Expected: account deleted, redirected to login, further login attempts fail
  - Priority: Medium

### Entity Management (`/items`)

- **TC-09**: Create entity happy path
  - Steps: login, open create form, fill valid fields, submit
  - Expected: success toast, record appears in list and detail
  - Priority: High

- **TC-10**: Create entity with invalid input
  - Steps: submit empty or invalid fields
  - Expected: field-level errors and no record created
  - Priority: Medium

- **TC-11**: Update entity
  - Steps: open existing record, edit a field, save
  - Expected: success toast and persisted change in list and detail
  - Priority: Medium

- **TC-12**: Delete entity with confirm
  - Steps: delete existing record and confirm
  - Expected: record removed from list, 404 on old detail link
  - Priority: Medium

- **TC-13**: API error surfaced to UI
  - Steps: simulate backend failure for create or update or use invalid payload
  - Expected: friendly error state and no crash
  - Priority: Medium

### Other Flows

- **TC-14**: Navigation and deep links
  - Steps: use in-app links and direct URL entries for main areas
  - Expected: consistent routing and expected guards
  - Priority: Low

- **TC-15**: Password recovery path
  - Steps: request reset for existing email, confirm email captured in MailCatcher, complete flow if enabled
  - Expected: reset email visible in MailCatcher, password change effective
  - Priority: Low

## 10. Automation plan

- **Framework**: Playwright with TypeScript (required by the assessment)
- **Suite outline**:
  - `tests/auth`: login positive and negative
  - `tests/entities`: create, update, delete
  - `tests/access`: route guard tests
- **Design**: reusable selectors, helpers under utils, storage state fixture, test data builders
- **Reporting**: Playwright HTML report + JUnit XML for CI:contentReference[oaicite:9]{index=9}

---

## 11. Defect reporting

**Fields**

- Title and unique ID
- Environment and build
- Steps to reproduce
- Expected vs. actual result
- Severity and priority with justification
- Evidence (screenshots, video, console, network logs)
- Suggested area to investigate or probable cause

**Severity model**

- **Critical**: stops core flow or data loss
- **High**: blocks primary path without workaround
- **Medium**: affects secondary path or confusing behavior
- **Low**: minor or cosmetic:contentReference[oaicite:10]{index=10}

---

## 12. Deliverables

- Test plan document (this file)
- Separate repository with Playwright TypeScript tests and README explaining setup, run, and assumptions
- Three detailed bug reports with reproduction steps and evidence:contentReference[oaicite:11]{index=11}

---
