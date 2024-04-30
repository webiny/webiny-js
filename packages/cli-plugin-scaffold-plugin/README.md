# @webiny/cli-plugin-scaffold-plugin

[![](https://img.shields.io/npm/dw/@webiny/cli-plugin-scaffold-plugin.svg)](https://www.npmjs.com/package/@webiny/cli-plugin-scaffold-plugin)
[![](https://img.shields.io/npm/v/@webiny/cli-plugin-scaffold-plugin.svg)](https://www.npmjs.com/package/@webiny/cli-plugin-scaffold-plugin)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A plugin for @webiny/cli-plugin-scaffold that generates a simple React component.

## Install

```
yarn add @webiny/cli-plugin-scaffold-plugin
```

Add the plugin to your project by editing `webiny.project.js`:

```js
module.exports = {
  projectName: "my-project",
  cli: {
    plugins: [require("@webiny/cli-plugin-scaffold-plugin").default(),]
  }
};
```
