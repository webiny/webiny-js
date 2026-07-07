import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createPulumiApp, isResourceOfType } from "@webiny/pulumi";
import { SyncSystemSQS } from "./SyncSystemSQS.js";
import { SyncSystemResolverLambda } from "./SyncSystemResolverLambda.js";
import type { IGetSyncSystemOutputResult, PulumiOutput } from "./types.js";
import { APPS_SYNC_SYSTEM_PATH } from "./constants.js";
import { SyncSystemEventBus } from "./SyncSystemEventBus.js";
import { customApp } from "./customApp.js";
import { SyncSystemDynamoDb } from "~/pulumi/apps/syncSystem/SyncSystemDynamoDb.js";
import { SyncSystemWorkerLambda } from "~/pulumi/apps/syncSystem/SyncSystemWorkerLambda.js";
import { getProjectSdk } from "@webiny/project";
import { getVpcConfigFromExtension } from "~/pulumi/apps/extensions/getVpcConfigFromExtension.js";
import { applyAwsResourceTags } from "~/pulumi/apps/awsUtils.js";

export function createSyncSystemPulumiApp() {
    return createPulumiApp({
        name: "sync",
        path: APPS_SYNC_SYSTEM_PATH,
        program: async app => {
            const sdk = await getProjectSdk();
            const projectConfig = await sdk.getProjectConfig();

            const pulumiResourceNamePrefix = await sdk.getPulumiResourceNamePrefix();

            const vpcExtensionsConfig = getVpcConfigFromExtension(projectConfig);

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

                // Not using advanced VPC params? Then immediately exit.
                if (!usingAdvancedVpcParams) {
                    return;
                }

                const { onResource, addResource } = app;
                const { useExistingVpc } = vpcExtensionsConfig;

                // 1. We first deal with "existing VPC" setup.
                if (useExistingVpc) {
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
                }

                return;
            });
            // <-------------------- Enterprise end -------------------->

            const protect = app.env.isProduction;
            const regionApp = customApp({
                app,
                protect
            });
            /**
             * Sync System services.
             */
            const { sqsQueue } = regionApp.addModule(SyncSystemSQS);
            const dynamoDb = regionApp.addModule(SyncSystemDynamoDb);

            const workerLambda = regionApp.addModule(SyncSystemWorkerLambda);

            const resolverLambda = regionApp.addModule(SyncSystemResolverLambda);
            const { eventBusRule, eventBus, eventBusTarget, eventBusPolicy } =
                regionApp.addModule(SyncSystemEventBus);

            const output: PulumiOutput<IGetSyncSystemOutputResult> = {
                /**
                 * Region provider.
                 */
                region: pulumi.output(process.env.AWS_REGION as string),
                /**
                 * SyncSystemSQS
                 */
                sqsUrl: sqsQueue.output.url,
                sqsArn: sqsQueue.output.arn,
                sqsName: sqsQueue.output.name,
                /**
                 * DynamoDB
                 */
                dynamoDbArn: dynamoDb.output.arn,
                dynamoDbName: dynamoDb.output.name,
                dynamoDbHashKey: dynamoDb.output.hashKey,
                dynamoDbRangeKey: dynamoDb.output.rangeKey as pulumi.Output<string>,
                /**
                 * SyncSystemResolverLambda
                 */
                resolverLambdaArn: resolverLambda.lambda.output.arn,
                resolverLambdaName: resolverLambda.lambda.output.name,
                resolverLambdaRoleArn: resolverLambda.role.output.arn,
                resolverLambdaRoleName: resolverLambda.role.output.name,
                resolverLambdaRoleId: resolverLambda.role.output.id,
                resolverLambdaPolicyArn: resolverLambda.policy.output.arn,
                resolverLambdaPolicyName: resolverLambda.policy.output.name,
                resolverLambdaPolicyId: resolverLambda.policy.output.id,
                resolverLambdaEventSourceMappingArn: resolverLambda.eventSourceMapping.output.arn,
                resolverLambdaEventSourceMappingId: resolverLambda.eventSourceMapping.output.id,
                // # We can safely cast as we know that the property exists.
                resolverLambdaEventSourceMappingEventSourceArn: resolverLambda.eventSourceMapping
                    .output.eventSourceArn as pulumi.Output<string>,
                /**
                 * SyncSystemWorkerLambda
                 */
                workerLambdaArn: workerLambda.lambda.output.arn,
                workerLambdaName: workerLambda.lambda.output.name,
                workerLambdaRoleArn: workerLambda.role.output.arn,
                workerLambdaRoleName: workerLambda.role.output.name,
                /**
                 * SyncSystemEventBus
                 */
                eventBusArn: eventBus.output.arn,
                eventBusName: eventBus.output.name,
                eventBusRuleArn: eventBusRule.output.arn,
                eventBusRuleName: eventBusRule.output.id,
                eventBusTargetArn: eventBusTarget.output.arn,
                eventBusPolicyId: eventBusPolicy.output.id,
                eventBusPolicyUrn: eventBusPolicy.output.urn,
                eventBusPolicyQueueUrl: eventBusPolicy.output.queueUrl
            };
            app.addOutputs(output);

            // Applies internal and user-defined AWS tags.
            await applyAwsResourceTags("sync");

            return {
                sqs: sqsQueue.output,
                dynamoDb: dynamoDb.output,
                eventBus: eventBus.output,
                eventBusRule: eventBusRule.output,
                eventBusTarget: eventBusTarget.output,
                eventBusPolicy: eventBusPolicy.output,
                /**
                 * Worker Lambda - used to resolve actions triggered by the resolver Lambda.
                 */
                workerLambda: workerLambda.lambda.output,
                workerLambdaRole: workerLambda.role.output,
                /**
                 * Resolver Lambda - gets hit by SQS and resolves the data.
                 */
                resolverLambda: resolverLambda.lambda.output,
                resolverLambdaRole: resolverLambda.role.output,
                resolverLambdaPolicy: resolverLambda.policy.output,
                resolverLambdaEventSourceMapping: resolverLambda.eventSourceMapping.output,
                /**
                 * Systems we are connecting together.
                 */
                primary: {},
                secondary: {}
            };
        }
    });
}
