<p align="center">
  <img src="https://s3.amazonaws.com/owler-image/logo/webiny_owler_20160228_232453_original.png" width="400" />
</p>

[![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=master)](https://travis-ci.org/Webiny/webiny-js) [![Coverage Status](https://coveralls.io/repos/github/Webiny/webiny-js/badge.svg?branch=master)](https://coveralls.io/github/Webiny/webiny-js?branch=master) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=package.json) <a href="https://prettier.io/"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>

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
 
 ## Packages
 | Package                   | npm | snyk |
 |:--------------------------|:---:|:----:|   
 | webiny-api | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-api%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-api%2Fpackage.json) | 
 | webiny-entity-memory | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-entity-memory%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-entity-memory%2Fpackage.json) | 
 | webiny-entity-mysql | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-entity-mysql%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-entity-mysql%2Fpackage.json) | 
 | webiny-entity | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-entity%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-entity%2Fpackage.json) | 
 | webiny-model | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-model%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-model%2Fpackage.json) | 
 | webiny-sql-query-builder | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-sql-query-builder%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-sql-query-builder%2Fpackage.json) | 
 | webiny-backend-app | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-client%2Fwebiny-backend-app%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-client%2Fwebiny-backend-app%2Fpackage.json) | 
 | webiny-client | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-client%2Fwebiny-client%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-client%2Fwebiny-client%2Fpackage.json) | 
 | webiny-skeleton-app | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-client%2Fwebiny-skeleton-app%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-client%2Fwebiny-skeleton-app%2Fpackage.json) | 
 | webiny-ui | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-client%2Fwebiny-ui%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-client%2Fwebiny-ui%2Fpackage.json) | 
 | webiny-data-extractor | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-data-extractor%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-data-extractor%2Fpackage.json) | 
 | webiny-file-storage | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage%2Fpackage.json) | 
 | webiny-file-storage-local | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage-local%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage-local%2Fpackage.json) | 
 | webiny-scripts | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-scripts%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-scripts%2Fpackage.json) | 
 | webiny-validation | -- | [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-validation%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-validation%2Fpackage.json) | 
