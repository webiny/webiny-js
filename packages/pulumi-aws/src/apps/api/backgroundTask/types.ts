import * as pulumi from "@pulumi/pulumi";

/**
 * Update types if required. Try to avoid generic objects
 */
export enum StepFunctionDefinitionStatesType {
    Task = "Task",
    Choice = "Choice",
    Wait = "Wait",
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

// export interface StepFunctionDefinitionStatesChoice {
//     Variable: string;
//     Next?: string;
//     StringEquals?: string;
//     StringMatches?: string;
//     IsPresent?: boolean;
//     And?: StepFunctionDefinitionStatesChoice[];
// }

export interface StepFunctionDefinitionStatesChoiceBase {
    Variable: string;
    Next: string;
    StringEquals?: string;
    StringMatches?: string;
    IsPresent?: boolean;
}

export interface StepFunctionDefinitionStatesChoiceAndItem {
    Variable: string;
    StringEquals?: string;
    StringMatches?: string;
    IsPresent?: boolean;
    IsTimestamp?: boolean;
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

export interface StepFunctionDefinitionStatesTypeWait extends StepFunctionDefinitionStatesTypeBase {
    Next: string;
    Seconds?: number;
    Timestamp?: string;
    SecondsPath?: string;
    TimestampPath?: string;
}

export type StepFunctionDefinitionStatesTypes =
    | StepFunctionDefinitionStatesTypeTask<Record<string, any>>
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
