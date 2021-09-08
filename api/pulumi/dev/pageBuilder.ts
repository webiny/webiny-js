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
    exportPageTaskRole: aws.iam.Role;
    importPageRole: aws.iam.Role;
    functions: {
        updateSettings: aws.lambda.Function;
        exportPageTask: aws.lambda.Function;
        importPage: aws.lambda.Function;
    };

    constructor({
        env,
        bucket,
        primaryDynamodbTable,
        elasticsearchDomain,
        elasticsearchDynamodbTable,
        cognitoUserPool
    }: PageBuilderParams) {
        const pbInstallationZipPath = path.join(path.resolve(), ".tmp", "pbInstallation.zip");

        createInstallationZip(pbInstallationZipPath);
        try {
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
        } catch (e) {
            console.log("Error-------");
            console.log(e);
        }

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

        this.exportPageTaskRole = new aws.iam.Role("pb-export-page-task-lambda-role", {
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

        const exportPageTaskPolicy = policies.getPbExportPageTaskLambdaPolicy(
            primaryDynamodbTable,
            bucket
        );

        new aws.iam.RolePolicyAttachment(`pb-export-page-task-lambda-role-policy-attachment`, {
            role: this.exportPageTaskRole,
            policyArn: exportPageTaskPolicy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`pb-export-page-task-lambda-AWSLambdaBasicExecutionRole`, {
            role: this.exportPageTaskRole,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const exportPageTask = new aws.lambda.Function("pb-export-page-task", {
            role: this.exportPageTaskRole.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle page export workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/exportPageTask/build")
            }),
            environment: {
                variables: {
                    ...env,
                    S3_BUCKET: bucket.id
                }
            }
        });

        this.importPageRole = new aws.iam.Role("pb-import-page-lambda-role", {
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

        const importPageLambdaPolicy = policies.getImportPageLambdaPolicy({
            primaryDynamodbTable,
            elasticsearchDomain,
            elasticsearchDynamodbTable,
            cognitoUserPool,
            bucket
        });

        new aws.iam.RolePolicyAttachment(`pb-import-page-lambda-role-policy-attachment`, {
            role: this.exportPageTaskRole,
            policyArn: importPageLambdaPolicy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`pb-import-page-lambda-AWSLambdaBasicExecutionRole`, {
            role: this.exportPageTaskRole,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const importPage = new aws.lambda.Function("pb-import-page", {
            role: this.exportPageTaskRole.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 60,
            memorySize: 128,
            description: "Handle import page workflow",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/pageBuilder/importPage/build")
            }),
            environment: {
                variables: {
                    ...env,
                    S3_BUCKET: bucket.id
                }
            }
        });

        this.functions = {
            updateSettings,
            exportPageTask,
            importPage
        };
    }
}

export default PageBuilder;
