import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { queryAll, queryOne, queryAllWithCallback } from "@webiny/db-dynamodb/utils/query";

export {
    queryAll,
    queryAllWithCallback,
    queryOne,
    batchReadAll,
    batchWriteAll
};
