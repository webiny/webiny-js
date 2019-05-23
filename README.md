<br/>
<p align="center">
  <img src="https://s3.amazonaws.com/owler-image/logo/webiny_owler_20160228_232453_original.png" width="400" />
  <br/>
  <strong>Developer-friendly Serverless CMS powered by GraphQL and React</strong>
</p>
<p align="center">
  <a href="https://www.webiny.com">Official Website</a> |
  <a href="https://docs.webiny.com/docs/developer-tutorials/local-setup">Docs</a> 
</p>

#
<p align="center">

[![Prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg)](https://prettier.io)
[![license](https://img.shields.io/badge/license-MIT-green.svg)](https://github.com/webiny/webiny-js/blob/master/LICENSE)
[![SemVer](http://img.shields.io/:semver-2.0.0-brightgreen.svg)](http://semver.org)
![](https://img.shields.io/npm/types/react-butterfiles.svg)
[![All Contributors](https://img.shields.io/badge/all_contributors-4-orange.svg?style=flat-square)](#contributors)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

| Branch | Build |
| :--- | :---: |
| master (latest release) | [![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=master)](https://travis-ci.org/Webiny/webiny-js) |
| development (active development) | [![Build Status](https://travis-ci.org/Webiny/webiny-js.svg?branch=development)](https://travis-ci.org/Webiny/webiny-js) |
</p>

## Installation
Installation instructions can be found in the official [docs](https://docs.webiny.com/docs/developer-tutorials/local-setup) .

## About
Webiny consists of two layers that work closely together.

### GraphQL API
API layer works as a Lambda function with Apollo-Server handling all the GraphQL-related stuff.
In addition to that we created a simple `data-sources` wrapper inspired by GrAMPS (and later Apollo data-sources). It helps you develop separate modules (packages) and stitch them together to build one big GraphQL service.

### Client layer (SPA)
Our client (SPA) layer is based on `create-react-app` v2 and Apollo Client. If you ever developed using those tools - you already know Webiny 🙂
As our UI library we are using Material Components, and a very promising project [RMWC](https://jamesmfriedman.github.io/rmwc/) to get going with Material faster.
You can see all the currently available components in our [storybook](https://webiny-material-storybook.netlify.com/).

## Admin app
We provide you with an administration app so you can kickstart your projects much faster and begin developing features for your clients right away.
The entire admin app is based on plugins and you can customize everything. Each of the plugin is documented and has a corresponding Flow type to help you while coding.

## Project organization
We have decided to use a `monorepo` organization and have fixed publishing (so when we publish a change, all the packages will be published using that same version).

## Contributing
Please see our [Contributing Guideline](/CONTRIBUTING.md) which explains repo organization, linting, testing, and other steps.

## License
This project is licensed under the terms of the [MIT license](/LICENSE).

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore -->
<table><tr><td align="center"><a href="https://www.webiny.com"><img src="https://avatars0.githubusercontent.com/u/5121148?v=4" width="100px;" alt="Adrian Smijulj"/><br /><sub><b>Adrian Smijulj</b></sub></a><br /><a href="#question-doitadrian" title="Answering Questions">💬</a> <a href="https://github.com/Webiny/webiny-js/commits?author=doitadrian" title="Code">💻</a> <a href="https://github.com/Webiny/webiny-js/commits?author=doitadrian" title="Documentation">📖</a> <a href="#example-doitadrian" title="Examples">💡</a> <a href="#ideas-doitadrian" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-doitadrian" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-doitadrian" title="Maintenance">🚧</a> <a href="#platform-doitadrian" title="Packaging/porting to new platform">📦</a> <a href="#plugin-doitadrian" title="Plugin/utility libraries">🔌</a> <a href="#tool-doitadrian" title="Tools">🔧</a></td><td align="center"><a href="http://webiny.com/"><img src="https://avatars1.githubusercontent.com/u/3920893?v=4" width="100px;" alt="Pavel Denisjuk"/><br /><sub><b>Pavel Denisjuk</b></sub></a><br /><a href="#question-Pavel910" title="Answering Questions">💬</a> <a href="https://github.com/Webiny/webiny-js/commits?author=Pavel910" title="Code">💻</a> <a href="https://github.com/Webiny/webiny-js/commits?author=Pavel910" title="Documentation">📖</a> <a href="#example-Pavel910" title="Examples">💡</a> <a href="#ideas-Pavel910" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-Pavel910" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-Pavel910" title="Maintenance">🚧</a> <a href="#platform-Pavel910" title="Packaging/porting to new platform">📦</a> <a href="#plugin-Pavel910" title="Plugin/utility libraries">🔌</a> <a href="#projectManagement-Pavel910" title="Project Management">📆</a> <a href="#tool-Pavel910" title="Tools">🔧</a></td><td align="center"><a href="http://www.webiny.com/"><img src="https://avatars3.githubusercontent.com/u/3808420?v=4" width="100px;" alt="Sven"/><br /><sub><b>Sven</b></sub></a><br /><a href="#question-SvenAlHamad" title="Answering Questions">💬</a> <a href="#blog-SvenAlHamad" title="Blogposts">📝</a> <a href="https://github.com/Webiny/webiny-js/issues?q=author%3ASvenAlHamad" title="Bug reports">🐛</a> <a href="#business-SvenAlHamad" title="Business development">💼</a> <a href="https://github.com/Webiny/webiny-js/commits?author=SvenAlHamad" title="Code">💻</a> <a href="#design-SvenAlHamad" title="Design">🎨</a> <a href="https://github.com/Webiny/webiny-js/commits?author=SvenAlHamad" title="Documentation">📖</a> <a href="#financial-SvenAlHamad" title="Financial">💵</a> <a href="#fundingFinding-SvenAlHamad" title="Funding Finding">🔍</a> <a href="#ideas-SvenAlHamad" title="Ideas, Planning, & Feedback">🤔</a> <a href="#infra-SvenAlHamad" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#maintenance-SvenAlHamad" title="Maintenance">🚧</a> <a href="#projectManagement-SvenAlHamad" title="Project Management">📆</a> <a href="#tutorial-SvenAlHamad" title="Tutorials">✅</a> <a href="#video-SvenAlHamad" title="Videos">📹</a></td><td align="center"><a href="https://github.com/ndcollins"><img src="https://avatars0.githubusercontent.com/u/501726?v=4" width="100px;" alt="Nick Collins"/><br /><sub><b>Nick Collins</b></sub></a><br /><a href="https://github.com/Webiny/webiny-js/issues?q=author%3Andcollins" title="Bug reports">🐛</a> <a href="#ideas-ndcollins" title="Ideas, Planning, & Feedback">🤔</a> <a href="#userTesting-ndcollins" title="User Testing">📓</a></td></tr></table>

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
