import { ITaskEvent } from "~/handler/types";

export type ITaskEventValidationResult = ITaskEvent;

export interface IPollutedTaskEvent extends ITaskEvent {
    [key: string]: any;
}

export interface ITaskEventValidation {
    validate: (event: IPollutedTaskEvent) => ITaskEventValidationResult;
}
