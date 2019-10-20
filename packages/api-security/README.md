# @webiny/api-security
[![](https://img.shields.io/npm/dw/@webiny/api-security.svg)](https://www.npmjs.com/package/@webiny/api-security) 
[![](https://img.shields.io/npm/v/@webiny/api-security.svg)](https://www.npmjs.com/package/@webiny/api-security)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

The API for the [Webiny Security (@webiny/app-security)](../app-security) app. 
  
## Install
```
npm install --save @webiny/api-security
```

Or if you prefer yarn: 
```
yarn add @webiny/api-security
```

## Security installation
Installation mutation can be executed when certain conditions are met:
- there must be no existing users in the Webiny DB, or...
- there must be no existing users in the 3rd party auth provider, or...
- all of the above

If the above conditions are met, you can execute an `install` mutation
to create a new user with `full-access` role (a root user).

The logic behind user creation is built with the following scenarios in mind.
Say you want to create a new user with `admin@webiny.com` email:
1) if a matching user is NOT FOUND in the Webiny DB, but is FOUND in auth provider,
    a new local user is created. Auth provider user remains intact.
2) if a matching user is FOUND in the Webiny DB but is NOT FOUND in auth provider,
    a new user is created on your auth provider, and the local user's data is updated
    with the new firstName/lastName.
3) if a matching user is NOT FOUND anywhere, a new user is first created in the Webiny DB,
    and after that, a new user is created in your auth provider.
