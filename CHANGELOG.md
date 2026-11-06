# 1.6.0 (2026-11-06)

### Features

- **e02:** live github releases and install section ([075f417](https://github.com/danielvm-git/big-dock-locker-site/commit/075f4173846512c14291a205aed4abce621c88a6))
- **e01s02:** complete css tokens and navbar component ([d76663d](https://github.com/danielvm-git/big-dock-locker-site/commit/d76663dcaa5b28c81b4e4f96266b6492c8f73d43))
- **e01s01:** verify static assets and html shell ([e99fc16](https://github.com/danielvm-git/big-dock-locker-site/commit/e99fc16eb7d1d0a84138b62ae0be4df9b2ee150e))

### Bug Fixes

- **ci:** make commit-msg hook POSIX so releases can commit ([44c2e27](https://github.com/danielvm-git/big-dock-locker-site/commit/44c2e27a306a734c35dde57c063fac971cddb612))
- **ci:** make pre-push hook POSIX and exempt the release workflow ([e18b3ab](https://github.com/danielvm-git/big-dock-locker-site/commit/e18b3ab1154c37bcd861207ffd0c8dbb64fec41d))

# 1.5.3 (2026-11-04)

### Bug Fixes

- **release:** use top-level versionFile config ([039f904](https://github.com/danielvm-git/big-dock-locker-site/commit/039f904de9ef39c05cdb68a91005ecb0be348826))

# 1.5.2 (2026-11-04)

### Bug Fixes

- **ci:** use native big-release versionfile plugin ([26b46c5](https://github.com/danielvm-git/big-dock-locker-site/commit/26b46c527aba10055202f9ac43e0729ce90a561a))

# 1.5.1 (2026-11-04)

### Bug Fixes

- **ci:** sync VERSION file after releases ([e521586](https://github.com/danielvm-git/big-dock-locker-site/commit/e521586297d1165deae01a0260fd5d2a27658c39))

# 1.5.0 (2026-11-04)

### Features

- **release:** add .big-release.yml configuration ([7815c39](https://github.com/danielvm-git/big-dock-locker-site/commit/7815c39cd16e44772c0ea301b43fe12f2ebe18cc))
- **feat:** optimistic download counter increment and refetch on tab focus ([c1d4636](https://github.com/danielvm-git/big-dock-locker-site/commit/c1d46364bf3538314d5f7b5877e574c8c7d5f424))
- **feat:** show GitHub release download counts on hero and download section ([9ff440e](https://github.com/danielvm-git/big-dock-locker-site/commit/9ff440e8506938ae96dd97e35cbcd266d658b660))
- **feat:** add Sentry release pipeline — source maps, commit association, deploy notification ([8da1985](https://github.com/danielvm-git/big-dock-locker-site/commit/8da19859dcecb276db9d495e671b96776b18420c))
- **feat:** add Sentry release health — release tag and environment injected at build time ([a245be3](https://github.com/danielvm-git/big-dock-locker-site/commit/a245be391c2db00ad5dd7ecf127e1c97cb2dd533))
- **feat:** add Sentry observability — page tracing, session replay, download tracking ([9e24260](https://github.com/danielvm-git/big-dock-locker-site/commit/9e24260380b0c1a76b97b7ef270ad352d754da84))
- **feat:** launch Big DockLocker marketing website - Seven-section SPA: Navbar, Hero, Features, HowItWorks, Install, Download, Footer - Live download buttons and version badge via GitHub Releases API (singleton composable) - Semantic-release wired with GitHub Actions on main branch - Responsive, dark-mode ready, no external UI dependencies ([8067724](https://github.com/danielvm-git/big-dock-locker-site/commit/80677247c9de91d70e0da77710dee1089b8b884c))

### Bug Fixes

- **ci:** configure git identity for big-release ([#5](https://github.com/danielvm-git/big-dock-locker-site/issues/5)) ([8bc36c4](https://github.com/danielvm-git/big-dock-locker-site/commit/8bc36c4f182d1b2bb74f09394cbe8a22034c4ea1))
- **ci:** invoke big-release release subcommand ([#4](https://github.com/danielvm-git/big-dock-locker-site/issues/4)) ([51992ec](https://github.com/danielvm-git/big-dock-locker-site/commit/51992ec68d1e057197fb6cb5f74f877229c6b886))
- **fix:** harden release and clipboard state machines, update CI actions ([#3](https://github.com/danielvm-git/big-dock-locker-site/issues/3)) ([63f2967](https://github.com/danielvm-git/big-dock-locker-site/commit/63f2967a50be10f6244f295a7ab122984291356b))
- **fix:** correct Netlify domain in OG meta tags ([bd016ce](https://github.com/danielvm-git/big-dock-locker-site/commit/bd016ced57ffdd48f8882701a025d9dd8433f178))
- **fix:** use dashboard screenshot for social media preview image ([524c210](https://github.com/danielvm-git/big-dock-locker-site/commit/524c2108a3b98dd7221412eb59e50008d5342fed))

# 1.0.0 (2026-08-03)

### Bug Fixes

- correct Netlify domain in OG meta tags ([bd016ce](https://github.com/danielvm-git/big-dock-locker-site/commit/bd016ced57ffdd48f8882701a025d9dd8433f178))
- use dashboard screenshot for social media preview image ([524c210](https://github.com/danielvm-git/big-dock-locker-site/commit/524c2108a3b98dd7221412eb59e50008d5342fed))

### Features

- add Sentry observability — page tracing, session replay, download tracking ([9e24260](https://github.com/danielvm-git/big-dock-locker-site/commit/9e24260380b0c1a76b97b7ef270ad352d754da84))
- add Sentry release health — release tag and environment injected at build time ([a245be3](https://github.com/danielvm-git/big-dock-locker-site/commit/a245be391c2db00ad5dd7ecf127e1c97cb2dd533))
- add Sentry release pipeline — source maps, commit association, deploy notification ([8da1985](https://github.com/danielvm-git/big-dock-locker-site/commit/8da19859dcecb276db9d495e671b96776b18420c))
- launch Big DockLocker marketing website ([8067724](https://github.com/danielvm-git/big-dock-locker-site/commit/80677247c9de91d70e0da77710dee1089b8b884c))
- optimistic download counter increment and refetch on tab focus ([c1d4636](https://github.com/danielvm-git/big-dock-locker-site/commit/c1d46364bf3538314d5f7b5877e574c8c7d5f424))
- show GitHub release download counts on hero and download section ([9ff440e](https://github.com/danielvm-git/big-dock-locker-site/commit/9ff440e8506938ae96dd97e35cbcd266d658b660))

# [1.4.0](https://github.com/danielvm-git/big-dock-locker-site/compare/v1.3.0...v1.4.0) (2026-05-21)

### Features

- optimistic download counter increment and refetch on tab focus ([578f745](https://github.com/danielvm-git/big-dock-locker-site/commit/578f7450b9947a764e33c3a8e394d7cdd4fb6164))

# [1.3.0](https://github.com/danielvm-git/big-dock-locker-site/compare/v1.2.0...v1.3.0) (2026-05-21)

### Features

- show GitHub release download counts on hero and download section ([c2cbe74](https://github.com/danielvm-git/big-dock-locker-site/commit/c2cbe74c98d68c802c3ccc85079da3f72cc3366b))

# [1.2.0](https://github.com/danielvm-git/big-dock-locker-site/compare/v1.1.0...v1.2.0) (2026-05-21)

### Features

- add Sentry release health — release tag and environment injected at build time ([8852610](https://github.com/danielvm-git/big-dock-locker-site/commit/8852610a989cfb353574dfe8e173975bc4541899))
- add Sentry release pipeline — source maps, commit association, deploy notification ([6c50a7f](https://github.com/danielvm-git/big-dock-locker-site/commit/6c50a7f570faea9016a302fe71b2b4a279ee85a8))

# [1.1.0](https://github.com/danielvm-git/big-dock-locker-site/compare/v1.0.2...v1.1.0) (2026-05-21)

### Features

- add Sentry observability — page tracing, session replay, download tracking ([69dcc5a](https://github.com/danielvm-git/big-dock-locker-site/commit/69dcc5ac661f4878eda7f5fa6372c3ed7f577882))

## [1.6.1] - 2026-11-06

### Bug Fixes

- **ci:** close historical gaps and repair stale state ([914828b](https://github.com/danielvm-git/big-dock-locker-site/commit/914828b95d588f7c7520bd3f2a7e858c21ba2316))

## [1.0.2](https://github.com/danielvm-git/big-dock-locker-site/compare/v1.0.1...v1.0.2) (2026-05-21)

### Bug Fixes

- correct Netlify domain in OG meta tags ([d167192](https://github.com/danielvm-git/big-dock-locker-site/commit/d167192b023ead8178e4065ed3869f7e0a90cfef))

## [1.0.1](https://github.com/danielvm-git/big-dock-locker-site/compare/v1.0.0...v1.0.1) (2026-05-21)

### Bug Fixes

- use dashboard screenshot for social media preview image ([57733ec](https://github.com/danielvm-git/big-dock-locker-site/commit/57733ecf3b6727471feaa8870f414994b8dc7c9a))

# 1.0.0 (2026-05-21)

### Features

- launch Big DockLocker marketing website ([8cac267](https://github.com/danielvm-git/big-dockLocker-stie/commit/8cac267135e4eaf99ff8ee2a4916c87d94d3902a))
