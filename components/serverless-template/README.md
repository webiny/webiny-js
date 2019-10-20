# @webiny/serverless-template
[![](https://img.shields.io/npm/dw/@webiny/serverless-function.svg)](https://www.npmjs.com/package/@webiny/serverless-function) 
[![](https://img.shields.io/npm/v/@webiny/serverless-function.svg)](https://www.npmjs.com/package/@webiny/serverless-function)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A component to deploy a serverless Webiny template.
This component is a fork of [@serverless/template](https://github.com/serverless/template), therefore, it is published under the original Apache 2.0 license.  

### Why?
The original Template component was not the best fit for our needs, so we forked it and modified the internals to get it to work nicely with Webiny.
The major change is the way components are resolved: they are no longer ever downloaded from `npm`. Instead, they are always resolved using `require.resolve`
from your current working directory. This is particularly important when you're developing in the `webiny/webiny-js` repo. It ensures that all components are resolved 
using the regular node.js mechanism (node_modules).
