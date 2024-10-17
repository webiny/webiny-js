import * as aws from "@pulumi/aws";
import { createPulumiApp, PulumiAppParam } from "@webiny/pulumi";
import { CoreCognito } from "./CoreCognito";
import { CoreDynamo } from "./CoreDynamo";
import { ElasticSearch } from "./CoreElasticSearch";
import { OpenSearch } from "./CoreOpenSearch";
import { CoreEventBus } from "./CoreEventBus";
import { CoreFileManger } from "./CoreFileManager";
import { CoreVpc } from "./CoreVpc";
import { WatchCommand } from "./WatchCommand";
import { tagResources } from "~/utils";
import { withServiceManifest } from "~/utils/withServiceManifest";
import { addServiceManifestTableItem, TableDefinition } from "~/utils/addServiceManifestTableItem";
import { DEFAULT_PROD_ENV_NAMES } from "~/constants";
import * as random from "@pulumi/random";
import { featureFlags } from "@webiny/feature-flags";

export type CorePulumiApp = ReturnType<typeof createCorePulumiApp>;

export interface ElasticsearchConfig {
    domainName: string;
    indexPrefix: string;
    sharedIndexes: boolean;
}

export interface OpenSearchConfig {
    domainName: string;
    indexPrefix: string;
    sharedIndexes: boolean;
}

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
    elasticSearch?: PulumiAppParam<boolean | Partial<ElasticsearchConfig>>;

    /**
     * Enables OpenSearch infrastructure.
     * Note that it requires also changes in application code.
     */
    openSearch?: PulumiAppParam<boolean | Partial<OpenSearchConfig>>;

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

    /**
     * Prefixes names of all Pulumi cloud infrastructure resource with given prefix.
     */
    pulumiResourceNamePrefix?: PulumiAppParam<string>;

    /**
     * Treats provided environments as production environments, which
     * are deployed in production deployment mode.
     * https://www.webiny.com/docs/architecture/deployment-modes/production
     */
    productionEnvironments?: PulumiAppParam<string[]>;
}

export interface CoreAppLegacyConfig {
    useEmailAsUsername?: boolean;
}

export function createCorePulumiApp(projectAppParams: CreateCorePulumiAppParams = {}) {
    const app = createPulumiApp({
        name: "core",
        path: "apps/core",
        config: projectAppParams,
        program: async app => {
            const deploymentId = new random.RandomId("deploymentId", { byteLength: 8 });

            let searchEngineType: "openSearch" | "elasticSearch" | null = null;
            let searchEngineParams:
                | CreateCorePulumiAppParams["openSearch"]
                | CreateCorePulumiAppParams["elasticSearch"]
                | null = null;

            if (projectAppParams.openSearch) {
                searchEngineParams = app.getParam(projectAppParams.openSearch);
                searchEngineType = "openSearch";
            } else if (projectAppParams.elasticSearch) {
                searchEngineParams = app.getParam(projectAppParams.elasticSearch);
                searchEngineType = "elasticSearch";
            }

            if (searchEngineParams) {
                const params = app.getParam(searchEngineParams);
                if (typeof params === "object") {
                    if (params.domainName) {
                        process.env.AWS_ELASTIC_SEARCH_DOMAIN_NAME = params.domainName;
                    }

                    if (params.indexPrefix) {
                        process.env.ELASTIC_SEARCH_INDEX_PREFIX = params.indexPrefix;
                    }

                    if (params.sharedIndexes) {
                        process.env.ELASTICSEARCH_SHARED_INDEXES = "true";
                    }
                }
            }

            const pulumiResourceNamePrefix = app.getParam(
                projectAppParams.pulumiResourceNamePrefix
            );

            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            if (projectAppParams.pulumi) {
                app.addHandler(() => {
                    return projectAppParams.pulumi!(app as unknown as CorePulumiApp);
                });
            }

            const productionEnvironments =
                app.params.create.productionEnvironments || DEFAULT_PROD_ENV_NAMES;
            const isProduction = productionEnvironments.includes(app.params.run.env);

            const protect = app.getParam(projectAppParams.protect) ?? isProduction;
            const legacyConfig = app.getParam(projectAppParams.legacy) || {};

            // Setup DynamoDB table
            const dynamoDbTable = app.addModule(CoreDynamo, { protect });

            // Setup VPC
            const vpcEnabled = app.getParam(projectAppParams?.vpc) ?? isProduction;
            const vpc = vpcEnabled ? app.addModule(CoreVpc) : null;

            // Setup Cognito
            const cognito = app.addModule(CoreCognito, {
                protect,
                useEmailAsUsername: legacyConfig.useEmailAsUsername ?? false
            });

            // Setup event bus
            const eventBus = app.addModule(CoreEventBus);

            // Setup file core bucket
            const { bucket: fileManagerBucket } = app.addModule(CoreFileManger, { protect });

            let elasticSearch;
            if (searchEngineType === "openSearch") {
                elasticSearch = app.addModule(OpenSearch, { protect });
            } else if (searchEngineType === "elasticSearch") {
                elasticSearch = app.addModule(ElasticSearch, { protect });
            }

            if (featureFlags.newWatchCommand) {
                app.addModule(WatchCommand, {
                    deploymentId: deploymentId.hex
                });
            }

            app.addOutputs({
                deploymentId: deploymentId.hex,
                region: aws.config.region,
                fileManagerBucketId: fileManagerBucket.output.id,
                primaryDynamodbTableArn: dynamoDbTable.output.arn,
                primaryDynamodbTableName: dynamoDbTable.output.name,
                primaryDynamodbTableHashKey: dynamoDbTable.output.hashKey,
                primaryDynamodbTableRangeKey: dynamoDbTable.output.rangeKey,
                cognitoUserPoolId: cognito.userPool.output.id,
                cognitoUserPoolArn: cognito.userPool.output.arn,
                cognitoUserPoolPasswordPolicy: cognito.userPool.output.passwordPolicy,
                cognitoAppClientId: cognito.userPoolClient.output.id,
                eventBusName: eventBus.output.name,
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

    return withServiceManifest(app, manifests => {
        const dynamoTable = app.resources.dynamoDbTable;

        const table: TableDefinition = {
            tableName: dynamoTable.output.name,
            hashKey: dynamoTable.output.hashKey,
            rangeKey: dynamoTable.output.rangeKey
        };

        manifests.forEach(manifest => addServiceManifestTableItem(app, table, manifest));
    });
}
