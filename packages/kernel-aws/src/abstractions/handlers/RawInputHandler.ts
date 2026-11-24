import type { InputHandler } from "@webiny/kernel-core";

// Raw handlers register under InputHandler from @webiny/kernel-core.
// This namespace provides a typed interface for untyped event handling.
export namespace RawInputHandler {
    export type Interface<TEvent = any, TResult = any> = InputHandler.Interface<TEvent, TResult>;
}
