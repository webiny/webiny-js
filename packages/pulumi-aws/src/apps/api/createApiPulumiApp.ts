import { createPulumiApp, PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi";
import {
    ApiGateway,
    ApiApwScheduler,
    ApiCloudfront,
    ApiFileManager,
    ApiGraphql,
    ApiHeadlessCMS,
    ApiPageBuilder,
    CoreOutput,
    VpcConfig
} from "~/apps";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import { tagResources } from "~/utils";
import { withCommonLambdaEnvVariables } from "~/utils";

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

    /**
     * Prefixes names of all Pulumi cloud infrastructure resource with given prefix.
     */
    pulumiResourceNamePrefix?: PulumiAppParam<string>;

    /**
     * Treats provided environments as production environments, which
     * are deployed in production deployment mode.
     * https://www.webiny.com/docs/architecture/deployment-modes/production
     */
    productionEnvironments?: PulumiAppParam<string[]>;
}

export const createApiPulumiApp = (projectAppParams: CreateApiPulumiAppParams = {}) => {
    const app = createPulumiApp({
        name: "api",
        path: "apps/api",
        config: projectAppParams,
        program: async app => {
            const pulumiResourceNamePrefix = app.getParam(
                projectAppParams.pulumiResourceNamePrefix
            );
            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied too late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as ApiPulumiApp);
                });
            }

            const productionEnvironments = app.params.create.productionEnvironments || ["prod"];
            const isProduction = productionEnvironments.includes(app.params.run.env);

            // Enables logs forwarding.
            // https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding
            const WEBINY_LOGS_FORWARD_URL = String(process.env.WEBINY_LOGS_FORWARD_URL);

            // Register core output as a module available to all the other modules
            const core = app.addModule(CoreOutput);

            // Register VPC config module to be available to other modules.
            const vpcEnabled = app.getParam(projectAppParams?.vpc) ?? isProduction;
            app.addModule(VpcConfig, { enabled: vpcEnabled });

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
                    WEBINY_LOGS_FORWARD_URL,
                    /**
                     * APW
                     */
                    APW_SCHEDULER_SCHEDULE_ACTION_HANDLER:
                        apwScheduler.scheduleAction.lambda.output.arn
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
                    IMPORT_CREATE_HANDLER: pageBuilder.import.functions.create.output.arn,
                    EXPORT_PROCESS_HANDLER: pageBuilder.export.functions.process.output.arn,
                    // TODO: move to okta plugin
                    OKTA_ISSUER: process.env["OKTA_ISSUER"],
                    WEBINY_LOGS_FORWARD_URL,
                    /**
                     * APW
                     */
                    APW_SCHEDULER_SCHEDULE_ACTION_HANDLER:
                        apwScheduler.scheduleAction.lambda.output.arn
                },
                apwSchedulerEventRule: apwScheduler.eventRule.output,
                apwSchedulerEventTarget: apwScheduler.eventTarget.output
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

    return withCommonLambdaEnvVariables(app);
};
