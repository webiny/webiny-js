import {
    batchReadAll,
    BatchReadItem,
    BatchReadParams,
    batchWriteAll,
    BatchWriteItem,
    BatchWriteParams,
    get,
    GetRecordParams,
    count,
    queryAll,
    queryAllWithCallback as ddbQueryAllWithCallback,
    queryOne,
    scan,
    ScanParams,
    ScanResponse,
    scanWithCallback as ddbScanWithCallback
} from "@webiny/db-dynamodb/utils";

export {
    count,
    get,
    queryAll,
    ddbQueryAllWithCallback,
    queryOne,
    batchReadAll,
    batchWriteAll,
    scan,
    ddbScanWithCallback
};
export type {
    GetRecordParams,
    BatchWriteItem,
    BatchWriteParams,
    BatchReadItem,
    BatchReadParams,
    ScanParams,
    ScanResponse
};
