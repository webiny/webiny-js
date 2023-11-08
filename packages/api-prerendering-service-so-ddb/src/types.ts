import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { Entity, Table } from "@webiny/db-dynamodb/toolbox";
import { TableConstructor } from "@webiny/db-dynamodb/toolbox";
import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";
import { PrerenderingServiceStorageOperations as BasePrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service/types";

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    RENDER = "PrerenderingServiceRender",
    SETTINGS = "PrerenderingServiceSettings",
    QUEUE_JOB = "PrerenderingServiceQueueJob",
    TAG_PATH_LINK = "PrerenderingServiceTagPathLink",
    TENANT = "Tenant"
}

export interface PrerenderingServiceFactoryParams {
    documentClient: DynamoDBClient;
    table?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
}

export type Entities = "render" | "queueJob" | "tagPathLink";

export interface PrerenderingServiceStorageOperations
    extends BasePrerenderingServiceStorageOperations {
    getTable(): Table<string, string, string>;
    getEntities(): Record<Entities, Entity<any>>;
}

export interface PrerenderingServiceFactory {
    (params: PrerenderingServiceFactoryParams): PrerenderingServiceStorageOperations;
}

export interface TableModifier {
    (table: TableConstructor<string, string, string>): TableConstructor<string, string, string>;
}

export interface DataContainer<T> {
    PK: string;
    SK: string;
    data: T;
}
