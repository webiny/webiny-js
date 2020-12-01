# @webiny/api-security-user-management
[![](https://img.shields.io/npm/dw/@webiny/api-security.svg)](https-user-management://www.npmjs.com/package/@webiny/api-security)-user-management 
[![](https://img.shields.io/npm/v/@webiny/api-security.svg)](https-user-management://www.npmjs.com/package/@webiny/api-security)-user-management
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The API for the [Webiny Security (@webiny/app-security)](../app-security) app. 
  
## Install
```
npm install --save @webiny/api-security-user-management
```

Or if you prefer yarn: 
```
yarn add @webiny/api-security-user-management
```

## Security installation
Installation mutation can be executed when there are no existing users in the Webiny DB.

When you execute an `install` mutation, it will create a new user with `full-access` role (a root user).