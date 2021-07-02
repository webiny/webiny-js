# @webiny/api-file-manager-ddb-es

[![](https://img.shields.io/npm/dw/@webiny/api-file-manager-ddb-es.svg)](https://www.npmjs.com/package/@webiny/api-file-manager-ddb-es)
[![](https://img.shields.io/npm/v/@webiny/api-file-manager-ddb-es.svg)](https://www.npmjs.com/package/@webiny/api-file-manager-ddb-es)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

## Install

```
npm install --save @webiny/api-file-manager-ddb-es
```

Or if you prefer yarn:

```
yarn add @webiny/api-file-manager-ddb-es
```


## Testing
To run the tests only for this package you must filter it with keywords.

### Env variables

###### LOCAL_ELASTICSEARCH
If set, does not run Elasticsearch when starting the tests, use local one. You must install it and run if, of course.

###### ELASTICSEARCH_PORT
Custom port for local elasticsearch.

### Command
````
ELASTICSEARCH_PORT=9200 LOCAL_ELASTICSEARCH=true yarn test packages/api-file-manager --keyword=fm:ddb-es --keyword=fm:base
````