import {
    defineApp,
    createGenericApplication,
    ApplicationHooks,
    ApplicationConfig
} from "@webiny/pulumi-sdk";
import { AppInput, getAppInput } from "../utils";

import { StorageCognito } from "./StorageCognito";
import { StorageDynamo } from "./StorageDynamo";
import { ElasticSearch } from "./StorageElasticSearch";
import { StorageEventBus } from "./StorageEventBus";
import { StorageFileManger } from "./StorageFileManager";

export interface StorageAppConfig extends Partial<ApplicationHooks> {
    protect?: AppInput<boolean>;
    legacy?: AppInput<StorageAppLegacyConfig>;
    elasticSearch?: AppInput<boolean>;
}

export interface StorageAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export const StorageApp = defineApp({
    name: "storage",
    config(app, config: StorageAppConfig) {
        const protect = getAppInput(app, config.protect) ?? app.ctx.env !== "dev";
        const legacyConfig = getAppInput(app, config.legacy) ?? {};

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

        const elasticSearch = getAppInput(app, config.elasticSearch)
            ? app.addModule(ElasticSearch, { protect: protect })
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

        return {
            dynamoDbTable,
            ...cognito,
            fileManagerBucket,
            eventBus,
            elasticSearch
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
