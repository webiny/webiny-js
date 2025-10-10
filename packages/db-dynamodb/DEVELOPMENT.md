### Helper classes
We have some classes that ease the use of dynamodb-toolbox.

#### [Table](./src/utils/table/Table.ts)
```typescript
import { createTable } from "@webiny/db-dynamodb";

const table = createTable({...params});
const writer = table.createWriter(); // see TableWriteBatch
const reader = table.createReader(); // see TableReadBatch

const result = await table.scan({...params}); // see scan
```

#### [Entity](./src/utils/entity/Entity.ts)
```typescript

import { createEntity } from "@webiny/db-dynamodb";

const entity = createEntity({...params});
const writer = entity.createWriter(); // see EntityWriteBatch
const reader = entity.createReader(); // see EntityReadBatch
const tableWriter = entity.createTableWriter(); // see TableWriteBatch

const getResult = await entity.get({...params}); // see get
const getCleanResult = await entity.getClean({...params}); // see get
const queryAllResult = await entity.queryAll({...params}); // see queryAllClean
const queryOneResult = await entity.queryOne({...params}); // see queryOneClean
const putResult = await entity.put({...params}); // see put

```

#### [EntityWriteBatch](./src/utils/entity/EntityWriteBatch.ts)
```typescript
import { createEntityWriteBatch } from "@webiny/db-dynamodb";

const writer = createEntityWriteBatch({...params});

writer.put({...item});
writer.delete({...keys});
writer.delete({...moreKeys});

await writer.execute();
```

#### [EntityReadBatch](./src/utils/entity/EntityReadBatch.ts)
```typescript
import { createEntityReadBatch } from "@webiny/db-dynamodb";

const reader = createEntityReadBatch({...params});

reader.get({...keys});
reader.get({...moreKeys});

const result = await reader.execute();
```
#### [TableWriteBatch](./src/utils/table/TableWriteBatch.ts)
```typescript
import { createTableWriteBatch } from "@webiny/db-dynamodb";

const writer = createTableWriteBatch({...params});

writer.put(entity, {...item});
writer.delete(entity, {...keys});
writer.delete(entity, {...moreKeys});

await writer.execute();
```
#### [TableReadBatch](./src/utils/table/TableReadBatch.ts)
```typescript
import {createTableReadBatch} from "@webiny/db-dynamodb";

const reader = createTableReadBatch({...params});

writer.get(entity, {...keys});
writer.get(entity, {...moreKeys});

const result = await reader.execute();
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