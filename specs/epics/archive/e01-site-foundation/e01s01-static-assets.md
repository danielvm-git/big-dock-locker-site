# story: e01s01

# e01s01 — Static Assets and HTML Shell

**Epic:** e01 | **Story:** e01s01 | **Status:** done | **BCPs:** 2

## Goal

Provide static branding assets (`icon.png`, `dashboard.png`) in `public/` and configure the HTML document metadata shell with proper title and favicon.

## Scope

- Favicon and app icon in `public/icon.png`
- Dashboard preview image in `public/dashboard.png`
- Document title, description metadata, and viewport settings in `index.html`

## Out of scope

- Dynamic API assets
- Dynamic meta tags generation

## Verify

```bash
test -f public/icon.png && test -f public/dashboard.png && grep -q 'Big DockLocker' index.html
```
