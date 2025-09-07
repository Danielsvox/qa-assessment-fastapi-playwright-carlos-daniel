# QA Assessment – Findings Report

This document summarizes issues discovered during functional and exploratory testing of the **FastAPI Full Stack Template** application.  
While core flows (auth, CRUD, session handling) worked as expected, several **usability and feedback gaps** were observed that may impact user experience and product adoption.

---

## Bug 1 – No feedback upon user creation, no email sent

**Severity**: Medium  
**Priority**: P1  
**Category**: User Experience / Communication

### Steps to Reproduce

1. Log in as admin.
2. Navigate to the **Users** section.
3. Create a new user by filling all required fields and submitting.

### Expected

- Visible confirmation message (toast/snackbar or redirect with success banner).
- Email notification sent to the new user (activation, welcome, or at least confirmation of account creation).

### Actual

- No visual confirmation is shown after creation.
- No email is sent (other than seeded superuser existing).

### Impact

Admins and users cannot easily confirm whether account creation succeeded. This can cause confusion, repeated attempts, and missed onboarding steps.

---

## Bug 2 – Password reset sends email but lacks follow-up notifications

**Severity**: Medium  
**Priority**: P2  
**Category**: User Experience / Industry Standard Practices

### Steps to Reproduce

1. Navigate to the **Forgot Password** page.
2. Submit a registered email.
3. Check MailCatcher.

### Expected

- Reset email is received (✅ this occurs).
- Additional follow-up confirmation emails are sent after password reset completion (e.g. “Your password has been changed”).

### Actual

- Only the initial reset email is received.
- No confirmation email is sent after a successful password update.

### Impact

Industry-standard applications provide confirmation to protect against unauthorized password changes. Lack of this weakens trust and security transparency.

---

## Bug 3 – Items ordering inconsistent with common UX standards

**Severity**: Low  
**Priority**: P3  
**Category**: Usability / Data Presentation

### Steps to Reproduce

1. Log in as any user.
2. Navigate to the **Items** page (`/items`).
3. Create several items with different timestamps.

### Expected

- Newest items should appear at the top of the list (reverse chronological).
- Option to sort items by date or name.

### Actual

- Items appear in order of creation from **oldest to newest**.
- No option to re-arrange or sort.

### Impact

Users expect the most recent entries to be easily visible. The current ordering requires extra scrolling and reduces efficiency for frequent users.

---

## Bug 4 – User list ordering inconsistent with admin expectations

**Severity**: Low  
**Priority**: P3  
**Category**: Usability / Data Presentation

### Steps to Reproduce

1. Log in as admin.
2. Navigate to the **Users** section.
3. Review the list of created users.

### Expected

- Newest users should appear first.
- Option to sort or filter users (e.g. by date created).

### Actual

- Users appear from **first created to last created** (chronological order).
- No sorting or filtering options are available.

### Impact

Makes it harder for admins to track and manage recent signups. Industry-standard admin panels default to showing the newest users first.

---

## Summary

The application is **functionally stable** with working authentication, CRUD, and email flows.  
However, several **usability and feedback issues** should be addressed to align with industry standards and improve user/admin confidence:

- Missing feedback messages for critical actions.
- Lack of confirmation/notification emails.
- Non-standard ordering of items and users without sorting options.

These changes are relatively low-effort but high-value improvements for user experience and adoption.
