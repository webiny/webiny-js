# @webiny/system-upgrade
[![](https://img.shields.io/npm/dw/@webiny/system-upgrade.svg)](https://www.npmjs.com/package/@webiny/system-upgrade) 
[![](https://img.shields.io/npm/v/@webiny/system-upgrade.svg)](https://www.npmjs.com/package/@webiny/system-upgrade)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of upgrade utils, plugins and types.


Each application will need to maintain its own upgrade plugins, this package is just help to ease the running of the upgrade plugins and to check if upgrade is actually necessary.

#### Usage


```ts
// register your upgrade plugins
context.plugins.register([
    upgrade500beta2(),
    upgrade500beta3(),
    upgrade500beta4(),
]);

// will find the first available upgrade and return true in that case
const isSystemUpgradeable = await isSystemUpgradeable(context);
if (isSystemUpgradeable) {
    // run the upgrade
    await systemUpgrade(context);
}
```