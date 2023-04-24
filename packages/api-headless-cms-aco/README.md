# @webiny/api-headless-cms-aco

[![](https://img.shields.io/npm/dw/@webiny/api-headless-cms-aco.svg)](https://www.npmjs.com/package/@webiny/api-headless-cms-aco)
[![](https://img.shields.io/npm/v/@webiny/api-headless-cms-aco.svg)](https://www.npmjs.com/package/@webiny/api-headless-cms-aco)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Install

```
npm install --save @webiny/api-headless-cms-aco
```

Or if you prefer yarn:

```
yarn add @webiny/api-headless-cms-aco
```
## Testing

To run tests api-headless-cms-aco tests with targeted storage operations loaded use:

### DynamoDB

```
yarn test packages/api-headless-cms-aco/* --keyword=cms:ddb --keyword=cms:base --keyword=cms-aco:base
```

### DynamoDB + ElasticSearch

```
yarn test packages/api-headless-cms-aco/* --keyword=cms:ddb-es --keyword=cms:base --keyword=cms-aco:base
```
