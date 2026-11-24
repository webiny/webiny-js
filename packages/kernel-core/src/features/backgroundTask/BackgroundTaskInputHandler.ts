import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "~/features/events/InputHandler.js";
import type { IBackgroundTaskEvent } from "./BackgroundTaskInputType.js";

// Result is the task response (status: continue/done/error) — the Step Functions state machine
// reads `$.status` from the Lambda's return value to decide the next state, so the handler MUST
// return it (returning void makes the SFN see null → UnknownError → execution FAILED).
export interface IBackgroundTaskInputHandler extends IInputHandler<IBackgroundTaskEvent, unknown> {}

export const BackgroundTaskInputHandler = new Abstraction<IBackgroundTaskInputHandler>(
    "BackgroundTaskInputHandler"
);

export namespace BackgroundTaskInputHandler {
    export type Interface = IBackgroundTaskInputHandler;
}
