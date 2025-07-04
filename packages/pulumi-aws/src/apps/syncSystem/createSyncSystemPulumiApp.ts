import * as pulumi from "@pulumi/pulumi";
import { createPulumiApp, PulumiAppParam } from "@webiny/pulumi";
import { DEFAULT_PROD_ENV_NAMES } from "~/constants.js";
import { SyncSystemSQS } from "./SyncSystemSQS.js";
import { SyncSystemResolverLambda } from "./SyncSystemResolverLambda.js";
import type { IGetSyncSystemOutputResult, PulumiOutput } from "./types.js";
import { APPS_SYNC_SYSTEM_PATH } from "./constants.js";
import { SyncSystemEventBus } from "./SyncSystemEventBus.js";
import { customApp } from "./customApp.js";
import { SyncSystemDynamoDb } from "~/apps/syncSystem/SyncSystemDynamoDb.js";
import { SyncSystemWorkerLambda } from "~/apps/syncSystem/SyncSystemWorkerLambda.js";

export type SyncSystemPulumiApp = ReturnType<typeof createSyncSystemPulumiApp>;

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

export interface CreateSyncSystemPulumiAppParams {
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
     * Provides a way to adjust existing Pulumi code (cloud infrastructure resources)
     * or add additional ones into the mix.
     */
    pulumi?: (app: SyncSystemPulumiApp) => void | Promise<void>;

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

export function createSyncSystemPulumiApp(projectAppParams: CreateSyncSystemPulumiAppParams) {
    return createPulumiApp({
        name: "sync",
        path: APPS_SYNC_SYSTEM_PATH,
        config: projectAppParams,
        program: async app => {
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
            const productionEnvironments =
                app.params.create.productionEnvironments || DEFAULT_PROD_ENV_NAMES;
            const isProduction = productionEnvironments.includes(app.params.run.env);
            const protect = app.getParam(projectAppParams.protect) ?? isProduction;
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
