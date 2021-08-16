# @webiny/cli-plugin-scaffold-admin-app-module

[![](https://img.shields.io/npm/dw/@webiny/cli-plugin-scaffold-admin-app-module.svg)](https://www.npmjs.com/package/@webiny/cli-plugin-scaffold-admin-app-module)
[![](https://img.shields.io/npm/v/@webiny/cli-plugin-scaffold-admin-app-module.svg)](https://www.npmjs.com/package/@webiny/cli-plugin-scaffold-admin-app-module)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A plugin for @webiny/cli-plugin-scaffold that adds an Admin app module that connects to the GraphQL service.

## Install

```
yarn add @webiny/cli-plugin-scaffold-admin-app-module
```

Add plugin to your project by editing `webiny.project.js`:

```js
module.exports = {
  projectName: "my-project",
  cli: {
    plugins: [require("@webiny/cli-plugin-scaffold-admin-app-module").default(),]
  }
};
```
