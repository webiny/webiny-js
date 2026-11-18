import type * as pulumi from "@pulumi/pulumi";
import type { PulumiApp } from "@webiny/pulumi";
import type { CoreOutput } from "~/pulumi/apps/common/CoreOutput.js";

/*
 * The api app's references to the core's DynamoDB tables. With `<Infra.Postgres />` the core has
 * neither the primary nor the audit logs table, so there is no env or output for them. The
 * OpenSearch table belongs to `CoreOpenSearch` and exists whenever OpenSearch is configured, with
 * or without Postgres, so its env stays. The GraphQL policy's DynamoDB statement follows the
 * core's output instead (see `ApiGraphql`).
 */

export type DynamoDbLambdaEnv = Partial<
    Record<"DB_TABLE" | "DB_TABLE_AUDIT_LOGS" | "DB_TABLE_OPENSEARCH", pulumi.Output<unknown>>
>;

/* The env that names the core's DynamoDB tables, for the GraphQL functions. */
export const getDynamoDbLambdaEnv = (
    core: CoreOutput,
    usesPostgres: boolean
): DynamoDbLambdaEnv => {
    if (usesPostgres) {
        // Unset (undefined) without OpenSearch, as before.
        return { DB_TABLE_OPENSEARCH: core.opensearchDynamodbTableName };
    }
    return {
        DB_TABLE: core.primaryDynamodbTableName,
        DB_TABLE_AUDIT_LOGS: core.auditLogsDynamodbTableName,
        DB_TABLE_OPENSEARCH: core.opensearchDynamodbTableName
    };
};

/* The api stack outputs that name the core's DynamoDB tables. */
export const addDynamoDbOutputs = (app: PulumiApp, core: CoreOutput, usesPostgres: boolean) => {
    if (usesPostgres) {
        return;
    }
    app.addOutputs({
        dynamoDbTable: core.primaryDynamodbTableName,
        auditLogsDynamoDbTable: core.auditLogsDynamodbTableName
    });
};
