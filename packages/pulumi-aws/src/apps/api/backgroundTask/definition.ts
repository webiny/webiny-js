import * as pulumi from "@pulumi/pulumi";
import { StepFunctionDefinition, StepFunctionDefinitionStatesType } from "./types";

export interface BackgroundTaskParams {
    lambdaName: string;
    lambdaArn: pulumi.Input<string>;
}

export const createBackgroundTaskDefinition = (
    params: BackgroundTaskParams
): StepFunctionDefinition => {
    const { lambdaName, lambdaArn } = params;
    return {
        Comment: "Background tasks",
        StartAt: "TransformEvent",
        States: {
            /**
             * Transform the EventBridge event to a format that will be used in the Lambda.
             */
            TransformEvent: {
                Type: StepFunctionDefinitionStatesType.Pass,
                Next: "Run",
                Parameters: {
                    "webinyTaskId.$": "$.detail.webinyTaskId",
                    "webinyTaskDefinitionId.$": "$.detail.webinyTaskDefinitionId",
                    "tenant.$": "$.detail.tenant",
                    "locale.$": "$.detail.locale",
                    "delay.$": "$.detail.delay"
                }
            },
            /**
             * Run the task and wait for the response from lambda.
             * On some fatal error go to Error step.
             * In other cases, check the status of the task.
             */
            Run: {
                Type: StepFunctionDefinitionStatesType.Task,
                Resource: lambdaArn,
                Next: "CheckStatus",
                ResultPath: "$",
                InputPath: "$",
                /**
                 * Parameters will be received as an event in the Lambda.
                 * Task Handler determines that it can run a task based on the Payload.webinyTaskId parameter - it must be set!
                 */
                Parameters: {
                    name: lambdaName,
                    payload: {
                        "webinyTaskId.$": "$.webinyTaskId",
                        "webinyTaskDefinitionId.$": "$.webinyTaskDefinitionId",
                        "locale.$": "$.locale",
                        "tenant.$": "$.tenant",
                        "delay.$": "$.delay",
                        endpoint: "manage",
                        "executionName.$": "$$.Execution.Name",
                        "stateMachineId.$": "$$.StateMachine.Id"
                    }
                },
                Catch: [
                    {
                        ErrorEquals: ["States.ALL"],
                        Next: "UnknownError"
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
                    /**
                     * There is a possibility that the task will return a CONTINUE status and a waitUntil value.
                     * This means that task will wait for the specified time and then continue.
                     * It can be used to handle waiting for child tasks or some resource to be created.
                     */
                    {
                        And: [
                            {
                                Variable: "$.status",
                                StringEquals: "continue"
                            },
                            {
                                Variable: "$.wait",
                                IsPresent: true
                            },
                            {
                                Variable: "$.wait",
                                IsNumeric: true
                            },
                            {
                                Variable: "$.wait",
                                NumericGreaterThan: 0
                            }
                        ],
                        Next: "Waiter"
                    },
                    /**
                     * When no wait value is present, go to Run.
                     */
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
                    },
                    {
                        Variable: "$.status",
                        StringEquals: "aborted",
                        Next: "Aborted"
                    }
                ],
                Default: "UnknownStatus"
            },
            Waiter: {
                Type: StepFunctionDefinitionStatesType.Wait,
                SecondsPath: "$.wait",
                Next: "Run"
            },
            UnknownError: {
                Type: StepFunctionDefinitionStatesType.Fail,
                Cause: "Fatal error - unknown task error."
            },
            /**
             * Unknown task status on Choice step.
             */
            UnknownStatus: {
                Type: StepFunctionDefinitionStatesType.Fail,
                Cause: "Fatal error - unknown status."
            },
            /**
             * Fail the task and output the error.
             */
            Error: {
                Type: StepFunctionDefinitionStatesType.Fail,
                CausePath: "States.JsonToString($.error)",
                ErrorPath: "$.error.message"
            },
            /**
             * Complete the task.
             */
            Done: {
                Type: StepFunctionDefinitionStatesType.Succeed
            },
            Aborted: {
                Type: StepFunctionDefinitionStatesType.Succeed
            }
        }
    };
};
