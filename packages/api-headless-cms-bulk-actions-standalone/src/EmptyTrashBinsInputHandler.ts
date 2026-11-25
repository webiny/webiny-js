import { Abstraction } from "@webiny/di";
import type { InputHandler } from "@webiny/api-kernel-core";
import type { IEmptyTrashBinsEvent } from "./EmptyTrashBinsInputType.js";

export interface IEmptyTrashBinsInputHandler extends InputHandler.Interface<
    IEmptyTrashBinsEvent,
    void
> {}

export const EmptyTrashBinsInputHandler = new Abstraction<IEmptyTrashBinsInputHandler>(
    "EmptyTrashBinsInputHandler"
);

export namespace EmptyTrashBinsInputHandler {
    export type Interface = IEmptyTrashBinsInputHandler;
}
