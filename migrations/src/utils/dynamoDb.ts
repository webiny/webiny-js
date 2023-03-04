import { batchReadAll } from "@webiny/db-dynamodb/utils/batchRead";
import { batchWriteAll } from "@webiny/db-dynamodb/utils/batchWrite";
import { queryAll, queryOne } from "@webiny/db-dynamodb/utils/query";

interface DynamoDbUtils {
    queryAll: typeof queryAll;
    queryOne: typeof queryOne;
    batchReadAll: typeof batchReadAll;
    batchWriteAll: typeof batchWriteAll;
}

export const dynamoDbUtils: DynamoDbUtils = {
    queryAll,
    queryOne,
    batchReadAll,
    batchWriteAll
};
