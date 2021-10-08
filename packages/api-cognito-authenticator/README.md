# @webiny/api-cognito-authenticator

[![](https://img.shields.io/npm/dw/@webiny/api-cognito-authenticator.svg)](https://www.npmjs.com/package/@webiny/api-cognito-authenticator)
[![](https://img.shields.io/npm/v/@webiny/api-cognito-authenticator.svg)](https://www.npmjs.com/package/@webiny/api-cognito-authenticator)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## About

This is an authenticator for `idToken` JWT received from AWS Cognito. It's not a plugin, but a simple function which you configure with your User Pool, then pass an `idToken` value to it, and if the token is valid, it returns an `Identity` object.

To use it, you can wrap it with a `ContextPlugin` and use in conjunction with `api-authentication` or `api-security` applications, for example.
