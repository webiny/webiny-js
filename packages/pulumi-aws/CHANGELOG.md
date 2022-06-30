# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.29.0](https://github.com/webiny/webiny-js/compare/v5.29.0-beta.2...v5.29.0) (2022-06-28)

**Note:** Version bump only for package @webiny/pulumi-aws





# [5.29.0-beta.2](https://github.com/webiny/webiny-js/compare/v5.29.0-beta.1...v5.29.0-beta.2) (2022-06-27)

**Note:** Version bump only for package @webiny/pulumi-aws





# [5.29.0-beta.1](https://github.com/webiny/webiny-js/compare/v5.29.0-beta.0...v5.29.0-beta.1) (2022-06-25)


### Features

* **pulumi-aws:** add an AWS OpenSearch module ([88d6cf2](https://github.com/webiny/webiny-js/commit/88d6cf2edb11f10b51f0c54c9cf61e004d0d54de))
* **pulumi-aws:** add production features to ElasticSearch module ([8e7f6ab](https://github.com/webiny/webiny-js/commit/8e7f6aba84704f0ede2540314c5b965f81bdbdc9))





# [5.29.0-beta.0](https://github.com/webiny/webiny-js/compare/v5.28.0...v5.29.0-beta.0) (2022-06-25)


### Bug Fixes

* bring back `AWS_ELASTIC_SEARCH_DOMAIN_NAME` env var support ([a4a4712](https://github.com/webiny/webiny-js/commit/a4a4712fb458a957c8984ff49a5b5cfc6de8dc0a))
* correct inputs handling ([d73034c](https://github.com/webiny/webiny-js/commit/d73034cdbb3ad409cc2850e8ba1dfff4e6f040b5))
* rename `PulumiRemoteResource` to `PulumiAppRemoteResource` [no ci] ([804901e](https://github.com/webiny/webiny-js/commit/804901edf77808307f7dd379e5972428346b3deb))
* revert `AWS_ELASTIC_SEARCH_DOMAIN_NAME` support ([0c12113](https://github.com/webiny/webiny-js/commit/0c12113d0d135236eb6d273754d8e967ee26e0a2))
* **pb-settings:** use PS#SETTINGS record for default website URLs ([da1dde3](https://github.com/webiny/webiny-js/commit/da1dde30cbd155c5695a772d7f1024a96e20fb85))
* **pulumi-aws:** add dynamodb query action to router policy ([d2f0c78](https://github.com/webiny/webiny-js/commit/d2f0c785e821dd57b7c1bca77441deadeea78613))
* do not rely on env var to determine if MT is enabled ([34ce776](https://github.com/webiny/webiny-js/commit/34ce776fe988551c7c5dae1e69fcd1b4b454873c))
* do not rely on env var to determine if MT is enabled ([d7a60d7](https://github.com/webiny/webiny-js/commit/d7a60d7cb591473a2952927dc2852636fab19bac))
* improve env vars handling ([ee7f4dd](https://github.com/webiny/webiny-js/commit/ee7f4dd72c37c1934b67a2965c76cd3db4831f3f))
* introduce `pulumi-app-aws` package ([080acba](https://github.com/webiny/webiny-js/commit/080acbaaff79ae472aa0cdbb2f54fb2b598bdb4d))
* map to root tenant if only 1 tenant is present ([740664f](https://github.com/webiny/webiny-js/commit/740664f02d9fbb0f3b33c1b21f5fbff6d0eb55ac))
* remove `PulumiInputValue` ([da89d60](https://github.com/webiny/webiny-js/commit/da89d60acb060802e1c409dc97d5c5c996251c79))
* rename "config" to "params" ([cae50b5](https://github.com/webiny/webiny-js/commit/cae50b5455f3b239333a1754ec6cf66edf6bc466))
* rename "input" to "param" ([3d0fa34](https://github.com/webiny/webiny-js/commit/3d0fa346ecb3d2b39ec31b05a78308351d78087c))
* rename domain to domains (plural) ([b9f1ea7](https://github.com/webiny/webiny-js/commit/b9f1ea74085ac3f8f335c3a357b22796955a54d9))
* run `pulumi` arg within the `program` callback function ([3b932a2](https://github.com/webiny/webiny-js/commit/3b932a2ea15e90de0d315bfbacf086a2e1816193))
* simplify types ([5949f23](https://github.com/webiny/webiny-js/commit/5949f23f33c346042be06dc32786a8540130be2c))
* use correct begins_with syntax ([e0db46d](https://github.com/webiny/webiny-js/commit/e0db46d6614f5cc297bfec8302debd89716a5f06))
* **prerendering:** resolve requested changes from PR [#2469](https://github.com/webiny/webiny-js/issues/2469) ([6b1c15d](https://github.com/webiny/webiny-js/commit/6b1c15d97c1428e20f24e442e3d18b088c1f058a))
* **prerendering:** update to work with event-driven prerendering ([3c8c470](https://github.com/webiny/webiny-js/commit/3c8c4701ad1c9bd4d248a2b62efbb494ddce65a6))
* **pulumi-aws:** extract APW into apps/api while in development ([04ac91c](https://github.com/webiny/webiny-js/commit/04ac91cd49e9d8a18ed91b986bce358dca0f21e4))
* **pulumi-aws:** optimize tenant check in tenant router ([abb2d39](https://github.com/webiny/webiny-js/commit/abb2d393ee176a66a81d8e077c8a9bd8f8cbe726))
* **pulumi-aws:** support array of domain strings ([1f9d8a5](https://github.com/webiny/webiny-js/commit/1f9d8a530bc589fc31e0c7ce71935a8f0c45170d))
* rename `pulumi-app` to `pulumi` ([42f1d4f](https://github.com/webiny/webiny-js/commit/42f1d4f37ede9d68b437fbe09e2125670a579c82))
* update comments ([f9a1d60](https://github.com/webiny/webiny-js/commit/f9a1d602fe81bd96766056a2a14df1aa00140705))
* use `PulumiAppInput` only from `@webiny/pulumi` package ([df34d31](https://github.com/webiny/webiny-js/commit/df34d31e14b19df1f2f88c6dc1f58b9ae378b486))
* use pulumi.all instead of Promise.all ([ddb0cc8](https://github.com/webiny/webiny-js/commit/ddb0cc872178d19e8fee1d1d8d40b342baee05cd))
* **pulumi-aws:** update config in a type safe manner ([b49d14b](https://github.com/webiny/webiny-js/commit/b49d14b0434698a27a8c98beabbe7fe08b1f3d1c))


### Features

* **pulumi:** add support for remote resources ([d64eac1](https://github.com/webiny/webiny-js/commit/d64eac110d632faa4f3128f405248ed5ce004f42))
* introduce `@webiny/serverless-cms-aws` package ([55bc800](https://github.com/webiny/webiny-js/commit/55bc800102c791d048ce98c6b2a25f14809a2aa5))
* remove `code` folder ([4930ac1](https://github.com/webiny/webiny-js/commit/4930ac1baf61de25635a8a02589e3bd28bf49556))
* simplify prerendering internals and data structure ([#2478](https://github.com/webiny/webiny-js/issues/2478)) ([91b4cd2](https://github.com/webiny/webiny-js/commit/91b4cd2590993624136e5b9b82ae534a83933fee))
* simplify project structure ([4f3a75b](https://github.com/webiny/webiny-js/commit/4f3a75b0b1028e42689b7ea69a3e25925b7b3689))
