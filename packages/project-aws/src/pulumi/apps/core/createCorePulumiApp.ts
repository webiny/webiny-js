import * as aws from "@pulumi/aws";
import { createPulumiApp, isResourceOfType } from "@webiny/pulumi";
import { CoreCognito } from "./CoreCognito.js";
import { CoreDynamo } from "./CoreDynamo.js";
import { OpenSearch } from "./CoreOpenSearch.js";
import { CoreEventBus } from "./CoreEventBus.js";
import { CoreFileManger } from "./CoreFileManager.js";
import { CoreVpc } from "./CoreVpc.js";
import { WatchCommand } from "./WatchCommand.js";
import { withServiceManifest } from "~/pulumi/utils/withServiceManifest.js";
import {
    addServiceManifestTableItem,
    type TableDefinition
} from "~/pulumi/utils/addServiceManifestTableItem.js";
import * as random from "@pulumi/random";
import { LogDynamo } from "./LogDynamo.js";
import { getProjectSdk } from "@webiny/project";
import { CorePulumi } from "@webiny/project/abstractions/index.js";
import { getOsConfigFromExtension } from "~/pulumi/apps/extensions/getOsConfigFromExtension.js";
import { getVpcConfigFromExtension } from "~/pulumi/apps/extensions/getVpcConfigFromExtension.js";
import { applyAwsResourceTags, getAwsRegion } from "~/pulumi/apps/awsUtils.js";
import { License } from "@webiny/wcp";
import { configureS3BucketMalwareProtection } from "./configureS3BucketMalwareProtection.js";
import * as pulumi from "@pulumi/pulumi";
import { CoreAuditLogsDynamo } from "~/pulumi/index.js";

export type CorePulumiApp = ReturnType<typeof createCorePulumiApp>;

