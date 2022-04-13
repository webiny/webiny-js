import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    PulumiApp,
    ApplicationConfig,
    updateGatewayConfig
} from "@webiny/pulumi-sdk";

import { createGraphql } from "./ApiGraphql";
import { createVpc, Vpc } from "./ApiVpc";
import { createFileManager } from "./ApiFileManager";
import { createPageBuilder } from "./ApiPageBuilder";
import { createHeadlessCms } from "./ApiHeadlessCMS";
import { createApiGateway } from "./ApiGateway";
import { createCloudfront } from "./ApiCloudfront";
import { getStorageOutput } from "../getStorageOutput";
import { getAwsAccountId, getAwsRegion } from "../awsUtils";

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

        const graphql = createGraphql(app, {
            env: {
                COGNITO_REGION: String(process.env.AWS_REGION),
                COGNITO_USER_POOL_ID: storage.cognitoUserPoolId,
                DB_TABLE: storage.primaryDynamodbTableName,
                S3_BUCKET: storage.fileManagerBucketId,
                EVENT_BUS: storage.eventBusArn,
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
            eventBusArn: storage.eventBusArn,
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
            dynamoDbTable: storage.primaryDynamodbTableName
        });

        // Update variant gateway configuration.
        const variant = app.ctx.variant;
        if (variant) {
            app.onDeploy(async ({ outputs }) => {
                // After deployment is made we update a static JSON file with a variant configuration.
                // TODO: We should update WCP config instead of a static file here
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
