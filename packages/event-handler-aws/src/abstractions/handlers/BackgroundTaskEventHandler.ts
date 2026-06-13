import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/event-handler-core";
import type { IBackgroundTaskEvent } from "~/eventTypes/BackgroundTaskEventType.js";

export interface IBackgroundTaskEventHandler extends IEventHandler<IBackgroundTaskEvent, void> {}

export const BackgroundTaskEventHandler = new Abstraction<IBackgroundTaskEventHandler>(
    "BackgroundTaskEventHandler"
);

export namespace BackgroundTaskEventHandler {
    export type Interface = IBackgroundTaskEventHandler;
}
