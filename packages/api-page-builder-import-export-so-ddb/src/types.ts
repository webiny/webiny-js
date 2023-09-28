import { DynamoDBTypes } from "dynamodb-toolbox/dist/classes/Table";
import {
    EntityAttributeConfig,
    EntityCompositeAttributes
} from "dynamodb-toolbox/dist/classes/Entity";
import { DynamoDBClient } from "@webiny/aws-sdk/client-dynamodb";
import { ImportExportTaskStorageOperations } from "@webiny/api-page-builder-import-export/types";

export type AttributeDefinition = DynamoDBTypes | EntityAttributeConfig | EntityCompositeAttributes;

export type Attributes = Record<string, AttributeDefinition>;

export interface CreateStorageOperations {
    (params: {
        documentClient: DynamoDBClient;
        table?: string;
        attributes?: Attributes;
    }): ImportExportTaskStorageOperations;
}
