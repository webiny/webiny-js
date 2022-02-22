import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";

import { Vpc } from "./ApiVpc";

interface HeadlessCMSParams {
    env: Record<string, any>;
    primaryDynamodbTableArn: pulumi.Input<string>;
    vpc: Vpc | undefined;
}

export function createHeadlessCms(app: PulumiApp, params: HeadlessCMSParams) {
    const roleName = "headless-cms-lambda-role";
    const role = app.addResource(aws.iam.Role, {
        name: roleName,
        config: {
            assumeRolePolicy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Action: "sts:AssumeRole",
                        Principal: {
                            Service: "lambda.amazonaws.com"
                        },
                        Effect: "Allow"
                    }
                ]
            }
        }
    });

    const policy = createHeadlessCmsLambdaPolicy(app, params);

    app.addResource(aws.iam.RolePolicyAttachment, {
        name: `${roleName}-HeadlessCmsLambdaPolicy`,
        config: {
            role: role.output,
            policyArn: policy.output.arn
        }
    });

    if (params.vpc) {
        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${roleName}-AWSLambdaVPCAccessExecutionRole`,
            config: {
                role: role.output,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
            }
        });
    } else {
        app.addResource(aws.iam.RolePolicyAttachment, {
            name: `${roleName}-AWSLambdaBasicExecutionRole`,
            config: {
                role: role.output,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
            }
        });
    }

    const graphql = app.addResource(aws.lambda.Function, {
        name: "headless-cms",
        config: {
            runtime: "nodejs14.x",
            handler: "handler.handler",
            role: role.output.arn,
            timeout: 30,
            memorySize: 512,
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/headlessCMS/build")
                )
            }),
            environment: {
                variables: {
                    ...params.env,
                    AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
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

function createHeadlessCmsLambdaPolicy(app: PulumiApp, params: HeadlessCMSParams) {
    return app.addResource(aws.iam.Policy, {
        name: "HeadlessCmsLambdaPolicy",
        config: {
            description: "This policy enables access to Dynamodb streams",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionDynamodb",
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
                    }
                ]
            }
        }
    });
}
