import * as pulumi from "@pulumi/pulumi";
import { StepFunctionDefinition, StepFunctionDefinitionStatesType } from "./types";

export interface BackgroundTaskParams {
    lambdaFunctionName: string;
    lambdaFunctionArn: pulumi.Input<string>;
}

export const createBackgroundTaskDefinition = (
    params: BackgroundTaskParams
): StepFunctionDefinition => {
    const { lambdaFunctionName, lambdaFunctionArn } = params;
    return {
        Comment: "Background tasks",
        StartAt: "Run",
        States: {
            /**
             * Run the task and wait for the response from lambda.
             * On some fatal error go to Error step.
             * In other cases, check the status of the task.
             */
            Run: {
                Type: StepFunctionDefinitionStatesType.Task,
                Resource: lambdaFunctionArn,
                Next: "CheckStatus",
                ResultPath: "$",
                /**
                 * Parameters will be received as an event in the lambda function.
                 * Task Handler determines that it can run a task based on the Payload.webinyTaskId parameter - it must be set!
                 */
                Parameters: {
                    FunctionName: lambdaFunctionName,
                    Payload: {
                        "webinyTaskId.$": "$.webinyTaskId",
                        "tenant.$": "$.tenant",
                        endpoint: "manage",
                        "locale.$": "$.locale",
                        "stateMachineId.$": "$$.StateMachine.Id"
                    }
                },
                Catch: [
                    {
                        ErrorEquals: ["States.ALL"],
                        Next: "Error"
                    }
                ]
            },
            /**
             * On CONTINUE, go back to Run.
             * On ERROR, go to Error step.
             * On DONE, go to Done step.
             */
            CheckStatus: {
                Type: StepFunctionDefinitionStatesType.Choice,
                InputPath: "$",
                Choices: [
                    {
                        Variable: "$.status",
                        StringEquals: "continue",
                        Next: "Run"
                    },
                    {
                        Variable: "$.status",
                        StringEquals: "error",
                        Next: "Error"
                    },
                    {
                        Variable: "$.status",
                        StringEquals: "done",
                        Next: "Done"
                    }
                ],
                Default: "Error"
            },
            /**
             * Fail the task and output the error.
             */
            Error: {
                Type: StepFunctionDefinitionStatesType.Fail,
                CausePath: "States.JsonToString($.error)",
                ErrorPath: "$.error.code"
            },
            /**
             * Complete the task.
             */
            Done: {
                Type: StepFunctionDefinitionStatesType.Pass,
                End: true
            }
        }
    };
};
