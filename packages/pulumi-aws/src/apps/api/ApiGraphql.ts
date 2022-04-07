import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
import { Vpc } from "./ApiVpc";
import { createLambdaRole } from "./ApiLambdaUtils";

interface GraphqlParams {
    env: Record<string, any>;
    primaryDynamodbTableArn: pulumi.Input<string>;
    fileManagerBucketId: pulumi.Input<string>;
    cognitoUserPoolArn: pulumi.Input<string>;
    eventBusArn: pulumi.Input<string>;
    awsAccountId: pulumi.Input<string>;
    awsRegion: pulumi.Input<string>;
    vpc: Vpc | undefined;
}

export function createGraphql(app: PulumiApp, params: GraphqlParams) {
    const policy = createGraphqlLambdaPolicy(app, params);
    const role = createLambdaRole(app, {
        name: "api-lambda-role",
        policy: policy.output,
        vpc: params.vpc
    });

    const graphql = app.addResource(aws.lambda.Function, {
        name: "graphql",
        config: {
            runtime: "nodejs14.x",
            handler: "handler.handler",
            role: role.output.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(path.join(app.ctx.appDir, "code/graphql/build"))
            }),
            environment: {
                variables: {
                    ...params.env,
                    AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1",
                    WCP_ENVIRONMENT_API_KEY: String(process.env["WCP_ENVIRONMENT_API_KEY"])
                }
            },
            vpcConfig: params.vpc
                ? {
                      subnetIds: params.vpc.subnets.private.map(subNet => subNet.output.id),
                      securityGroupIds: [params.vpc.vpc.output.defaultSecurityGroupId]
                  }
                : undefined
        }
    });

    return {
        role,
        policy,
        functions: {
            graphql
        }
    };
}

function createGraphqlLambdaPolicy(app: PulumiApp, params: GraphqlParams) {
    return app.addResource(aws.iam.Policy, {
        name: "ApiGraphqlLambdaPolicy",
        config: {
            description: "This policy enables access to Dynamodb, S3, Lambda and Cognito IDP",
            policy: {
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
                        Resource: [
                            pulumi.interpolate`${params.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.primaryDynamodbTableArn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForS3",
                        Effect: "Allow",
                        Action: [
                            "s3:GetObjectAcl",
                            "s3:DeleteObject",
                            "s3:PutObjectAcl",
                            "s3:PutObject",
                            "s3:GetObject"
                        ],
                        Resource: pulumi.interpolate`arn:aws:s3:::${params.fileManagerBucketId}/*`
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: pulumi.interpolate`arn:aws:lambda:${params.awsRegion}:${params.awsAccountId}:function:*`
                    },
                    {
                        Sid: "PermissionForCognitoIdp",
                        Effect: "Allow",
                        Action: "cognito-idp:*",
                        Resource: params.cognitoUserPoolArn
                    },
                    {
                        Sid: "PermissionForEventBus",
                        Effect: "Allow",
                        Action: "events:PutEvents",
                        Resource: params.eventBusArn
                    }
                ]
            }
        }
    });
}
