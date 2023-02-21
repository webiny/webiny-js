# @webiny/api-aco

[![](https://img.shields.io/npm/dw/@webiny/api-aco.svg)](https://www.npmjs.com/package/@webiny/api-aco)
[![](https://img.shields.io/npm/v/@webiny/api-aco.svg)](https://www.npmjs.com/package/@webiny/api-aco)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Install

```
npm install --save @webiny/api-aco
```

Or if you prefer yarn:

```
yarn add @webiny/api-aco
```
## Testing

To run tests api-apw tests with targeted storage operations loaded use:

### DynamoDB

```
yarn test packages/api-aco --keyword=cms:ddb --keyword=aco:base
```

#### Note

> All the tests in `@webiny/api-aco` package are being tested against ddb-only storage operations because
current jest setup doesn't allow usage of more than one storage operations at a time with the help of --keyword flag.
We should revisit these tests once we have the ability to load multiple storage operations in the jest setup.