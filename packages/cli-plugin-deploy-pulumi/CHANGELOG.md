# Change Log

All notable changes to this project will be documented in this file.
See [Conventional Commits](https://conventionalcommits.org) for commit guidelines.

# [5.0.0](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.5...v5.0.0) (2021-03-09)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.5](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.4...v5.0.0-beta.5) (2021-03-09)


### Bug Fixes

* change env variable name ([0ac1274](https://github.com/webiny/webiny-js/commit/0ac1274352cc47c9c52bfa6653157fd145248663))
* improve error message ([4c95452](https://github.com/webiny/webiny-js/commit/4c954525ac7f1f147d0563f9742e02737fe5aabb))
* make notifications work on Windows after deploy ([2b9bec3](https://github.com/webiny/webiny-js/commit/2b9bec31fab685cbdb7e1fc0826520de8909a92f))
* remove redundant login call ([443ae74](https://github.com/webiny/webiny-js/commit/443ae742cc183f3e0b9eeb00bb2ab10ccc92ccc1))
* remove standalone "pulumi" command ([b95ca1e](https://github.com/webiny/webiny-js/commit/b95ca1e5c06245ee07bb73b9680be3b74ba66aab))
* use "--" for passing Pulumi commands ([0b90316](https://github.com/webiny/webiny-js/commit/0b903165dfd9b3cef66d0bfbb60c8450bab3c4df))


### Features

* add login calls ([69887d0](https://github.com/webiny/webiny-js/commit/69887d0d2be100003d1b398f82ea4b40bed2180d))
* automatically login when deploying stacks ([a3ba451](https://github.com/webiny/webiny-js/commit/a3ba45113bbd16d4f8d45bfb4fb4e064d93fb87d))
* create login function ([db42819](https://github.com/webiny/webiny-js/commit/db42819edbccecbd53409926fa39dbccff246af6))
* forward `WEBINY_ENV` variable into Pulumi code ([0e065aa](https://github.com/webiny/webiny-js/commit/0e065aa6510e2982cb728538919890ad411c30f3))
* remove `app` commands section ([ed277d4](https://github.com/webiny/webiny-js/commit/ed277d447de91875bf0543d7d007afe390b61bd3))
* resource tagging and custom infra setups ([#1474](https://github.com/webiny/webiny-js/issues/1474)) ([46da034](https://github.com/webiny/webiny-js/commit/46da034badccd67adb6cf24196c708a8790c6a84))





# [5.0.0-beta.4](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.3...v5.0.0-beta.4) (2021-02-01)


### Bug Fixes

* skip first line when parsing stack JSON output ([a53d9ce](https://github.com/webiny/webiny-js/commit/a53d9ce6c79c99445d0962b2af91de0dc69dea70))
* use first "{" as the delimiter ([cd33904](https://github.com/webiny/webiny-js/commit/cd33904e85ac3ee50afbbdcff33b7cda3dec985f))





# [5.0.0-beta.3](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.2...v5.0.0-beta.3) (2021-02-01)


### Bug Fixes

* execute Webiny CLI with "yarn" ([5e7e44f](https://github.com/webiny/webiny-js/commit/5e7e44f43a6b42b362dc52789843a1dd6f249bd2))





# [5.0.0-beta.2](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.1...v5.0.0-beta.2) (2021-01-29)


### Bug Fixes

* **cli-plugin-deploy-pulumi:** rename stack to app ([946c109](https://github.com/webiny/webiny-js/commit/946c109ce02a31c1c044f736b73b1d8c69eb08cb))
* improve error message ([a04c836](https://github.com/webiny/webiny-js/commit/a04c8364c5fb3fc6dd87b103ee59828dd32d490a))
* pass `pulumi` command as string ([c49aa4a](https://github.com/webiny/webiny-js/commit/c49aa4ad9ada36fc3a4d41b132dbc666c6b3cf8d))
* rename `stack` to `app` ([f7b1655](https://github.com/webiny/webiny-js/commit/f7b16550ec1ecd5e45ca6734ccadd41d18bbd43b))
* reword descriptions ([50a5def](https://github.com/webiny/webiny-js/commit/50a5deffb0d213ae3e4ca159da5d8fc212586d6b))
* set `secretsProvider` via `env` variables ([be537c4](https://github.com/webiny/webiny-js/commit/be537c44fbbc4112a4f5baf422bb86d7c6008468))
* unify messaging ([6faee8c](https://github.com/webiny/webiny-js/commit/6faee8cc908c253b099821c17495533ba36cff68))
* use `ws run build` ([bfb53d2](https://github.com/webiny/webiny-js/commit/bfb53d25c71c6138476e0b7e49df9419e34a867e))
* use CLI context for logging ([5f450ee](https://github.com/webiny/webiny-js/commit/5f450ee9bd722e30a277d34223f62ebe61054ed8))
* **cli-plugin-deploy-pulumi:** minor messaging changes ([b2da341](https://github.com/webiny/webiny-js/commit/b2da3417fad7831cdf85fc7208b9fa631f5bdeb0))
* **cli-plugin-deploy-pulumi:** use forward slashes in stack dir ([5d1f6f9](https://github.com/webiny/webiny-js/commit/5d1f6f96427e651bb2d6e7dd3e0c1123580acd74))





# [5.0.0-beta.1](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.0...v5.0.0-beta.1) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.0](https://github.com/webiny/webiny-js/compare/v4.14.0...v5.0.0-beta.0) (2021-01-08)


### Bug Fixes

* adapt Pulumi arguments ([d758707](https://github.com/webiny/webiny-js/commit/d7587079cc5955681bf0d5953a2d67ad788b66c9))
* adapt to latest `pulumi-sdk` changes ([e76b2d7](https://github.com/webiny/webiny-js/commit/e76b2d79d854cb05ba035c69849cb2cac59de54e))
* adapt to newest `pulumi-sdk` changes ([7558088](https://github.com/webiny/webiny-js/commit/7558088010e9f9691acffadec18f656f5728dee0))
* adapt to recent `pulumi-sdk` changes ([19d0160](https://github.com/webiny/webiny-js/commit/19d0160570a41950e955e2fc4e494f7732896040))
* add `execute` plugin property ([a1dbfd5](https://github.com/webiny/webiny-js/commit/a1dbfd524c9903f88277cf5e30a0b9bfdd65c5d7))
* add missing / remove redundant dependencies ([cdc8c39](https://github.com/webiny/webiny-js/commit/cdc8c3980890834f4c4d0d6beee372525f18cad6))
* change icon (weird spacing with the previous one) ([abe9be6](https://github.com/webiny/webiny-js/commit/abe9be621b9a3abd1bbb1e01f8f4b14959ddaf22))
* check AWS credentials and region before deployment ([f49c6fa](https://github.com/webiny/webiny-js/commit/f49c6fa5855274c7c3a4a9310eb416d25c2e05c2))
* cleanup args ([23021a8](https://github.com/webiny/webiny-js/commit/23021a8c29f8aace81392bf87331753f0ceb0ef9))
* create `stack` command ([c5313e3](https://github.com/webiny/webiny-js/commit/c5313e3cb7aaf870fdf6704a56922d2fae188660))
* enable returning output as a JSON ([a0f18c9](https://github.com/webiny/webiny-js/commit/a0f18c9b2f2727d7c306f1b6a51b44484ff377e4))
* ensure Pulumi is installed ([cd4bacf](https://github.com/webiny/webiny-js/commit/cd4bacf042285ac0cf3c2756fb30c8d72be42a8e))
* execute command directly instead of doing it via plugins ([9d53823](https://github.com/webiny/webiny-js/commit/9d538234076600bece10178ab8dd489051a7ca28))
* execute command from project-root ([b81a3e8](https://github.com/webiny/webiny-js/commit/b81a3e85377536c6a3a8b2bc1cd843367d5fcd1e))
* execute command from project-root ([3c0f4d5](https://github.com/webiny/webiny-js/commit/3c0f4d5fd3e0ed021283ba4f26e56210fb33fe39))
* first instantiate and then execute `run` ([f6525fe](https://github.com/webiny/webiny-js/commit/f6525fed1088dec877c53562ba2fd32b24dba0e9))
* forward original pulumi output to stdout ([5fba9c3](https://github.com/webiny/webiny-js/commit/5fba9c35b3f4b3b9eb90bc50add7c22b4b2f631f))
* improve error messaging ([cd8b67d](https://github.com/webiny/webiny-js/commit/cd8b67d3be687aada6cf1fc70b18a0a4c03b3b99))
* improve messaging ([15a27e6](https://github.com/webiny/webiny-js/commit/15a27e665e03d225d2e413e42f5efc7d1e68487d))
* improve messaging ([b5dc28c](https://github.com/webiny/webiny-js/commit/b5dc28c36b7b8ecd14be5e27ea4b3e704d082414))
* move aws CLI plugins to cwp-template-full ([8f39101](https://github.com/webiny/webiny-js/commit/8f391019ff18c3e06d90c4a7cfe141f4277c6bdb))
* only execute hook for `api` stack ([7cadc66](https://github.com/webiny/webiny-js/commit/7cadc6680e2f934d627402e01cce0c89883c2d28))
* pass env ([6f8980c](https://github.com/webiny/webiny-js/commit/6f8980c991c7cbcd4b0c45d40718ff5d40bc44fa))
* pass region to config Pulumi files ([5bea518](https://github.com/webiny/webiny-js/commit/5bea5189729ccc0c528a3c590a4ca82849ba1b17))
* prettier and eslint run for v5 ([3069a33](https://github.com/webiny/webiny-js/commit/3069a33ccef2fd3767818b274a730df28cecaf5b))
* remove `execute` property ([c4294ac](https://github.com/webiny/webiny-js/commit/c4294acf2ea1426bd65afe63f49e06ef6fc44281))
* remove `sleep` calls ([e88b5d5](https://github.com/webiny/webiny-js/commit/e88b5d580521a5fb0bbf7c6352590830660c3670))
* remove `updateEnvValues` ([2d0d03b](https://github.com/webiny/webiny-js/commit/2d0d03b668d2ae6185a25cc0197dfcceb1edd496))
* remove any mention of MongoDb ([b3193cb](https://github.com/webiny/webiny-js/commit/b3193cb3016b58d8e6f95f7558af34a6f588b3c8))
* remove build phase ([28eae01](https://github.com/webiny/webiny-js/commit/28eae011821e314ae5a809f536f9ccdff2f13d96))
* remove destroy ([7431736](https://github.com/webiny/webiny-js/commit/7431736327676af62a62770ec0486d4c0d91ef9e))
* remove new line ([84f1b83](https://github.com/webiny/webiny-js/commit/84f1b833a5e9d6e2d2c398c87ef066fd4a65a3cc))
* remove options ([cdf40e2](https://github.com/webiny/webiny-js/commit/cdf40e2bc7bb32425f47b3a0c9d7fd8d8ed41531))
* remove setting `aws:region` to Pulumi.yaml ([8b4a425](https://github.com/webiny/webiny-js/commit/8b4a425d38f8c329f2abd693c2cf4a8029eac098))
* rename `cwp-template-full` to `cwp-template-aws` ([9ad9e6c](https://github.com/webiny/webiny-js/commit/9ad9e6c3da732feba1e8292cc238fde606302227))
* rename `folder` to `stack` ([984e405](https://github.com/webiny/webiny-js/commit/984e40556c8c43332982ce9c1113eac069d5b55f))
* rename `folder` to `stack` ([765ee96](https://github.com/webiny/webiny-js/commit/765ee96478ec620f8ca4ef54df7eb2f9317750a2))
* rename `remove` to `destroy` ([d1537f3](https://github.com/webiny/webiny-js/commit/d1537f301ae0f0fd8b740faf11f94eaf8f92d5f4))
* rename `remove` to `destroy` ([289a990](https://github.com/webiny/webiny-js/commit/289a99011c0af401e318b92e31c2cb42d2cbf162))
* rename `remove` to `destroy` ([24dacd0](https://github.com/webiny/webiny-js/commit/24dacd05e7661624515fc9e657c9e080e568f66e))
* reorganize utils ([23c50cd](https://github.com/webiny/webiny-js/commit/23c50cd75e083fd9d867b93d0cc8482f76ab2e66))
* return plain object instead of an array ([472a642](https://github.com/webiny/webiny-js/commit/472a642a36078d88033d3b714f64d8fdc9400738))
* simplify message (remove word "binaries") ([868f304](https://github.com/webiny/webiny-js/commit/868f3042b7dd7b68cf86cc5db11f717f26be8248))
* throw errors on missing args ([2c0b3a2](https://github.com/webiny/webiny-js/commit/2c0b3a21cb67e0caf415abe61f8d189410f4bbb9))
* update command execution (used old approach) ([ce9cf88](https://github.com/webiny/webiny-js/commit/ce9cf88d8fb29047d96f2f76775d779dc7473750))
* update dependencies ([d61dc8d](https://github.com/webiny/webiny-js/commit/d61dc8d454c5073f7553a3f5873b7c1e5ee578fb))
* update dependencies ([95f567d](https://github.com/webiny/webiny-js/commit/95f567df98d00596b3a52484b765ffcc28af11f3))
* update dependencies ([e32454c](https://github.com/webiny/webiny-js/commit/e32454c14c95f5a5f5ee4114126fd3b92020346c))
* update exports ([516056b](https://github.com/webiny/webiny-js/commit/516056bcbd2cda025980e1f513fff069eaedda97))
* update labels ([1f4c4c2](https://github.com/webiny/webiny-js/commit/1f4c4c2a58d720bae76e2b78088c9246df0924ad))
* use the `toConsole` function ([00b2361](https://github.com/webiny/webiny-js/commit/00b23611cc60c9b9ba17e10304605062a456cc59))
* utilize newly create utils ([d3a458a](https://github.com/webiny/webiny-js/commit/d3a458a166823a30e3fa37a3ba1ad3a4596940cb))


### Features

* add `getPulumi` helper ([5e7d31b](https://github.com/webiny/webiny-js/commit/5e7d31b8abc97514352fae132d40670231dbc580))
* add `webiny pulumi -- ...` command ([a71986e](https://github.com/webiny/webiny-js/commit/a71986ec8d922e584dbb532981aa8a5f78cce305))
* **app-page-builder:** switch redux for recoil ([a1c5f18](https://github.com/webiny/webiny-js/commit/a1c5f18e271d27a6e65a912014de66dc048741a9))
* add Elastic domain setup ([2205343](https://github.com/webiny/webiny-js/commit/220534345830ce216bc82667f2d3d6390df8d9e8))
* add ES service role creation plugin ([72baddb](https://github.com/webiny/webiny-js/commit/72baddbe1ff89a0cff0047508183f0678988bb53))
* introduce cli-plugin-deploy-pulumi ([6e2a61e](https://github.com/webiny/webiny-js/commit/6e2a61e04b99322e7dbe00e41836fda101fcdc89))





# [5.0.0-beta.52](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.51...v5.0.0-beta.52) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.51](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.50...v5.0.0-beta.51) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.50](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.49...v5.0.0-beta.50) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.49](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.48...v5.0.0-beta.49) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.48](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.47...v5.0.0-beta.48) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.47](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.46...v5.0.0-beta.47) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.46](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.45...v5.0.0-beta.46) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.45](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.44...v5.0.0-beta.45) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.44](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.43...v5.0.0-beta.44) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.36](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.35...v5.0.0-beta.36) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.35](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.34...v5.0.0-beta.35) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.34](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.33...v5.0.0-beta.34) (2021-01-08)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.33](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.32...v5.0.0-beta.33) (2021-01-08)


### Bug Fixes

* remove any mention of MongoDb ([b3193cb](https://github.com/webiny/webiny-js/commit/b3193cb3016b58d8e6f95f7558af34a6f588b3c8))
* rename `cwp-template-full` to `cwp-template-aws` ([9ad9e6c](https://github.com/webiny/webiny-js/commit/9ad9e6c3da732feba1e8292cc238fde606302227))
* throw errors on missing args ([2c0b3a2](https://github.com/webiny/webiny-js/commit/2c0b3a21cb67e0caf415abe61f8d189410f4bbb9))





# [5.0.0-beta.32](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.31...v5.0.0-beta.32) (2021-01-06)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.31](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.30...v5.0.0-beta.31) (2021-01-06)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.30](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.29...v5.0.0-beta.30) (2021-01-06)


### Bug Fixes

* update dependencies ([d61dc8d](https://github.com/webiny/webiny-js/commit/d61dc8d454c5073f7553a3f5873b7c1e5ee578fb))





# [5.0.0-beta.29](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.28...v5.0.0-beta.29) (2021-01-06)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.28](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.27...v5.0.0-beta.28) (2021-01-06)

**Note:** Version bump only for package @webiny/cli-plugin-deploy-pulumi





# [5.0.0-beta.27](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.26...v5.0.0-beta.27) (2021-01-06)


### Bug Fixes

* execute command directly instead of doing it via plugins ([9d53823](https://github.com/webiny/webiny-js/commit/9d538234076600bece10178ab8dd489051a7ca28))
* remove `execute` property ([c4294ac](https://github.com/webiny/webiny-js/commit/c4294acf2ea1426bd65afe63f49e06ef6fc44281))





# [5.0.0-beta.26](https://github.com/webiny/webiny-js/compare/v5.0.0-beta.25...v5.0.0-beta.26) (2021-01-06)


### Bug Fixes

* add `execute` plugin property ([a1dbfd5](https://github.com/webiny/webiny-js/commit/a1dbfd524c9903f88277cf5e30a0b9bfdd65c5d7))
* create `stack` command ([c5313e3](https://github.com/webiny/webiny-js/commit/c5313e3cb7aaf870fdf6704a56922d2fae188660))
* enable returning output as a JSON ([a0f18c9](https://github.com/webiny/webiny-js/commit/a0f18c9b2f2727d7c306f1b6a51b44484ff377e4))
* ensure Pulumi is installed ([cd4bacf](https://github.com/webiny/webiny-js/commit/cd4bacf042285ac0cf3c2756fb30c8d72be42a8e))
* execute command from project-root ([b81a3e8](https://github.com/webiny/webiny-js/commit/b81a3e85377536c6a3a8b2bc1cd843367d5fcd1e))
* execute command from project-root ([3c0f4d5](https://github.com/webiny/webiny-js/commit/3c0f4d5fd3e0ed021283ba4f26e56210fb33fe39))
* move aws CLI plugins to cwp-template-aws ([8f39101](https://github.com/webiny/webiny-js/commit/8f391019ff18c3e06d90c4a7cfe141f4277c6bdb))
* remove `updateEnvValues` ([2d0d03b](https://github.com/webiny/webiny-js/commit/2d0d03b668d2ae6185a25cc0197dfcceb1edd496))
* remove destroy ([7431736](https://github.com/webiny/webiny-js/commit/7431736327676af62a62770ec0486d4c0d91ef9e))
* reorganize utils ([23c50cd](https://github.com/webiny/webiny-js/commit/23c50cd75e083fd9d867b93d0cc8482f76ab2e66))
* update dependencies ([95f567d](https://github.com/webiny/webiny-js/commit/95f567df98d00596b3a52484b765ffcc28af11f3))
* update exports ([516056b](https://github.com/webiny/webiny-js/commit/516056bcbd2cda025980e1f513fff069eaedda97))
* update labels ([1f4c4c2](https://github.com/webiny/webiny-js/commit/1f4c4c2a58d720bae76e2b78088c9246df0924ad))
* utilize newly create utils ([d3a458a](https://github.com/webiny/webiny-js/commit/d3a458a166823a30e3fa37a3ba1ad3a4596940cb))


### Features

* add `getPulumi` helper ([5e7d31b](https://github.com/webiny/webiny-js/commit/5e7d31b8abc97514352fae132d40670231dbc580))
* add `webiny pulumi -- ...` command ([a71986e](https://github.com/webiny/webiny-js/commit/a71986ec8d922e584dbb532981aa8a5f78cce305))





# [5.0.0-beta.10](https://github.com/webiny/webiny-js/compare/v4.14.0...v5.0.0-beta.10) (2021-01-04)


### Bug Fixes

* adapt Pulumi arguments ([d758707](https://github.com/webiny/webiny-js/commit/d7587079cc5955681bf0d5953a2d67ad788b66c9))
* adapt to latest `pulumi-sdk` changes ([e76b2d7](https://github.com/webiny/webiny-js/commit/e76b2d79d854cb05ba035c69849cb2cac59de54e))
* adapt to newest `pulumi-sdk` changes ([7558088](https://github.com/webiny/webiny-js/commit/7558088010e9f9691acffadec18f656f5728dee0))
* adapt to recent `pulumi-sdk` changes ([19d0160](https://github.com/webiny/webiny-js/commit/19d0160570a41950e955e2fc4e494f7732896040))
* add missing / remove redundant dependencies ([cdc8c39](https://github.com/webiny/webiny-js/commit/cdc8c3980890834f4c4d0d6beee372525f18cad6))
* change icon (weird spacing with the previous one) ([abe9be6](https://github.com/webiny/webiny-js/commit/abe9be621b9a3abd1bbb1e01f8f4b14959ddaf22))
* check AWS credentials and region before deployment ([f49c6fa](https://github.com/webiny/webiny-js/commit/f49c6fa5855274c7c3a4a9310eb416d25c2e05c2))
* cleanup args ([23021a8](https://github.com/webiny/webiny-js/commit/23021a8c29f8aace81392bf87331753f0ceb0ef9))
* first instantiate and then execute `run` ([f6525fe](https://github.com/webiny/webiny-js/commit/f6525fed1088dec877c53562ba2fd32b24dba0e9))
* forward original pulumi output to stdout ([5fba9c3](https://github.com/webiny/webiny-js/commit/5fba9c35b3f4b3b9eb90bc50add7c22b4b2f631f))
* improve error messaging ([cd8b67d](https://github.com/webiny/webiny-js/commit/cd8b67d3be687aada6cf1fc70b18a0a4c03b3b99))
* improve messaging ([15a27e6](https://github.com/webiny/webiny-js/commit/15a27e665e03d225d2e413e42f5efc7d1e68487d))
* improve messaging ([b5dc28c](https://github.com/webiny/webiny-js/commit/b5dc28c36b7b8ecd14be5e27ea4b3e704d082414))
* only execute hook for `api` stack ([7cadc66](https://github.com/webiny/webiny-js/commit/7cadc6680e2f934d627402e01cce0c89883c2d28))
* pass env ([6f8980c](https://github.com/webiny/webiny-js/commit/6f8980c991c7cbcd4b0c45d40718ff5d40bc44fa))
* pass region to config Pulumi files ([5bea518](https://github.com/webiny/webiny-js/commit/5bea5189729ccc0c528a3c590a4ca82849ba1b17))
* prettier and eslint run for v5 ([3069a33](https://github.com/webiny/webiny-js/commit/3069a33ccef2fd3767818b274a730df28cecaf5b))
* remove `sleep` calls ([e88b5d5](https://github.com/webiny/webiny-js/commit/e88b5d580521a5fb0bbf7c6352590830660c3670))
* remove build phase ([28eae01](https://github.com/webiny/webiny-js/commit/28eae011821e314ae5a809f536f9ccdff2f13d96))
* remove new line ([84f1b83](https://github.com/webiny/webiny-js/commit/84f1b833a5e9d6e2d2c398c87ef066fd4a65a3cc))
* remove options ([cdf40e2](https://github.com/webiny/webiny-js/commit/cdf40e2bc7bb32425f47b3a0c9d7fd8d8ed41531))
* remove setting `aws:region` to Pulumi.yaml ([8b4a425](https://github.com/webiny/webiny-js/commit/8b4a425d38f8c329f2abd693c2cf4a8029eac098))
* rename `folder` to `stack` ([984e405](https://github.com/webiny/webiny-js/commit/984e40556c8c43332982ce9c1113eac069d5b55f))
* rename `folder` to `stack` ([765ee96](https://github.com/webiny/webiny-js/commit/765ee96478ec620f8ca4ef54df7eb2f9317750a2))
* rename `remove` to `destroy` ([d1537f3](https://github.com/webiny/webiny-js/commit/d1537f301ae0f0fd8b740faf11f94eaf8f92d5f4))
* rename `remove` to `destroy` ([289a990](https://github.com/webiny/webiny-js/commit/289a99011c0af401e318b92e31c2cb42d2cbf162))
* rename `remove` to `destroy` ([24dacd0](https://github.com/webiny/webiny-js/commit/24dacd05e7661624515fc9e657c9e080e568f66e))
* return plain object instead of an array ([472a642](https://github.com/webiny/webiny-js/commit/472a642a36078d88033d3b714f64d8fdc9400738))
* simplify message (remove word "binaries") ([868f304](https://github.com/webiny/webiny-js/commit/868f3042b7dd7b68cf86cc5db11f717f26be8248))
* update command execution (used old approach) ([ce9cf88](https://github.com/webiny/webiny-js/commit/ce9cf88d8fb29047d96f2f76775d779dc7473750))
* update dependencies ([e32454c](https://github.com/webiny/webiny-js/commit/e32454c14c95f5a5f5ee4114126fd3b92020346c))
* use the `toConsole` function ([00b2361](https://github.com/webiny/webiny-js/commit/00b23611cc60c9b9ba17e10304605062a456cc59))


### Features

* **app-page-builder:** switch redux for recoil ([a1c5f18](https://github.com/webiny/webiny-js/commit/a1c5f18e271d27a6e65a912014de66dc048741a9))
* add Elastic domain setup ([2205343](https://github.com/webiny/webiny-js/commit/220534345830ce216bc82667f2d3d6390df8d9e8))
* add ES service role creation plugin ([72baddb](https://github.com/webiny/webiny-js/commit/72baddbe1ff89a0cff0047508183f0678988bb53))
* introduce cli-plugin-deploy-pulumi ([6e2a61e](https://github.com/webiny/webiny-js/commit/6e2a61e04b99322e7dbe00e41836fda101fcdc89))
