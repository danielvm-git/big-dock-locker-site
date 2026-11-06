# Threat Model: Epic e01 — Site Foundation, Layout, and Assets

**Epic:** e01 | **Date:** 2026-11-06 | **Evaluator:** security-review

## 1. Scope & Surface Area

- Static files served from `public/`: `icon.png`, `dashboard.png`, `favicon.svg`, `icons.svg`.
- HTML shell: `index.html` with viewport, charset, CSP meta tags, title.
- CSS layout: `src/style.css` (custom properties, container constraints).
- Navigation header: `src/components/TheNavbar.vue` (brand anchor, GitHub link, download anchor).

## 2. Threat Analysis (STRIDE)

| Threat                         | Risk Level | Target                     | Mitigation                                                                              |
| :----------------------------- | :--------: | :------------------------- | :-------------------------------------------------------------------------------------- |
| **Spoofing**                   |    Low     | Navbar brand / GitHub link | Hardcoded canonical GitHub repo URL: `https://github.com/danielvm-git/big-dock-locker`. |
| **Tampering**                  |    Low     | Static assets in `public/` | Static integrity checked at build; served with immutable caching headers.               |
| **Information Disclosure**     |    Low     | HTML Shell metadata        | No internal hostnames or tokens exposed in meta tags.                                   |
| **Cross-Site Scripting (XSS)** |    Low     | Navigation anchors         | Pure template anchors without dynamic `v-html` or uncontrolled interpolations.          |

## 3. Security Verdict

**PASS** — Risk tier is Low; no external user inputs or dynamic script executions involved in e01 scope.
