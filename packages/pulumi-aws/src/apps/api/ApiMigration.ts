import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import type { PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";

import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { CoreOutput, VpcConfig } from "../common";
import { ApiBackgroundTask, ApiGraphql } from "~/apps";
import { LAMBDA_RUNTIME } from "~/constants";
import { getEnvVariableAwsRegion } from "~/env/awsRegion";
import { AuditLogsDynamo } from "~/apps/api/AuditLogsDynamo.js";

export type ApiMigration = PulumiAppModule<typeof ApiMigration>;

export const ApiMigration = createAppModule({
    name: "ApiMigration",
    config(app: PulumiApp) {
        const core = app.getModule(CoreOutput);
        const graphql = app.getModule(ApiGraphql);
        const backgroundTask = app.getModule(ApiBackgroundTask);
        const auditLogsDynamoDb = app.getModule(AuditLogsDynamo);

        const role = createLambdaRole(app, {
            name: "migration-lambda-role",
            policy: graphql.policy.output
        });

        const migration = app.addResource(aws.lambda.Function, {
            name: "data-migration",
            config: {
                handler: "handler.handler",
                timeout: 900,
                runtime: LAMBDA_RUNTIME,
                memorySize: 3008,
                role: role.output.arn,
                description: "Performs data migrations.",
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "migration/build")
                    )
                }),
                environment: {
                    variables: getCommonLambdaEnvVariables().apply(value => ({
                        ...value,
                        COGNITO_REGION: getEnvVariableAwsRegion(),
                        COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
                        DB_TABLE: core.primaryDynamodbTableName,
                        DB_TABLE_LOG: core.logDynamodbTableName,
                        DB_TABLE_AUDIT_LOGS: auditLogsDynamoDb.output.name,
                        DB_TABLE_ELASTICSEARCH: core.elasticsearchDynamodbTableName,
                        ELASTIC_SEARCH_ENDPOINT: core.elasticsearchDomainEndpoint,
                        ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,
                        ELASTICSEARCH_SHARED_INDEXES: process.env.ELASTICSEARCH_SHARED_INDEXES,
                        S3_BUCKET: core.fileManagerBucketId
                    })) as Record<string, any>
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig
            }
        });

        // Add IAM policy to allow states:StartExecution for the background task Step Function
        const stepFunctionPolicy = app.addResource(aws.iam.Policy, {
            name: "migration-lambda-step-function-policy",
            config: {
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Action: ["states:StartExecution"],
                            Resource: [
                                pulumi.interpolate`${backgroundTask.stepFunction.output.arn}`,
                                pulumi.interpolate`${backgroundTask.stepFunction.output.arn}/*`
                            ]
                        }
                    ]
                }
            }
        });

        // Attach policy to the Lambda role
        app.addResource(aws.iam.RolePolicyAttachment, {
            name: "migration-lambda-attach-step-function-policy",
            config: {
                role: role.output.name,
                policyArn: stepFunctionPolicy.output.arn
            }
        });

        return {
            function: migration
        };
    }
});
