import * as aws from "@pulumi/aws";
import { createPulumiApp, PulumiAppParam, PulumiAppParamCallback } from "@webiny/pulumi";
import {
    ApiApwScheduler,
    ApiBackgroundTask,
    ApiCloudfront,
    ApiFileManager,
    ApiGateway,
    ApiGraphql,
    ApiMigration,
    ApiPageBuilder,
    ApiWebsocket,
    CoreOutput,
    CreateCorePulumiAppParams,
    VpcConfig
} from "~/apps";
import { applyCustomDomain, CustomDomainParams } from "../customDomain";
import {
    addDomainsUrlsOutputs,
    tagResources,
    withCommonLambdaEnvVariables,
    withServiceManifest
} from "~/utils";
import { DEFAULT_PROD_ENV_NAMES } from "~/constants";

export type ApiPulumiApp = ReturnType<typeof createApiPulumiApp>;

export interface ApiElasticsearchConfig {
    domainName: string;
    indexPrefix: string;
    sharedIndexes: boolean;
}

export interface ApiOpenSearchConfig {
    domainName: string;
    indexPrefix: string;
    sharedIndexes: boolean;
}

export interface CreateApiPulumiAppParams {
    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppParam<boolean | Partial<ApiElasticsearchConfig>>;

    /**
     * Enables OpenSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    openSearch?: PulumiAppParam<boolean | Partial<ApiOpenSearchConfig>>;

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
    const baseApp = createPulumiApp({
        name: "api",
        path: "apps/api",
        config: projectAppParams,
        program: async app => {
            let searchEngineParams:
                | CreateCorePulumiAppParams["openSearch"]
                | CreateCorePulumiAppParams["elasticSearch"]
                | null = null;

            if (projectAppParams.openSearch) {
                searchEngineParams = app.getParam(projectAppParams.openSearch);
            } else if (projectAppParams.elasticSearch) {
                searchEngineParams = app.getParam(projectAppParams.elasticSearch);
            }

            if (searchEngineParams) {
                const params = app.getParam(searchEngineParams);
                if (typeof params === "object") {
                    if (params.domainName) {
                        process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME = params.domainName;
                    }

                    if (params.indexPrefix) {
                        process.env.ELASTIC_SEARCH_INDEX_PREFIX = params.indexPrefix;
                    }

                    if (params.sharedIndexes) {
                        process.env.ELASTICSEARCH_SHARED_INDEXES = "true";
                    }
                }
            }

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

            const productionEnvironments =
                app.params.create.productionEnvironments || DEFAULT_PROD_ENV_NAMES;
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
                    ELASTICSEARCH_SHARED_INDEXES: process.env.ELASTICSEARCH_SHARED_INDEXES,

                    S3_BUCKET: core.fileManagerBucketId,
                    WEBINY_LOGS_FORWARD_URL
                }
            });

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
                    ELASTICSEARCH_SHARED_INDEXES: process.env.ELASTICSEARCH_SHARED_INDEXES,

                    S3_BUCKET: core.fileManagerBucketId,
                    EVENT_BUS: core.eventBusArn,
                    IMPORT_CREATE_HANDLER: pageBuilder.import.functions.create.output.arn,
                    EXPORT_PROCESS_HANDLER: pageBuilder.export.functions.process.output.arn,
                    // TODO: move to okta plugin
                    OKTA_ISSUER: process.env["OKTA_ISSUER"],
                    WEBINY_LOGS_FORWARD_URL,
                    APW_SCHEDULER_SCHEDULE_ACTION_HANDLER:
                        apwScheduler.scheduleAction.lambda.output.arn
                },
                apwSchedulerEventRule: apwScheduler.eventRule.output,
                apwSchedulerEventTarget: apwScheduler.eventTarget.output
            });

            const websocket = app.addModule(ApiWebsocket);

            const fileManager = app.addModule(ApiFileManager, {
                env: {
                    DB_TABLE: core.primaryDynamodbTableName
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
                    path: "/files/{path+}",
                    method: "ANY",
                    function: fileManager.functions.download.output.arn
                },
                "private-any": {
                    path: "/private/{path+}",
                    method: "ANY",
                    function: fileManager.functions.download.output.arn
                },
                "cms-post": {
                    path: "/cms/{key+}",
                    method: "POST",
                    function: graphql.functions.graphql.output.arn
                },
                "cms-options": {
                    path: "/cms/{key+}",
                    method: "OPTIONS",
                    function: graphql.functions.graphql.output.arn
                },
                "files-catch-all": {
                    path: "/{path+}",
                    method: "ANY",
                    function: fileManager.functions.download.output.arn
                }
            });

            const cloudfront = app.addModule(ApiCloudfront);
            const migration = app.addModule(ApiMigration);

            const domains = app.getParam(projectAppParams.domains);
            if (domains) {
                applyCustomDomain(cloudfront, domains);
            }

            const backgroundTask = app.addModule(ApiBackgroundTask);

            app.addOutputs({
                region: aws.config.region,
                cognitoUserPoolId: core.cognitoUserPoolId,
                cognitoAppClientId: core.cognitoAppClientId,
                cognitoUserPoolPasswordPolicy: core.cognitoUserPoolPasswordPolicy,
                apwSchedulerScheduleAction: apwScheduler.scheduleAction.lambda.output.arn,
                apwSchedulerExecuteAction: apwScheduler.executeAction.lambda.output.arn,
                apwSchedulerEventRule: apwScheduler.eventRule.output.name,
                apwSchedulerEventTargetId: apwScheduler.eventTarget.output.targetId,
                dynamoDbTable: core.primaryDynamodbTableName,
                migrationLambdaArn: migration.function.output.arn,
                graphqlLambdaName: graphql.functions.graphql.output.name,
                graphqlLambdaRole: graphql.role.output.arn,
                backgroundTaskLambdaArn: backgroundTask.backgroundTask.output.arn,
                backgroundTaskStepFunctionArn: backgroundTask.stepFunction.output.arn,
                websocketApiId: websocket.websocketApi.output.id,
                websocketApiUrl: websocket.websocketApiUrl
            });

            // Only add `dynamoDbElasticsearchTable` output if using search engine (ES/OS).
            if (searchEngineParams) {
                app.addOutputs({
                    dynamoDbElasticsearchTable: core.elasticsearchDynamodbTableName
                });
            }

            app.addHandler(() => {
                addDomainsUrlsOutputs({
                    app,
                    cloudfrontDistribution: cloudfront,
                    map: {
                        distributionDomain: "cloudfrontApiDomain",
                        distributionUrl: "cloudfrontApiUrl",
                        usedDomain: "apiDomain",
                        usedUrl: "apiUrl"
                    }
                });
            });

            tagResources({
                WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
                WbyEnvironment: String(process.env["WEBINY_ENV"])
            });

            return {
                fileManager,
                graphql,
                apiGateway,
                cloudfront,
                apwScheduler,
                migration,
                backgroundTask
            };
        }
    });

    const app = withServiceManifest(withCommonLambdaEnvVariables(baseApp));

    app.addHandler(() => {
        app.addServiceManifest({
            name: "api",
            manifest: {
                bgTaskSfn: baseApp.resources.backgroundTask.stepFunction.output.arn,
                cloudfront: {
                    distributionId: baseApp.resources.cloudfront.output.id
                }
            }
        });
    });

    return app;
};
