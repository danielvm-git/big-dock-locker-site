# Big Dock Locker — Website

The official public website for the [big-dock-locker](https://github.com/danielvm-git/big-dock-locker) app.

## Tech/framework used

| Tool               | Purpose                          |
| ------------------ | -------------------------------- |
| **Vue 3**          | Reactive UI framework            |
| **Vite**           | Dev server, HMR, build bundler   |
| **TypeScript**     | Type-safe codebase               |
| **Sentry**         | Error monitoring (`@sentry/vue`) |
| **Node.js 24 LTS** | Runtime                          |

## Architecture

A single-page application with sections for Home, Features, Pricing, Docs, Blog, and Contact.

## Installation

```bash
npm install
```

## How to use

```bash
npm run dev       # start dev server
npm run build     # production build (vue-tsc -b && vite build)
npm run preview   # preview production build
```

Deployed via Netlify (`netlify.toml`); releases are automated with big-release.

## Contribute

1. Create a feature branch
2. Follow the conventions in [CLAUDE.md](CLAUDE.md) / [CONVENTIONS.md](CONVENTIONS.md)
3. Run build before opening a Pull Request

## License

MIT — see [LICENSE](./LICENSE) for details.
