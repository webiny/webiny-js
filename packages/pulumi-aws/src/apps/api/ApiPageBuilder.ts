import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createInstallationZip } from "@webiny/api-page-builder/installation";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { CoreOutput } from "../common";
import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { getAwsAccountId, getAwsRegion } from "../awsUtils";
import { LAMBDA_RUNTIME } from "~/constants";

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
                bucket: core.fileManagerBucketId,
                contentType: "application/octet-stream",
                source: new pulumi.asset.FileAsset(pbInstallationZipPath)
            });
        });

        const exportResources = createExportResources(app, params);
        const importResources = createImportResources(app, params);

        return {
            export: exportResources,
            import: importResources
        };
    }
});

function createExportResources(app: PulumiApp, params: PageBuilderParams) {
    const core = app.getModule(CoreOutput);

    const policy = createExportLambdaPolicy(app);
    const role = createLambdaRole(app, {
        name: "pb-export-lambda-role",
        policy: policy.output
    });

    const combine = app.addResource(aws.lambda.Function, {
        name: "pb-export-combine",
        config: {
            role: role.output.arn,
            runtime: LAMBDA_RUNTIME,
            handler: "handler.handler",
            timeout: 60,
            memorySize: 1024,
            description: "Handle export's combine workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.workspace, "pageBuilder/export/combine/build")
                )
            }),
            environment: {
                variables: getCommonLambdaEnvVariables().apply(value => ({
                    ...value,
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId
                }))
            }
        }
    });

    const process = app.addResource(aws.lambda.Function, {
        name: "pb-export-process",
        config: {
            role: role.output.arn,
            runtime: LAMBDA_RUNTIME,
            handler: "handler.handler",
            timeout: 60,
            memorySize: 1024,
            description: "Handle export's process workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.workspace, "pageBuilder/export/process/build")
                )
            }),
            environment: {
                variables: getCommonLambdaEnvVariables().apply(value => ({
                    ...value,
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId,
                    EXPORT_COMBINE_HANDLER: combine.output.arn
                }))
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

function createExportLambdaPolicy(app: PulumiApp) {
    const core = app.getModule(CoreOutput);
    const awsAccountId = getAwsAccountId(app);
    const awsRegion = getAwsRegion(app);

    const elasticSearchEnabled = !!app.params.create.elasticSearch;

    return app.addResource(aws.iam.Policy, {
        name: "PbExportTaskLambdaPolicy",
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
                    },
                    // Attach permissions for elastic search domain as well (if ES is enabled).
                    ...(elasticSearchEnabled
                        ? [
                              {
                                  Sid: "PermissionForES",
                                  Effect: "Allow" as const,
                                  Action: "es:*",
                                  Resource: [
                                      pulumi.interpolate`${core.elasticsearchDomainArn}`,
                                      pulumi.interpolate`${core.elasticsearchDomainArn}/*`
                                  ]
                              }
                          ]
                        : [])
                ]
            }
        }
    });
}

function createImportResources(app: PulumiApp, params: PageBuilderParams) {
    const core = app.getModule(CoreOutput);
    const policy = createImportLambdaPolicy(app);
    const role = createLambdaRole(app, {
        name: "pb-import-lambda-role",
        policy: policy.output
    });

    const process = app.addResource(aws.lambda.Function, {
        name: "pb-import-queue-process",
        config: {
            role: role.output.arn,
            runtime: LAMBDA_RUNTIME,
            handler: "handler.handler",
            timeout: 60,
            memorySize: 1024,
            description: "Handle import queue process workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.workspace, "pageBuilder/import/process/build")
                )
            }),
            environment: {
                variables: getCommonLambdaEnvVariables().apply(value => ({
                    ...value,
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId
                }))
            }
        }
    });

    const create = app.addResource(aws.lambda.Function, {
        name: "pb-import-queue-create",
        config: {
            role: role.output.arn,
            runtime: LAMBDA_RUNTIME,
            handler: "handler.handler",
            timeout: 60,
            memorySize: 1024,
            description: "Handle import queue create workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.workspace, "pageBuilder/import/create/build")
                )
            }),
            environment: {
                variables: getCommonLambdaEnvVariables().apply(value => ({
                    ...value,
                    ...params.env,
                    S3_BUCKET: core.fileManagerBucketId,
                    IMPORT_QUEUE_PROCESS_HANDLER: process.output.arn
                }))
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

function createImportLambdaPolicy(app: PulumiApp) {
    const coreOutput = app.getModule(CoreOutput);
    const awsAccountId = getAwsAccountId(app);
    const awsRegion = getAwsRegion(app);

    const elasticSearchEnabled = !!app.params.create.elasticSearch;

    return app.addResource(aws.iam.Policy, {
        name: "ImportLambdaPolicy",
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
                        ...(elasticSearchEnabled
                            ? [
                                  {
                                      Sid: "PermissionForES",
                                      Effect: "Allow" as const,
                                      Action: "es:*",
                                      Resource: [
                                          pulumi.interpolate`${core.elasticsearchDomainArn}`,
                                          pulumi.interpolate`${core.elasticsearchDomainArn}/*`
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
