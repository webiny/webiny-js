import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { IScheduledActionRecoverEvent } from "./ScheduledActionRecoverEventType.js";

export interface IScheduledActionRecoverResult {
    recovered: number;
}

export interface IScheduledActionRecoverEventHandler extends IEventHandler<
    IScheduledActionRecoverEvent,
    IScheduledActionRecoverResult
> {}

export const ScheduledActionRecoverEventHandler =
    new Abstraction<IScheduledActionRecoverEventHandler>("ScheduledActionRecoverEventHandler");

export namespace ScheduledActionRecoverEventHandler {
    export type Interface = IScheduledActionRecoverEventHandler;
    export type Result = IScheduledActionRecoverResult;
}
