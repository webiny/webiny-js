import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "@webiny/kernel-core";
import type { IEmptyTrashBinsEvent } from "./EmptyTrashBinsInputType.js";

export interface IEmptyTrashBinsInputHandler extends IInputHandler<IEmptyTrashBinsEvent, void> {}

export const EmptyTrashBinsInputHandler = new Abstraction<IEmptyTrashBinsInputHandler>(
    "EmptyTrashBinsInputHandler"
);

export namespace EmptyTrashBinsInputHandler {
    export type Interface = IEmptyTrashBinsInputHandler;
}
