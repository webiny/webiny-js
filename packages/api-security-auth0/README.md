# @webiny/api-security-auth0

[![](https://img.shields.io/npm/dw/@webiny/api-security-auth0.svg)](https://www.npmjs.com/package/@webiny/api-security-auth0)
[![](https://img.shields.io/npm/v/@webiny/api-security-auth0.svg)](https://www.npmjs.com/package/@webiny/api-security-auth0)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

In `.env` file, add your Auth0 variables:

```yaml
# Auth0 variables for the API.
AUTH0_DOMAIN=https://dev-12345678.us.auth0.com
AUTH0_CLIENT_ID=111111111111111

# Auth0 variables for React apps (webpack will pick this up).
REACT_APP_AUTH0_DOMAIN=https://dev-12345678.us.auth0.com
REACT_APP_AUTH0_CLIENT_ID=111111111111111
```

Auth0 Action to add custom claims:

```js
/**
 * Handler that will be called during the execution of a PostLogin flow.
 *
 * @param {Event} event - Details about the user and the context in which they are logging in.
 * @param {PostLoginAPI} api - Interface whose methods can be used to change the behavior of the login.
 */
exports.onExecutePostLogin = async (event, api) => {
  if (event.authorization) {
    api.idToken.setCustomClaim(`webiny_group`, event.user.app_metadata.group);
  }
};
```
