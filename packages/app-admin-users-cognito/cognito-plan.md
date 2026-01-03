Use these packages as a reference implementation: `packages/auth0`, `packages/okta`.
Now I need to refactor my current Cognito implementation, to fit the architecture of the two referenced packages.
I need a new package called `cognito`, which will contain all the Cognito-specific logic from: `api-cognito-authenticator`, `api-security-cognito`, `app-admin-cognito`, `app-cognito-authenticator`, `app-admin-users-cognito`.

`api-cognito-authenticator` can be replaced entirely with the new `OidcIdpProvider` class.
This identity logic `packages/api-security-cognito/src/createCognito.ts:48` should be moved to the built-in CognitoIdpConfig class. We will provide this default mapping of identity for users, and they can override it by providing their own implementation.

For code which you don't know how to register, leave it as is, and add a TODO comment for me.
