import { Abstraction } from "@webiny/di";
import type { IEventHandler } from "~/features/events/EventHandler.js";

export const TestHttpEventHandler = new Abstraction<IEventHandler>("TestHttpEventHandler");

export namespace TestHttpEventHandler {
    export type Interface = IEventHandler;
}
