import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { createAppModule, PulumiApp, PulumiAppModule } from "@webiny/pulumi";
import { ApiGraphql } from "~/apps";
import { createBackgroundTaskDefinition } from "./backgroundTask/definition";
import { createBackgroundTaskStepFunctionPolicy } from "~/apps/api/backgroundTask/policy";
import { createBackgroundTaskStepFunctionRole } from "./backgroundTask/role";

export type ApiBackgroundTask = PulumiAppModule<typeof ApiBackgroundTask>;

export const ApiBackgroundTaskLambdaName = "background-task-lambda";

export const ApiBackgroundTask = createAppModule({
    name: "ApiBackgroundTask",
    config(app: PulumiApp) {
        const graphql = app.getModule(ApiGraphql);
        const baseConfig = graphql.functions.graphql.config.clone();

        const backgroundTask = app.addResource(aws.lambda.Function, {
            name: ApiBackgroundTaskLambdaName,
            config: {
                ...baseConfig,
                timeout: 900,
                memorySize: 512,
                description: "Performs background tasks."
            }
        });

        const stepFunctionPolicy = createBackgroundTaskStepFunctionPolicy(app, {
            name: "background-task-stepFn-policy",
            lambdaFunctionArn: backgroundTask.output.arn
        });

        const stepFunctionRole = createBackgroundTaskStepFunctionRole(app, {
            name: "background-task-stepFn-role",
            policy: stepFunctionPolicy.output
        });

        const stepFunction = app.addResource(aws.sfn.StateMachine, {
            name: "background-task-step-function",
            config: {
                roleArn: stepFunctionRole.output.arn,
                definition: pulumi.jsonStringify(
                    createBackgroundTaskDefinition({
                        lambdaFunctionName: ApiBackgroundTaskLambdaName,
                        lambdaFunctionArn: backgroundTask.output.arn
                    })
                )
            }
        });

        return {
            backgroundTask,
            stepFunction
        };
    }
});
