import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-app";

import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { StorageOutput, VpcConfig } from "../common";

interface HeadlessCMSParams {
    env: Record<string, any>;
}

export type ApiHeadlessCMS = PulumiAppModule<typeof ApiHeadlessCMS>;

export const ApiHeadlessCMS = createAppModule({
    name: "ApiHeadlessCMS",
    config(app: PulumiApp, params: HeadlessCMSParams) {
        const policy = createHeadlessCmsLambdaPolicy(app);
        const role = createLambdaRole(app, {
            name: "headless-cms-lambda-role",
            policy: policy.output
        });

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
                        path.join(app.paths.absolute, "code/headlessCMS/build")
                    )
                }),
                environment: {
                    variables: {
                        ...getCommonLambdaEnvVariables(),
                        ...params.env,
                        AWS_NODEJS_CONNECTION_REUSE_ENABLED: "1"
                    }
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig
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

function createHeadlessCmsLambdaPolicy(app: PulumiApp) {
    const storageOutput = app.getModule(StorageOutput);

    return app.addResource(aws.iam.Policy, {
        name: "HeadlessCmsLambdaPolicy",
        config: {
            description: "This policy enables access to Dynamodb streams",
            // Storage is pulumi.Output, so we need to run apply() to resolve policy based on it
            policy: storageOutput.apply(storage => {
                const policy: aws.iam.PolicyDocument = {
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
                                `${storage.primaryDynamodbTableArn}`,
                                `${storage.primaryDynamodbTableArn}/*`,
                                // Attach permissions for elastic search dynamo as well (if ES is enabled).
                                ...(storage.elasticsearchDynamodbTableArn
                                    ? [
                                          `${storage.elasticsearchDynamodbTableArn}`,
                                          `${storage.elasticsearchDynamodbTableArn}/*`
                                      ]
                                    : [])
                            ]
                        },
                        // Attach permissions for elastic search domain as well (if ES is enabled).
                        ...(storage.elasticsearchDomainArn
                            ? [
                                  {
                                      Sid: "PermissionForES",
                                      Effect: "Allow" as const,
                                      Action: "es:*",
                                      Resource: [
                                          `${storage.elasticsearchDomainArn}`,
                                          `${storage.elasticsearchDomainArn}/*`
                                      ]
                                  }
                              ]
                            : [])
                    ]
                };

                return policy;
            })
        }
    });
}
