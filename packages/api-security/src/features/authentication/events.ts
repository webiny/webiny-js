import { DomainEvent } from "@webiny/api-core";
import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "@webiny/api-core";
import type { Identity } from "~/features/IdentityContext/Identity.js";

export interface BeforeLoginPayload {
    token: string;
}

export class BeforeLoginEvent extends DomainEvent<BeforeLoginPayload> {
    eventType = "authentication.beforeLogin" as const;

    getHandlerAbstraction() {
        return BeforeLoginHandler;
    }
}

export const BeforeLoginHandler = createAbstraction<IEventHandler<BeforeLoginEvent>>(
    "BeforeLoginHandler"
);

export namespace BeforeLoginHandler {
    export type Interface = IEventHandler<BeforeLoginEvent>;
    export type Event = BeforeLoginEvent;
}

export interface AfterLoginPayload {
    identity: Identity;
    token: string;
}

export class AfterLoginEvent extends DomainEvent<AfterLoginPayload> {
    eventType = "authentication.afterLogin" as const;

    getHandlerAbstraction() {
        return AfterLoginHandler;
    }
}

export const AfterLoginHandler = createAbstraction<IEventHandler<AfterLoginEvent>>(
    "AfterLoginHandler"
);

export namespace AfterLoginHandler {
    export type Interface = IEventHandler<AfterLoginEvent>;
    export type Event = AfterLoginEvent;
}
