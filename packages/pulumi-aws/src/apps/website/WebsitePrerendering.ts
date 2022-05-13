import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

import { PulumiApp } from "@webiny/pulumi-sdk";
// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

import { createLambdaRole } from "./WebsiteLambdaUtils";

interface PreRenderingServiceParams {
    awsAccountId: pulumi.Input<string>;
    envVariables: Record<string, pulumi.Input<string>>;
    primaryDynamodbTableArn: pulumi.Input<string>;
    elasticsearchDynamodbTableArn: pulumi.Input<string | undefined>;
    fileManagerBucketId: pulumi.Input<string>;
    eventBusArn: pulumi.Input<string>;
}

export function createPrerenderingService(app: PulumiApp, params: PreRenderingServiceParams) {
    const queue = app.addResource(aws.sqs.Queue, {
        name: "ps-render-queue",
        config: {
            visibilityTimeoutSeconds: 300,
            fifoQueue: true
        }
    });

    const policy = createLambdaPolicy(app, queue.output, params);
    const subscriber = createRenderSubscriber(app, queue.output, policy.output, params);
    const renderer = createRenderer(app, queue.output, policy.output, params);
    const flush = createFlushService(app, policy.output, params);

    return {
        subscriber,
        renderer,
        flush
    };
}

function createRenderSubscriber(
    app: PulumiApp,
    queue: pulumi.Output<aws.sqs.Queue>,
    policy: pulumi.Output<aws.iam.Policy>,
    params: PreRenderingServiceParams
) {
    const role = createLambdaRole(app, {
        name: "ps-render-subscriber-role",
        policy: policy,
        executionRole: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: "ps-render-subscriber-lambda",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            environment: {
                variables: {
                    ...params.envVariables,
                    SQS_QUEUE: queue.url
                }
            },
            description: "Subscribes to render events on event bus",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "prerendering/subscribe/build")
                )
            })
        }
    });

    const eventRule = app.addResource(aws.cloudwatch.EventRule, {
        name: "ps-render-subscriber-event-rule",
        config: {
            eventBusName: params.eventBusArn,
            eventPattern: JSON.stringify({
                "detail-type": ["RenderPages"]
            })
        }
    });

    const eventPermission = app.addResource(aws.lambda.Permission, {
        name: "ps-render-subscriber-event-permission",
        config: {
            action: "lambda:InvokeFunction",
            function: lambda.output.arn,
            principal: "events.amazonaws.com",
            sourceArn: eventRule.output.arn
        }
    });

    const eventTarget = app.addResource(aws.cloudwatch.EventTarget, {
        name: "ps-render-subscriber-event-target",
        config: {
            rule: eventRule.output.name,
            eventBusName: params.eventBusArn,
            arn: lambda.output.arn
        }
    });

    return {
        policy,
        role,
        lambda,
        eventRule,
        eventPermission,
        eventTarget
    };
}

function createRenderer(
    app: PulumiApp,
    queue: pulumi.Output<aws.sqs.Queue>,
    policy: pulumi.Output<aws.iam.Policy>,
    params: PreRenderingServiceParams
) {
    const role = createLambdaRole(app, {
        name: "ps-render-lambda-role",
        policy: policy,
        executionRole: aws.iam.ManagedPolicy.AWSLambdaSQSQueueExecutionRole
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: "ps-render-lambda",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 300,
            memorySize: 2048,
            layers: [getLayerArn("shelf-io-chrome-aws-lambda-layer")],
            environment: {
                variables: {
                    ...params.envVariables
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
        name: "ps-render-event-source-mapping",
        config: {
            functionName: lambda.output.arn,
            eventSourceArn: queue.arn,
            batchSize: 1
        }
    });

    return {
        policy,
        role,
        lambda,
        eventSourceMapping
    };
}

function createFlushService(
    app: PulumiApp,
    policy: pulumi.Output<aws.iam.Policy>,
    params: PreRenderingServiceParams
) {
    const role = createLambdaRole(app, {
        name: "ps-flush-lambda-role",
        policy: policy,
        executionRole: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: "ps-flush-lambda",
        config: {
            role: role.output.arn,
            runtime: "nodejs14.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            environment: {
                variables: {
                    ...params.envVariables
                }
            },
            description: "Subscribes to fluhs events on event bus",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.ctx.appDir, "prerendering/flush/build")
                )
            })
        }
    });

    const eventRule = app.addResource(aws.cloudwatch.EventRule, {
        name: "ps-flush-event-rule",
        config: {
            eventBusName: params.eventBusArn,
            eventPattern: JSON.stringify({
                "detail-type": ["FlushPages"]
            })
        }
    });

    const eventPermission = app.addResource(aws.lambda.Permission, {
        name: "ps-flush-event-permission",
        config: {
            action: "lambda:InvokeFunction",
            function: lambda.output.arn,
            principal: "events.amazonaws.com",
            sourceArn: eventRule.output.arn
        }
    });

    const eventTarget = app.addResource(aws.cloudwatch.EventTarget, {
        name: "ps-flush-event-target",
        config: {
            rule: eventRule.output.name,
            eventBusName: params.eventBusArn,
            arn: lambda.output.arn
        }
    });

    return {
        policy,
        role,
        lambda,
        eventRule,
        eventPermission,
        eventTarget
    };
}

function createLambdaPolicy(
    app: PulumiApp,
    queue: pulumi.Output<aws.sqs.Queue>,
    params: PreRenderingServiceParams
) {
    return app.addResource(aws.iam.Policy, {
        name: "ps-lambda-policy",
        config: {
            description: "This policy enables access to Lambda, S3, Cloudfront, SQS and Dynamodb",
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
                            pulumi.interpolate`${params.primaryDynamodbTableArn}/*`,
                            // Attach permissions for elastic search dynamo as well (if ES is enabled).
                            ...(params.elasticsearchDynamodbTableArn
                                ? [
                                      pulumi.interpolate`${params.elasticsearchDynamodbTableArn}`,
                                      pulumi.interpolate`${params.elasticsearchDynamodbTableArn}/*`
                                  ]
                                : [])
                        ]
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
                    },
                    {
                        Sid: "PermissionForSQS",
                        Effect: "Allow",
                        Action: ["sqs:SendMessage", "sqs:SendMessageBatch"],
                        Resource: queue.arn
                    }
                ]
            }
        }
    });
}
