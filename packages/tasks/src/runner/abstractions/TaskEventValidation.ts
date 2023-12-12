import { ITaskEvent } from "~/handler/types";

export type ITaskEventValidationResult = ITaskEvent;

export interface PollutedITaskEvent extends ITaskEvent {
    [key: string]: any;
}

export interface ITaskEventValidation {
    validate: (event: PollutedITaskEvent) => ITaskEventValidationResult;
}
