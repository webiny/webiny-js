import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "~/eventTypes/BackgroundTaskEventType.js";

// Result is the task response (status: continue/done/error) — the Step Functions state machine
// reads `$.status` from the Lambda's return value to decide the next state, so the handler MUST
// return it (returning void makes the SFN see null → UnknownError → execution FAILED).
export interface IBackgroundTaskEventHandler extends IEventHandler<IBackgroundTaskEvent, unknown> {}

export const BackgroundTaskEventHandler = new Abstraction<IBackgroundTaskEventHandler>(
    "BackgroundTaskEventHandler"
);

export namespace BackgroundTaskEventHandler {
    export type Interface = IBackgroundTaskEventHandler;
}
