import { DomainEvent } from "@webiny/api-core";
import type { IEventHandler } from "@webiny/api-core";
import { createAbstraction } from "@webiny/feature/api";
import { Identity } from "~/features/IdentityContext/index.js";

export interface AfterLoginPayload {
    identity: Identity;
}

export class AfterLoginEvent extends DomainEvent<AfterLoginPayload> {
    eventType = "login.afterLogin" as const;

    getHandlerAbstraction() {
        return AfterLoginHandler;
    }
}

export const AfterLoginHandler =
    createAbstraction<IEventHandler<AfterLoginEvent>>("AfterLoginHandler");

export namespace AfterLoginHandler {
    export type Interface = IEventHandler<AfterLoginEvent>;
    export type Event = AfterLoginEvent;
}
