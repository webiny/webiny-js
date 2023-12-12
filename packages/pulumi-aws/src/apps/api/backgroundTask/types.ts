import * as pulumi from "@pulumi/pulumi";
/**
 * Update types if required. Try to avoid generic objects
 */
export enum StepFunctionDefinitionStatesType {
    Task = "Task",
    Choice = "Choice",
    Fail = "Fail",
    Succeed = "Succeed"
}

export interface StepFunctionDefinitionStatesParameters<P extends Record<string, any>> {
    FunctionName: string;
    Payload: P;
}

export interface StepFunctionDefinitionStatesCatch {
    ErrorEquals: string[];
    Next: string;
    ResultPath?: string;
}

export interface StepFunctionDefinitionStatesChoice {
    Variable: string;
    StringEquals: string;
    Next: string;
}

export interface StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType;
    Comment?: string;
    InputPath?: string;
    OutputPath?: string;
}

export interface StepFunctionDefinitionStatesTypeTask<P extends Record<string, any>>
    extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Task;
    Resource: pulumi.Input<string>;
    Next: string;
    ResultPath?: string;
    Parameters: StepFunctionDefinitionStatesParameters<P>;
    Catch: StepFunctionDefinitionStatesCatch[];
    End?: boolean;
}

export interface StepFunctionDefinitionStatesTypeChoice
    extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Choice;
    Choices: StepFunctionDefinitionStatesChoice[];
    Default?: string;
}

export interface StepFunctionDefinitionStatesTypeFail extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Fail;
    Error?: string;
    Cause?: string;
    CausePath?: string;
    ErrorPath?: string;
}

export interface StepFunctionDefinitionStatesTypeSucceed
    extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Succeed;
}

export type StepFunctionDefinitionStatesTypes =
    | StepFunctionDefinitionStatesTypeTask<Record<string, any>>
    | StepFunctionDefinitionStatesTypeChoice
    | StepFunctionDefinitionStatesTypeFail
    | StepFunctionDefinitionStatesTypeSucceed;

export interface StepFunctionDefinition {
    Comment: string;
    StartAt: string;
    States: {
        [key: string]: StepFunctionDefinitionStatesTypes;
    };
}
