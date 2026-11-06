# story: e01s02

# e01s02 — Global CSS Tokens and Navbar Component

**Epic:** e01 | **Story:** e01s02 | **Status:** done | **BCPs:** 3

## Goal

Provide global CSS layout variables, button tokens, and a responsive sticky navbar with branding and download CTA.

## Scope

- Global CSS variables and `.site-container` in `src/style.css`
- Sticky header component in `src/components/TheNavbar.vue`
- Unit tests verifying navbar navigation and download anchor links

## Out of scope

- Live dynamic release badge inside navbar

## Verify

```bash
npm run test -- tests/unit/TheNavbar.test.ts
```
