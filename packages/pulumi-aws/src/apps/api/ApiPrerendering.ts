import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

import { createLambdaRole } from "./ApiLambdaUtils";
import { StorageOutput, VpcConfig } from "../common";
import { getAwsAccountId, getAwsRegion } from "../awsUtils";

interface PreRenderingServiceParams {
    env: Record<string, any>;
}

export function createPrerenderingService(app: PulumiApp, params: PreRenderingServiceParams) {
    const policy = createRenderingServiceLambdaPolicy(app);
    const role = createLambdaRole(app, {
        name: "pre-rendering-service-lambda-role",
        policy: policy.output
    });

    const render = app.addResource(aws.lambda.Function, {
        name: "ps-render",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 600,
            memorySize: 2048,
            layers: [getLayerArn("shelf-io-chrome-aws-lambda-layer")],
            environment: {
                variables: {
                    ...params.env
                }
            },
            description: "Renders pages and stores output in an S3 bucket of choice.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/prerenderingService/render/build")
                )
            }),
            vpcConfig: app.getModule(VpcConfig).functionVpcConfig
        }
    });

    const flush = app.addResource(aws.lambda.Function, {
        name: "ps-flush",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            environment: {
                variables: {
                    ...params.env
                }
            },
            description: "Flushes previously render pages.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/prerenderingService/flush/build")
                )
            }),
            vpcConfig: app.getModule(VpcConfig).functionVpcConfig
        }
    });

    const queueAdd = app.addResource(aws.lambda.Function, {
        name: "ps-queue-add",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            environment: {
                variables: {
                    ...params.env
                }
            },
            description: "Adds a prerendering task to the prerendering queue.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/prerenderingService/queue/add/build")
                )
            }),
            vpcConfig: app.getModule(VpcConfig).functionVpcConfig
        }
    });

    const queueProcess = app.addResource(aws.lambda.Function, {
        name: "ps-queue-process",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 300, // 5 minutes.
            memorySize: 1024,
            environment: {
                variables: {
                    ...params.env,
                    PRERENDERING_RENDER_HANDLER: render.output.arn,
                    PRERENDERING_FLUSH_HANDLER: flush.output.arn
                }
            },
            description: "Processes all jobs added to the prerendering queue.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "code/prerenderingService/queue/process/build")
                )
            }),
            vpcConfig: app.getModule(VpcConfig).functionVpcConfig
        }
    });

    const cloudWatchEventRule = app.addResource(aws.cloudwatch.EventRule, {
        name: "ps-process-queue-event-rule",
        config: {
            description: `Triggers "ps-process-queue" Lambda function that will process all queued prerendering jobs.`,
            scheduleExpression: "rate(1 minute)",
            isEnabled: true
        }
    });

    app.addResource(aws.lambda.Permission, {
        name: "ps-process-queue-event-rule-permission",
        config: {
            action: "lambda:InvokeFunction",
            function: queueProcess.output.arn,
            principal: "events.amazonaws.com",
            sourceArn: cloudWatchEventRule.output.arn
        }
    });

    app.addResource(aws.cloudwatch.EventTarget, {
        name: "ps-process-queue-event-target",
        config: {
            rule: cloudWatchEventRule.output.name,
            arn: queueProcess.output.arn
        }
    });

    const functions = {
        render,
        flush,
        queue: {
            add: queueAdd,
            process: queueProcess
        }
    };

    return {
        functions
    };
}

function createRenderingServiceLambdaPolicy(app: PulumiApp) {
    const storage = app.getModule(StorageOutput);
    const awsAccountId = getAwsAccountId(app);
    const awsRegion = getAwsRegion(app);

    return app.addResource(aws.iam.Policy, {
        name: "PreRenderingServicePolicy",
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
                            pulumi.interpolate`${storage.primaryDynamodbTableArn}`,
                            pulumi.interpolate`${storage.primaryDynamodbTableArn}/*`
                        ]
                    },
                    {
                        Sid: "PermissionForLambda",
                        Effect: "Allow",
                        Action: "lambda:InvokeFunction",
                        Resource: pulumi.interpolate`arn:aws:lambda:${awsRegion}:${awsAccountId}:function:*`
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
                            pulumi.interpolate`arn:aws:s3:::${storage.fileManagerBucketId}/*`,
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
                        Resource: pulumi.interpolate`arn:aws:cloudfront::${awsAccountId}:distribution/*`
                    }
                ]
            }
        }
    });
}
