import { Abstraction } from "@webiny/di";
import type { InputHandler } from "~/features/kernel/InputHandler.js";

export const TestHttpInputHandler = new Abstraction<InputHandler.Interface>("TestHttpInputHandler");

export namespace TestHttpInputHandler {
    export type Interface = InputHandler.Interface;
}
