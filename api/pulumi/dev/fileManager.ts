import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { Vpc } from "./vpc";

// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

export interface FileManagerOptions {
    /**
     * Don't allow to delete the resource.
     * Useful for production environments to avoid losing data.
     */
    protected: boolean;
    vpc?: Vpc;
    /** Id of file manager S3 bucket. */
    bucketId: string;
}

export class FileManager {
    manageS3LambdaPermission?: aws.lambda.Permission;
    bucketNotification?: aws.s3.BucketNotification;
    role: aws.iam.Role;
    functions: {
        manage: aws.lambda.Function;
        transform: aws.lambda.Function;
        download: aws.lambda.Function;
    };

    constructor(options: FileManagerOptions) {
        const roleName = "fm-lambda-role";
        const bucketArn = `arn:aws:s3:::${options.bucketId}`;

        this.role = new aws.iam.Role(roleName, {
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
        });

        const policy = new aws.iam.Policy("FileManagerLambdaPolicy", {
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
                        Resource: `${bucketArn}/*`
                    }
                ]
            }
        });

        new aws.iam.RolePolicyAttachment(`${roleName}-FileManagerLambdaPolicy`, {
            role: this.role,
            policyArn: policy.arn
        });

        if (options.vpc) {
            new aws.iam.RolePolicyAttachment(`${roleName}-AWSLambdaVPCAccessExecutionRole`, {
                role: this.role,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaVPCAccessExecutionRole
            });
        } else {
            new aws.iam.RolePolicyAttachment(`${roleName}-AWSLambdaBasicExecutionRole`, {
                role: this.role,
                policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
            });
        }

        const transform = new aws.lambda.Function("fm-image-transformer", {
            handler: "handler.handler",
            timeout: 30,
            runtime: "nodejs12.x",
            memorySize: 1600,
            role: this.role.arn,
            description: "Performs image optimization, resizing, etc.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/fileManager/transform/build")
            }),
            layers: [getLayerArn("sharp")],
            environment: {
                variables: { S3_BUCKET: options.bucketId }
            },
            vpcConfig: options.vpc?.getFunctionVpcConfig()
        });

        const manage = new aws.lambda.Function("fm-manage", {
            role: this.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            description: "Triggered when a file is deleted.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/fileManager/manage/build")
            }),
            environment: {
                variables: { S3_BUCKET: options.bucketId }
            },
            vpcConfig: options.vpc?.getFunctionVpcConfig()
        });

        const download = new aws.lambda.Function("fm-download", {
            role: this.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            description: "Serves previously uploaded files.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/fileManager/download/build")
            }),
            environment: {
                variables: {
                    S3_BUCKET: options.bucketId,
                    IMAGE_TRANSFORMER_FUNCTION: transform.arn
                }
            },
            vpcConfig: options.vpc?.getFunctionVpcConfig()
        });

        this.functions = {
            transform,
            manage,
            download
        };

        this.manageS3LambdaPermission = new aws.lambda.Permission(
            "fm-manage-s3-lambda-permission",
            {
                action: "lambda:InvokeFunction",
                function: this.functions.manage.arn,
                principal: "s3.amazonaws.com",
                sourceArn: bucketArn
            },
            {
                dependsOn: [this.functions.manage]
            }
        );

        this.bucketNotification = new aws.s3.BucketNotification(
            "bucketNotification",
            {
                bucket: options.bucketId,
                lambdaFunctions: [
                    {
                        lambdaFunctionArn: this.functions.manage.arn,
                        events: ["s3:ObjectRemoved:*"]
                    }
                ]
            },
            {
                dependsOn: [this.functions.manage, this.manageS3LambdaPermission]
            }
        );
    }
}
