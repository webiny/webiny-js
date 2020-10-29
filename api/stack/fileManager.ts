import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import vpc from "./vpc";
import defaultLambdaRole from "./defaultLambdaRole";

// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

class FileManager {
    bucket: aws.s3.Bucket;
    manageS3LambdaPermission?: aws.lambda.Permission;
    bucketNotification?: aws.s3.BucketNotification;
    functions: {
        manage: aws.lambda.Function;
        transform: aws.lambda.Function;
        graphql: aws.lambda.Function;
        download: aws.lambda.Function;
    };
    dynamoDbTable: aws.dynamodb.Table;
    constructor({ env }: { env: { graphql: { [key: string]: any } } }) {
        this.dynamoDbTable = new aws.dynamodb.Table("FileManager", {
            attributes: [
                { name: "PK", type: "S" },
                { name: "SK", type: "S" }
            ],
            billingMode: "PAY_PER_REQUEST",
            hashKey: "PK",
            rangeKey: "SK"
        });
        this.bucket = new aws.s3.Bucket("fm-bucket", {
            forceDestroy: false,
            acl: "private",
            corsRules: [
                {
                    allowedHeaders: ["*"],
                    allowedMethods: ["POST", "GET"],
                    allowedOrigins: ["*"],
                    maxAgeSeconds: 3000
                }
            ]
        });

        const transform = new aws.lambda.Function("fm-image-transformer", {
            handler: "handler.handler",
            timeout: 30,
            runtime: "nodejs10.x", // Because of the "sharp" library (built for Node10).
            memorySize: 1600,
            role: defaultLambdaRole.role.arn,
            description: "Performs image optimization, resizing, etc.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/fileManager/transform/build")
            }),
            layers: [getLayerArn("webiny-v4-sharp", String(process.env.AWS_REGION))],
            environment: {
                variables: { S3_BUCKET: this.bucket.id, DB_TABLE: this.dynamoDbTable.name }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        const manage = new aws.lambda.Function("fm-manage", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            description: "Triggered when a file is deleted.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/fileManager/manage/build")
            }),
            environment: {
                variables: { S3_BUCKET: this.bucket.id, DB_TABLE: this.dynamoDbTable.name }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        const graphql = new aws.lambda.Function("fm-graphql", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            description: "Files GraphQL API",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/fileManager/graphql/build")
            }),
            environment: {
                variables: {
                    ...env.graphql,
                    S3_BUCKET: this.bucket.id,
                    DB_TABLE: this.dynamoDbTable.name
                }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        const download = new aws.lambda.Function("fm-download", {
            role: defaultLambdaRole.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            description: "Serves previously uploaded files.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("./code/fileManager/download//build")
            }),
            environment: {
                variables: {
                    S3_BUCKET: this.bucket.id,
                    IMAGE_TRANSFORMER_FUNCTION: transform.arn,
                    DB_TABLE: this.dynamoDbTable.name
                }
            },
            vpcConfig: {
                subnetIds: vpc.subnets.private.map(subNet => subNet.id),
                securityGroupIds: [vpc.vpc.defaultSecurityGroupId]
            }
        });

        this.functions = {
            transform,
            manage,
            graphql,
            download
        };

        this.manageS3LambdaPermission = new aws.lambda.Permission(
            "fm-manage-s3-lambda-permission",
            {
                action: "lambda:InvokeFunction",
                function: this.functions.manage.arn,
                principal: "s3.amazonaws.com",
                sourceArn: this.bucket.arn
            }
        );

        this.bucketNotification = new aws.s3.BucketNotification(
            "bucketNotification",
            {
                bucket: this.bucket.id,
                lambdaFunctions: [
                    {
                        lambdaFunctionArn: this.functions.manage.arn,
                        events: ["s3:ObjectRemoved:*"]
                    }
                ]
            },
            {
                dependsOn: [this.manageS3LambdaPermission]
            }
        );
    }
}

export default FileManager;
