import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "@webiny/kernel-core";
import type { IScheduledActionRecoverEvent } from "./ScheduledActionRecoverInputType.js";

export interface IScheduledActionRecoverResult {
    recovered: number;
    // Tenants whose schedules could not be read or re-armed; the others were still recovered.
    failedTenants: string[];
}

export interface IScheduledActionRecoverInputHandler extends IInputHandler<
    IScheduledActionRecoverEvent,
    IScheduledActionRecoverResult
> {}

export const ScheduledActionRecoverInputHandler =
    new Abstraction<IScheduledActionRecoverInputHandler>("ScheduledActionRecoverInputHandler");

export namespace ScheduledActionRecoverInputHandler {
    export type Interface = IScheduledActionRecoverInputHandler;
    export type Result = IScheduledActionRecoverResult;
}
