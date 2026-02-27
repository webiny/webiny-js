import * as aws from "@pulumi/aws";
import { createPulumiApp, isResourceOfType, type PulumiApp } from "@webiny/pulumi";
import {
    ApiBackgroundTask,
    ApiCloudfront,
    ApiFileManager,
    ApiGateway,
    ApiGraphql,
    ApiMigration,
    ApiWebsocket,
    CoreOutput,
    VpcConfig
} from "~/pulumi/apps/index.js";
import {
    addDomainsUrlsOutputs,
    withCommonLambdaEnvVariables,
    withServiceManifest
} from "~/pulumi/utils/index.js";
import { getEnvVariableAwsRegion } from "~/pulumi/env/awsRegion.js";
// import { attachSyncSystem } from "../syncSystem/api/index.js";
import { applyAwsResourceTags, getAwsAccountId } from "~/pulumi/apps/awsUtils.js";
import type { WithServiceManifest } from "~/pulumi/utils/withServiceManifest.js";
import { ApiScheduler } from "~/pulumi/apps/api/ApiScheduler.js";
import { getProjectSdk } from "@webiny/project";
import { getVpcConfigFromExtension } from "~/pulumi/apps/extensions/getVpcConfigFromExtension.js";
import { getOsConfigFromExtension } from "~/pulumi/apps/extensions/getOsConfigFromExtension.js";
import { getApiLambdaFunctionConfigFromExtension } from "~/pulumi/apps/extensions/getApiLambdaFunctionConfigFromExtension.js";
import { License } from "@webiny/wcp";
import { handleGuardDutyEvents } from "./handleGuardDutyEvents.js";
import { ApiPulumi } from "@webiny/project/abstractions/index.js";

export type ApiPulumiApp = ReturnType<typeof createApiPulumiApp>;

