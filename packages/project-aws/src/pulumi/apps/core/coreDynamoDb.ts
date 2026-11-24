import type { PulumiApp } from "@webiny/pulumi";
import { CoreDynamo } from "./CoreDynamo.js";
import { CoreAuditLogsDynamo } from "./CoreAuditLogsDynamo.js";

export interface CoreDynamoDbParams {
    /* The project has `<Infra.AuroraPostgres />`. */
    usesPostgres: boolean;
    protect: boolean;
    pointInTimeRecovery: boolean;
}

export interface CoreDynamoDbTables {
    /* Not created with `<Infra.AuroraPostgres />`. */
    dynamoDbTable: CoreDynamo | undefined;
    /* Not created with `<Infra.AuroraPostgres />`. */
    auditLogsDynamoDbTable: CoreAuditLogsDynamo | undefined;
}

/**
 * The core's DynamoDB tables (the primary one and the audit logs one) and their stack outputs.
 *
 * With `<Infra.AuroraPostgres />` there are none: the API keeps all of its data, the service
 * manifests included, in the database, so `<Infra.DynamoDb.Pitr />` has nothing to apply to either.
 */
export const addCoreDynamoDb = (app: PulumiApp, params: CoreDynamoDbParams): CoreDynamoDbTables => {
    if (params.usesPostgres) {
        return { dynamoDbTable: undefined, auditLogsDynamoDbTable: undefined };
    }

    const { protect, pointInTimeRecovery } = params;
    const dynamoDbTable = app.addModule(CoreDynamo, { protect, pointInTimeRecovery });
    const auditLogsDynamoDbTable = app.addModule(CoreAuditLogsDynamo, {
        protect,
        pointInTimeRecovery
    });

    app.addOutputs({
        primaryDynamodbTableArn: dynamoDbTable.output.arn,
        primaryDynamodbTableName: dynamoDbTable.output.name,
        primaryDynamodbTableHashKey: dynamoDbTable.output.hashKey,
        primaryDynamodbTableRangeKey: dynamoDbTable.output.rangeKey,
        auditLogsDynamodbTableArn: auditLogsDynamoDbTable.output.arn,
        auditLogsDynamodbTableName: auditLogsDynamoDbTable.output.name,
        auditLogsDynamodbTableHashKey: auditLogsDynamoDbTable.output.hashKey,
        auditLogsDynamodbTableRangeKey: auditLogsDynamoDbTable.output.rangeKey
    });

    return { dynamoDbTable, auditLogsDynamoDbTable };
};
