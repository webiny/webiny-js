import { createPulumiApp, PulumiAppInput } from "@webiny/pulumi";
import { CoreCognito } from "./CoreCognito";
import { CoreDynamo } from "./CoreDynamo";
import { ElasticSearch } from "./CoreElasticSearch";
import { CoreEventBus } from "./CoreEventBus";
import { CoreFileManger } from "./CoreFileManager";
import { CoreVpc } from "./CoreVpc";
import { tagResources } from "~/utils";

export interface CreateCoreAppConfig {
    /**
     * Secures against deleting database by accident.
     * By default enabled in production environments.
     */
    protect?: PulumiAppInput<boolean>;

    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppInput<boolean>;

    /**
     * Enables VPC for the application.
     * By default enabled in production environments.
     */
    vpc?: PulumiAppInput<boolean>;

    /**
     * Additional settings for backwards compatibility.
     */
    legacy?: PulumiAppInput<CoreAppLegacyConfig>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: ReturnType<typeof createCorePulumiApp>) => void;
}

export interface CoreAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export function createCoreApp(projectAppConfig: CreateCoreAppConfig = {}) {
    return {
        id: "core",
        name: "Core",
        description: "Your project's persistent cores.",
        pulumi: createCorePulumiApp(projectAppConfig)
    };
}

export function createCorePulumiApp(projectAppConfig: CreateCoreAppConfig = {}) {
    const app = createPulumiApp({
        name: "core",
        path: "apps/core",
        config: projectAppConfig,
        program: app => {
            const protect = app.getInput(projectAppConfig.protect) || app.config.run.env === 'prod';
            const legacyConfig = app.getInput(projectAppConfig.legacy) || {};

            // Setup DynamoDB table
            const dynamoDbTable = app.addModule(CoreDynamo, { protect });

            // Setup VPC
            // const vpcEnabled = getAppInput(app, config.vpc) ?? app.ctx.env === "prod";
            const vpcEnabled = app.getInput(projectAppConfig?.vpc) || app.config.run.env === "prod";
            const vpc = vpcEnabled ? app.addModule(CoreVpc) : null;

            // Setup Cognito
            const cognito = app.addModule(CoreCognito, {
                protect,
                useEmailAsUsername: legacyConfig.useEmailAsUsername ?? false
            });

            // Setup event bus
            const eventBus = app.addModule(CoreEventBus);

            // Setup file core bucket
            const fileManagerBucket = app.addModule(CoreFileManger, { protect });

            const elasticSearch = app.getInput(projectAppConfig?.elasticSearch)
                ? app.addModule(ElasticSearch, { protect })
                : null;

            app.addOutputs({
                fileManagerBucketId: fileManagerBucket.output.id,
                primaryDynamodbTableArn: dynamoDbTable.output.arn,
                primaryDynamodbTableName: dynamoDbTable.output.name,
                primaryDynamodbTableHashKey: dynamoDbTable.output.hashKey,
                primaryDynamodbTableRangeKey: dynamoDbTable.output.rangeKey,
                cognitoUserPoolId: cognito.userPool.output.id,
                cognitoUserPoolArn: cognito.userPool.output.arn,
                cognitoUserPoolPasswordPolicy: cognito.userPool.output.passwordPolicy,
                cognitoAppClientId: cognito.userPoolClient.output.id,
                eventBusArn: eventBus.output.arn
            });

            tagResources({
                WbyProjectName: String(process.env["WEBINY_PROJECT_NAME"]),
                WbyEnvironment: String(process.env["WEBINY_ENV"])
            });

            return {
                dynamoDbTable,
                vpc,
                ...cognito,
                fileManagerBucket,
                eventBus,
                elasticSearch
            };
        }
    });

    if (projectAppConfig.pulumi) {
        projectAppConfig.pulumi(app);
    }

    return app;
}
