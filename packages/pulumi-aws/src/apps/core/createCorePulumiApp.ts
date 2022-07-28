import { createPulumiApp, PulumiAppParam } from "@webiny/pulumi";
import { CoreCognito } from "./CoreCognito";
import { CoreDynamo } from "./CoreDynamo";
import { ElasticSearch } from "./CoreElasticSearch";
import { CoreEventBus } from "./CoreEventBus";
import { CoreFileManger } from "./CoreFileManager";
import { CoreVpc } from "./CoreVpc";
import { tagResources } from "~/utils";

export type CorePulumiApp = ReturnType<typeof createCorePulumiApp>;

export interface CreateCorePulumiAppParams {
    /**
     * Secures against deleting database by accident.
     * By default enabled in production environments.
     */
    protect?: PulumiAppParam<boolean>;

    /**
     * Enables ElasticSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    elasticSearch?: PulumiAppParam<boolean>;

    /**
     * Enables VPC for the application.
     * By default enabled in production environments.
     */
    vpc?: PulumiAppParam<boolean>;

    /**
     * Additional settings for backwards compatibility.
     */
    legacy?: PulumiAppParam<CoreAppLegacyConfig>;

    /**
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: CorePulumiApp) => void | Promise<void>;
}

export interface CoreAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export function createCorePulumiApp(projectAppParams: CreateCorePulumiAppParams = {}) {
    return createPulumiApp({
        name: "core",
        path: "apps/core",
        config: projectAppParams,
        program: async app => {
            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as CorePulumiApp);
                });
            }

            const prod = app.params.run.env === "prod";
            const protect = app.getParam(projectAppParams.protect) || prod;
            const legacyConfig = app.getParam(projectAppParams.legacy) || {};

            // Setup DynamoDB table
            const dynamoDbTable = app.addModule(CoreDynamo, { protect });

            // Setup VPC
            const vpcEnabled = app.getParam(projectAppParams?.vpc) || prod;
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

            const elasticSearch = app.getParam(projectAppParams?.elasticSearch)
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
}
