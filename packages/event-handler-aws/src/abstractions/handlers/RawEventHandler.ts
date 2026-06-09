import type { IEventHandler } from "@webiny/event-handler-core";

// Raw handlers register under EventHandler from @webiny/event-handler.
// This namespace provides a typed interface for untyped event handling.
export namespace RawEventHandler {
    export type Interface<TEvent = any, TResult = any> = IEventHandler<TEvent, TResult>;
}
