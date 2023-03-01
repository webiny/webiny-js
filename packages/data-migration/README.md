# @webiny/api-upgrade

[![](https://img.shields.io/npm/dw/@webiny/system-upgrade.svg)](https://www.npmjs.com/package/@webiny/system-upgrade)
[![](https://img.shields.io/npm/v/@webiny/system-upgrade.svg)](https://www.npmjs.com/package/@webiny/system-upgrade)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of upgrade utils, plugins and types.

Each application will need to maintain its own upgrade plugins, this package is just help to ease the running of the upgrade plugins and to check if upgrade is actually necessary.

#### Usage

```ts
// Get your upgrade plugins
const upgradePlugins = context.plugins
  .byType<UpgradePlugin>("api-upgrade")
  .filter(pl => pl.app === "file-manager");

// Run "getApplicablePlugin" to validate and get the applicable plugin
const plugin = getApplicablePlugin({
  deployedVersion: context.WEBINY_VERSION,
  installedAppVersion: "5.0.0",
  upgradePlugins,
  upgradeToVersion: "5.1.0"
});

// Execute your upgrade plugin
await plugin.apply(context);

// If you have input data for your plugin, run it with "data" as second parameter
await plugin.apply(context, data);
```
