import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi";
import { SyncSystemSQS } from "../SyncSystemSQS.js";
import { SyncSystemDynamoDb } from "../SyncSystemDynamoDb.js";
import { SyncSystemWorkerLambda } from "~/apps/syncSystem/SyncSystemWorkerLambda.js";

interface ICreateSyncSystemResolverLambdaPolicyParams {
    name: string;
    app: PulumiApp;
}

export function createSyncSystemResolverLambdaPolicy(
    params: ICreateSyncSystemResolverLambdaPolicyParams
) {
    const { app } = params;
    const { sqsQueue } = app.getModule(SyncSystemSQS);
    const { lambda: workerLambda } = app.getModule(SyncSystemWorkerLambda);
    const dynamoDb = app.getModule(SyncSystemDynamoDb);

    const policy: aws.iam.PolicyDocument = {
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "PermissionForSQS",
                Effect: "Allow",
                Action: [
                    "sqs:SendMessage",
                    "sqs:SendMessageBatch",
                    "sqs:ReceiveMessage",
                    "sqs:DeleteMessage",
                    "sqs:DeleteMessageBatch",
                    "sqs:ChangeMessageVisibility",
                    "sqs:ChangeMessageVisibilityBatch",
                    "sqs:GetQueueAttributes"
                ],
                Resource: sqsQueue.output.arn.apply(arn => {
                    return [`${arn}`, `${arn}/*`];
                })
            },
            {
                Sid: "PermissionForDynamoDb",
                Effect: "Allow",
                Action: [
                    "dynamodb:BatchGetItem",
                    "dynamodb:BatchWriteItem",
                    "dynamodb:ConditionCheckItem",
                    "dynamodb:CreateBackup",
                    "dynamodb:CreateTable",
                    "dynamodb:CreateTableReplica",
                    "dynamodb:DeleteBackup",
                    "dynamodb:DeleteItem",
                    "dynamodb:DeleteTable",
                    "dynamodb:DeleteTableReplica",
                    "dynamodb:DescribeBackup",
                    "dynamodb:DescribeContinuousBackups",
                    "dynamodb:DescribeContributorInsights",
                    "dynamodb:DescribeExport",
                    "dynamodb:DescribeKinesisStreamingDestination",
                    "dynamodb:DescribeLimits",
                    "dynamodb:DescribeReservedCapacity",
                    "dynamodb:DescribeReservedCapacityOfferings",
                    "dynamodb:DescribeStream",
                    "dynamodb:DescribeTable",
                    "dynamodb:DescribeTableReplicaAutoScaling",
                    "dynamodb:DescribeTimeToLive",
                    "dynamodb:DisableKinesisStreamingDestination",
                    "dynamodb:EnableKinesisStreamingDestination",
                    "dynamodb:ExportTableToPointInTime",
                    "dynamodb:GetItem",
                    "dynamodb:GetRecords",
                    "dynamodb:GetShardIterator",
                    "dynamodb:ListBackups",
                    "dynamodb:ListContributorInsights",
                    "dynamodb:ListExports",
                    "dynamodb:ListStreams",
                    "dynamodb:ListTables",
                    "dynamodb:ListTagsOfResource",
                    "dynamodb:PartiQLDelete",
                    "dynamodb:PartiQLInsert",
                    "dynamodb:PartiQLSelect",
                    "dynamodb:PartiQLUpdate",
                    "dynamodb:PurchaseReservedCapacityOfferings",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:RestoreTableFromBackup",
                    "dynamodb:RestoreTableToPointInTime",
                    "dynamodb:Scan",
                    "dynamodb:UpdateContinuousBackups",
                    "dynamodb:UpdateContributorInsights",
                    "dynamodb:UpdateItem",
                    "dynamodb:UpdateTable",
                    "dynamodb:UpdateTableReplicaAutoScaling",
                    "dynamodb:UpdateTimeToLive"
                ],
                Resource: [
                    dynamoDb.output.arn.apply(arn => `${arn}`),
                    dynamoDb.output.arn.apply(arn => `${arn}/*`)
                ]
            },
            {
                Sid: "PermissionForWorkerLambda",
                Effect: "Allow",
                Action: ["lambda:InvokeFunction"],
                Resource: workerLambda.output.arn.apply(arn => {
                    return [`${arn}`, `${arn}/*`];
                })
            }
        ]
    };

    return app.addResource(aws.iam.Policy, {
        name: params.name,
        config: {
            description: "This policy enables access to DynamoDb and SQS.",
            policy
        }
    });
}
