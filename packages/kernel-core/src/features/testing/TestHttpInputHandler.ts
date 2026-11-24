import { Abstraction } from "@webiny/di";
import type { IInputHandler } from "~/features/events/InputHandler.js";

export const TestHttpInputHandler = new Abstraction<IInputHandler>("TestHttpInputHandler");

export namespace TestHttpInputHandler {
    export type Interface = IInputHandler;
}
