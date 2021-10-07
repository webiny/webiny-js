# @webiny/app-security-cognito-authentication

[![](https://img.shields.io/npm/dw/webiny-commodo.svg)](https://www.npmjs.com/package/webiny-commodo)
[![](https://img.shields.io/npm/v/webiny-commodo.svg)](https://www.npmjs.com/package/webiny-commodo)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This is a utility package which serves as a base for building custom signup/signin UI based on Amplify Auth and AWS Cofgnito, in context of Webiny Admin Area. It depends on `app-security`, so you can't use it in a random custom app.

It provides an ApolloLink plugin which attaches current identity's `idToken` to every HTTP request, using the `Authorization` header.

It also provides a React context and a bunch of hooks to use in your custom UI. They contain the necessary logic and state transitions; you only need to hook them up to your UI components:

- useAuthenticator
- useForgotPassword
- useRequireNewPassword
- useSetNewPassword
- useSignedIn
- useSignIn

## Where is it used?

Currently, this packaged is used in [@webiny/app-security-admin-users-cognito](../app-security-admin-users-cognito).
