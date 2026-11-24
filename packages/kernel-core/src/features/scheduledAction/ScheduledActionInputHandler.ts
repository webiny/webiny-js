import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "~/features/events/InputHandler.js";
import type { IScheduledActionEvent } from "./ScheduledActionInputType.js";

export interface IScheduledActionResult {
    success: boolean;
}

export interface IScheduledActionInputHandler extends IInputHandler<
    IScheduledActionEvent,
    IScheduledActionResult
> {}

export const ScheduledActionInputHandler = new Abstraction<IScheduledActionInputHandler>(
    "ScheduledActionInputHandler"
);

export namespace ScheduledActionInputHandler {
    export type Interface = IScheduledActionInputHandler;
}
