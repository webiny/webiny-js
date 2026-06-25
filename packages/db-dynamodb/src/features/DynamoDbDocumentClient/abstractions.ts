import type { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb/index.js";
import type { GenericRecord } from "@webiny/api/types.js";

export interface IKeyAttributes {
    pk: string;
    sk?: string;
}

export interface IQueryParams {
    partitionKey: string;
    index?: string;
    limit?: number;
    reverse?: boolean;
    consistent?: boolean;
    beginsWith?: string;
    eq?: string | number;
    lt?: string | number;
    lte?: string | number;
    gt?: string | number;
    gte?: string | number;
    between?: [string, string] | [number, number];
    startKey?: GenericRecord;
    filters?: GenericRecord;
    attributes?: string[];
}

export interface IQueryPageResponse<T> {
    items: T[];
    lastEvaluatedKey?: GenericRecord;
}

export interface IScanParams {
    index?: string;
    limit?: number;
    startKey?: GenericRecord;
    segment?: number;
    totalSegments?: number;
    filters?: GenericRecord;
    consistent?: boolean;
}

export interface IScanResponse<T> {
    items: T[];
    count?: number;
    scannedCount?: number;
    lastEvaluatedKey?: GenericRecord;
    next?: () => Promise<IScanResponse<T>>;
    requestId: string;
    error: any;
}

export interface IDynamoDbDocumentClient {
    getTableName(): string;
    getDocumentClient(): DynamoDBDocument;

    get<T>(keys: GenericRecord): Promise<T | null>;
    put<T extends GenericRecord>(item: T): Promise<void>;
    delete(keys: GenericRecord): Promise<void>;

    query<T>(params: IQueryParams): Promise<T[]>;
    queryPage<T>(params: IQueryParams): Promise<IQueryPageResponse<T>>;
    queryOne<T>(params: IQueryParams): Promise<T | null>;

    scan<T>(params?: IScanParams): Promise<IScanResponse<T>>;

    batchGet<T>(keys: GenericRecord[], maxChunk?: number): Promise<T[]>;
    batchWrite(items: Array<Record<string, any>>, maxChunk?: number): Promise<void>;
}

export namespace DynamoDbDocumentClient {
    export type Interface = IDynamoDbDocumentClient;
}
