import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { IScheduledActionEvent } from "~/eventTypes/ScheduledActionEventType.js";

export interface IScheduledActionResult {
    success: boolean;
}

export interface IScheduledActionEventHandler extends IEventHandler<
    IScheduledActionEvent,
    IScheduledActionResult
> {}

export const ScheduledActionEventHandler = new Abstraction<IScheduledActionEventHandler>(
    "ScheduledActionEventHandler"
);

export namespace ScheduledActionEventHandler {
    export type Interface = IScheduledActionEventHandler;
}
