import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

import { createLambdaRole } from "./WebsiteLambdaUtils";

interface PreRenderingServiceParams {
    primaryDynamodbTableArn: pulumi.Input<string>;
    primaryDynamodbTableName: pulumi.Input<string>;
    fileManagerBucketId: pulumi.Input<string>;
    cognitoUserPoolArn: pulumi.Input<string>;
    eventBusArn: pulumi.Input<string>;
    awsAccountId: pulumi.Input<string>;
    awsRegion: pulumi.Input<string>;
    appCloudfront: pulumi.Output<aws.cloudfront.Distribution>;
    deliveryBucket: pulumi.Output<aws.s3.Bucket>;
    deliveryCloudfront: pulumi.Output<aws.cloudfront.Distribution>;
}

export function createPrerenderingService(app: PulumiApp, params: PreRenderingServiceParams) {
    const render = createRenderService(app, params);

    return {
        render
    };
}

function createRenderService(app: PulumiApp, params: PreRenderingServiceParams) {
    const queue = app.addResource(aws.sqs.Queue, {
        name: "render-queue",
        config: {
            visibilityTimeoutSeconds: 300
        }
    });

    const policy = createRenderServiceLambdaPolicy(app, params);

    const role = createLambdaRole(app, {
        name: "render-lambda-role",
        policy: policy.output,
        executionRole: aws.iam.ManagedPolicy.AWSLambdaSQSQueueExecutionRole
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: "render-lambda",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 300,
            memorySize: 2048,
            layers: [getLayerArn("shelf-io-chrome-aws-lambda-layer")],
            environment: {
                variables: {
                    // Among other things, this determines the amount of information we reveal on runtime errors.
                    // https://www.webiny.com/docs/how-to-guides/environment-variables/#debug-environment-variable
                    DEBUG: String(process.env.DEBUG),
                    DB_TABLE: params.primaryDynamodbTableName,
                    DELIVERY_BUCKET: params.deliveryBucket.bucket,
                    DELIVERY_CLOUDFRONT: params.deliveryCloudfront.id,
                    APP_URL: pulumi.interpolate`https://${params.appCloudfront.domainName}`
                }
            },
            description: "Renders pages and stores output in an S3 bucket of choice.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "prerendering/render/build")
                )
            })
        }
    });

    const eventSourceMapping = app.addResource(aws.lambda.EventSourceMapping, {
        name: "render-event-source-mapping",
        config: {
            functionName: lambda.output.arn,
            eventSourceArn: queue.output.arn,
            batchSize: 1
        }
    });

    return {
        queue,
        policy,
        role,
        lambda,
        eventSourceMapping
    };
}

function createRenderServiceLambdaPolicy(app: PulumiApp, params: PreRenderingServiceParams) {
    return app.addResource(aws.iam.Policy, {
        name: "render-lambda-policy",
        config: {
            description: "This policy enables access to Lambda, S3, Cloudfront and Dynamodb",
            policy: {
                Version: "2012-10-17",
                Statement: [
                    {
                        Sid: "PermissionForDynamodb",
                        Effect: "Allow",
                        Action: [
                            "dynamodb:BatchGetItem",
                            "dynamodb:BatchWriteItem",
                            "dynamodb:DeleteItem",
                            "dynamodb:GetItem",
                            "dynamodb:PutItem",
                            "dynamodb:Query",
                            "dynamodb:Scan",
                            "dynamodb:UpdateItem"
                        ],
                        Resource: [
                            pulumi.interpolate`${params.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${params.primaryDynamodbTableArn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: "lambda:InvokeFunction",
                        Resource: pulumi.interpolate`arn:aws:lambda:${params.awsRegion}:${params.awsAccountId}:function:*`
                    },
                    {
                        Sid: "PermissionForS3",
                        Effect: "Allow",
                        Action: [
                            "s3:DeleteObject",
                            "s3:GetObject",
                            "s3:GetObjectAcl",
                            "s3:PutObject",
                            "s3:PutObjectAcl"
                        ],
                        Resource: [
                            pulumi.interpolate`arn:aws:s3:::${params.fileManagerBucketId}/*`,
                            /**
                             * We're using the hard-coded value for "delivery" S3 bucket because;
                             * It is created during deployment of the `apps/website` stack which is after the api stack,
                             * so, we don't know its ARN.
                             */
                            "arn:aws:s3:::delivery-*/*"
                        ]
                    },
                    {
                        Sid: "PermissionForCloudfront",
                        Effect: "Allow",
                        Action: "cloudfront:CreateInvalidation",
                        Resource: pulumi.interpolate`arn:aws:cloudfront::${params.awsAccountId}:distribution/*`
                    }
                ]
            }
        }
    });
}
