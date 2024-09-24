import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { ApiGraphql, CoreOutput } from "~/apps";
import { createBackgroundTaskDefinition } from "./backgroundTask/definition";
import { createBackgroundTaskStepFunctionPolicy } from "~/apps/api/backgroundTask/policy";
import { createBackgroundTaskStepFunctionRole } from "./backgroundTask/role";
import { getLayerArn } from "@webiny/aws-layers";
import { getAwsAccountId, getAwsRegion } from "~/apps/awsUtils";

export type ApiBackgroundTask = PulumiAppModule<typeof ApiBackgroundTask>;

export const ApiBackgroundTaskLambdaName = "background-task";

export const ApiBackgroundTask = createAppModule({
    name: "ApiBackgroundTask",
    config(app: PulumiApp) {
        const awsAccountId = getAwsAccountId(app);
        const awsRegion = getAwsRegion(app);
        const core = app.getModule(CoreOutput);
        const graphql = app.getModule(ApiGraphql);
        const baseConfig = graphql.functions.graphql.config.clone();

        const backgroundTask = app.addResource(aws.lambda.Function, {
            name: ApiBackgroundTaskLambdaName,
            config: {
                ...baseConfig,
                layers: graphql.functions.graphql.output.layers.apply(arns => {
                    return Array.from(new Set([...(arns || []), getLayerArn("sharp")]));
                }),
                timeout: 900,
                memorySize: 1024,
                description: "Performs background tasks."
            }
        });

        const stepFunctionPolicy = createBackgroundTaskStepFunctionPolicy(app, {
            name: "background-task-sfn-policy",
            lambdaFunctionArn: backgroundTask.output.arn
        });

        const stepFunctionRole = createBackgroundTaskStepFunctionRole(app, {
            name: "background-task-sfn-role",
            policy: stepFunctionPolicy.output
        });

        const stepFunction = app.addResource(aws.sfn.StateMachine, {
            name: "background-task-sfn",
            config: {
                roleArn: stepFunctionRole.output.arn,
                definition: pulumi.jsonStringify(
                    createBackgroundTaskDefinition({
                        lambdaName: ApiBackgroundTaskLambdaName,
                        lambdaArn: backgroundTask.output.arn
                    })
                )
            }
        });

        const policyToAccessStepFunction = app.addResource(aws.iam.Policy, {
            name: "background-task-step-function-policy",
            config: {
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: ["states:StartExecution", "states:StopExecution"],
                            Effect: "Allow",
                            Resource: [
                                stepFunction.output.arn.apply(arn => `${arn}`),
                                stepFunction.output.arn.apply(arn => `${arn}*`)
                            ]
                        },
                        {
                            Action: ["states:DescribeExecution", "states:ListExecutions"],
                            Effect: "Allow",
                            Resource: [
                                stepFunction.output.name.apply(name => {
                                    return pulumi.interpolate`arn:aws:states:${awsRegion}:${awsAccountId}:execution:${name}:*`;
                                })
                            ]
                        }
                    ]
                }
            }
        });

        app.addResource(aws.iam.RolePolicyAttachment, {
            name: "background-task-step-function-policy-attachment-graphql",
            config: {
                policyArn: policyToAccessStepFunction.output.arn,
                role: graphql.role.output.name
            }
        });

        const eventRole = app.addResource(aws.iam.Role, {
            name: "background-task-event-role",
            config: {
                assumeRolePolicy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: "sts:AssumeRole",
                            Effect: "Allow",
                            Principal: {
                                Service: "events.amazonaws.com"
                            }
                        }
                    ]
                }
            }
        });

        const eventPolicy = app.addResource(aws.iam.Policy, {
            name: "background-task-event-policy",
            config: {
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: "states:StartExecution",
                            Effect: "Allow",
                            Resource: stepFunction.output.arn
                        }
                    ]
                }
            }
        });

        const eventRolePolicyAttachment = app.addResource(aws.iam.RolePolicyAttachment, {
            name: "background-task-event-role-policy-attachment",
            config: {
                role: eventRole.output.name,
                policyArn: eventPolicy.output.arn
            }
        });

        const eventRule = app.addResource(aws.cloudwatch.EventRule, {
            name: "background-task-event-rule",
            config: {
                eventBusName: core.eventBusName,
                roleArn: eventRole.output.arn,
                eventPattern: JSON.stringify({
                    "detail-type": ["WebinyBackgroundTask"]
                })
            }
        });

        const eventTarget = app.addResource(aws.cloudwatch.EventTarget, {
            name: "background-task-event-target",
            config: {
                // This is going to get called.
                arn: stepFunction.output.arn,
                // This is the rule which determines if this target gets called.
                rule: eventRule.output.name,
                // This is the role which gets assumed when calling the target.
                roleArn: eventRole.output.arn,
                // This is the event bus name.
                eventBusName: core.eventBusName
            }
        });

        return {
            backgroundTask,
            stepFunction,
            stepFunctionRole,
            stepFunctionPolicy,
            eventPolicy,
            eventRolePolicyAttachment,
            eventTarget
        };
    }
});
