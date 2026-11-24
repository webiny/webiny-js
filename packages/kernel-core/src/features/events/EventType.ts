import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "./EventHandler.js";

export interface IEventType<TEvent = any> {
    canHandle(event: any): event is TEvent;
    getHandlerAbstraction(): Abstraction<IEventHandler>;
}

export const EventType = new Abstraction<IEventType>("EventType");

export namespace EventType {
    export type Interface<TEvent = any> = IEventType<TEvent>;
}
