import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Table, Entity } from "dynamodb-toolbox";
import { DynamoDBTypes, TableConstructor } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { PrerenderingServiceStorageOperations as BasePrerenderingServiceStorageOperations } from "@webiny/api-prerendering-service/types";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export enum ENTITIES {
    RENDER = "PrerenderingServiceRender",
    SETTINGS = "PrerenderingServiceSettings",
    QUEUE_JOB = "PrerenderingServiceQueueJob",
    TAG_PATH_LINK = "PrerenderingServiceTagPathLink"
}

export interface PrerenderingServiceFactoryParams {
    documentClient: DocumentClient;
    table?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
}

export type Entities = "render" | "queueJob" | "tagPathLink";

export interface PrerenderingServiceStorageOperations
    extends BasePrerenderingServiceStorageOperations {
    getTable(): Table;
    getEntities(): Record<Entities, Entity<any>>;
}

export interface PrerenderingServiceFactory {
    (params: PrerenderingServiceFactoryParams): PrerenderingServiceStorageOperations;
}

export interface TableModifier {
    (table: TableConstructor): TableConstructor;
}

export interface DataContainer<T> {
    PK: string;
    SK: string;
    data: T;
}
