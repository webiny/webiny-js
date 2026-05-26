import type { ITaskEvent } from "~/api/handler/types.js";

export type ITaskEventValidationResult = ITaskEvent;

export interface ITaskEventValidation {
    validate: (event: Partial<ITaskEvent>) => ITaskEventValidationResult;
}
