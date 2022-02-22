import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    ApplicationHooks,
    PulumiApp
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

export interface ApiAppConfig extends Partial<ApplicationHooks> {
    config?(app: ApiApp, ctx: ApplicationContext): void;
    vpc?(app: PulumiApp, ctx: ApplicationContext): boolean | Vpc;
}

export const ApiApp = defineApp({
    name: "Api",
    config(app, config: ApiAppConfig) {
        // Among other things, this determines the amount of information we reveal on runtime errors.
        // https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
        const DEBUG = String(process.env.DEBUG);

        // Enables logs forwarding.
        // https://www.webiny.com/docs/how-to-guides/use-watch-command#enabling-logs-forwarding
        const WEBINY_LOGS_FORWARD_URL = String(process.env.WEBINY_LOGS_FORWARD_URL);

        const vpcConfig = config.vpc?.(app, app.ctx) ?? app.ctx.env !== "dev";
        const vpc =
            vpcConfig === true ? createVpc(app) : vpcConfig === false ? undefined : vpcConfig;

        const storageOutput = getStackOutput({
            folder: "apps/storage",
            env: app.ctx.env
        });

        const current = aws.getCallerIdentity({});
        const awsAccountId = pulumi.output(current).accountId;
        const awsRegion = aws.config.requireRegion();

        const fileManagerBucketId = storageOutput.fileManagerBucketId as string;
        const primaryDynamodbTableArn = storageOutput.primaryDynamodbTableArn as string;
        const primaryDynamodbTableName = storageOutput.primaryDynamodbTableName as string;
        const cognitoUserPoolId = storageOutput.cognitoUserPoolId as string;
        const cognitoUserPoolArn = storageOutput.cognitoUserPoolArn as string;
        const cognitoUserPoolPasswordPolicy = storageOutput.cognitoUserPoolPasswordPolicy;
        const cognitoAppClientId = storageOutput.cognitoAppClientId as string;

        const pageBuilder = createPageBuilder(app, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: cognitoUserPoolId,
                DB_TABLE: primaryDynamodbTableName,

                S3_BUCKET: fileManagerBucketId,
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            awsRegion,
            awsAccountId,
            fileManagerBucketId,
            primaryDynamodbTableArn,
            cognitoUserPoolArn,
            vpc
        });

        const fileManager = createFileManager(app, {
            awsRegion,
            awsAccountId,
            fileManagerBucketId,
            vpc
        });

        const prerenderingService = createPrerenderingService(app, {
            env: {
                DB_TABLE: primaryDynamodbTableName,
                DEBUG
            },
            awsRegion,
            awsAccountId,
            primaryDynamodbTableArn,
            fileManagerBucketId,
            cognitoUserPoolArn,
            vpc
        });

        const graphql = createGraphql(app, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: cognitoUserPoolId,
                DB_TABLE: primaryDynamodbTableName,
                S3_BUCKET: fileManagerBucketId,

                PRERENDERING_RENDER_HANDLER: prerenderingService.functions.render.output.arn,
                PRERENDERING_FLUSH_HANDLER: prerenderingService.functions.flush.output.arn,
                PRERENDERING_QUEUE_ADD_HANDLER: prerenderingService.functions.queue.add.output.arn,
                PRERENDERING_QUEUE_PROCESS_HANDLER:
                    prerenderingService.functions.queue.process.output.arn,
                IMPORT_PAGES_CREATE_HANDLER: pageBuilder.importPages.functions.create.output.arn,
                EXPORT_PAGES_PROCESS_HANDLER: pageBuilder.exportPages.functions.process.output.arn,
                // TODO: move to okta plugin
                OKTA_ISSUER: process.env.OKTA_ISSUER,
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            awsRegion,
            awsAccountId,
            primaryDynamodbTableArn,
            fileManagerBucketId,
            cognitoUserPoolArn,
            vpc
        });

        const headlessCms = createHeadlessCms(app, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: cognitoUserPoolId,
                DB_TABLE: primaryDynamodbTableName,
                S3_BUCKET: fileManagerBucketId,
                // TODO: move to okta plugin
                OKTA_ISSUER: process.env.OKTA_ISSUER,
                DEBUG,
                WEBINY_LOGS_FORWARD_URL
            },
            primaryDynamodbTableArn,
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
            cognitoUserPoolId: cognitoUserPoolId,
            cognitoAppClientId: cognitoAppClientId,
            cognitoUserPoolPasswordPolicy: cognitoUserPoolPasswordPolicy,
            updatePbSettingsFunction: pageBuilder.updateSettings.functions.update.output.arn,
            psQueueAdd: prerenderingService.functions.queue.add.output.arn,
            psQueueProcess: prerenderingService.functions.queue.process.output.arn,
            dynamoDbTable: primaryDynamodbTableName
        });

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

export function createApiApp(config: ApiAppConfig) {
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
        app(ctx) {
            const app = new ApiApp(ctx, config);
            config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy
    });
}
