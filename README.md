Webiny JS  [![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=master)](https://travis-ci.org/Webiny/webiny-js) [![Coverage Status](https://coveralls.io/repos/github/Webiny/webiny-js/badge.svg?branch=master)](https://coveralls.io/github/Webiny/webiny-js?branch=master) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/)
===
Our goal is a single web app development platform to develop APIs as well as React apps.

## API layer
API is implemented as an `express` middleware so you can plug it into an existing express app, spin up a new express server or even deploy it using serverless providers.
Last year we have released a PHP version of our API framework, but as JS is constantly growing and `serverless` architecture is gaining more and more momentum we decided we have to board the train and go 100% JS. 

For the past couple of months we have been working on migrating our PHP API philosophy to JS, adapting things to JS environment, writing tons of tests and so far we are very happy with the results. 

## Client layer (SPA)
Our client (SPA) layer is based on React and features over 70+ ready to use components, you can [see and try all of them here](https://www.webiny.com/docs/current/components/alert).

## Database support
So far we are only focused on `MySQL` but our storage layer allows 3rd party drivers.

## Documentation
Documentation is a `work in progress` and will be available when we reach the pre-launch stage.

 ## Project organization
 We have decided to use a `monorepo` organization with multiple `yarn` workspaces to reduce the amount of repo maintenance.
 So far it is working out pretty well but we are still testing the structure. If you have any ideas or suggestions, feel free to get in touch with us. 