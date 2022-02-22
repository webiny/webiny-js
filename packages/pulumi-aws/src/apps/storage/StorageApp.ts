import {
    defineApp,
    createGenericApplication,
    ApplicationContext,
    ApplicationHooks
} from "@webiny/pulumi-sdk";

import { createCognitoResources } from "./StorageCognito";
import { createDynamoTable } from "./StorageDynamo";
import { createFileManagerBucket } from "./StorageFileManager";

export interface StorageAppConfig extends Partial<ApplicationHooks> {
    config?(app: StorageApp, ctx: ApplicationContext): void;
    protect?(ctx: ApplicationContext): boolean;
}

export const StorageApp = defineApp({
    name: "Storage",
    config(app, config: StorageAppConfig) {
        const protect = config.protect?.(app.ctx) ?? app.ctx.env === "dev";

        // Setup DynamoDB table
        const table = createDynamoTable(app, { protect });

        // Setup Cognito
        const cognito = createCognitoResources(app, { protect });

        // Setup file storage bucket
        const fileManagerBucket = createFileManagerBucket(app, { protect });

        app.addOutputs({
            fileManagerBucketId: fileManagerBucket.output.id,
            primaryDynamodbTableArn: table.output.arn,
            primaryDynamodbTableName: table.output.name,
            cognitoUserPoolId: cognito.userPool.output.id,
            cognitoUserPoolArn: cognito.userPool.output.arn,
            cognitoUserPoolPasswordPolicy: cognito.userPool.output.passwordPolicy,
            cognitoAppClientId: cognito.userPoolClient.output.id
        });

        return {
            table,
            ...cognito,
            fileManagerBucket
        };
    }
});

export type StorageApp = InstanceType<typeof StorageApp>;

export function createStorageApp(config: StorageAppConfig) {
    return createGenericApplication({
        id: "storage",
        name: "Storage",
        description: "Your project's persistent storages.",
        app(ctx) {
            const app = new StorageApp(ctx, config);
            config.config?.(app, ctx);
            return app;
        },
        beforeBuild: config.beforeBuild,
        afterBuild: config.afterBuild,
        beforeDeploy: config.beforeDeploy,
        afterDeploy: config.afterDeploy
    });
}
