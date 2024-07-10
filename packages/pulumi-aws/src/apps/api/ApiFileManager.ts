import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { getLayerArn } from "@webiny/aws-layers";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";

import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { ApiGraphql, CoreOutput, VpcConfig } from "~/apps";
import { getAwsAccountId } from "~/apps/awsUtils";
import { LAMBDA_RUNTIME } from "~/constants";

export type ApiFileManager = PulumiAppModule<typeof ApiFileManager>;

interface ApiFileManagerConfig {
    env: Record<string, any>;
}

export const ApiFileManager = createAppModule({
    name: "ApiFileManager",
    config(app: PulumiApp, config: ApiFileManagerConfig) {
        const core = app.getModule(CoreOutput);
        const graphql = app.getModule(ApiGraphql);
        const accountId = getAwsAccountId(app);

        const policy = createFileManagerLambdaPolicy(app);
        const role = createLambdaRole(app, {
            name: "fm-lambda-role",
            policy: policy.output
        });

        const manage = app.addResource(aws.lambda.Function, {
            name: "fm-manage",
            config: {
                role: role.output.arn,
                runtime: LAMBDA_RUNTIME,
                handler: "handler.handler",
                timeout: 30,
                memorySize: 1024,
                description: "Triggered when a file is deleted.",
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "fileManager/manage/build")
                    )
                }),
                environment: {
                    variables: getCommonLambdaEnvVariables().apply(value => ({
                        ...value,
                        S3_BUCKET: core.fileManagerBucketId
                    }))
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig
            }
        });

        const baseConfig = graphql.functions.graphql.config.clone();

        const download = app.addResource(aws.lambda.Function, {
            name: "fm-download",
            config: {
                ...baseConfig,
                memorySize: 1600,
                description: "Serves previously uploaded files.",
                layers: [getLayerArn("sharp")],
                environment: {
                    variables: graphql.functions.graphql.output.environment.apply(env => {
                        return {
                            WEBINY_FUNCTION_TYPE: "asset-delivery",
                            ...env?.variables,
                            ...config.env
                        };
                    })
                }
            }
        });

        const manageS3LambdaPermission = app.addResource(aws.lambda.Permission, {
            name: "fm-manage-s3-lambda-permission",
            config: {
                action: "lambda:InvokeFunction",
                function: manage.output.arn,
                principal: "s3.amazonaws.com",
                sourceArn: pulumi.interpolate`arn:aws:s3:::${core.fileManagerBucketId}`,
                sourceAccount: accountId
            },
            opts: {
                dependsOn: [manage.output]
            }
        });

        const bucketNotification = app.addResource(aws.s3.BucketNotification, {
            name: "bucketNotification",
            config: {
                bucket: core.fileManagerBucketId,
                lambdaFunctions: [
                    {
                        lambdaFunctionArn: manage.output.arn,
                        events: ["s3:ObjectRemoved:*"]
                    }
                ]
            },
            opts: {
                dependsOn: [manage.output, manageS3LambdaPermission.output]
            }
        });

        const functions = {
            manage,
            download
        };

        return {
            functions,
            bucketNotification
        };
    }
});

function createFileManagerLambdaPolicy(app: PulumiApp) {
    const core = app.getModule(CoreOutput);

    return app.addResource(aws.iam.Policy, {
        name: "FileManagerLambdaPolicy",
        config: {
            description: "This policy enables access to Lambda and S3",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: "lambda:InvokeFunction",
                        Resource: "*"
                    },
                    {
                        Sid: "PermissionForS3",
                        Effect: "Allow",
                        Action: [
                            "s3:DeleteObject",
                            "s3:PutObject",
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        Resource: [
                            pulumi.interpolate`arn:aws:s3:::${core.fileManagerBucketId}`,
                            pulumi.interpolate`arn:aws:s3:::${core.fileManagerBucketId}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForDynamoDB",
                        Effect: "Allow",
                        Action: ["dynamodb:GetItem", "dynamodb:Query"],
                        Resource: [
                            pulumi.interpolate`${core.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${core.primaryDynamodbTableArn}/*`
                        ]
                    }
                ]
            }
        }
    });
}
