import path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";

import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { CoreOutput, VpcConfig } from "../common";
import { getAwsAccountId } from "~/apps/awsUtils";

export type ApiFileManager = PulumiAppModule<typeof ApiFileManager>;

export const ApiFileManager = createAppModule({
    name: "ApiFileManager",
    config(app: PulumiApp) {
        const core = app.getModule(CoreOutput);
        const accountId = getAwsAccountId(app);

        const policy = createFileManagerLambdaPolicy(app);
        const role = createLambdaRole(app, {
            name: "fm-lambda-role",
            policy: policy.output
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
                        path.join(app.paths.workspace, "fileManager/transform/build")
                    )
                }),
                layers: [getLayerArn("sharp")],
                environment: {
                    variables: getCommonLambdaEnvVariables().apply(value => ({
                        ...value,
                        S3_BUCKET: core.fileManagerBucketId
                    }))
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig
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
                        path.join(app.paths.workspace, "fileManager/download/build")
                    )
                }),
                environment: {
                    variables: getCommonLambdaEnvVariables().apply(value => ({
                        ...value,
                        S3_BUCKET: core.fileManagerBucketId,
                        IMAGE_TRANSFORMER_FUNCTION: transform.output.arn
                    }))
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig
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

        // ------------------------------------------------------------------------

        const role2 = app.addResource(aws.iam.Role, {
            name: `fm-get-s3-object-role`,
            config: {
                managedPolicyArns: [aws.iam.ManagedPolicies.AdministratorAccess],
                assumeRolePolicy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: "sts:AssumeRole",
                            Principal: aws.iam.Principals.LambdaPrincipal,
                            Effect: "Allow"
                        }
                    ]
                }
            }
        });

        const getS3Object = app.addResource(aws.lambda.Function, {
            name: "fm-get-s3-object",
            config: {
                role: role2.output.arn,
                runtime: "nodejs14.x",
                handler: "handler.handler",
                timeout: 30,
                memorySize: 1024,
                description: "Serves uploaded files.",
                code: new pulumi.asset.AssetArchive({
                    ".": new pulumi.asset.FileArchive(
                        path.join(app.paths.workspace, "fileManager/getS3Object/build")
                    )
                }),
                layers: [getLayerArn("sharp")],
                environment: {
                    variables: getCommonLambdaEnvVariables().apply(value => ({
                        ...value,
                        S3_BUCKET: core.fileManagerBucketId,
                        IMAGE_TRANSFORMER_FUNCTION: transform.output.arn
                    }))
                },
                vpcConfig: app.getModule(VpcConfig).functionVpcConfig
            }
        });

        // S3 AP
        const fmBucketAp = new aws.s3.AccessPoint("fm-bucket-ap", {
            bucket: core.fileManagerBucketId
        });

        new aws.s3control.AccessPointPolicy("fm-bucket-ap-policy", {
            accessPointArn: fmBucketAp.arn,
            policy: fmBucketAp.name.apply(apName => {
                return JSON.stringify({
                    Version: "2012-10-17",
                    // Id: "default",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: {
                                Service: "cloudfront.amazonaws.com"
                            },
                            Action: "s3:*",
                            Resource: [
                                `arn:aws:s3:eu-central-1:674320871285:accesspoint/${apName}`,
                                `arn:aws:s3:eu-central-1:674320871285:accesspoint/${apName}/object/*`
                            ],
                            Condition: {
                                "ForAnyValue:StringEquals": {
                                    "aws:CalledVia": "s3-object-lambda.amazonaws.com"
                                }
                            }
                        }
                    ]
                });
            })
        });

        // S3 OLAP
        const fmBucketOlap = new aws.s3control.ObjectLambdaAccessPoint("fm-bucket-olap", {
            configuration: {
                supportingAccessPoint: fmBucketAp.arn,
                transformationConfigurations: [
                    {
                        actions: ["GetObject"],
                        contentTransformation: {
                            awsLambda: {
                                functionArn: getS3Object.output.arn
                            }
                        }
                    }
                ]
            }
        });

        new aws.s3control.ObjectLambdaAccessPointPolicy("fm-bucket-olap-policy", {
            name: fmBucketOlap.name,
            policy: fmBucketOlap.name.apply(olapName =>
                JSON.stringify({
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: {
                                Service: "cloudfront.amazonaws.com"
                            },
                            Action: "s3-object-lambda:Get*",
                            Resource: `arn:aws:s3-object-lambda:eu-central-1:674320871285:accesspoint/${olapName}`,
                            Condition: {
                                StringEquals: {
                                    "aws:SourceArn":
                                        "arn:aws:cloudfront::674320871285:distribution/E3FLE6J1PAR1CR"
                                }
                            }
                        }
                    ]
                })
            )
        });

        app.addResource(aws.s3.BucketPolicy, {
            name: `fm-bucket-s3-policy`,
            config: {
                bucket: core.fileManagerBucketId,
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Effect: "Allow",
                            Principal: {
                                AWS: "*"
                            },
                            Action: "*",
                            Resource: [
                                "arn:aws:s3:::fm-bucket-38f71e6",
                                "arn:aws:s3:::fm-bucket-38f71e6/*"
                            ],
                            Condition: {
                                StringEquals: {
                                    "s3:DataAccessPointAccount": "674320871285"
                                }
                            }
                        }
                    ]
                }
            }
        });

        // Add required permission to the target lambda.
        app.addResource(aws.lambda.Permission, {
            name: "allow-cf-to-invoke-get-s3-object",
            config: {
                action: "lambda:InvokeFunction",
                function: getS3Object.output.arn,
                principal: "cloudfront.amazonaws.com",
                statementId: "allow-cf-to-invoke-get-s3-object"
            }
        });

        const functions = {
            transform,
            manage,
            download
        };

        return {
            functions,
            bucketNotification,
            fileManagerBucketAccessPoint: fmBucketAp,
            fileManagerBucketObjectLambdaAccessPoint: fmBucketOlap
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
                    }
                ]
            }
        }
    });
}
