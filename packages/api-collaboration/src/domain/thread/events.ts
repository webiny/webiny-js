import { createAbstraction } from "@webiny/feature/api";
import { DomainEvent } from "@webiny/api-core/features/eventPublisher/index.js";
import type { IEventHandler } from "@webiny/api-core/features/eventPublisher/index.js";
import type { ICollabMessage, ICollabThread } from "./abstractions.js";
import type { ICollabLocatorResolution } from "~/domain/locator/abstractions.js";

/**
 * Emitted after a thread (and its first message) is created. Consumers (e.g. notifications)
 * react to mentions on the first message. `anchor` carries the resolved label/breadcrumb for
 * display.
 */
export interface CollabThreadCreatedPayload {
    thread: ICollabThread;
    message: ICollabMessage;
    anchor: ICollabLocatorResolution;
}

export class CollabThreadCreatedEvent extends DomainEvent<CollabThreadCreatedPayload> {
    eventType = "collaboration.threadCreated" as const;

    getHandlerAbstraction() {
        return CollabThreadCreatedHandler;
    }
}

export const CollabThreadCreatedHandler = createAbstraction<
    IEventHandler<CollabThreadCreatedEvent>
>("CollabThreadCreatedHandler");

export namespace CollabThreadCreatedHandler {
    export type Interface = IEventHandler<CollabThreadCreatedEvent>;
    export type Event = CollabThreadCreatedEvent;
}

/**
 * Emitted after a reply is added to a thread. Consumers react to thread participants and any
 * mentions on the reply.
 */
export interface CollabReplyAddedPayload {
    thread: ICollabThread;
    message: ICollabMessage;
    anchor: ICollabLocatorResolution;
}

export class CollabReplyAddedEvent extends DomainEvent<CollabReplyAddedPayload> {
    eventType = "collaboration.replyAdded" as const;

    getHandlerAbstraction() {
        return CollabReplyAddedHandler;
    }
}

export const CollabReplyAddedHandler =
    createAbstraction<IEventHandler<CollabReplyAddedEvent>>("CollabReplyAddedHandler");

export namespace CollabReplyAddedHandler {
    export type Interface = IEventHandler<CollabReplyAddedEvent>;
    export type Event = CollabReplyAddedEvent;
}
