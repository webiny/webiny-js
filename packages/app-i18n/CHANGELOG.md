# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [4.0.0-beta.0](https://github.com/webiny/webiny-js/compare/v1.15.1...v4.0.0-beta.0) (2020-05-22)


### Bug Fixes

* add I18NValue generic type ([b5b83a2](https://github.com/webiny/webiny-js/commit/b5b83a2e92c079bf50e844e4498b2287bf816eb7))
* add loading to I18NProvider and fix identity setter. ([c40593c](https://github.com/webiny/webiny-js/commit/c40593c7985d9ff83bf2d8397f267f39bd1c06f9))
* add missing prop type definition ([e4f3695](https://github.com/webiny/webiny-js/commit/e4f369593d54cac2bcdf1cf93a8f86e9ee1ee3da))
* add progress label. ([181f3e6](https://github.com/webiny/webiny-js/commit/181f3e60395e2db1357ae8bfaaf9f9e01c4bf0a3))
* convert all app plugins to factories ([b3553fa](https://github.com/webiny/webiny-js/commit/b3553fa2b3d7aa00d73df9ab700dc8a90631bf96))
* fix eslint error ([b7079c1](https://github.com/webiny/webiny-js/commit/b7079c1f61209e5096350598da5d8f6101e5959d))
* fix eslint error ([a1af24e](https://github.com/webiny/webiny-js/commit/a1af24edf167be31f2502372d989f8abbd7dee81))
* improve handling of global search bar hotkey "/" ([6435a7b](https://github.com/webiny/webiny-js/commit/6435a7be5ea1579025419cbbd576e963c718d674))
* incorrect import ([fee11e3](https://github.com/webiny/webiny-js/commit/fee11e333581206ffc6e86d6731d7eaa07130d58))
* log out users on "invalid signature" security error ([#630](https://github.com/webiny/webiny-js/issues/630)) ([66aaa50](https://github.com/webiny/webiny-js/commit/66aaa501b5ac8ae890bc11cc58d7d91ad60b45e5))
* reload i18n information once a new locale was saved / removed ([a0c6969](https://github.com/webiny/webiny-js/commit/a0c6969b8a759038ffab9e39dc719e2a3ed5a419))
* remove withAutoComplete, useCrud / useDatalist adjustments ([6a0e1bc](https://github.com/webiny/webiny-js/commit/6a0e1bca789788b860d633030a23c3911066cfff))
* rename variables to fix name clash in form views. ([108586d](https://github.com/webiny/webiny-js/commit/108586d21e94ac586c0ff29d16794176b77c8372))
* security and i18n installation. ([bb8aa0c](https://github.com/webiny/webiny-js/commit/bb8aa0ca0287d31a82de2af0392547500aff7913))
* synced dependencies across all packages ([#567](https://github.com/webiny/webiny-js/issues/567)) ([38eda54](https://github.com/webiny/webiny-js/commit/38eda547bead6e8a2c46875730bbcd8f1227e475))
* update dependencies ([2def479](https://github.com/webiny/webiny-js/commit/2def479886ed356e7981b7be61b957edcc87f887))
* update plugin names and usage ([38754f2](https://github.com/webiny/webiny-js/commit/38754f2c1c4d71667cab35c84436662c36dcec04))
* upgrade react-transition-group and CSS selectors. ([8f388ad](https://github.com/webiny/webiny-js/commit/8f388adfbb9fb45919bbf08071d044362ed2dc7a))
* use graphql-tag instead of apollo-server-lambda ([5531e33](https://github.com/webiny/webiny-js/commit/5531e33682ca3721701abc3415da85261d0283de))
* useCrud wip ([515b649](https://github.com/webiny/webiny-js/commit/515b649d1b3f0a28778e7946b79607f2be1c9a28))
* useCrud wip ([32ba832](https://github.com/webiny/webiny-js/commit/32ba8326be08c16244971a5355aa347a395e746e))


### Features

* create rich-text field ([ee1dadb](https://github.com/webiny/webiny-js/commit/ee1dadbcece0929a4fe259f9051554249012c043)), closes [#811](https://github.com/webiny/webiny-js/issues/811)
* form inputs validators refactor ([4bca7b4](https://github.com/webiny/webiny-js/commit/4bca7b463699bdc0ad94a71ea42d5a10d1353caa))
* I18NInput component - add ability to toggle visibility of the translate icon and define custom render ([#598](https://github.com/webiny/webiny-js/issues/598)) ([25ea0bb](https://github.com/webiny/webiny-js/commit/25ea0bb02610ef6b3d4f187e926fae6200dd31d9))
* improved scopes selection auto-complete component([#743](https://github.com/webiny/webiny-js/issues/743)) ([f3acbc5](https://github.com/webiny/webiny-js/commit/f3acbc5aa467ac3d70649628bfbe68727345487e)), closes [#729](https://github.com/webiny/webiny-js/issues/729)
* migrate from offset pagination to cursor pagination ([0780b11](https://github.com/webiny/webiny-js/commit/0780b116f293c8da686b91e0612dd4ee254c5554))
* new app installation mechanism. ([83b6417](https://github.com/webiny/webiny-js/commit/83b641757d43dd3573bfa8d40cf053da35cb0180))
* TypeScript && improved SSR mechanisms ([#677](https://github.com/webiny/webiny-js/issues/677)) ([3da0566](https://github.com/webiny/webiny-js/commit/3da0566f29e1d46df0e7c357be0b42bdaa4c7d2b))


### BREAKING CHANGES

* We're now using cursor pagination, which means we no longer have a page and perPage parameters, but rather a "limit" and "after" + "before" cursors.





## [3.1.3](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.1.3-next.0...@webiny/app-i18n@3.1.3) (2020-04-23)

**Note:** Version bump only for package @webiny/app-i18n





## [3.1.3-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.1.2...@webiny/app-i18n@3.1.3-next.0) (2020-04-23)

**Note:** Version bump only for package @webiny/app-i18n





## [3.1.2](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.1.2-next.0...@webiny/app-i18n@3.1.2) (2020-04-16)

**Note:** Version bump only for package @webiny/app-i18n





## [3.1.2-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.1.1...@webiny/app-i18n@3.1.2-next.0) (2020-04-16)

**Note:** Version bump only for package @webiny/app-i18n





## [3.1.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.1.1-next.0...@webiny/app-i18n@3.1.1) (2020-04-03)

**Note:** Version bump only for package @webiny/app-i18n





## [3.1.1-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.1.0...@webiny/app-i18n@3.1.1-next.0) (2020-04-03)

**Note:** Version bump only for package @webiny/app-i18n





# [3.1.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.1.0-next.0...@webiny/app-i18n@3.1.0) (2020-03-09)

**Note:** Version bump only for package @webiny/app-i18n





# [3.1.0-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.4...@webiny/app-i18n@3.1.0-next.0) (2020-03-09)


### Features

* improved scopes selection auto-complete component([#743](https://github.com/webiny/webiny-js/issues/743)) ([f3acbc5](https://github.com/webiny/webiny-js/commit/f3acbc5aa467ac3d70649628bfbe68727345487e)), closes [#729](https://github.com/webiny/webiny-js/issues/729)





## [3.0.4](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.4-next.0...@webiny/app-i18n@3.0.4) (2020-03-01)

**Note:** Version bump only for package @webiny/app-i18n





## [3.0.4-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.3...@webiny/app-i18n@3.0.4-next.0) (2020-03-01)

**Note:** Version bump only for package @webiny/app-i18n





## [3.0.3](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.3-next.0...@webiny/app-i18n@3.0.3) (2020-02-24)

**Note:** Version bump only for package @webiny/app-i18n





## [3.0.3-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.2...@webiny/app-i18n@3.0.3-next.0) (2020-02-23)

**Note:** Version bump only for package @webiny/app-i18n





## [3.0.2](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.2-next.0...@webiny/app-i18n@3.0.2) (2020-02-12)

**Note:** Version bump only for package @webiny/app-i18n





## [3.0.2-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.1...@webiny/app-i18n@3.0.2-next.0) (2020-02-11)

**Note:** Version bump only for package @webiny/app-i18n





## [3.0.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.1-next.0...@webiny/app-i18n@3.0.1) (2020-02-07)

**Note:** Version bump only for package @webiny/app-i18n





## [3.0.1-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@3.0.0...@webiny/app-i18n@3.0.1-next.0) (2020-02-07)

**Note:** Version bump only for package @webiny/app-i18n





# [3.0.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.1...@webiny/app-i18n@3.0.0) (2020-01-27)


### Features

* TypeScript && improved SSR mechanisms ([#677](https://github.com/webiny/webiny-js/issues/677)) ([3da0566](https://github.com/webiny/webiny-js/commit/3da0566f29e1d46df0e7c357be0b42bdaa4c7d2b))





## [2.1.2-next.2](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.2-next.1...@webiny/app-i18n@2.1.2-next.2) (2020-01-27)

**Note:** Version bump only for package @webiny/app-i18n





## [2.1.2-next.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.2-next.0...@webiny/app-i18n@2.1.2-next.1) (2020-01-27)

**Note:** Version bump only for package @webiny/app-i18n





## [2.1.2-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.1...@webiny/app-i18n@2.1.2-next.0) (2020-01-24)

**Note:** Version bump only for package @webiny/app-i18n





## [2.1.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.1-next.2...@webiny/app-i18n@2.1.1) (2019-12-04)

**Note:** Version bump only for package @webiny/app-i18n





## [2.1.1-next.2](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.1-next.1...@webiny/app-i18n@2.1.1-next.2) (2019-12-04)


### Bug Fixes

* log out users on "invalid signature" security error ([#630](https://github.com/webiny/webiny-js/issues/630)) ([66aaa50](https://github.com/webiny/webiny-js/commit/66aaa501b5ac8ae890bc11cc58d7d91ad60b45e5))





## [2.1.1-next.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.1-next.0...@webiny/app-i18n@2.1.1-next.1) (2019-12-04)

**Note:** Version bump only for package @webiny/app-i18n





## [2.1.1-next.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.1.0...@webiny/app-i18n@2.1.1-next.0) (2019-12-04)

**Note:** Version bump only for package @webiny/app-i18n





# [2.1.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.0.1...@webiny/app-i18n@2.1.0) (2019-11-08)


### Features

* I18NInput component - add ability to toggle visibility of the translate icon and define custom render ([#598](https://github.com/webiny/webiny-js/issues/598)) ([25ea0bb](https://github.com/webiny/webiny-js/commit/25ea0bb))





## [2.0.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@2.0.0...@webiny/app-i18n@2.0.1) (2019-11-03)

**Note:** Version bump only for package @webiny/app-i18n





# [2.0.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.2.5...@webiny/app-i18n@2.0.0) (2019-10-29)

**Note:** Version bump only for package @webiny/app-i18n





## [0.2.5](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.2.4...@webiny/app-i18n@0.2.5) (2019-10-29)

**Note:** Version bump only for package @webiny/app-i18n





## [0.2.4](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.2.3...@webiny/app-i18n@0.2.4) (2019-10-29)


### Bug Fixes

* add progress label. ([181f3e6](https://github.com/webiny/webiny-js/commit/181f3e6))
* rename variables to fix name clash in form views. ([108586d](https://github.com/webiny/webiny-js/commit/108586d))





## [0.2.3](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.2.2...@webiny/app-i18n@0.2.3) (2019-10-24)

**Note:** Version bump only for package @webiny/app-i18n





## [0.2.2](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.2.1...@webiny/app-i18n@0.2.2) (2019-10-23)

**Note:** Version bump only for package @webiny/app-i18n





## [0.2.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.2.0...@webiny/app-i18n@0.2.1) (2019-10-21)

**Note:** Version bump only for package @webiny/app-i18n





# [0.2.0](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.9...@webiny/app-i18n@0.2.0) (2019-10-21)


### Bug Fixes

* security and i18n installation. ([bb8aa0c](https://github.com/webiny/webiny-js/commit/bb8aa0ca0287d31a82de2af0392547500aff7913))
* use graphql-tag instead of apollo-server-lambda ([5531e33](https://github.com/webiny/webiny-js/commit/5531e33682ca3721701abc3415da85261d0283de))


### Features

* new app installation mechanism. ([83b6417](https://github.com/webiny/webiny-js/commit/83b641757d43dd3573bfa8d40cf053da35cb0180))





## [0.1.9](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.8...@webiny/app-i18n@0.1.9) (2019-10-17)

**Note:** Version bump only for package @webiny/app-i18n





## [0.1.8](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.7...@webiny/app-i18n@0.1.8) (2019-10-17)

**Note:** Version bump only for package @webiny/app-i18n





## [0.1.7](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.6...@webiny/app-i18n@0.1.7) (2019-10-16)

**Note:** Version bump only for package @webiny/app-i18n





## [0.1.6](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.5...@webiny/app-i18n@0.1.6) (2019-10-14)


### Bug Fixes

* incorrect import ([fee11e3](https://github.com/webiny/webiny-js/commit/fee11e333581206ffc6e86d6731d7eaa07130d58))





## [0.1.5](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.4...@webiny/app-i18n@0.1.5) (2019-10-14)


### Bug Fixes

* synced dependencies across all packages ([#567](https://github.com/webiny/webiny-js/issues/567)) ([38eda54](https://github.com/webiny/webiny-js/commit/38eda547bead6e8a2c46875730bbcd8f1227e475))





## [0.1.4](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.3...@webiny/app-i18n@0.1.4) (2019-10-11)


### Bug Fixes

* update dependencies ([2def479](https://github.com/webiny/webiny-js/commit/2def479886ed356e7981b7be61b957edcc87f887))





<a name="0.1.3"></a>
## [0.1.3](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.2...@webiny/app-i18n@0.1.3) (2019-10-11)

**Note:** Version bump only for package @webiny/app-i18n





# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

## [0.1.2](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.1...@webiny/app-i18n@0.1.2) (2019-10-10)

**Note:** Version bump only for package @webiny/app-i18n





## [0.1.1](https://github.com/webiny/webiny-js/compare/@webiny/app-i18n@0.1.0...@webiny/app-i18n@0.1.1) (2019-10-06)

**Note:** Version bump only for package @webiny/app-i18n
