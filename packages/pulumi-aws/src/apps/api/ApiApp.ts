import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    PulumiApp,
    ApplicationConfig
} from "@webiny/pulumi-sdk";

import { ApiGraphql } from "./ApiGraphql";
import { createVpc, Vpc } from "./ApiVpc";
import { createPrerenderingService } from "./ApiPrerendering";
import { ApiFileManager } from "./ApiFileManager";
import { ApiPageBuilder } from "./ApiPageBuilder";
import { ApiHeadlessCMS } from "./ApiHeadlessCMS";
import { ApiGateway } from "./ApiGateway";
import { ApiCloudfront } from "./ApiCloudfront";
import { getStorageOutput } from "../getStorageOutput";
import { getAwsAccountId, getAwsRegion } from "../awsUtils";
import { ApiApwScheduler } from "./ApiApwScheduler";

export interface ApiAppConfig {
    vpc?(app: PulumiApp, ctx: ApplicationContext): boolean | Vpc;
}

export const ApiApp = defineApp({
    name: "Api",
    async config(app, config: ApiAppConfig) {
        // Among other things, this determines the amount of information we reveal on runtime errors.
        // https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
        const DEBUG = String(process.env.DEBUG);

        // Enables logs forwarding.
        // https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding
        const WEBINY_LOGS_FORWARD_URL = String(process.env.WEBINY_LOGS_FORWARD_URL);

        const vpcConfig = config.vpc?.(app, app.ctx) ?? app.ctx.env !== "dev";
        const vpc =
            vpcConfig === true ? createVpc(app) : vpcConfig === false ? undefined : vpcConfig;

        const storage = getStorageOutput(app);
        const awsAccountId = getAwsAccountId(app);
        const awsRegion = getAwsRegion(app);

        const pageBuilder = app.addModule(ApiPageBuilder, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
                DB_TABLE_ELASTICSEARCH: storage.elasticsearchDynamodbTableName,
                ELASTIC_SEARCH_ENDPOINT: storage.elasticsearchDomainEndpoint,

                // Not required. Useful for testing purposes / ephemeral environments.
                // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
                ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

                S3_BUCKET: storage.fileManagerBucketId,
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            awsRegion,
            awsAccountId,
            fileManagerBucketId: storage.fileManagerBucketId,
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            cognitoUserPoolArn: storage.cognitoUserPoolArn,
            elasticsearchDomainArn: storage.elasticsearchDomainArn,
            elasticsearchDynamodbTableArn: storage.elasticsearchDynamodbTableArn,
            vpc
        });

        const fileManager = app.addModule(ApiFileManager, {
            fileManagerBucketId: storage.fileManagerBucketId,
            vpc
        });

        const prerenderingService = createPrerenderingService(app, {
            env: {
                DB_TABLE: storage.primaryDynamodbTableName,
                DB_TABLE_ELASTICSEARCH: storage.elasticsearchDynamodbTableName,
                DEBUG
            },
            awsRegion,
            awsAccountId,
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            fileManagerBucketId: storage.fileManagerBucketId,
            cognitoUserPoolArn: storage.cognitoUserPoolArn,
            elasticsearchDynamodbTableArn: storage.elasticsearchDynamodbTableArn,
            vpc
        });

        const apwScheduler = app.addModule(ApiApwScheduler, {
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
                S3_BUCKET: storage.fileManagerBucketId,
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            }
        });

        const graphql = app.addModule(ApiGraphql, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
                DB_TABLE_ELASTICSEARCH: storage.elasticsearchDynamodbTableName,
                ELASTIC_SEARCH_ENDPOINT: storage.elasticsearchDomainEndpoint,

                // Not required. Useful for testing purposes / ephemeral environments.
                // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
                ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

                S3_BUCKET: storage.fileManagerBucketId,

                PRERENDERING_RENDER_HANDLER: prerenderingService.functions.render.output.arn,
                PRERENDERING_FLUSH_HANDLER: prerenderingService.functions.flush.output.arn,
                PRERENDERING_QUEUE_ADD_HANDLER: prerenderingService.functions.queue.add.output.arn,
                PRERENDERING_QUEUE_PROCESS_HANDLER:
                    prerenderingService.functions.queue.process.output.arn,
                IMPORT_PAGES_CREATE_HANDLER: pageBuilder.importPages.functions.create.output.arn,
                EXPORT_PAGES_PROCESS_HANDLER: pageBuilder.exportPages.functions.process.output.arn,
                // TODO: move to okta plugin
                OKTA_ISSUER: process.env["OKTA_ISSUER"],
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            awsRegion,
            awsAccountId,
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            primaryDynamodbTableName: storage.primaryDynamodbTableName,
            primaryDynamodbTableHashKey: storage.primaryDynamodbTableHashKey,
            primaryDynamodbTableRangeKey: storage.primaryDynamodbTableRangeKey,
            fileManagerBucketId: storage.fileManagerBucketId,
            cognitoUserPoolArn: storage.cognitoUserPoolArn,
            apwSchedulerEventRule: apwScheduler.eventRule.output,
            apwSchedulerEventTarget: apwScheduler.eventTarget.output,
            elasticsearchDomainArn: storage.elasticsearchDomainArn,
            elasticsearchDynamodbTableArn: storage.elasticsearchDynamodbTableArn,
            vpc
        });

        const headlessCms = app.addModule(ApiHeadlessCMS, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
                DB_TABLE_ELASTICSEARCH: storage.elasticsearchDynamodbTableName,
                ELASTIC_SEARCH_ENDPOINT: storage.elasticsearchDomainEndpoint,

                // Not required. Useful for testing purposes / ephemeral environments.
                // https://www.webiny.com/docs/key-topics/ci-cd/testing/slow-ephemeral-environments
                ELASTIC_SEARCH_INDEX_PREFIX: process.env.ELASTIC_SEARCH_INDEX_PREFIX,

                S3_BUCKET: storage.fileManagerBucketId,
                // TODO: move to okta plugin
                OKTA_ISSUER: process.env["OKTA_ISSUER"],
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            elasticsearchDomainArn: storage.elasticsearchDomainArn,
            elasticsearchDynamodbTableArn: storage.elasticsearchDynamodbTableArn,
            vpc
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

        app.addOutputs({
            region: process.env.AWS_REGION,
            apiUrl: cloudfront.output.domainName.apply(value => `https://${value}`),
            cognitoUserPoolId: storage.cognitoUserPoolId,
            cognitoAppClientId: storage.cognitoAppClientId,
            cognitoUserPoolPasswordPolicy: storage.cognitoUserPoolPasswordPolicy,
            updatePbSettingsFunction: pageBuilder.updateSettings.functions.update.output.arn,
            psQueueAdd: prerenderingService.functions.queue.add.output.arn,
            psQueueProcess: prerenderingService.functions.queue.process.output.arn,
            apwSchedulerScheduleAction: apwScheduler.scheduleAction.lambda.output.arn,
            apwSchedulerExecuteAction: apwScheduler.executeAction.lambda.output.arn,
            apwSchedulerEventRule: apwScheduler.eventRule.output.name,
            apwSchedulerEventTargetId: apwScheduler.eventTarget.output.targetId,
            dynamoDbTable: storage.primaryDynamodbTableName,
            dynamoDbElasticsearchTable: storage.elasticsearchDynamodbTableName
        });

        return {
            fileManager,
            prerenderingService,
            graphql,
            headlessCms,
            apiGateway,
            cloudfront,
            apwScheduler
        };
    }
});

export type ApiApp = InstanceType<typeof ApiApp>;

export function createApiApp(config?: ApiAppConfig & ApplicationConfig<ApiApp>) {
    return createGenericApplication({
        id: "api",
        name: "api",
        description:
            "Represents cloud infrastructure needed for supporting your project's (GraphQL) API.",
        cli: {
            // Default args for the "yarn webiny watch ..." command.
            watch: {
                // Watch five levels of dependencies, starting from this project application.
                depth: 5
            }
        },
        async app(ctx) {
            // Create the app instance.
            const app = new ApiApp(ctx);
            // Run the default application setup.
            await app.setup(config || {});
            // Run the custom user config.
            await config?.config?.(app, ctx);
            return app;
        },
        onBeforeBuild: config?.onBeforeBuild,
        onAfterBuild: config?.onAfterBuild,
        onBeforeDeploy: config?.onBeforeDeploy,
        onAfterDeploy: config?.onAfterDeploy
    });
}
