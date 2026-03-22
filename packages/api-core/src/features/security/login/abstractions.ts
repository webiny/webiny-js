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
        return AfterLoginEventHandler;
    }
}

/** Hook into login lifecycle after a user logs in. */
export const AfterLoginEventHandler =
    createAbstraction<IEventHandler<AfterLoginEvent>>("AfterLoginEventHandler");

export namespace AfterLoginEventHandler {
    export type Interface = IEventHandler<AfterLoginEvent>;
    export type Event = AfterLoginEvent;
}