export const createApiPulumiApp = () => {
    const baseApp = createPulumiApp({
        name: "api",
        path: "apps/api",
        program: async (app: PulumiApp & WithServiceManifest) => {
            const sdk = await getProjectSdk();
            const projectConfig = await sdk.getProjectConfig();

            const pulumiResourceNamePrefix = await sdk.getPulumiResourceNamePrefix();
            const vpcExtensionsConfig = getVpcConfigFromExtension(projectConfig);
            const openSearchExtensionConfig = getOsConfigFromExtension(projectConfig);
            const apiLambdaFunctionConfig = getApiLambdaFunctionConfigFromExtension(projectConfig);

            let searchEngineParams: typeof openSearchExtensionConfig | null = null;

            if (openSearchExtensionConfig) {
                searchEngineParams = openSearchExtensionConfig;
            }

            if (searchEngineParams) {
                const params = searchEngineParams;
                if (typeof params === "object") {
                    if (params.domainName) {
                        process.env.AWS_OS_DOMAIN_NAME = params.domainName;
                    }

                    if (params.indexPrefix) {
                        process.env.OPENSEARCH_INDEX_PREFIX = params.indexPrefix;
                    }

                    if (params.sharedIndexes) {
                        process.env.OPENSEARCH_SHARED_INDEXES = "true";
                    }
                }
            }

            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            // <-------------------- Enterprise start -------------------->
            app.addHandler(async () => {
                const license = await License.fromEnvironment();

                const usingAdvancedVpcParams =
                    vpcExtensionsConfig && typeof vpcExtensionsConfig !== "boolean";

                if (license.canUseFileManagerThreatDetection()) {
                    handleGuardDutyEvents(app as ApiPulumiApp);
                }

                // Not using advanced VPC params? Then immediately exit.
                if (usingAdvancedVpcParams) {
                    const { onResource, addResource } = app;
                    const { useExistingVpc } = vpcExtensionsConfig;

                    // 1. We first deal with "existing VPC" setup.
                    if (useExistingVpc) {
                        if (!useExistingVpc.lambdaFunctionsVpcConfig) {
                            throw new Error(
                                "Cannot specify `useExistingVpc` parameter because the `lambdaFunctionsVpcConfig` parameter wasn't provided."
                            );
                        }

                        onResource(resource => {
                            if (isResourceOfType(resource, aws.lambda.Function)) {
                                const canUseVpc = resource.meta.canUseVpc !== false;
                                if (canUseVpc) {
                                    resource.config.vpcConfig(
                                        useExistingVpc!.lambdaFunctionsVpcConfig
                                    );
                                }
                            }

                            if (isResourceOfType(resource, aws.iam.Role)) {
                                if (resource.meta.isLambdaFunctionRole) {
                                    addResource(aws.iam.RolePolicyAttachment, {
                                        name: `${resource.name}-vpc-access-execution-role`,
                                        config: {
                                            role: resource.output.name,
                                            policyArn:
                                                aws.iam.ManagedPolicy
                                                    .AWSLambdaVPCAccessExecutionRole
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            });
            // <-------------------- Enterprise end -------------------->

            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            const pulumiHandlers = sdk.getContainer().resolve(ApiPulumi);

            app.addHandler(() => {
                return pulumiHandlers.execute(app as unknown as ApiPulumiApp);
            });

            const isProduction = app.env.isProduction;

            // Register core output as a module available to all the other modules
            const core = app.addModule(CoreOutput);

            // Register VPC config module to be available to other modules.
            const vpcEnabled =
                vpcExtensionsConfig === true ||
                typeof vpcExtensionsConfig === "object" ||
                isProduction;

            app.addModule(VpcConfig, { enabled: vpcEnabled });

            const graphql = app.addModule(ApiGraphql, {
                lambdaFunctionConfig: apiLambdaFunctionConfig?.graphql,
                env: {
                    COGNITO_REGION: getEnvVariableAwsRegion(),
                    COGNITO_USER_POOL_ID: core.cognitoUserPoolId,
                    DB_TABLE: core.primaryDynamodbTableName,
                    DB_TABLE_LOG: core.logDynamodbTableName,
                    DB_TABLE_AUDIT_LOGS: core.auditLogsDynamodbTableName,
                    DB_TABLE_OPENSEARCH: core.opensearchDynamodbTableName,
                    OPENSEARCH_ENDPOINT: core.opensearchDomainEndpoint,

                    // Not required. Useful for testing purposes / ephemeral environments.
                    // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
                    OPENSEARCH_INDEX_PREFIX: process.env.OPENSEARCH_INDEX_PREFIX,
                    OPENSEARCH_SHARED_INDEXES: process.env.OPENSEARCH_SHARED_INDEXES,

                    S3_BUCKET: core.fileManagerBucketId,
                    EVENT_BUS: core.eventBusArn,
                    // TODO: move to okta plugin
                    OKTA_ISSUER: process.env["OKTA_ISSUER"]
                }
            });

            const websocket = app.addModule(ApiWebsocket);

            const fileManager = app.addModule(ApiFileManager, {
                env: {
                    DB_TABLE: core.primaryDynamodbTableName,
                    DB_TABLE_LOG: core.logDynamodbTableName,
                    DB_TABLE_AUDIT_LOGS: core.auditLogsDynamodbTableName
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
                "redirects-get": {
                    path: "/wb/redirects",
                    method: "GET",
                    function: graphql.functions.graphql.output.arn
                },
                "redirects-options": {
                    path: "/wb/redirects",
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
            const backgroundTask = app.addModule(ApiBackgroundTask);
            const migration = app.addModule(ApiMigration);
            const scheduler = app.addModule(ApiScheduler);

            // const domains = app.getParam(projectAppParams.domains);
            // if (domains) {
            //     applyCustomDomain(cloudfront, domains);
            // }

            app.addOutputs({
                awsAccountId: getAwsAccountId(app),
                region: aws.config.region,
                cognitoUserPoolId: core.cognitoUserPoolId,
                cognitoAppClientId: core.cognitoAppClientId,
                cognitoUserPoolPasswordPolicy: core.cognitoUserPoolPasswordPolicy,
                dynamoDbTable: core.primaryDynamodbTableName,
                auditLogsDynamoDbTable: core.auditLogsDynamodbTableName,
                migrationLambdaArn: migration.function.output.arn,
                graphqlLambdaName: graphql.functions.graphql.output.name,
                graphqlLambdaRole: graphql.role.output.arn,
                graphqlLambdaRoleName: graphql.role.output.name,
                backgroundTaskLambdaArn: backgroundTask.backgroundTask.output.arn,
                backgroundTaskStepFunctionArn: backgroundTask.stepFunction.output.arn,
                fileManagerDownloadLambdaArn: fileManager.functions.download.output.arn,
                websocketApiId: websocket.websocketApi.output.id,
                websocketApiUrl: websocket.websocketApiUrl,
                schedulerLambdaInvokeRole: scheduler.invokeRole.output.arn
            });

            // Only add `dynamoDbOpensearchTable` output if using search engine (ES/OS).
            if (searchEngineParams) {
                app.addOutputs({
                    dynamoDbOpensearchTable: core.opensearchDynamodbTableName
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
            // /**
            //  * We need to attach the Sync System if it exists.
            //  */
            // await attachSyncSystem({
            //     app,
            //     core,
            //     env: app.params.run.env
            // });

            // Applies internal and user-defined AWS tags.
            await applyAwsResourceTags("api");

            return {
                fileManager,
                graphql,
                apiGateway,
                websocket,
                cloudfront,
                migration,
                backgroundTask,
                scheduler
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
                    distributionId: baseApp.resources.cloudfront.output.id,
                    domain: baseApp.resources.cloudfront.output.domainName.apply(
                        v => `https://${v}`
                    )
                }
            }
        });

        app.addServiceManifest({
            name: "scheduler",
            manifest: {
                lambdaArn: baseApp.resources.graphql.functions.graphql.output.arn,
                roleArn: baseApp.resources.scheduler.invokeRole.output.arn
            }
        });
    });

    return app;
};
