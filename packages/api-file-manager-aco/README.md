# @webiny/api-file-manager-aco

[![](https://img.shields.io/npm/dw/@webiny/api-file-manager-aco.svg)](https://www.npmjs.com/package/@webiny/api-file-manager-aco)
[![](https://img.shields.io/npm/v/@webiny/api-file-manager-aco.svg)](https://www.npmjs.com/package/@webiny/api-file-manager-aco)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Install

```
npm install --save @webiny/api-file-manager-aco
```

Or if you prefer yarn:

```
yarn add @webiny/api-file-manager-aco
```
## Testing

To run tests api-file-manager-aco tests with targeted storage operations loaded use:

### DynamoDB

```
yarn test packages/api-file-manager-aco/* --keyword=cms:ddb --keyword=aco:base --keyword=fm:ddb --keyword=fm:base --keyword=api-file-manager-aco:base
```

### DynamoDB + ElasticSearch

```
yarn test packages/api-file-manager-aco/* --keyword=cms:ddb-es --keyword=aco:base --keyword=fm:ddb-es --keyword=fm:base --keyword=api-file-manager-aco:base
```