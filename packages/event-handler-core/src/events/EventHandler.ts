import { Abstraction } from "@webiny/di";
import type { NextFunction } from "./types.js";

export interface EventContext<TEvent = any> {
    event: TEvent;
    metadata: Record<string, any>;
}

export interface IEventHandler<TEvent = any, TResult = any> {
    execute(ctx: EventContext<TEvent>, next: NextFunction): Promise<TResult>;
}

export const EventHandler = new Abstraction<IEventHandler>("EventHandler");

export namespace EventHandler {
    export type Interface<TEvent = any, TResult = any> = IEventHandler<TEvent, TResult>;
}

export const HttpEventHandler = new Abstraction<IEventHandler>("HttpEventHandler");

export namespace HttpEventHandler {
    export type Interface<TEvent = any, TResult = any> = IEventHandler<TEvent, TResult>;
}
