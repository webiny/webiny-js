import * as aws from "@pulumi/aws";

import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    PulumiApp,
    ApplicationConfig,
    updateGatewayConfig
} from "@webiny/pulumi-sdk";

import { getStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils";

import { createGraphql } from "./ApiGraphql";
import { createVpc, Vpc } from "./ApiVpc";
import { createPrerenderingService } from "./ApiPrerendering";
import { createFileManager } from "./ApiFileManager";
import { createPageBuilder } from "./ApiPageBuilder";
import { createHeadlessCms } from "./ApiHeadlessCMS";
import { createApiGateway } from "./ApiGateway";
import { createCloudfront } from "./ApiCloudfront";

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

        const storage = app.addHandler(async () => {
            const output = await getStackOutput({
                folder: "apps/storage",
                env: app.ctx.env
            });

            return {
                fileManagerBucketId: output["fileManagerBucketId"] as string,
                primaryDynamodbTableArn: output["primaryDynamodbTableArn"] as string,
                primaryDynamodbTableName: output["primaryDynamodbTableName"] as string,
                cognitoUserPoolId: output["cognitoUserPoolId"] as string,
                cognitoUserPoolArn: output["cognitoUserPoolArn"] as string,
                cognitoUserPoolPasswordPolicy: output["cognitoUserPoolPasswordPolicy"],
                cognitoAppClientId: output["cognitoAppClientId"] as string
            };
        });

        const awsAccountId = app.addHandler(() => {
            return aws.getCallerIdentity({}).then(x => x.accountId);
        });

        const awsRegion = app.addHandler(() => {
            return aws.config.requireRegion();
        });

        const pageBuilder = createPageBuilder(app, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
                S3_BUCKET: storage.fileManagerBucketId,
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            awsRegion,
            awsAccountId,
            fileManagerBucketId: storage.fileManagerBucketId,
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            cognitoUserPoolArn: storage.cognitoUserPoolArn,
            vpc
        });

        const fileManager = createFileManager(app, {
            awsRegion,
            awsAccountId,
            fileManagerBucketId: storage.fileManagerBucketId,
            vpc
        });

        const prerenderingService = createPrerenderingService(app, {
            env: {
                DB_TABLE: storage.primaryDynamodbTableName,
                DEBUG
            },
            awsRegion,
            awsAccountId,
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            fileManagerBucketId: storage.fileManagerBucketId,
            cognitoUserPoolArn: storage.cognitoUserPoolArn,
            vpc
        });

        const graphql = createGraphql(app, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
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
            fileManagerBucketId: storage.fileManagerBucketId,
            cognitoUserPoolArn: storage.cognitoUserPoolArn,
            vpc
        });

        const headlessCms = createHeadlessCms(app, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
                S3_BUCKET: storage.fileManagerBucketId,
                // TODO: move to okta plugin
                OKTA_ISSUER: process.env["OKTA_ISSUER"],
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            primaryDynamodbTableArn: storage.primaryDynamodbTableArn,
            vpc
        });

        const apiGateway = createApiGateway(app, {
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

        const cloudfront = createCloudfront(app, {
            apiGateway
        });

        app.addOutputs({
            region: process.env.AWS_REGION,
            apiUrl: cloudfront.output.domainName.apply(value => `https://${value}`),
            apiDomain: cloudfront.output.domainName,
            cognitoUserPoolId: storage.cognitoUserPoolId,
            cognitoAppClientId: storage.cognitoAppClientId,
            cognitoUserPoolPasswordPolicy: storage.cognitoUserPoolPasswordPolicy,
            updatePbSettingsFunction: pageBuilder.updateSettings.functions.update.output.arn,
            psQueueAdd: prerenderingService.functions.queue.add.output.arn,
            psQueueProcess: prerenderingService.functions.queue.process.output.arn,
            dynamoDbTable: storage.primaryDynamodbTableName
        });

        // Update variant gateway configuration.
        const variant = app.ctx.variant;
        if (variant) {
            app.onDeploy(async ({ outputs }) => {
                await updateGatewayConfig({
                    app: "api",
                    cwd: app.ctx.projectDir,
                    env: app.ctx.env,
                    variant: variant,
                    domain: outputs["apiDomain"]
                });
            });
        }

        return {
            fileManager,
            prerenderingService,
            graphql,
            headlessCms,
            apiGateway,
            cloudfront
        };
    }
});

export type ApiApp = InstanceType<typeof ApiApp>;

export function createApiApp(config: ApiAppConfig & ApplicationConfig<ApiApp>) {
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
            const app = new ApiApp(ctx);
            await app.setup(config);
            await config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy
    });
}
