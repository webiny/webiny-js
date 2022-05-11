import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    ApplicationHooks,
    ApplicationConfig
} from "@webiny/pulumi-sdk";

import { StorageCognito } from "./StorageCognito";
import { StorageDynamo } from "./StorageDynamo";
import { StorageEventBus } from "./StorageEventBus";
import { StorageFileManger } from "./StorageFileManager";

export interface StorageAppConfig extends Partial<ApplicationHooks> {
    protect?(ctx: ApplicationContext): boolean;
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

        // Setup Cognito
        const cognito = app.addModule(StorageCognito, {
            protect,
            useEmailAsUsername: legacyConfig.useEmailAsUsername ?? false
        });

        // Setup event bus
        const eventBus = app.addModule(StorageEventBus);

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
            cognitoAppClientId: cognito.userPoolClient.output.id,
            eventBusArn: eventBus.output.arn
        });

        return {
            dynamoDbTable,
            ...cognito,
            eventBus,
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
