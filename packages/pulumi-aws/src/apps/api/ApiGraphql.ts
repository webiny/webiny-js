import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { defineAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-sdk";
import { Vpc } from "./ApiVpc";
import { createLambdaRole } from "./ApiLambdaUtils";

interface GraphqlParams {
    env: Record<string, any>;
    primaryDynamodbTableArn: pulumi.Input<string>;
    primaryDynamodbTableName: pulumi.Input<string>;
    primaryDynamodbTableHashKey: pulumi.Input<string>;
    primaryDynamodbTableRangeKey: pulumi.Input<string>;
    fileManagerBucketId: pulumi.Input<string>;
    cognitoUserPoolArn: pulumi.Input<string>;
    eventBusArn: pulumi.Input<string>;
    apwSchedulerEventRule: pulumi.Output<aws.cloudwatch.EventRule>;
    apwSchedulerEventTarget: pulumi.Output<aws.cloudwatch.EventTarget>;
    awsAccountId: pulumi.Input<string>;
    awsRegion: pulumi.Input<string>;
    elasticsearchDomainArn: pulumi.Input<string | undefined>;
    elasticsearchDynamodbTableArn: pulumi.Input<string | undefined>;
    vpc: Vpc | undefined;
}

export type ApiGraphql = PulumiAppModule<typeof ApiGraphql>;

export const ApiGraphql = defineAppModule({
    name: "ApiGraphql",
    config(app: PulumiApp, params: GraphqlParams) {
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
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.ctx.appDir, "code/graphql/build")
                    )
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

        /**
         * Store meta information like "mainGraphqlFunctionArn" in APW settings at deploy time.
         *
         * Note: We can't pass "mainGraphqlFunctionArn" as env variable due to circular dependency between
         * "graphql" lambda and "api-apw-scheduler-execute-action" lambda.
         */
        app.addResource(aws.dynamodb.TableItem, {
            name: "apwSettings",
            config: {
                tableName: params.primaryDynamodbTableName,
                hashKey: params.primaryDynamodbTableHashKey,
                rangeKey: pulumi
                    .output(params.primaryDynamodbTableRangeKey)
                    .apply(key => key || "SK"),
                item: pulumi.interpolate`{
              "PK": {"S": "APW#SETTINGS"},
              "SK": {"S": "A"},
              "mainGraphqlFunctionArn": {"S": "${graphql.output.arn}"},
              "eventRuleName": {"S": "${params.apwSchedulerEventRule.name}"},
              "eventTargetId": {"S": "${params.apwSchedulerEventTarget.targetId}"}
            }`
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
});

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
                            pulumi.interpolate`${params.primaryDynamodbTableArn}/*`,
                            // Attach permissions for elastic search dynamo as well (if ES is enabled).
                            ...(params.elasticsearchDynamodbTableArn
                                ? [
                                      pulumi.interpolate`${params.elasticsearchDynamodbTableArn}`,
                                      pulumi.interpolate`${params.elasticsearchDynamodbTableArn}/*`
                                  ]
                                : [])
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
                    },
                    // Attach permissions for elastic search domain as well (if ES is enabled).
                    ...(params.elasticsearchDomainArn
                        ? [
                              {
                                  Sid: "PermissionForES",
                                  Effect: "Allow" as const,
                                  Action: "es:*",
                                  Resource: [
                                      pulumi.interpolate`${params.elasticsearchDomainArn}`,
                                      pulumi.interpolate`${params.elasticsearchDomainArn}/*`
                                  ]
                              }
                          ]
                        : [])
                ]
            }
        }
    });
}
