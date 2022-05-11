import {
    defineApp,
    createGenericApplication,
    ApplicationConfig,
    ApplicationContext
} from "@webiny/pulumi-sdk";

import { StorageCognito } from "./StorageCognito";
import { StorageDynamo } from "./StorageDynamo";
import { StorageFileManger } from "./StorageFileManager";
import { StorageVpc } from "./StorageVpc";

export interface StorageAppConfig {
    /**
     * Secures against deleting database by accident.
     * By default enabled in production environments.
     * @param ctx Application context
     */
    protect?(ctx: ApplicationContext): boolean;
    /**
     * Enables VPC for the application.
     * By default enabled in production environments.
     * @param ctx Application context
     */
    vpc?(ctx: ApplicationContext): boolean;
    /**
     * Additional settings for backwards compatibility.
     * @param ctx Application context
     */
    legacy?(ctx: ApplicationContext): StorageAppLegacyConfig;
}

export interface StorageAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export const StorageApp = defineApp({
    name: "storage",
    config(app, config: StorageAppConfig) {
        const protect = config.protect?.(app.ctx) ?? app.ctx.env !== "dev";
        const legacyConfig = config?.legacy?.(app.ctx) ?? {};

        // Setup DynamoDB table
        const dynamoDbTable = app.addModule(StorageDynamo, { protect });

        // Setup VPC
        const vpc = config?.vpc?.(app.ctx) ? app.addModule(StorageVpc) : null;

        // Setup Cognito
        const cognito = app.addModule(StorageCognito, {
            protect,
            useEmailAsUsername: legacyConfig.useEmailAsUsername ?? false
        });

        // Setup file storage bucket
        const fileManagerBucket = app.addModule(StorageFileManger, { protect });

        app.addOutputs({
            fileManagerBucketId: fileManagerBucket.output.id,
            primaryDynamodbTableArn: dynamoDbTable.output.arn,
            primaryDynamodbTableName: dynamoDbTable.output.name,
            primaryDynamodbTableHashKey: dynamoDbTable.output.hashKey,
            primaryDynamodbTableRangeKey: dynamoDbTable.output.rangeKey,
            cognitoUserPoolId: cognito.userPool.output.id,
            cognitoUserPoolArn: cognito.userPool.output.arn,
            cognitoUserPoolPasswordPolicy: cognito.userPool.output.passwordPolicy,
            cognitoAppClientId: cognito.userPoolClient.output.id
        });

        return {
            dynamoDbTable,
            vpc,
            ...cognito,
            fileManagerBucket
        };
    }
});

export type StorageApp = InstanceType<typeof StorageApp>;

export function createStorageApp(config?: StorageAppConfig & ApplicationConfig<StorageApp>) {
    return createGenericApplication({
        id: "storage",
        name: "storage",
        description: "Your project's persistent storages.",
        async app(ctx) {
            // Create the app instance.
            const app = new StorageApp(ctx);
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
