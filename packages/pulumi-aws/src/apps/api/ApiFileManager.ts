import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";
import { PulumiApp } from "@webiny/pulumi-sdk";

import { Vpc } from "./ApiVpc";
import { createLambdaRole } from "./ApiLambdaUtils";

interface FileManagerParams {
    fileManagerBucketId: pulumi.Input<string>;
    vpc: Vpc | undefined;
}

export function createFileManager(app: PulumiApp, params: FileManagerParams) {
    const policy = createFileManagerLambdaPolicy(app, params);
    const role = createLambdaRole(app, {
        name: "fm-lambda-role",
        policy: policy.output,
        vpc: params.vpc
    });

    const transform = app.addResource(aws.lambda.Function, {
        name: "fm-image-transformer",
        config: {
            handler: "handler.handler",
            timeout: 30,
            runtime: "nodejs14.x",
            memorySize: 1600,
            role: role.output.arn,
            description: "Performs image optimization, resizing, etc.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/fileManager/transform/build")
                )
            }),
            layers: [getLayerArn("sharp")],
            environment: {
                variables: { S3_BUCKET: params.fileManagerBucketId }
            },
            vpcConfig: params.vpc
                ? {
                      subnetIds: params.vpc.subnets.private.map(subNet => subNet.output.id),
                      securityGroupIds: [params.vpc.vpc.output.defaultSecurityGroupId]
                  }
                : undefined
        }
    });

    const manage = app.addResource(aws.lambda.Function, {
        name: "fm-manage",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            description: "Triggered when a file is deleted.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/fileManager/manage/build")
                )
            }),
            environment: {
                variables: { S3_BUCKET: params.fileManagerBucketId }
            },
            vpcConfig: params.vpc
                ? {
                      subnetIds: params.vpc.subnets.private.map(subNet => subNet.output.id),
                      securityGroupIds: [params.vpc.vpc.output.defaultSecurityGroupId]
                  }
                : undefined
        }
    });

    const download = app.addResource(aws.lambda.Function, {
        name: "fm-download",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            description: "Serves previously uploaded files.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/fileManager/download/build")
                )
            }),
            environment: {
                variables: {
                    S3_BUCKET: params.fileManagerBucketId,
                    IMAGE_TRANSFORMER_FUNCTION: transform.output.arn
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

    const manageS3LambdaPermission = app.addResource(aws.lambda.Permission, {
        name: "fm-manage-s3-lambda-permission",
        config: {
            action: "lambda:InvokeFunction",
            function: manage.output.arn,
            principal: "s3.amazonaws.com",
            sourceArn: pulumi.interpolate`arn:aws:s3:::${params.fileManagerBucketId}`
        },
        opts: {
            dependsOn: [/* TODO this.bucket, */ manage.output]
        }
    });

    const bucketNotification = app.addResource(aws.s3.BucketNotification, {
        name: "bucketNotification",
        config: {
            bucket: params.fileManagerBucketId,
            lambdaFunctions: [
                {
                    lambdaFunctionArn: manage.output.arn,
                    events: ["s3:ObjectRemoved:*"]
                }
            ]
        },
        opts: {
            dependsOn: [/* TODO this.bucket, */ manage.output, manageS3LambdaPermission.output]
        }
    });

    const functions = {
        transform,
        manage,
        download
    };

    return {
        functions,
        bucketNotification
    };
}

function createFileManagerLambdaPolicy(app: PulumiApp, params: FileManagerParams) {
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
                        Action: "s3:*",
                        Resource: pulumi.interpolate`arn:aws:s3:::${params.fileManagerBucketId}/*`
                    }
                ]
            }
        }
    });
}
