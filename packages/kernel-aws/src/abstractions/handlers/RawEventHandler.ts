import type { IEventHandler } from "@webiny/kernel-core";

// Raw handlers register under EventHandler from @webiny/kernel-core.
// This namespace provides a typed interface for untyped event handling.
export namespace RawEventHandler {
    export type Interface<TEvent = any, TResult = any> = IEventHandler<TEvent, TResult>;
}
