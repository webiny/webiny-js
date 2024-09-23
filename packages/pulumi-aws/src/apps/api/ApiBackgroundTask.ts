import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { ApiGraphql } from "~/apps";
import { createBackgroundTaskDefinition } from "./backgroundTask/definition";
import { createBackgroundTaskStepFunctionPolicy } from "~/apps/api/backgroundTask/policy";
import { createBackgroundTaskStepFunctionRole } from "./backgroundTask/role";
import { getLayerArn } from "@webiny/aws-layers";

export type ApiBackgroundTask = PulumiAppModule<typeof ApiBackgroundTask>;

export const ApiBackgroundTaskLambdaName = "background-task";

export const ApiBackgroundTask = createAppModule({
    name: "ApiBackgroundTask",
    config(app: PulumiApp) {
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

        const policy = app.addResource(aws.iam.Policy, {
            name: "background-task-sf-policy",
            config: {
                policy: {
                    Version: "2012-10-17",
                    Statement: [
                        {
                            Action: [
                                "states:StartExecution",
                                "states:StopExecution",
                                "states:DescribeExecution",
                                "states:ListExecutions"
                            ],
                            Effect: "Allow",
                            Resource: stepFunction.output.arn
                        }
                    ]
                }
            }
        });

        app.addResource(aws.iam.RolePolicyAttachment, {
            name: "background-task-sfn-policy-attachment",
            config: {
                policyArn: policy.output.arn,
                role: graphql.role.output.name
            }
        });

        return {
            backgroundTask,
            stepFunction
        };
    }
});
