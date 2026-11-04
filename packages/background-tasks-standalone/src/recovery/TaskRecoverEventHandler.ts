import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { ITaskRecoverEvent } from "./TaskRecoverEventType.js";

export interface ITaskRecoverResult {
    // Tasks nobody held, now driven by this process.
    resumed: number;
    // Tasks taken over too often, now failed instead of resumed.
    failed: number;
    // Tenants whose tasks could not be read or recovered; the others were still recovered.
    failedTenants: string[];
}

export interface ITaskRecoverEventHandler extends IEventHandler<
    ITaskRecoverEvent,
    ITaskRecoverResult
> {}

export const TaskRecoverEventHandler = new Abstraction<ITaskRecoverEventHandler>(
    "BackgroundTasks/TaskRecoverEventHandler"
);

export namespace TaskRecoverEventHandler {
    export type Interface = ITaskRecoverEventHandler;
    export type Result = ITaskRecoverResult;
}
