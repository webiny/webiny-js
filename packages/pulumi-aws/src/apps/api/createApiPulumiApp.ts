import { createPulumiApp, PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi";
import {
    ApiGateway,
    ApiApwScheduler,
    ApiCloudfront,
    ApiFileManager,
    ApiGraphql,
    ApiHeadlessCMS,
    ApiPageBuilder
} from "~/apps";
import { CoreOutput, VpcConfig } from "~/apps";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import { tagResources } from "~/utils";

export type ApiPulumiApp = ReturnType<typeof createApiPulumiApp>;

export interface CreateApiPulumiAppParams {
    /**
     * Enables or disables VPC for the API.
     * For VPC to work you also have to enable it in the Core application.
     */
    vpc?: PulumiAppParam<boolean>;

    /** Custom domain configuration */
    domains?: PulumiAppParamCallback<CustomDomainParams>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ApiPulumiApp) => void | Promise<void>;
}

export const createApiPulumiApp = (projectAppParams: CreateApiPulumiAppParams = {}) => {
    return createPulumiApp({
        name: "api",
        path: "apps/api",
        config: projectAppParams,
        program: async app => {
            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as ApiPulumiApp);
                });
            }

            // Enables logs forwarding.
            // https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding
            const WEBINY_LOGS_FORWARD_URL = String(process.env.WEBINY_LOGS_FORWARD_URL);

            // Register core output as a module available for all other modules
            const core = app.addModule(CoreOutput);

            // Register VPC config module to be available to other modules
            app.addModule(VpcConfig, {
                enabled: app.getParam(projectAppParams.vpc)
            });

            const pageBuilder = app.addModule(ApiPageBuilder, {
                env: {
                    COGNITO_REGION: String(process.env.AWS_REGION),
                    COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
                    DB_TABLE: core.primaryDynamodbTableName,
                    DB_TABLE_ELASTICSEARCH: core.elasticsearchDynamodbTableName,
                    ELASTIC_SEARCH_ENDPOINT: core.elasticsearchDomainEndpoint,

                    // Not required. Useful for testing purposes / ephemeral environments.
                    // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
                    ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

                    S3_BUCKET: core.fileManagerBucketId,
                    WEBINY_LOGS_FORWARD_URL
                }
            });

            const fileManager = app.addModule(ApiFileManager);

            const apwScheduler = app.addModule(ApiApwScheduler, {
                primaryDynamodbTableArn: core.primaryDynamodbTableArn,

                env: {
                    COGNITO_REGION: String(process.env.AWS_REGION),
                    COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
                    DB_TABLE: core.primaryDynamodbTableName,
                    S3_BUCKET: core.fileManagerBucketId,
                    WEBINY_LOGS_FORWARD_URL
                }
            });

            const graphql = app.addModule(ApiGraphql, {
                env: {
                    COGNITO_REGION: String(process.env.AWS_REGION),
                    COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
                    DB_TABLE: core.primaryDynamodbTableName,
                    DB_TABLE_ELASTICSEARCH: core.elasticsearchDynamodbTableName,
                    ELASTIC_SEARCH_ENDPOINT: core.elasticsearchDomainEndpoint,

                    // Not required. Useful for testing purposes / ephemeral environments.
                    // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
                    ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

                    S3_BUCKET: core.fileManagerBucketId,
                    EVENT_BUS: core.eventBusArn,
                    IMPORT_PAGES_CREATE_HANDLER:
                        pageBuilder.importPages.functions.create.output.arn,
                    EXPORT_PAGES_PROCESS_HANDLER:
                        pageBuilder.exportPages.functions.process.output.arn,
                    // TODO: move to okta plugin
                    OKTA_ISSUER: process.env["OKTA_ISSUER"],
                    WEBINY_LOGS_FORWARD_URL
                },
                apwSchedulerEventRule: apwScheduler.eventRule.output,
                apwSchedulerEventTarget: apwScheduler.eventTarget.output
            });

            const headlessCms = app.addModule(ApiHeadlessCMS, {
                env: {
                    COGNITO_REGION: String(process.env.AWS_REGION),
                    COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
                    DB_TABLE: core.primaryDynamodbTableName,
                    DB_TABLE_ELASTICSEARCH: core.elasticsearchDynamodbTableName,
                    ELASTIC_SEARCH_ENDPOINT: core.elasticsearchDomainEndpoint,

                    // Not required. Useful for testing purposes / ephemeral environments.
                    // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
                    ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

                    S3_BUCKET: core.fileManagerBucketId,
                    // TODO: move to okta plugin
                    OKTA_ISSUER: process.env["OKTA_ISSUER"],
                    WEBINY_LOGS_FORWARD_URL
                }
            });

            const apiGateway = app.addModule(ApiGateway, {
                "graphql-post": {
                    path: "/graphql",
                    method: "POST",
                    function: graphql.functions.graphql.output.arn
                },
                "graphql-options": {
                    path: "/graphql",
                    method: "OPTIONS",
                    function: graphql.functions.graphql.output.arn
                },
                "files-any": {
                    path: "/files/{path}",
                    method: "ANY",
                    function: fileManager.functions.download.output.arn
                },
                "cms-post": {
                    path: "/cms/{key+}",
                    method: "POST",
                    function: headlessCms.functions.graphql.output.arn
                },
                "cms-options": {
                    path: "/cms/{key+}",
                    method: "OPTIONS",
                    function: headlessCms.functions.graphql.output.arn
                }
            });

            const cloudfront = app.addModule(ApiCloudfront);

            const domains = app.getParam(projectAppParams.domains);
            if (domains) {
                applyCustomDomain(cloudfront, domains);
            }

            app.addOutputs({
                region: process.env.AWS_REGION,
                apiUrl: cloudfront.output.domainName.apply(value => `https://${value}`),
                apiDomain: cloudfront.output.domainName,
                cognitoUserPoolId: core.cognitoUserPoolId,
                cognitoAppClientId: core.cognitoAppClientId,
                cognitoUserPoolPasswordPolicy: core.cognitoUserPoolPasswordPolicy,
                apwSchedulerScheduleAction: apwScheduler.scheduleAction.lambda.output.arn,
                apwSchedulerExecuteAction: apwScheduler.executeAction.lambda.output.arn,
                apwSchedulerEventRule: apwScheduler.eventRule.output.name,
                apwSchedulerEventTargetId: apwScheduler.eventTarget.output.targetId,
                dynamoDbTable: core.primaryDynamodbTableName,
                dynamoDbElasticsearchTable: core.elasticsearchDynamodbTableName
            });

            tagResources({
                WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
                WbyEnvironment: String(process.env["WEBINY_ENV"])
            });

            return {
                fileManager,
                graphql,
                headlessCms,
                apiGateway,
                cloudfront,
                apwScheduler
            };
        }
    });
};
