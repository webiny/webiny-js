import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

//@ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";
import { defineAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi-sdk";
import { createLambdaRole } from "./ApiLambdaUtils";
import { StorageOutput } from "../getStorageOutput";
import { getFunctionVpcConfig } from "../vpcUtils";

interface PageBuilderParams {
    env: Record<string, any>;
    awsAccountId: pulumi.Input<string>;
    awsRegion: pulumi.Input<string>;
    storage: StorageOutput;
}

export type ApiPageBuilder = PulumiAppModule<typeof ApiPageBuilder>;

export const ApiPageBuilder = defineAppModule({
    name: "ApiPageBuilder",
    config(app: PulumiApp, params: PageBuilderParams) {
        app.addHandler(() => {
            const pbInstallationZipPath = path.join(path.resolve(), ".tmp", "pbInstallation.zip");
            // Will create "pbInstallation.zip" and save it in the `pbInstallationZipPath` path.
            createInstallationZip(pbInstallationZipPath);

            new aws.s3.BucketObject("./pbInstallation.zip", {
                key: "pbInstallation.zip",
                acl: "public-read",
                bucket: params.storage.fileManagerBucketId,
                contentType: "application/octet-stream",
                source: new pulumi.asset.FileAsset(pbInstallationZipPath)
            });
        });

        const updateSettings = createUpdateSettingsResources(app, params);
        const exportPages = createExportPagesResources(app, params);
        const importPages = createImportPagesResources(app, params);

        return {
            updateSettings,
            exportPages,
            importPages
        };
    }
});

function createUpdateSettingsResources(app: PulumiApp, params: PageBuilderParams) {
    const policy = createUpdateSettingsLambdaPolicy(app, params);
    const role = createLambdaRole(app, {
        name: "pb-update-settings-lambda-role",
        policy: policy.output,
        storage: params.storage
    });

    const update = app.addResource(aws.lambda.Function, {
        name: "pb-update-settings",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 10,
            memorySize: 128,
            description:
                "Updates default Page Builder app's settings, e.g. website or prerendering URLs, default title, etc.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/pageBuilder/updateSettings/build")
                )
            }),
            environment: {
                variables: {
                    ...params.env
                }
            },
            vpcConfig: getFunctionVpcConfig(params.storage)
        }
    });

    return {
        role,
        policy,
        functions: {
            update
        }
    };
}

function createUpdateSettingsLambdaPolicy(app: PulumiApp, params: PageBuilderParams) {
    return app.addResource(aws.iam.Policy, {
        name: "PbUpdateSettingsLambdaPolicy",
        config: {
            description: "This policy enables access to Dynamodb",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "AllowDynamoDBAccess",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:PutItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${params.storage.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.storage.primaryDynamodbTableArn}/*`
                        ]
                    }
                ]
            }
        }
    });
}

function createExportPagesResources(app: PulumiApp, params: PageBuilderParams) {
    const policy = createExportPagesLambdaPolicy(app, params);
    const role = createLambdaRole(app, {
        name: "pb-export-pages-lambda-role",
        policy: policy.output,
        storage: params.storage
    });

    const combine = app.addResource(aws.lambda.Function, {
        name: "pb-export-pages-combine",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle page export's combine workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/pageBuilder/exportPages/combine/build")
                )
            }),
            environment: {
                variables: {
                    ...params.env,
                    S3_BUCKET: params.storage.fileManagerBucketId
                }
            }
        }
    });

    const process = app.addResource(aws.lambda.Function, {
        name: "pb-export-pages-process",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle page export's process workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/pageBuilder/exportPages/process/build")
                )
            }),
            environment: {
                variables: {
                    ...params.env,
                    S3_BUCKET: params.storage.fileManagerBucketId,
                    EXPORT_PAGE_COMBINE_HANDLER: combine.output.arn
                }
            }
        }
    });

    return {
        role,
        policy,
        functions: {
            process,
            combine
        }
    };
}

function createExportPagesLambdaPolicy(app: PulumiApp, params: PageBuilderParams) {
    return app.addResource(aws.iam.Policy, {
        name: "PbExportPageTaskLambdaPolicy",
        config: {
            description: "This policy enables access to Dynamodb",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "AllowDynamoDBAccess",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:PutItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${params.storage.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.storage.primaryDynamodbTableArn}/*`
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
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        Resource: [
                            pulumi.interpolate`arn:aws:s3:::${params.storage.fileManagerBucketId}/*`,
                            // We need to explicitly add bucket ARN to "Resource" list for "s3:ListBucket" action.
                            pulumi.interpolate`arn:aws:s3:::${params.storage.fileManagerBucketId}`
                        ]
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: pulumi.interpolate`arn:aws:lambda:${params.awsRegion}:${params.awsAccountId}:function:*`
                    }
                ]
            }
        }
    });
}

function createImportPagesResources(app: PulumiApp, params: PageBuilderParams) {
    const policy = createImportPagesLambdaPolicy(app, params);
    const role = createLambdaRole(app, {
        name: "pb-import-page-lambda-role",
        policy: policy.output,
        storage: params.storage
    });

    const process = app.addResource(aws.lambda.Function, {
        name: "pb-import-page-queue-process",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 512,
            description: "Handle import page queue process workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/pageBuilder/importPages/process/build")
                )
            }),
            environment: {
                variables: {
                    ...params.env,
                    S3_BUCKET: params.storage.fileManagerBucketId
                }
            }
        }
    });

    const create = app.addResource(aws.lambda.Function, {
        name: "pb-import-page-queue-create",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 512,
            description: "Handle import page queue create workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/pageBuilder/importPages/create/build")
                )
            }),
            environment: {
                variables: {
                    ...params.env,
                    S3_BUCKET: params.storage.fileManagerBucketId,
                    IMPORT_PAGE_QUEUE_PROCESS_HANDLER: process.output.arn
                }
            }
        }
    });

    return {
        role,
        policy,
        functions: {
            create,
            process
        }
    };
}

function createImportPagesLambdaPolicy(app: PulumiApp, params: PageBuilderParams) {
    return app.addResource(aws.iam.Policy, {
        name: "ImportPageLambdaPolicy",
        config: {
            description: "This policy enables access Dynamodb, S3, Lambda and Cognito IDP",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForDynamodb",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:PutItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:Query",
                            "dynamodb:UpdateItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${params.storage.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.storage.primaryDynamodbTableArn}/*`
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
                            "s3:GetObject",
                            "s3:ListBucket"
                        ],
                        Resource: [
                            pulumi.interpolate`arn:aws:s3:::${params.storage.fileManagerBucketId}/*`,
                            // We need to explicitly add bucket ARN to "Resource" list for "s3:ListBucket" action.
                            pulumi.interpolate`arn:aws:s3:::${params.storage.fileManagerBucketId}`
                        ]
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
                        Resource: pulumi.interpolate`${params.storage.cognitoUserPoolArn}`
                    }
                ]
            }
        }
    });
}
