import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import policies from "./policies";

//@ts-ignore
import { createInstallationZip } from "@webiny/api-page-builder/installation";

interface PageBuilderParams {
    env: Record<string, any>;
    bucket: aws.s3.Bucket;
    primaryDynamodbTable: aws.dynamodb.Table;
}

class PageBuilder {
    role: aws.iam.Role;
    functions: {
        updateSettings: aws.lambda.Function;
    };

    constructor({ env, bucket, primaryDynamodbTable }: PageBuilderParams) {
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

        this.functions = {
            updateSettings
        };
    }
}

export default PageBuilder;
