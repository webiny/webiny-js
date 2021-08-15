import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import policies from "./policies";

// @ts-ignore
import { getLayerArn } from "@webiny/aws-layers";

interface PreRenderingServiceParams {
    env: Record<string, any>;
    primaryDynamodbTable: aws.dynamodb.Table;
    elasticsearchDynamodbTable: aws.dynamodb.Table;
    bucket: aws.s3.Bucket;
}

class PageBuilder {
    role: aws.iam.Role;
    functions: {
        render: aws.lambda.Function;
        flush: aws.lambda.Function;
        queue: {
            add: aws.lambda.Function;
            process: aws.lambda.Function;
        };
    };

    constructor({
        env,
        primaryDynamodbTable,
        elasticsearchDynamodbTable,
        bucket
    }: PreRenderingServiceParams) {
        const roleName = "pre-rendering-service-lambda-role";
        this.role = new aws.iam.Role(roleName, {
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

        const policy = policies.getPreRenderingServiceLambdaPolicy(
            primaryDynamodbTable,
            elasticsearchDynamodbTable,
            bucket
        );

        new aws.iam.RolePolicyAttachment(`${roleName}-PreRenderingServiceLambdaPolicy`, {
            role: this.role,
            policyArn: policy.arn.apply(arn => arn)
        });

        new aws.iam.RolePolicyAttachment(`${roleName}-AWSLambdaBasicExecutionRole`, {
            role: this.role,
            policyArn: aws.iam.ManagedPolicy.AWSLambdaBasicExecutionRole
        });

        const render = new aws.lambda.Function("ps-render", {
            role: this.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 600,
            memorySize: 2048,
            layers: [getLayerArn("shelf-io-chrome-aws-lambda-layer")],
            environment: {
                variables: {
                    ...env
                }
            },
            description: "Renders pages and stores output in an S3 bucket of choice.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/prerenderingService/render/build")
            })
        });

        const flush = new aws.lambda.Function("ps-flush", {
            role: this.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            environment: {
                variables: {
                    ...env
                }
            },
            description: "Flushes previously render pages.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/prerenderingService/flush/build")
            })
        });

        const queueAdd = new aws.lambda.Function("ps-queue-add", {
            role: this.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 30,
            memorySize: 512,
            environment: {
                variables: {
                    ...env
                }
            },
            description: "Adds a prerendering task to the prerendering queue.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/prerenderingService/queue/add/build")
            })
        });

        const queueProcess = new aws.lambda.Function("ps-queue-process", {
            role: this.role.arn,
            runtime: "nodejs12.x",
            handler: "handler.handler",
            timeout: 300, // 5 minutes.
            memorySize: 1024,
            environment: {
                variables: {
                    ...env,
                    PRERENDERING_RENDER_HANDLER: render.arn,
                    PRERENDERING_FLUSH_HANDLER: flush.arn
                }
            },
            description: "Processes all jobs added to the prerendering queue.",
            code: new pulumi.asset.AssetArchive({
                ".": new pulumi.asset.FileArchive("../code/prerenderingService/queue/process/build")
            })
        });

        this.functions = {
            render,
            flush,
            queue: {
                add: queueAdd,
                process: queueProcess
            }
        };

        const eventRule = new aws.cloudwatch.EventRule("ps-process-queue-event-rule", {
            description: `Triggers "ps-process-queue" Lambda function that will process all queued prerendering jobs.`,
            scheduleExpression: "rate(5 minutes)",
            isEnabled: true
        });

        new aws.lambda.Permission("ps-process-queue-event-rule-permission", {
            action: "lambda:InvokeFunction",
            function: this.functions.queue.process.arn,
            principal: "events.amazonaws.com",
            sourceArn: eventRule.arn
        });

        new aws.cloudwatch.EventTarget("ps-process-queue-event-target", {
            rule: eventRule.name,
            arn: this.functions.queue.process.arn
        });
    }
}

export default PageBuilder;
