import { AttributeDefinition } from "@webiny/db-dynamodb/toolbox";
import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import { ImportExportTaskStorageOperations } from "@webiny/api-page-builder-import-export/types";

export type Attributes = Record<string, AttributeDefinition>;

export interface CreateStorageOperations {
    (params: {
        documentClient: DynamoDBDocument;
        table?: string;
        attributes?: Attributes;
    }): ImportExportTaskStorageOperations;
}
