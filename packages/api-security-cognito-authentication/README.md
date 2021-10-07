# @webiny/api-security-cognito-authentication
[![](https://img.shields.io/npm/dw/@webiny/api-security-cognito-authentication.svg)](https://www.npmjs.com/package/@webiny/api-security-cognito-authentication)
[![](https://img.shields.io/npm/v/@webiny/api-security-cognito-authentication.svg)](https://www.npmjs.com/package/@webiny/api-security-cognito-authentication)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A collection of plugins that enables [Amazon Cognito](https://aws.amazon.com/cognito/) based authentication in [`@webiny/handler`](../handler) handlers.

## Install
```
npm install --save @webiny/api-security @webiny/api-security-cognito-authentication
```

Or if you prefer yarn:
```
yarn add @webiny/api-security @webiny/api-security-cognito-authentication
```

## Quick Example

The set up process consists only of a single step, and that's adding the plugins in your handler:

```ts
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import logsPlugins from "@webiny/handler-logs";
import securityPlugins, { SecurityIdentity } from "@webiny/api-security";
import cognitoAuthenticationPlugins from "@webiny/api-security-cognito-authentication";

// Imports plugins created via scaffolding utilities.
import scaffoldsPlugins from "./plugins/scaffolds";

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        securityPlugins(),
        cognitoAuthenticationPlugins({
            region: process.env.COGNITO_REGION,
            userPoolId: process.env.COGNITO_USER_POOL_ID,
            identityType: "user",
        }),
        logsPlugins(),
        graphqlPlugins({ debug }),
        scaffoldsPlugins()
    ],
    http: { debug }
});
```

With all of the plugins in place, you should be able to retrieve the current identity in your handler application code, via the `context.security` object:

```ts
const identity = context.security.getIdentity()
```
