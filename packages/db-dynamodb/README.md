# @webiny/db-dynamodb
[![](https://img.shields.io/npm/dw/webiny-data-dynamodb.svg)](https://www.npmjs.com/package/webiny-data-dynamodb) 
[![](https://img.shields.io/npm/v/webiny-data-dynamodb.svg)](https://www.npmjs.com/package/webiny-data-dynamodb)
[![code style: prettier](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?style=flat-square)](https://github.com/prettier/prettier)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

A set of frequently used data-dynamodb higher order functions.

For more information, please visit 
[the official docs](https://github.com/doitadrian/data-dynamodb). 
  
## Install
```
yarn add @webiny/db-dynamodb
```


### Helper functions
We have a number [helper](./src/utils) functions that ease the use of either dynamodb-toolbox, filtering, sorting or just creating proper response.

#### [batchRead](./src/utils/batchRead.ts)
Read a batch of records from the DynamoDB table.

This function accepts [table](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Table.ts) and items, an array of objects created by [Entity.getBatch()](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Entity.ts#L313).

Internally it reads records until there are no more to read and returns a list of read records.

#### [batchWrite](./src/utils/batchWrite.ts)
Write a batch of records to the DynamoDB table.

This function accepts [table](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Table.ts) and items, an array of objects created by [Entity.putBatch()](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Entity.ts#L989).
It also accepts a number which defines a number of items to be written in one request. DO NOT put that number over the official DynamoDB maximum.

Internally it loops through the items received (in chunks of `maxChunks` parameter) and does not return anything.


#### [cleanupItem and cleanupItems](./src/utils/cleanup.ts)
Clean up records received from the DynamoDB table. 

This function accepts [entity](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Entity.ts) and item to be cleaned up, in case of the cleanupItem.
In case of `cleanupItems` it accepts an array of items to clean up.

We use this to remove the properties that dynamodb-toolbox puts on the record automatically.

#### [get](./src/utils/get.ts)
Get a single record from the DynamoDB table with given keys.

This function accepts [entity](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Entity.ts) and keys to fetch the record by.

It returns either record or null. By default, [entity.get()](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Entity.ts#L281) returns a object with some meta data and `Item` property, which contains the record (or null if no record).

#### [queryOne and queryAll](./src/utils/query.ts)
Query the DynamoDB table for record(s) by given partition key and query options.

This function accepts [entity](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Entity.ts) to perform the query on, `partitionKey` to query by and [options](https://github.com/jeremydaly/dynamodb-toolbox/blob/main/src/classes/Table.ts#L65) to define the query parameters with.

The `queryAll` method accepts `limit`, a number with which you can load only a certain amount of records. The `queryOne` method does not have that property.

#### [filter](./src/utils/filter.ts)
Filter the DynamoDB records by given where condition.

This function accepts items (records) to be filtered, a definition of fields to filter by (not required by default if no field modification is required), where conditions (eg. `{published: true, date_gte: "2021-01-01"}`) and filtering plugins.

#### [sort](./src/utils/sort.ts)
Sort the DynamoDB records by given sort condition.

This function accepts items (records) to be sorted, sort options (eg. createdBy_ASC, id_DESC, etc.) and a definitions of fields to sort by (not required by default if no field modification is required).