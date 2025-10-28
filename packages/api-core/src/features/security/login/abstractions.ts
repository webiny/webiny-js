import { DomainEvent } from "~/features/eventPublisher/index.js";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import { createAbstraction } from "@webiny/feature/api";
import { Identity } from "~/features/security/IdentityContext/index.js";

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
