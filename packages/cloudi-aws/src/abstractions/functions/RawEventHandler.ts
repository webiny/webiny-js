import type { IEventHandler } from "@webiny/event-handler";

// Raw handlers register under EventHandler from @cloudi/core.
// This namespace provides a typed interface for untyped event handling.
export namespace RawEventHandler {
    export type Interface<TEvent = any, TResult = any> = IEventHandler<TEvent, TResult>;
}
