# @webiny/api-page-builder-aco

[![](https://img.shields.io/npm/dw/@webiny/api-page-builder-aco.svg)](https://www.npmjs.com/package/@webiny/api-page-builder-aco)
[![](https://img.shields.io/npm/v/@webiny/api-page-builder-aco.svg)](https://www.npmjs.com/package/@webiny/api-page-builder-aco)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Install

```
npm install --save @webiny/api-page-builder-aco
```

Or if you prefer yarn:

```
yarn add @webiny/api-page-builder-aco
```
## Testing

To run tests api-page-builder-aco tests with targeted storage operations loaded use:

### DynamoDB

```
yarn test packages/api-page-builder-aco/* --keyword=cms:ddb --keyword=aco:base --keyword=pb:ddb --keyword=pb:base --keyword=api-page-builder-aco:base
```

### DynamoDB + ElasticSearch

```
yarn test packages/api-page-builder-aco/* --keyword=cms:ddb-es --keyword=aco:base --keyword=pb:ddb-es --keyword=pb:base --keyword=api-page-builder-aco:base
```