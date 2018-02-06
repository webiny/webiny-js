<br/>
<p align="center">
  <img src="https://s3.amazonaws.com/owler-image/logo/webiny_owler_20160228_232453_original.png" width="400" />
  <br/>
  <strong>Web development made easy.</strong>
</p>

# 
[![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=master)](https://travis-ci.org/Webiny/webiny-js) [![Coverage Status](https://coveralls.io/repos/github/Webiny/webiny-js/badge.svg?branch=master)](https://coveralls.io/github/Webiny/webiny-js?branch=master) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=package.json) <a href="https://prettier.io/"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
[<img src="https://user-images.githubusercontent.com/7288322/34429152-141689f8-ecb9-11e7-8003-b5a10a5fcb29.png">](https://discord.gg/ZuZVyc) [![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/Webiny/webiny-js/blob/master/LICENSE)

Webiny is an open-source platform created for building modern web apps.

## Install
More on the `installation` process soon...

## About
Webiny consists of two layers that work closely together.

#### API layer
API is implemented as an `express` middleware so you can plug it into an existing express app, spin up a new express server or even deploy it using serverless providers.
Last year we have released a PHP version of our API framework, but as JS is constantly growing and `serverless` architecture is gaining more and more momentum we decided we have to board the train and go 100% JS. 

For the past couple of months we have been working on migrating our PHP API philosophy to JS, adapting things to JS environment, writing tons of tests and so far we are very happy with the results. 

#### Client layer (SPA)
Our client (SPA) layer is based on React and features over 70+ ready to use components, you can [see and try all of them here](https://www.webiny.com/docs/current/components/alert).  

## Project organization
We have decided to use a `monorepo` organization with multiple `yarn` workspaces to reduce the amount of repo maintenance.
So far it is working out pretty well but we are still testing the structure. If you have any ideas or suggestions, feel free to get in touch with us. 

## Packages
### [API](https://github.com/Webiny/webiny-js/tree/master/packages-api/webiny-api) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-api%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-api%2Fpackage.json)
Express middleware to quickly build powerful REST APIs.
 
### [API Security](https://github.com/Webiny/webiny-js/tree/master/packages-api/webiny-api-security) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-api%2Fwebiny-api-security%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-api%2Fwebiny-api-security%2Fpackage.json)
Provides an app which handles security layer for your project. It includes both authentication and authorization mechanisms.

### [Compose](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-compose) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-compose%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-compose%2Fpackage.json)
Compose multiple functions into a connect-style middleware.
 
### [Data Extractor](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-data-extractor) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-data-extractor%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-data-extractor%2Fpackage.json)
A small library for easy async data extraction, using dot and square brackets notation.

### [Entity](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-entity) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-entity%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-entity%2Fpackage.json)
Entity layer which can work with various database / storage systems like MySQL, MongoDB and even IndexedDB or localStorage if needed.

#### [Memory](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-entity-memory) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-entity-memory%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-entity-memory%2Fpackage.json)
A in-memory driver for `webiny-entity`.

#### [MySQL](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-entity-mysql) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-entity-mysql%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-entity-mysql%2Fpackage.json)
A MySQL driver for `webiny-entity`.

### [File Storage](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-file-storage) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage%2Fpackage.json)
A plugginable file storage package.

#### [Amazon S3](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-file-storage-s3) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage-s3%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage-s3%2Fpackage.json)
AWS S3 driver for `webiny-file-storage` interface. 

#### [Local Storage](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-file-storage-local) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-file-storage-local%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-file-storage-local%2Fpackage.json)
A local filesystem storage driver for `webiny-file-storage`.

### [Model](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-model) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-model%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-model%2Fpackage.json)
Model, store and validate data using models. 

### [Scripts](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-scripts) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-scripts%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-scripts%2Fpackage.json)
A set of utility scripts for development and production builds (currently used with `webiny-client` projects).

### [SQL Builder](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-sql-query-builder) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-sql-query-builder%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-sql-query-builder%2Fpackage.json)
An SQL query builder.

### [Validation](https://github.com/Webiny/webiny-js/tree/master/packages-utils/webiny-validation) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=packages-utils%2Fwebiny-validation%2Fpackage.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=packages-utils%2Fwebiny-validation%2Fpackage.json)
A simple, pluginable and async data validation library, packed with frequently used validators like `required`, `email`, `url`, `creditCard` etc.

## Contributing
Please see our [Contributing Guideline](/CONTRIBUTING.md) which explains repo organization, linting, testing, and other steps.

## License
This project is licensed under the terms of the [MIT license](/LICENSE.md).