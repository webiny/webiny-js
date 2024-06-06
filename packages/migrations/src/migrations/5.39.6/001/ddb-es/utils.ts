import { DynamoDBDocument } from "@webiny/aws-sdk/client-dynamodb";
import {
    ElasticsearchCatClusterHealthStatus,
    IWaitUntilHealthyParams
} from "@webiny/api-elasticsearch";

export type EsHealthChecksParams = Required<IWaitUntilHealthyParams>;

export const DEFAULT_ES_HEALTH_CHECKS_PARAMS: EsHealthChecksParams = {
    minClusterHealthStatus: ElasticsearchCatClusterHealthStatus.Yellow,
    maxProcessorPercent: 90,
    maxRamPercent: 100,
    maxWaitingTime: 90,
    waitingTimeStep: 2
};

export const migrationSkippedDdbRecord = {
    PK: "MIGRATION#5.39.6-001",
    SK: "A",
    data: {
        description: "Meta fields data migration (skipped via improved meta fields migration)",
        finishedOn: "2024-06-01T12:00:00.000Z",
        id: "5.39.6-001",
        reason: "skipped",
        startedOn: "2024-06-01T12:00:00.000Z"
    },
    GSI1_PK: "MIGRATIONS",
    GSI1_SK: "5.39.6-001",
    TYPE: "migration",
    _ct: "2024-06-01T12:00:00.000Z",
    _et: "Migration",
    _md: "2024-06-01T12:00:00.000Z"
};

interface MigrationSkippedDdbRecordParams {
    documentClient: DynamoDBDocument;
    ddbTable: string;
}

export const migrationSkippedDdbRecordExists = async ({
    documentClient,
    ddbTable
}: MigrationSkippedDdbRecordParams) => {
    // Was the migration already executed?
    const { Item } = await documentClient.get({
        TableName: ddbTable,
        Key: {
            PK: "MIGRATION#5.39.6-001",
            SK: "A"
        }
    });

    return !!Item;
};

export const createMigrationSkippedDdbRecord = async ({
    documentClient,
    ddbTable
}: MigrationSkippedDdbRecordParams) => {
    await documentClient.put({
        TableName: ddbTable,
        Item: migrationSkippedDdbRecord
    });
};
