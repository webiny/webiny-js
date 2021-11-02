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
    QUEUE_JOB = "PrerenderingServiceQueueJob",
    TAG_URL_LINK = "PrerenderingServiceTagUrlLink"
}

export interface PrerenderingServiceFactoryParams {
    documentClient: DocumentClient;
    table?: TableModifier;
    attributes?: Record<ENTITIES, Attributes>;
}

export type Entities = "render" | "queueJob" | "tagUrlLink";

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
