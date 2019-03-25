<br/>
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)
<p align="center">
  <img src="https://s3.amazonaws.com/owler-image/logo/webiny_owler_20160228_232453_original.png" width="400" />
  <br/>
  <strong>Developer-friendly Serverless CMS powered by GraphQL and React</strong>
</p>
<p align="center">
  <a href="https://www.webiny.com">Official Website</a> |
  <a href="documentation/packages.md">Packages</a> 
</p>

#
<p align="center">

[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/webiny/webiny-js/blob/master/LICENSE)
[![SemVer](http://img.shields.io/:semver-2.0.0-brightgreen.svg)](http://semver.org)
![](https://img.shields.io/npm/types/react-butterfiles.svg)
[![All Contributors](https://img.shields.io/badge/all_contributors-1-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

| Branch | Build |
| :--- | :---: |
| master (latest release) | [![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=master)](https://travis-ci.org/Webiny/webiny-js) |
| development (active development) | [![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=development)](https://travis-ci.org/Webiny/webiny-js) |
</p>

Webiny is an open-source platform created for building modern web apps.

## Install

## About
Webiny consists of two layers that work closely together.

### GraphQL API
API layer works as a Lambda function with Apollo-Server handling all the GraphQL-related stuff.
In addition to that we created a simple `data-sources` wrapper inspired by GrAMPS (and later Apollo data-sources). It helps you develop separate modules (packages) and stitch them together to build one big GraphQL service.

### Client layer (SPA)
Our client (SPA) layer is based on `create-react-app` v2 and Apollo Client. If you ever developed using those tools - you already know Webiny :)
As our UI library we are using Material Components, and a very promising project [RMWC](https://jamesmfriedman.github.io/rmwc/) to get going with Material faster.
You can see all the currently available components in our [storybook](https://webiny-material-storybook.netlify.com/).

## Admin app
We provide you with an administration app so you can kickstart your projects much faster and begin developing features for your clients right away.
The entire admin app is based on plugins and you can customize everything. Each of the plugin is documented and has a corresponding Flow type to help you while coding.

## Project organization
We have decided to use a `monorepo` organization and have fixed publishing (so when we publish a change, all the packages will be published using that same version).

## FAQ
### Why not microservices ?
We are planning on going the microservices way but at this point it really is not necessary.
The local data-sources approach is already a good separation of business logic which will make migration to microservices much easier later on.

## Contributing
Please see our [Contributing Guideline](/CONTRIBUTING.md) which explains repo organization, linting, testing, and other steps.

## License
This project is licensed under the terms of the [MIT license](/LICENSE).

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://www.webiny.com"><img src="https://avatars0.githubusercontent.com/u/5121148?v=4" width="100px;" alt="Adrian Smijulj"/><br /><sub><b>Adrian Smijulj</b></sub></a><br /><a href="#question-doitadrian" title="Answering Questions">💬</a> <a href="https://github.com/Webiny/webiny-js/commits?author=doitadrian" title="Code">💻</a> <a href="#maintenance-doitadrian" title="Maintenance">🚧</a> <a href="https://github.com/Webiny/webiny-js/commits?author=doitadrian" title="Tests">⚠️</a> <a href="#tool-doitadrian" title="Tools">🔧</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!