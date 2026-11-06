# Test Plan: e01 Site Foundation

**Epic:** e01 | **Status:** Active | **Risk Tier:** Low

## 1. Test Levels

- **Unit Tests**:
  - `TheNavbar.test.ts`: Verify download button points to `#download` section. Verify GitHub link resolves to canonical repository.
- **Visual & Layout**:
  - CSS layout verification: `.site-container` centers content with maximum width 1100px.
- **Static Assets**:
  - Presence and non-zero byte size for `public/icon.png` and `public/dashboard.png`.

## 2. Risk Matrix

| Component | Risk | Level | Test Strategy                     |
| --------- | ---- | ----- | --------------------------------- |
| Navbar    | Low  | Unit  | Mount with Vue Test Utils         |
| Shell     | Low  | Smoke | Check meta tags and assets in DOM |
