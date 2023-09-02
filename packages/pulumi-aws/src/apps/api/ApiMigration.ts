import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";

import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { CoreOutput, VpcConfig } from "../common";
import { ApiGraphql } from "~/apps";
import { LAMBDA_RUNTIME } from "~/constants";

export type ApiMigration = PulumiAppModule<typeof ApiMigration>;

export const ApiMigration = createAppModule({
    name: "ApiMigration",
    config(app: PulumiApp) {
        const core = app.getModule(CoreOutput);
        const graphql = app.getModule(ApiGraphql);

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
                        COGNITO_REGION: String(process.env.AWS_REGION),
                        COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
                        DB_TABLE: core.primaryDynamodbTableName,
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

        return {
            function: migration
        };
    }
});
