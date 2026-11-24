import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "@webiny/kernel-core";
import type { IEmptyTrashBinsEvent } from "./EmptyTrashBinsEventType.js";

export interface IEmptyTrashBinsEventHandler extends IEventHandler<IEmptyTrashBinsEvent, void> {}

export const EmptyTrashBinsEventHandler = new Abstraction<IEmptyTrashBinsEventHandler>(
    "EmptyTrashBinsEventHandler"
);

export namespace EmptyTrashBinsEventHandler {
    export type Interface = IEmptyTrashBinsEventHandler;
}
