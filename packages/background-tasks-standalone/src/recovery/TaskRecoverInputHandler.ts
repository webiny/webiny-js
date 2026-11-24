import { Abstraction } from "@webiny/di";
import type { InputHandler } from "@webiny/kernel-core";
import type { ITaskRecoverEvent } from "./TaskRecoverInputType.js";

export interface ITaskRecoverResult {
    // Tasks nobody held, now driven by this process.
    resumed: number;
    // Tasks taken over too often, now failed instead of resumed.
    failed: number;
    // Tenants whose tasks could not be read or recovered; the others were still recovered.
    failedTenants: string[];
}

export interface ITaskRecoverInputHandler extends InputHandler.Interface<
    ITaskRecoverEvent,
    ITaskRecoverResult
> {}

export const TaskRecoverInputHandler = new Abstraction<ITaskRecoverInputHandler>(
    "BackgroundTasks/TaskRecoverInputHandler"
);

export namespace TaskRecoverInputHandler {
    export type Interface = ITaskRecoverInputHandler;
    export type Result = ITaskRecoverResult;
}
