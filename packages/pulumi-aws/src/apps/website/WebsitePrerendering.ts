import * as path from "path";
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { marshall } from "@webiny/aws-sdk/client-dynamodb";

import { PulumiApp } from "@webiny/pulumi";
import { getLayerArn } from "@webiny/aws-layers";

import { createLambdaRole, getCommonLambdaEnvVariables } from "../lambdaUtils";
import { CoreOutput, VpcConfig } from "../common";
import { getAwsAccountId } from "../awsUtils";
import { LAMBDA_RUNTIME } from "~/constants";

interface PreRenderingServiceParams {
    dbTableName: pulumi.Output<string>;
    dbTableHashKey: pulumi.Output<string>;
    dbTableRangeKey: pulumi.Output<string>;
    appUrl: pulumi.Output<string>;
    deliveryUrl: pulumi.Output<string>;
    bucket: pulumi.Output<string>;
    cloudfrontId: pulumi.Output<string>;
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
    const renderer = createRenderer(app, queue.output, policy.output, params);
    const subscriber = createRenderSubscriber(app, policy.output, params);
    const flush = createFlushService(app, policy.output, params);
    const settings = createPrerenderingSettingsDbItem(app, queue.output, params);

    return {
        subscriber,
        renderer,
        flush,
        settings
    };
}

function createPrerenderingSettingsDbItem(
    app: PulumiApp,
    queue: pulumi.Output<aws.sqs.Queue>,
    params: PreRenderingServiceParams
) {
    /**
     * To handle everything related to prerendering, we need the following information:
     * - appUrl - SPA URL used to prerender HTML
     * - bucket - name of the S3 bucket used for storage of HTML snapshots
     * - cloudfrontId - for cache invalidation
     * - sqsQueueUrl - an SQS queue for prerendering tasks (messages)
     */
    const tableItem = app.addResource(aws.dynamodb.TableItem, {
        name: "psSettings",
        config: {
            tableName: params.dbTableName,
            hashKey: params.dbTableHashKey,
            rangeKey: params.dbTableRangeKey,
            item: pulumi.interpolate`{
                "PK": "PS#SETTINGS",
                "SK": "${app.params.run.variant || "default"}",
                "data": {
                    "appUrl": "${params.appUrl}",
                    "deliveryUrl": "${params.deliveryUrl}",
                    "bucket": "${params.bucket}",
                    "cloudfrontId": "${params.cloudfrontId}",
                    "sqsQueueUrl": "${queue.url}"
                }
            }`
                // We're using the native DynamoDB converter to avoid building those nested objects ourselves.
                .apply(v => JSON.stringify(marshall(JSON.parse(v))))
        }
    });

    return { tableItem };
}

function createRenderSubscriber(
    app: PulumiApp,
    policy: pulumi.Output<aws.iam.Policy>,
    params: PreRenderingServiceParams
) {
    const core = app.getModule(CoreOutput);

    const role = createLambdaRole(app, {
        name: "ps-render-subscriber-role",
        policy: policy
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: "ps-render-subscriber-lambda",
        config: {
            role: role.output.arn,
            runtime: LAMBDA_RUNTIME,
            handler: "handler.handler",
            timeout: 30,
            memorySize: 1024,
            environment: {
                variables: getCommonLambdaEnvVariables().apply(value => ({
                    ...value,
                    DB_TABLE: params.dbTableName
                }))
            },
            description: "Subscribes to render events on event bus",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.workspace, "prerendering/subscribe/build")
                )
            }),
            vpcConfig: app.getModule(VpcConfig).functionVpcConfig
        }
    });

    /**
     * TODO: when we get to staged rollouts and variants, maybe we can create per-variant event rules,
     * to avoid invocation of all variant lambdas just to do a `detail-type` check and exit early.
     * That way, we would be publishing events scoped to a variant, like "RenderPages-{variant}".
     */

    const eventRule = app.addResource(aws.cloudwatch.EventRule, {
        name: "ps-render-subscriber-event-rule",
        config: {
            eventBusName: core.eventBusArn,
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
            eventBusName: core.eventBusArn,
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
            runtime: LAMBDA_RUNTIME,
            handler: "handler.handler",
            timeout: 300,
            memorySize: 2048,
            layers: [getLayerArn("chromium")],
            environment: {
                variables: getCommonLambdaEnvVariables().apply(value => ({
                    ...value,
                    DB_TABLE: params.dbTableName
                }))
            },
            description: "Renders pages and stores output in an S3 bucket of choice.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.workspace, "prerendering/render/build")
                )
            }),
            vpcConfig: app.getModule(VpcConfig).functionVpcConfig
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
    const core = app.getModule(CoreOutput);

    const role = createLambdaRole(app, {
        name: "ps-flush-lambda-role",
        policy: policy
    });

    const lambda = app.addResource(aws.lambda.Function, {
        name: "ps-flush-lambda",
        config: {
            role: role.output.arn,
            runtime: LAMBDA_RUNTIME,
            handler: "handler.handler",
            timeout: 30,
            memorySize: 1024,
            environment: {
                variables: getCommonLambdaEnvVariables().apply(value => ({
                    ...value,
                    DB_TABLE: params.dbTableName
                }))
            },
            description: "Subscribes to flush events on event bus",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive(
                    path.join(app.paths.workspace, "prerendering/flush/build")
                )
            }),
            vpcConfig: app.getModule(VpcConfig).functionVpcConfig
        }
    });

    const eventRule = app.addResource(aws.cloudwatch.EventRule, {
        name: "ps-flush-event-rule",
        config: {
            eventBusName: core.eventBusArn,
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
            eventBusName: core.eventBusArn,
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
    const core = app.getModule(CoreOutput);
    const awsAccountId = getAwsAccountId(app);

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
                        Resource: core.apply(s => {
                            // Add permissions to DynamoDB table
                            const resources = [
                                `${s.primaryDynamodbTableArn}`,
                                `${s.primaryDynamodbTableArn}/*`
                            ];

                            // Attach permissions for elastic search dynamo as well (if ES is enabled).
                            if (s.elasticsearchDynamodbTableArn) {
                                resources.push(
                                    `${s.elasticsearchDynamodbTableArn}`,
                                    `${s.elasticsearchDynamodbTableArn}/*`
                                );
                            }

                            return resources;
                        })
                    },
                    {
                        Sid: "PermissionForS3",
                        Effect: "Allow",
                        Action: ["s3:DeleteObject", "s3:GetObject", "s3:PutObject"],
                        Resource: [pulumi.interpolate`arn:aws:s3:::${params.bucket}/*`]
                    },
                    {
                        Sid: "PermissionForCloudfront",
                        Effect: "Allow",
                        Action: "cloudfront:CreateInvalidation",
                        Resource: pulumi.interpolate`arn:aws:cloudfront::${awsAccountId}:distribution/*`
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
