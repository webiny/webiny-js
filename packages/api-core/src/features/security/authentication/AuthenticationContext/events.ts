import { DomainEvent } from "~/features/eventPublisher/index.js";
import { createAbstraction } from "@webiny/feature/api";
import type { IEventHandler } from "~/features/eventPublisher/index.js";
import type { Identity } from "~/features/security/IdentityContext/Identity.js";

export interface BeforeAuthenticationPayload {
    token: string;
}

export class BeforeAuthenticationEvent extends DomainEvent<BeforeAuthenticationPayload> {
    eventType = "authentication.beforeAuthentication" as const;

    getHandlerAbstraction() {
        return BeforeAuthenticationHandler;
    }
}

export const BeforeAuthenticationHandler = createAbstraction<
    IEventHandler<BeforeAuthenticationEvent>
>("BeforeAuthenticationHandler");

export namespace BeforeAuthenticationHandler {
    export type Interface = IEventHandler<BeforeAuthenticationEvent>;
    export type Event = BeforeAuthenticationEvent;
}

export interface AfterAuthenticationPayload {
    identity: Identity;
    token: string;
}

export class AfterAuthenticationEvent extends DomainEvent<AfterAuthenticationPayload> {
    eventType = "authentication.afterAuthentication" as const;

    getHandlerAbstraction() {
        return AfterAuthenticationHandler;
    }
}

export const AfterAuthenticationHandler = createAbstraction<
    IEventHandler<AfterAuthenticationEvent>
>("AfterAuthenticationHandler");

export namespace AfterAuthenticationHandler {
    export type Interface = IEventHandler<AfterAuthenticationEvent>;
    export type Event = AfterAuthenticationEvent;
}
