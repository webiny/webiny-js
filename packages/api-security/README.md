# @webiny/api-security
[![](https://img.shields.io/npm/dw/@webiny/api-security.svg)](https://www.npmjs.com/package/@webiny/api-security)
[![](https://img.shields.io/npm/v/@webiny/api-security.svg)](https://www.npmjs.com/package/@webiny/api-security)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A collection of plugins that sets up the [Webiny Security Framework](https://www.webiny.com/docs/key-topics/security-framework/introduction) in [`@webiny/handler`](../handler) handlers.

## Install
```
npm install --save @webiny/api-security
```

Or if you prefer yarn:
```
yarn add @webiny/api-security
```

## Quick Example

The first step is to add the security plugins in your handler, for example:

```ts
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import logsPlugins from "@webiny/handler-logs";
import securityPlugins from "@webiny/api-security";

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        // Webiny Security Framework plugins are registered here.
        securityPlugins(),
        
        logsPlugins(),
        graphqlPlugins({ debug })
    ],
    debug
});
```

Next, for type-safety and easier discovery down the road, it's recommended you update the main `Context` interface that describes the handler's `context` object. In Webiny projects, the interface can be found in `types.ts` file, for example `apps/api/graphql/src/types.ts` or `apps/api/headlessCMS/src/types.ts`. 

```ts
import { Context as BaseContext } from "@webiny/handler/types";
import { ClientContext } from "@webiny/handler-client/types";

// Import the `SecurityContext` from `@webiny/api-security/types`.
import { SecurityContext } from "@webiny/api-security/types";

export interface Context
    extends BaseContext,
        
        // Simply add the interface like to the list.
        SecurityContext {}
```

Finally, the security doesn't do much on its own. So, the final step would be to also add the appropriate package that implements the necessary internal processes for your identity provider, for example [`@webiny/api-security-cognito-authentication`](../api-security-cognito-authentication):

```ts
import { createHandler } from "@webiny/handler-aws";
import graphqlPlugins from "@webiny/handler-graphql";
import logsPlugins from "@webiny/handler-logs";
import securityPlugins, { SecurityIdentity } from "@webiny/api-security";
import cognitoAuthenticationPlugins from "@webiny/api-security-cognito-authentication";

const debug = process.env.DEBUG === "true";

export const handler = createHandler({
    plugins: [
        // Webiny Security Framework plugins are registered here.
        securityPlugins(),
        
        // Add Amazon Cognito authentication plugins.
        cognitoAuthenticationPlugins({
            region: process.env.COGNITO_REGION,
            userPoolId: process.env.COGNITO_USER_POOL_ID,
            identityType: "user",
        }),
        logsPlugins(),
        graphqlPlugins({ debug })
    ],
    debug
});
```

For more information on the Amazon Cognito plugins and all of the available configuration parameters, check the [`@webiny/api-security-cognito-authentication`](../api-security-cognito-authentication) package.
