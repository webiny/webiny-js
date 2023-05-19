import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import {
    queryAll,
    queryOne,
    queryAllWithCallback as ddbQueryAllWithCallback
} from "@webiny/db-dynamodb/utils/query";

export { queryAll, ddbQueryAllWithCallback, queryOne, batchReadAll, batchWriteAll };
