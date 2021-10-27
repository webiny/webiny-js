# @webiny/app-cognito-authenticator

[![](https://img.shields.io/npm/dw/app-cognito-authenticator.svg)](https://www.npmjs.com/package/app-cognito-authenticator)
[![](https://img.shields.io/npm/v/app-cognito-authenticator.svg)](https://www.npmjs.com/package/app-cognito-authenticator)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This is a utility package which serves as a base for building custom signup/signin UI based on Amplify Auth and AWS Cognito, in context of Webiny Admin Area. 

It provides an <Authenticator> component, and a bunch of hooks to use in your custom UI. They contain the necessary logic and state transitions; you only need to hook them up to your UI components:

- useAuthenticator
- useForgotPassword
- useRequireNewPassword
- useSetNewPassword
- useSignedIn
- useSignIn

## Where is it used?

Currently, this packaged is used in [@webiny/app-admin-cognito](../app-security-admin-cognito).