export function createCorePulumiApp() {
    const baseApp = createPulumiApp({
        name: "core",
        path: "apps/core",
        program: async app => {
            const sdk = await getProjectSdk();
            const projectConfig = await sdk.getProjectConfig();

            const pulumiResourceNamePrefix = await sdk.getPulumiResourceNamePrefix();
            const vpcExtensionsConfig = getVpcConfigFromExtension(projectConfig);
            const opensearchExtensionConfig = getOsConfigFromExtension(projectConfig);

            const deploymentId = new random.RandomId("deploymentId", { byteLength: 8 });

            let searchEngineType: "opensearch" | null = null;
            let searchEngineParams: typeof opensearchExtensionConfig | null = null;

            if (opensearchExtensionConfig) {
                searchEngineParams = opensearchExtensionConfig;
                searchEngineType = "opensearch";
            }

            if (searchEngineParams) {
                const params = searchEngineParams;
                if (typeof params === "object") {
                    if (params.domainName) {
                        process.env.AWS_OS_DOMAIN_NAME = params.domainName;
                    }

                    if (params.indexPrefix) {
                        process.env.OPENSEARCH_INDEX_PREFIX = params.indexPrefix;
                    }

                    if (params.sharedIndexes) {
                        process.env.OPENSEARCH_SHARED_INDEXES = "true";
                    }
                }
            }

            if (pulumiResourceNamePrefix) {
                app.onResource(resource => {
                    if (!resource.name.startsWith(pulumiResourceNamePrefix)) {
                        resource.name = `${pulumiResourceNamePrefix}${resource.name}`;
                    }
                });
            }

            // <-------------------- Enterprise start -------------------->
            app.addHandler(async () => {
                const usingAdvancedVpcParams =
                    vpcExtensionsConfig && typeof vpcExtensionsConfig !== "boolean";

                const license = await License.fromEnvironment();
                if (license.canUseFileManagerThreatDetection()) {
                    configureS3BucketMalwareProtection(app as CorePulumiApp);
                }

                // Not using advanced VPC params? Then immediately exit.
                if (!usingAdvancedVpcParams) {
                    return;
                }

                const { resources, addResource, onResource } = app as CorePulumiApp;
                const { useExistingVpc, useVpcEndpoints } = vpcExtensionsConfig;

                // 1. We first deal with "existing VPC" setup.
                if (useExistingVpc) {
                    if ("useVpcEndpoints" in vpcExtensionsConfig) {
                        throw new Error(
                            "Cannot specify `useVpcEndpoints` parameter when using an existing VPC. The VPC endpoints configurations should be already defined within the existing VPC."
                        );
                    }

                    if (opensearchExtensionConfig) {
                        if (!useExistingVpc.openSearchDomainVpcConfig) {
                            throw new Error(
                                "Cannot specify `useExistingVpc` parameter because the `openSearchDomainVpcConfig` parameter wasn't provided."
                            );
                        }

                        onResource(resource => {
                            if (isResourceOfType(resource, aws.opensearch.Domain)) {
                                resource.config.vpcOptions(
                                    useExistingVpc!.openSearchDomainVpcConfig
                                );
                            }
                        });
                    }

                    if (!useExistingVpc.lambdaFunctionsVpcConfig) {
                        throw new Error(
                            "Cannot specify `useExistingVpc` parameter because the `lambdaFunctionsVpcConfig` parameter wasn't provided."
                        );
                    }

                    onResource(resource => {
                        if (isResourceOfType(resource, aws.lambda.Function)) {
                            const canUseVpc = resource.meta.canUseVpc !== false;
                            if (canUseVpc) {
                                resource.config.vpcConfig(useExistingVpc!.lambdaFunctionsVpcConfig);
                            }
                        }

                        if (isResourceOfType(resource, aws.iam.Role)) {
                            if (resource.meta.isLambdaFunctionRole) {
                                addResource(aws.iam.RolePolicyAttachment, {
                                    name: `${resource.name}-vpc-access-execution-role`,
                                    config: {
                                        role: resource.output.name,
                                        policyArn:
                                            aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
                                    }
                                });
                            }
                        }
                    });

                    return;
                }

                // 2. Now we deal with "non-existing VPC" setup.
                if (useVpcEndpoints) {
                    const region = getAwsRegion(app);

                    onResource(resource => {
                        if (isResourceOfType(resource, aws.ec2.Vpc)) {
                            resource.config.enableDnsSupport(true);
                            resource.config.enableDnsHostnames(true);
                        }
                    });

                    const { vpc, subnets, routeTables } = resources.vpc!;
                    addResource(aws.ec2.VpcEndpoint, {
                        name: "vpc-s3-vpc-endpoint",
                        config: {
                            vpcId: vpc.output.id,
                            serviceName: pulumi.interpolate`com.amazonaws.${region}.s3`,
                            routeTableIds: [routeTables.privateSubnets.output.id]
                        }
                    });

                    addResource(aws.ec2.VpcEndpoint, {
                        name: "vpc-dynamodb-vpc-endpoint",
                        config: {
                            vpcId: vpc.output.id,
                            serviceName: pulumi.interpolate`com.amazonaws.${region}.dynamodb`,
                            routeTableIds: [routeTables.privateSubnets.output.id]
                        }
                    });

                    addResource(aws.ec2.VpcEndpoint, {
                        name: "vpc-sqs-vpc-endpoint",
                        config: {
                            vpcId: vpc.output.id,
                            serviceName: pulumi.interpolate`com.amazonaws.${region}.sqs`,
                            vpcEndpointType: "Interface",
                            privateDnsEnabled: true,
                            securityGroupIds: [vpc.output.defaultSecurityGroupId],
                            subnetIds: subnets.private.map(subNet => subNet.output.id)
                        }
                    });

                    addResource(aws.ec2.VpcEndpoint, {
                        name: "vpc-events-vpc-endpoint",
                        config: {
                            vpcId: vpc.output.id,
                            serviceName: pulumi.interpolate`com.amazonaws.${region}.events`,
                            vpcEndpointType: "Interface",
                            privateDnsEnabled: true,
                            securityGroupIds: [vpc.output.defaultSecurityGroupId],
                            subnetIds: subnets.private.map(subNet => subNet.output.id)
                        }
                    });
                }
            });
            // <-------------------- Enterprise end -------------------->

            // Overrides must be applied via a handler, registered at the very start of the program.
            // By doing this, we're ensuring user's adjustments are not applied to late.
            const pulumiHandlers = sdk.getContainer().resolve(CorePulumi);

            app.addHandler(() => {
                return pulumiHandlers.execute(app as unknown as CorePulumiApp);
            });

            const isProduction = app.env.isProduction;
            const protect = isProduction;

            // Setup DynamoDB table
            const dynamoDbTable = app.addModule(CoreDynamo, { protect });
            const logDynamoDbTable = app.addModule(LogDynamo, { protect });
            const auditLogsDynamoDbTable = app.addModule(CoreAuditLogsDynamo, { protect });

            // Setup VPC
            const vpcEnabled =
                vpcExtensionsConfig === true ||
                typeof vpcExtensionsConfig === "object" ||
                isProduction;

            const vpc = vpcEnabled ? app.addModule(CoreVpc) : null;

            // Setup Cognito
            const cognito = app.addModule(CoreCognito, {
                protect,
                useEmailAsUsername: false
            });

            // Setup event bus
            const eventBus = app.addModule(CoreEventBus);

            // Setup file core bucket
            const { bucket: fileManagerBucket } = app.addModule(CoreFileManger, { protect });

            let opensearch;
            if (searchEngineType === "opensearch") {
                opensearch = app.addModule(OpenSearch, { protect });
            }

            app.addModule(WatchCommand, { deploymentId: deploymentId.hex });

            app.addOutputs({
                deploymentId: deploymentId.hex,
                region: aws.config.region,
                fileManagerBucketId: fileManagerBucket.output.id,
                primaryDynamodbTableArn: dynamoDbTable.output.arn,
                primaryDynamodbTableName: dynamoDbTable.output.name,
                primaryDynamodbTableHashKey: dynamoDbTable.output.hashKey,
                primaryDynamodbTableRangeKey: dynamoDbTable.output.rangeKey,
                logDynamodbTableArn: logDynamoDbTable.output.arn,
                logDynamodbTableName: logDynamoDbTable.output.name,
                logDynamodbTableHashKey: logDynamoDbTable.output.hashKey,
                logDynamodbTableRangeKey: logDynamoDbTable.output.rangeKey,
                auditLogsDynamodbTableArn: auditLogsDynamoDbTable.output.arn,
                auditLogsDynamodbTableName: auditLogsDynamoDbTable.output.name,
                auditLogsDynamodbTableHashKey: auditLogsDynamoDbTable.output.hashKey,
                auditLogsDynamodbTableRangeKey: auditLogsDynamoDbTable.output.rangeKey,
                cognitoUserPoolId: cognito.userPool.output.id,
                cognitoUserPoolArn: cognito.userPool.output.arn,
                cognitoUserPoolPasswordPolicy: cognito.userPool.output.passwordPolicy,
                cognitoAppClientId: cognito.userPoolClient.output.id,
                eventBusName: eventBus.output.name,
                eventBusArn: eventBus.output.arn
            });

            // Applies internal and user-defined AWS tags.
            await applyAwsResourceTags("core");

            return {
                dynamoDbTable,
                logDynamoDbTable,
                vpc,
                ...cognito,
                fileManagerBucket,
                eventBus,
                opensearch
            };
        }
    });

    const app = withServiceManifest(baseApp, manifests => {
        const dynamoTable = baseApp.resources.dynamoDbTable;

        const table: TableDefinition = {
            tableName: dynamoTable.output.name,
            hashKey: dynamoTable.output.hashKey,
            rangeKey: dynamoTable.output.rangeKey
        };

        manifests.forEach(manifest => addServiceManifestTableItem(baseApp, table, manifest));
    });

    app.addHandler(() => {
        app.addServiceManifest({
            name: "core",
            manifest: {
                eventBus: {
                    arn: baseApp.resources.eventBus.output.arn,
                    name: baseApp.resources.eventBus.output.name
                },
                dynamodbTable: {
                    arn: baseApp.resources.dynamoDbTable.output.arn,
                    name: baseApp.resources.dynamoDbTable.output.name,
                    hashKey: baseApp.resources.dynamoDbTable.output.hashKey,
                    rangeKey: baseApp.resources.dynamoDbTable.output.rangeKey
                }
            }
        });
    });

    return app;
}
