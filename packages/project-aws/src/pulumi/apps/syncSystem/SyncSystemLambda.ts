import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import type { PulumiApp } from "@webiny/pulumi";
import { createAppModule } from "@webiny/pulumi";
import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { VpcConfig } from "~/pulumi/apps";
import { getAwsAccountId, getAwsRegion } from "../awsUtils";
import { LAMBDA_RUNTIME } from "~/pulumi/constants";
import { SyncSystemDynamo } from "./SyncSystemDynamo";

export interface SyncSystemLambdaParams {
    protect: boolean;
    config: Record<string, string>;
}

export const SyncSystemLambda = createAppModule({
    name: "SyncSystemLambda",
    // eslint-disable-next-line
    config(app: PulumiApp, _: SyncSystemLambdaParams) {
        const policy = createSyncSystemLambdaPolicy({
            app,
            // TODO - get bucket ids and dynamodb tables from the FileManager app
            primary: {
                fileManagerBucketId: "primaryFileManagerBucketId",
                dynamoDbTableArn: ""
            },
            secondary: {
                fileManagerBucketId: "secondaryFileManagerBucketId",
                dynamoDbTableArn: ""
            }
        });
        const role = createLambdaRole(app, {
            name: "sync-system-lambda-role",
            policy: policy.output
        });

        const syncSystemLambda = app.addResource(aws.lambda.Function, {
            name: "sync-system-lambda",
            config: {
                runtime: LAMBDA_RUNTIME,
                handler: "handler.handler",
                role: role.output.arn,
                timeout: 900,
                memorySize: 1024,
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "transfer/build")
                    )
                }),
                environment: {
                    variables: getCommonLambdaEnvVariables().apply(value => ({
                        ...value,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }))
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig
            }
        });

        return {
            role,
            policy,
            functions: {
                syncSystem: syncSystemLambda
            }
        };
    }
});

interface ICreateSyncSystemLambdaPolicyParamsType {
    fileManagerBucketId: string;
    dynamoDbTableArn: string;
}

interface ICreateSyncSystemLambdaPolicyParams {
    app: PulumiApp;
    primary: ICreateSyncSystemLambdaPolicyParamsType;
    secondary: ICreateSyncSystemLambdaPolicyParamsType;
}

function createSyncSystemLambdaPolicy(params: ICreateSyncSystemLambdaPolicyParams) {
    const { app, primary, secondary } = params;
    const dynamoDbTable = app.getModule(SyncSystemDynamo);
    const awsAccountId = getAwsAccountId(app);
    const awsRegion = getAwsRegion(app);

    const policy: aws.iam.PolicyDocument = {
        Version: "2012-10-17",
        Statement: [
            {
                Sid: "PermissionForDynamodb",
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
                Resource: [`${dynamoDbTable.output.arn}`, `${dynamoDbTable.output.arn}/*`]
            },
            {
                Sid: "PermissionForS3",
                Effect: "Allow",
                Action: [
                    "s3:ListBucket",
                    "s3:GetObjectAcl",
                    "s3:DeleteObject",
                    "s3:PutObjectAcl",
                    "s3:PutObject",
                    "s3:GetObject"
                ],
                Resource: [
                    pulumi.interpolate`arn:aws:s3:::${primary.fileManagerBucketId}`,
                    pulumi.interpolate`arn:aws:s3:::${primary.fileManagerBucketId}/*`,
                    pulumi.interpolate`arn:aws:s3:::${secondary.fileManagerBucketId}`,
                    pulumi.interpolate`arn:aws:s3:::${secondary.fileManagerBucketId}/*`
                ]
            },
            {
                Sid: "PermissionForLambda",
                Effect: "Allow",
                Action: ["lambda:InvokeFunction"],
                Resource: pulumi.interpolate`arn:aws:lambda:${awsRegion}:${awsAccountId}:function:*`
            }
        ]
    };

    return app.addResource(aws.iam.Policy, {
        name: "SyncSystemLambdaPolicy",
        config: {
            description: "This policy enables access to Dynamodb, S3 and Lambda.",
            policy
        }
    });
}
