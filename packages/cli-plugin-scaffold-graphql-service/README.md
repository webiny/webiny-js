# @webiny/cli-plugin-scaffold-graphql-service

[![](https://img.shields.io/npm/dw/@webiny/cli-plugin-scaffold-graphql-service.svg)](https://www.npmjs.com/package/@webiny/cli-plugin-scaffold-graphql-service)
[![](https://img.shields.io/npm/v/@webiny/cli-plugin-scaffold-graphql-service.svg)](https://www.npmjs.com/package/@webiny/cli-plugin-scaffold-graphql-service)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A plugin for @webiny/cli-plugin-scaffold that adds a GraphQL service.

## Install

```
yarn add @webiny/cli-plugin-scaffold-graphql-service
```

Add plugin to your project by editing `webiny.project.js`:

```js
module.exports = {
  projectName: "my-project",
  cli: {
    plugins: [require("@webiny/cli-plugin-scaffold-graphql-service").default(),]
  }
};
```
