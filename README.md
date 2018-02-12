<br/>
<p align="center">
  <img src="https://s3.amazonaws.com/owler-image/logo/webiny_owler_20160228_232453_original.png" width="400" />
  <br/>
  <strong>Web development made easy.</strong>
</p>
<p align="center">

[Official Website](https://www.webiny.com) | [Packages](/documentation/packages.md) 
</p>

#
<p align="center">
 
[![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=master)](https://travis-ci.org/Webiny/webiny-js) [![Coverage Status](https://coveralls.io/repos/github/Webiny/webiny-js/badge.svg?branch=master)](https://coveralls.io/github/Webiny/webiny-js?branch=master) [![Commitizen friendly](https://img.shields.io/badge/commitizen-friendly-brightgreen.svg)](http://commitizen.github.io/cz-cli/) [![Known Vulnerabilities](https://snyk.io/test/github/webiny/webiny-js/badge.svg?targetFile=package.json)](https://snyk.io/test/github/webiny/webiny-js?targetFile=package.json) <a href="https://prettier.io/"><img alt="code style: prettier" src="https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square"></a>
[<img src="https://user-images.githubusercontent.com/7288322/34429152-141689f8-ecb9-11e7-8003-b5a10a5fcb29.png">](https://discord.gg/ZuZVyc) [![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/Webiny/webiny-js/blob/master/LICENSE)
</p>

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

## Contributing
Please see our [Contributing Guideline](/CONTRIBUTING.md) which explains repo organization, linting, testing, and other steps.

## License
This project is licensed under the terms of the [MIT license](/LICENSE.md).