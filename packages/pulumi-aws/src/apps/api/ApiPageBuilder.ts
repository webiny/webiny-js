import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

//@ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { CoreOutput } from "../common";
import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { getAwsAccountId, getAwsRegion } from "../awsUtils";

interface PageBuilderParams {
    env: Record<string, any>;
}

export type ApiPageBuilder = PulumiAppModule<typeof ApiPageBuilder>;

export const ApiPageBuilder = createAppModule({
    name: "ApiPageBuilder",
    config(app: PulumiApp, params: PageBuilderParams) {
        const core = app.getModule(CoreOutput);

        app.addHandler(() => {
            const pbInstallationZipPath = path.join(path.resolve(), ".tmp", "pbInstallation.zip");
            // Will create "pbInstallation.zip" and save it in the `pbInstallationZipPath` path.
            createInstallationZip(pbInstallationZipPath);

            new aws.s3.BucketObject("./pbInstallation.zip", {
                key: "pbInstallation.zip",
                acl: "public-read",
                bucket: core.fileManagerBucketId,
                contentType: "application/octet-stream",
                source: new pulumi.asset.FileAsset(pbInstallationZipPath)
            });
        });

        const exportPages = createExportPagesResources(app, params);
        const importPages = createImportPagesResources(app, params);

        return {
            exportPages,
            importPages
        };
    }
});

function createExportPagesResources(app: PulumiApp, params: PageBuilderParams) {
    const core = app.getModule(CoreOutput);

    const policy = createExportPagesLambdaPolicy(app);
    const role = createLambdaRole(app, {
        name: "pb-export-pages-lambda-role",
        policy: policy.output
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
                    path.join(app.paths.workspace, "pageBuilder/exportPages/combine/build")
                )
            }),
            environment: {
                variables: {
                    ...getCommonLambdaEnvVariables(),
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId
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
                    path.join(app.paths.workspace, "pageBuilder/exportPages/process/build")
                )
            }),
            environment: {
                variables: {
                    ...getCommonLambdaEnvVariables(),
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId,
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

function createExportPagesLambdaPolicy(app: PulumiApp) {
    const core = app.getModule(CoreOutput);
    const awsAccountId = getAwsAccountId(app);
    const awsRegion = getAwsRegion(app);

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
                            pulumi.interpolate`${core.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${core.primaryDynamodbTableArn}/*`
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
                            pulumi.interpolate`arn:aws:s3:::${core.fileManagerBucketId}/*`,
                            // We need to explicitly add bucket ARN to "Resource" list for "s3:ListBucket" action.
                            pulumi.interpolate`arn:aws:s3:::${core.fileManagerBucketId}`
                        ]
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: ["lambda:InvokeFunction"],
                        Resource: pulumi.interpolate`arn:aws:lambda:${awsRegion}:${awsAccountId}:function:*`
                    }
                ]
            }
        }
    });
}

function createImportPagesResources(app: PulumiApp, params: PageBuilderParams) {
    const core = app.getModule(CoreOutput);
    const policy = createImportPagesLambdaPolicy(app);
    const role = createLambdaRole(app, {
        name: "pb-import-page-lambda-role",
        policy: policy.output
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
                    path.join(app.paths.workspace, "pageBuilder/importPages/process/build")
                )
            }),
            environment: {
                variables: {
                    ...getCommonLambdaEnvVariables(),
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId
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
                    path.join(app.paths.workspace, "pageBuilder/importPages/create/build")
                )
            }),
            environment: {
                variables: {
                    ...getCommonLambdaEnvVariables(),
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId,
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

function createImportPagesLambdaPolicy(app: PulumiApp) {
    const coreOutput = app.getModule(CoreOutput);
    const awsAccountId = getAwsAccountId(app);
    const awsRegion = getAwsRegion(app);

    return app.addResource(aws.iam.Policy, {
        name: "ImportPageLambdaPolicy",
        config: {
            description: "This policy enables access Dynamodb, S3, Lambda and Cognito IDP",
            // Core is pulumi.Output, so we need to run apply() to resolve policy based on it
            policy: coreOutput.apply(core => {
                const policy: aws.iam.PolicyDocument = {
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
                                `${core.primaryDynamodbTableArn}`,
                                `${core.primaryDynamodbTableArn}/*`,
                                // Attach permissions for elastic search dynamo as well (if ES is enabled).
                                ...(core.elasticsearchDynamodbTableArn
                                    ? [
                                          `${core.elasticsearchDynamodbTableArn}`,
                                          `${core.elasticsearchDynamodbTableArn}/*`
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
                                "s3:GetObject",
                                "s3:ListBucket"
                            ],
                            Resource: [
                                `arn:aws:s3:::${core.fileManagerBucketId}/*`,
                                // We need to explicitly add bucket ARN to "Resource" list for "s3:ListBucket" action.
                                `arn:aws:s3:::${core.fileManagerBucketId}`
                            ]
                        },
                        {
                            Sid: "PermissionForLambda",
                            Effect: "Allow",
                            Action: ["lambda:InvokeFunction"],
                            Resource: pulumi.interpolate`arn:aws:lambda:${awsRegion}:${awsAccountId}:function:*`
                        },
                        {
                            Sid: "PermissionForCognitoIdp",
                            Effect: "Allow",
                            Action: "cognito-idp:*",
                            Resource: `${core.cognitoUserPoolArn}`
                        },
                        // Attach permissions for elastic search domain as well (if ES is enabled).
                        ...(core.elasticsearchDomainArn
                            ? [
                                  {
                                      Sid: "PermissionForES",
                                      Effect: "Allow" as const,
                                      Action: "es:*",
                                      Resource: [
                                          `${core.elasticsearchDomainArn}`,
                                          `${core.elasticsearchDomainArn}/*`
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
