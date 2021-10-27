import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import policies, { EsDomain } from "./policies";

//@ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";

interface PageBuilderParams {
    env: Record<string, any>;
    primaryDynamodbTable: aws.dynamodb.Table;
    elasticsearchDynamodbTable: aws.dynamodb.Table;
    bucket: aws.s3.Bucket;
    elasticsearchDomain: EsDomain;
    cognitoUserPool: aws.cognito.UserPool;
}

class PageBuilder {
    role: aws.iam.Role;
    exportPagesLambdaRole: aws.iam.Role;
    importPagesLambdaRole: aws.iam.Role;
    functions: {
        updateSettings: aws.lambda.Function;
        importPages: {
            create: aws.lambda.Function;
            process: aws.lambda.Function;
        };
        exportPages: {
            process: aws.lambda.Function;
            combine: aws.lambda.Function;
        };
    };

    constructor({
        env,
        bucket,
        primaryDynamodbTable,
        elasticsearchDynamodbTable,
        elasticsearchDomain,
        cognitoUserPool
    }: PageBuilderParams) {
        const pbInstallationZipPath = path.join(path.resolve(), ".tmp", "pbInstallation.zip");

        createInstallationZip(pbInstallationZipPath);

        new aws.s3.BucketObject(
            "./pbInstallation.zip",
            {
                key: "pbInstallation.zip",
                acl: "public-read",
                bucket: bucket,
                contentType: "application/octet-stream",
                source: new pulumi.asset.FileAsset(pbInstallationZipPath)
            },
            {
                parent: bucket
            }
        );

        this.role = new aws.iam.Role("pb-update-settings-lambda-role", {
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

        const policy = policies.getPbUpdateSettingsLambdaPolicy(primaryDynamodbTable);

        new aws.iam.RolePolicyAttachment(`pb-update-settings-lambda-role-policy-attachment`, {
            role: this.role,
            policyArn: policy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`pb-update-settings-lambda-AWSLambdaBasicExecutionRole`, {
            role: this.role,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const updateSettings = new aws.lambda.Function("pb-update-settings", {
            role: this.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 10,
            memorySize: 128,
            description:
                "Updates default Page Builder app's settings, e.g. website or prerendering URLs, default title, etc.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/updateSettings/build")
            }),
            environment: {
                variables: {
                    ...env
                }
            }
        });

        this.exportPagesLambdaRole = new aws.iam.Role("pb-export-pages-lambda-role", {
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

        const exportPagesLambdaPolicy = policies.getPbExportPagesLambdaPolicy(
            primaryDynamodbTable,
            bucket
        );

        new aws.iam.RolePolicyAttachment(`pb-export-pages-lambda-role-policy-attachment`, {
            role: this.exportPagesLambdaRole,
            policyArn: exportPagesLambdaPolicy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`pb-export-pages-lambda-AWSLambdaBasicExecutionRole`, {
            role: this.exportPagesLambdaRole,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const exportPagesCombineLambda = new aws.lambda.Function("pb-export-pages-combine", {
            role: this.exportPagesLambdaRole.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle page export's combine workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/exportPages/combine/build")
            }),
            environment: {
                variables: {
                    ...env,
                    S3_BUCKET: bucket.id
                }
            }
        });

        const exportPagesProcessLambda = new aws.lambda.Function("pb-export-pages-process", {
            role: this.exportPagesLambdaRole.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle page export's process workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/exportPages/process/build")
            }),
            environment: {
                variables: {
                    ...env,
                    S3_BUCKET: bucket.id,
                    EXPORT_PAGE_COMBINE_HANDLER: exportPagesCombineLambda.arn
                }
            }
        });

        this.importPagesLambdaRole = new aws.iam.Role("pb-import-page-lambda-role", {
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

        const importPageLambdaPolicy = policies.getImportPagesLambdaPolicy({
            primaryDynamodbTable,
            elasticsearchDomain,
            elasticsearchDynamodbTable,
            cognitoUserPool,
            bucket
        });

        new aws.iam.RolePolicyAttachment(`pb-import-page-lambda-role-policy-attachment`, {
            role: this.importPagesLambdaRole,
            policyArn: importPageLambdaPolicy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`pb-import-page-lambda-AWSLambdaBasicExecutionRole`, {
            role: this.importPagesLambdaRole,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const importPagesQueueProcess = new aws.lambda.Function("pb-import-page-queue-process", {
            role: this.importPagesLambdaRole.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 512,
            description: "Handle import page queue process workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/importPages/process/build")
            }),
            environment: {
                variables: {
                    ...env,
                    S3_BUCKET: bucket.id
                }
            }
        });

        const importPagesQueueCreate = new aws.lambda.Function("pb-import-page-queue-create", {
            role: this.importPagesLambdaRole.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 512,
            description: "Handle import page queue create workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/importPages/create/build")
            }),
            environment: {
                variables: {
                    ...env,
                    S3_BUCKET: bucket.id,
                    IMPORT_PAGE_QUEUE_PROCESS_HANDLER: importPagesQueueProcess.arn
                }
            }
        });

        this.functions = {
            updateSettings,
            importPages: {
                create: importPagesQueueCreate,
                process: importPagesQueueProcess
            },
            exportPages: {
                process: exportPagesProcessLambda,
                combine: exportPagesCombineLambda
            }
        };
    }
}

export default PageBuilder;
