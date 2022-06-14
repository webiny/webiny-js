import { createPulumiApp } from "@webiny/pulumi-app";
import { PulumiAppInput, getPulumiAppInput } from "../utils";
import { StorageCognito } from "./StorageCognito";
import { StorageDynamo } from "./StorageDynamo";
import { ElasticSearch } from "./StorageElasticSearch";
import { StorageEventBus } from "./StorageEventBus";
import { StorageFileManger } from "./StorageFileManager";
import { StorageVpc } from "./StorageVpc";
import { tagResources } from "~/utils";

export interface CreateStorageAppConfig {
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
    legacy?: PulumiAppInput<StorageAppLegacyConfig>;
}

export interface StorageAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export function createStorageApp(projectAppConfig?: CreateStorageAppConfig) {
    return {
        id: "storage",
        name: "Storage",
        description: "Your project's persistent storages.",
        pulumi: createPulumiApp({
            name: "storage",
            path: "apps/storage",
            config: projectAppConfig,
            program: app => {
                const protect = app.run.params.protect || false;
                const legacyConfig = app.run.params.legacyConfig || {};

                // Setup DynamoDB table
                const dynamoDbTable = app.addModule(StorageDynamo, { protect });

                // Setup VPC
                // const vpcEnabled = getAppInput(app, config.vpc) ?? app.ctx.env === "prod";
                const vpcEnabled = projectAppConfig?.vpc || app.run.params.env === "prod";
                const vpc = vpcEnabled ? app.addModule(StorageVpc) : null;

                // Setup Cognito
                const cognito = app.addModule(StorageCognito, {
                    protect,
                    useEmailAsUsername: legacyConfig.useEmailAsUsername ?? false
                });

                // Setup event bus
                const eventBus = app.addModule(StorageEventBus);

                // Setup file storage bucket
                const fileManagerBucket = app.addModule(StorageFileManger, { protect });

                const elasticSearch = getPulumiAppInput(app, projectAppConfig?.elasticSearch)
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
        })
    };
}
