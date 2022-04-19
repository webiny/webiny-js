import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    ApplicationHooks,
    ApplicationConfig
} from "@webiny/pulumi-sdk";

import { createCognitoResources } from "./StorageCognito";
import { createDynamoTable } from "./StorageDynamo";
import { createFileManagerBucket } from "./StorageFileManager";

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
        const dynamoDbTable = createDynamoTable(app, { protect });

        // Setup Cognito
        const cognito = createCognitoResources(app, {
            protect,
            useEmailAsUsername: legacyConfig.useEmailAsUsername ?? false
        });

        // Setup file storage bucket
        const fileManagerBucket = createFileManagerBucket(app, { protect });

        app.addOutputs({
            fileManagerBucketId: fileManagerBucket.output.id,
            primaryDynamodbTableArn: dynamoDbTable.output.arn,
            primaryDynamodbTableName: dynamoDbTable.output.name,
            cognitoUserPoolId: cognito.userPool.output.id,
            cognitoUserPoolArn: cognito.userPool.output.arn,
            cognitoUserPoolPasswordPolicy: cognito.userPool.output.passwordPolicy,
            cognitoAppClientId: cognito.userPoolClient.output.id
        });

        return {
            dynamoDbTable,
            ...cognito,
            fileManagerBucket
        };
    }
});

export type StorageApp = InstanceType<typeof StorageApp>;

export function createStorageApp(config: StorageAppConfig & ApplicationConfig<StorageApp>) {
    return createGenericApplication({
        id: "storage",
        name: "storage",
        description: "Your project's persistent storages.",
        async app(ctx) {
            const app = new StorageApp(ctx);
            await app.setup(config);
            await config.config?.(app, ctx);
            config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy
    });
}
