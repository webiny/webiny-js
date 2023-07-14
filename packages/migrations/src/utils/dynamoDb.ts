import { get, GetRecordParams } from "@webiny/db-dynamodb/utils/get";
import { batchReadAll, BatchReadItem, BatchReadParams } from "@webiny/db-dynamodb/utils/batchRead";
import {
    batchWriteAll,
    BatchWriteItem,
    BatchWriteParams
} from "@webiny/db-dynamodb/utils/batchWrite";
import {
    queryAll,
    queryAllWithCallback as ddbQueryAllWithCallback,
    queryOne
} from "@webiny/db-dynamodb/utils/query";

export { get, queryAll, ddbQueryAllWithCallback, queryOne, batchReadAll, batchWriteAll };
export type { GetRecordParams, BatchWriteItem, BatchWriteParams, BatchReadItem, BatchReadParams };
