import * as pulumi from "@pulumi/pulumi";
/**
 * Update types if required. Try to avoid generic objects
 */
export enum StepFunctionDefinitionStatesType {
    Task = "Task",
    Choice = "Choice",
    Fail = "Fail",
    Pass = "Pass"
}

export interface StepFunctionDefinitionStatesParameters<P extends Record<string, any>> {
    FunctionName: string;
    Payload: P;
}

export interface StepFunctionDefinitionStatesCatch {
    ErrorEquals: string[];
    Next: string;
}

export interface StepFunctionDefinitionStatesChoice {
    Variable: string;
    StringEquals: string;
    Next: string;
}

export interface StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType;
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
    InputPath?: string;
    Default?: string;
}

export interface StepFunctionDefinitionStatesTypeFail extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Fail;
    CausePath: string;
    ErrorPath: string;
}

export interface StepFunctionDefinitionStatesTypePass extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Pass;
    End: boolean;
}

export type StepFunctionDefinitionStatesTypes =
    | StepFunctionDefinitionStatesTypeTask<Record<string, any>>
    | StepFunctionDefinitionStatesTypeChoice
    | StepFunctionDefinitionStatesTypeFail
    | StepFunctionDefinitionStatesTypePass;

export interface StepFunctionDefinition {
    Comment: string;
    StartAt: string;
    States: {
        [key: string]: StepFunctionDefinitionStatesTypes;
    };
}
