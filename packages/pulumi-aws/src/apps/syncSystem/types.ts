import * as pulumi from "@pulumi/pulumi";
import type { IStackOutput } from "@webiny/cli-plugin-deploy-pulumi/utils/index.js";

export type PulumiOutput<T> = {
    [K in keyof T]: pulumi.Output<T[K]>;
};

export interface IGetSyncSystemOutputResult extends IStackOutput {
    /**
     * createRegionProvider
     */
    region: string;
    /**
     * SyncSystemSQS
     */
    sqsUrl: string;
    sqsArn: string;
    sqsName: string;
    /**
     * DynamoDb
     */
    dynamoDbArn: string;
    dynamoDbName: string;
    dynamoDbHashKey: string;
    dynamoDbRangeKey: string;
    /**
     * SyncSystemResolverLambda
     */
    resolverLambdaArn: string;
    resolverLambdaName: string;
    resolverLambdaRoleArn: string;
    resolverLambdaRoleName: string;
    resolverLambdaRoleId: string;
    resolverLambdaPolicyArn: string;
    resolverLambdaPolicyName: string;
    resolverLambdaPolicyId: string;
    resolverLambdaEventSourceMappingId: string;
    resolverLambdaEventSourceMappingArn: string;
    resolverLambdaEventSourceMappingEventSourceArn: string;
    /**
     * SyncSystemWorkerLambda
     */
    workerLambdaArn: string;
    workerLambdaName: string;
    workerLambdaRoleArn: string;
    workerLambdaRoleName: string;
    /**
     * SyncSystemEventBus
     */
    eventBusArn: string;
    eventBusName: string;
    eventBusRuleArn: string;
    eventBusRuleName: string;
    eventBusTargetArn: string;
    eventBusPolicyUrn: string;
    eventBusPolicyQueueUrl: string;
}
