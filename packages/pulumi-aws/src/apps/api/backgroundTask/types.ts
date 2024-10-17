import * as pulumi from "@pulumi/pulumi";

/**
 * Update types if required. Try to avoid generic objects
 */
export enum StepFunctionDefinitionStatesType {
    Task = "Task",
    Pass = "Pass",
    Choice = "Choice",
    Wait = "Wait",
    Fail = "Fail",
    Succeed = "Succeed"
}

export interface StepFunctionDefinitionStatesCatch {
    ErrorEquals: string[];
    Next: string;
    ResultPath?: string;
}

export interface StepFunctionDefinitionStatesChoiceBase {
    Variable: string;
    Next: string;
    StringEquals?: string;
    StringMatches?: string;
    IsPresent?: boolean;
    IsNull?: boolean;
}

export interface StepFunctionDefinitionStatesChoiceAndItem {
    Variable: string;
    StringEquals?: string;
    StringMatches?: string;
    IsPresent?: boolean;
    IsTimestamp?: boolean;
    IsNumeric?: boolean;
    NumericGreaterThan?: number;
}
export interface StepFunctionDefinitionStatesChoiceAnd {
    And: StepFunctionDefinitionStatesChoiceAndItem[];
    Next: string;
}

export type StepFunctionDefinitionStatesChoice =
    | StepFunctionDefinitionStatesChoiceBase
    | StepFunctionDefinitionStatesChoiceAnd;

export interface StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType;
    Comment?: string;
    InputPath?: string;
    OutputPath?: string;
}

export interface StepFunctionDefinitionStatesTypeTask extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Task;
    Resource: pulumi.Input<string>;
    Next: string;
    ResultPath?: string;
    Parameters: Record<string, any>;
    Catch: StepFunctionDefinitionStatesCatch[];
    End?: boolean;
}

export interface StepFunctionDefinitionStatesTypePass extends StepFunctionDefinitionStatesTypeBase {
    Type: StepFunctionDefinitionStatesType.Pass;
    Next: string;
    ResultPath?: string;
    Parameters: Record<string, any>;
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

export interface StepFunctionDefinitionStatesTypeWait extends StepFunctionDefinitionStatesTypeBase {
    Next: string;
    Seconds?: number;
    Timestamp?: string;
    SecondsPath?: string;
    TimestampPath?: string;
}

export type StepFunctionDefinitionStatesTypes =
    | StepFunctionDefinitionStatesTypeTask
    | StepFunctionDefinitionStatesTypePass
    | StepFunctionDefinitionStatesTypeChoice
    | StepFunctionDefinitionStatesTypeFail
    | StepFunctionDefinitionStatesTypeSucceed
    | StepFunctionDefinitionStatesTypeWait;

export interface StepFunctionDefinition {
    Comment: string;
    StartAt: string;
    States: {
        [key: string]: StepFunctionDefinitionStatesTypes;
    };
}
