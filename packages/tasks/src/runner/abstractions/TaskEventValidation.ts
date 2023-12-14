import { ITaskEvent } from "~/handler/types";

export type ITaskEventValidationResult = ITaskEvent;

export interface ITaskEventValidation {
    validate: (event: Partial<ITaskEvent>) => ITaskEventValidationResult;
}
