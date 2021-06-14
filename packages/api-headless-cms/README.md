# @webiny/api-headless-cms

[![](https://img.shields.io/npm/dw/@webiny/api-headless-cms.svg)](https://www.npmjs.com/package/@webiny/api-headless-cms)
[![](https://img.shields.io/npm/v/@webiny/api-headless-cms.svg)](https://www.npmjs.com/package/@webiny/api-headless-cms)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Install

```
npm install --save @webiny/api-headless-cms
```

Or if you prefer yarn:

```
yarn add @webiny/api-headless-cms
```

## Testing
Due to possibility of multiple storage operations, the tests are completely decoupled from those storage operations.

The [jest.setup.js](./jest.setup.js) is using [@webiny/project-utils/testing/presets.js](../project-utils/testing/presets/index.js) to find and load all the packages containing `@webiny/api-headless-cms` and `storage-operations` keywords in their `package.json` file.
Those packages are then used to build the test run - one for each of the packages. So depending on how many storage operations there are in the repository, that much of `api-headless-cms` tests will run.

### Defining test environment
To make it possible for api-headless-cms tests to run with a storage operations package you MUST create `presets.js` file in `storage-operations-package-path/__tests__/__api__/` directory. That file is loaded when setting up the api-headless-cms tests.

It MUST contain the `testEnvironment` variable which contains path to the environment definition file.

That environment file MUST define the test environment which extends `NodeEnvironment` class.

Test environment MUST expose `__getStorageOperationsPlugins` method, via `this.global` property of the class, which will load the required plugins in the `api-headless-cms` tests.


### Examples of preset and test environment files

The first implementation of the decoupled storage operations is DynamoDB/Elasticsearch, which you can find in [@webiny/api-headless-cms-ddb-es](../api-headless-cms-ddb-es).
Files which you can check to help you define your own presets and test environment are:
* [presets.js](../api-headless-cms-ddb-es/__tests__/__api__/presets.js) - an array of presets of which last one defines the environment to be loaded
* [environment.js](../api-headless-cms-ddb-es/__tests__/__api__/environment.js) - a class which extends NodeEnvironment and exposes `__getStorageOperationsPlugins` to the tests

### Debugging when testing
For the WebStorm (PhpStorm,...) when starting a test you must have some values defined in the run/debug configurations screen:
#### Node options
`````
--inspect=9229
`````
#### Working directory
`````
PATH_TO_YOUR_PROJECT_ROOT
`````
example:
````
~/webiny/webiny-js/
````
#### Jest options
For DynamoDB + Elasticsearch storage operations tests:
`````
--keyword=cms:base --keyword=cms:ddb-es
`````
For the DynamoDB storage operations tests:
`````
--keyword=cms:base --keyword=cms:ddb
`````
Note that base keyword is the `cms:base`. It tells Jest setup to load the `api-headless-cms` tests with the api-headless-cms-ddb-es tests.

#### Environment variables
If you want to use local Elasticsearch:
`````
ELASTICSEARCH_PORT=9200;LOCAL_ELASTICSEARCH=true
`````
Nothing if you do not want to use the local Elasticsearch.