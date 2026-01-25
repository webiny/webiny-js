import { createAbstraction } from "@webiny/feature/admin";
import type { NetworkErrorEvent } from "./NetworkErrorEvent.js";
import type { AuthenticationErrorEvent } from "./AuthenticationErrorEvent.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";

export const NetworkErrorEventHandler = createAbstraction<IEventHandler<NetworkErrorEvent>>(
    "NetworkErrorEventHandler"
);

export namespace NetworkErrorEventHandler {
    export type Interface = IEventHandler<NetworkErrorEvent>;
}

export const AuthenticationErrorEventHandler = createAbstraction<
    IEventHandler<AuthenticationErrorEvent>
>("AuthenticationErrorEventHandler");

export namespace AuthenticationErrorEventHandler {
    export type Interface = IEventHandler<AuthenticationErrorEvent>;
}
