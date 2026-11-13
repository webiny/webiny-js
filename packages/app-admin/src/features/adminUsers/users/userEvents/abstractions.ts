import { createAbstraction } from "@webiny/feature/admin";
import type { IEventHandler } from "@webiny/app/features/eventPublisher/index.js";
import type { UserCreatedEvent } from "./UserCreatedEvent.js";
import type { UserUpdatedEvent } from "./UserUpdatedEvent.js";
import type { UserDeletedEvent } from "./UserDeletedEvent.js";

/** Reacts to an admin user created somewhere this tab did not see. */
export const UserCreatedEventHandler = createAbstraction<IEventHandler<UserCreatedEvent>>(
    "AdminUsers/UserCreatedEventHandler"
);

export namespace UserCreatedEventHandler {
    export type Interface = IEventHandler<UserCreatedEvent>;
    export type Event = UserCreatedEvent;
}

/** Reacts to an admin user changed somewhere this tab did not see, such as by the assistant. */
export const UserUpdatedEventHandler = createAbstraction<IEventHandler<UserUpdatedEvent>>(
    "AdminUsers/UserUpdatedEventHandler"
);

export namespace UserUpdatedEventHandler {
    export type Interface = IEventHandler<UserUpdatedEvent>;
    export type Event = UserUpdatedEvent;
}

/** Reacts to an admin user deleted somewhere this tab did not see. */
export const UserDeletedEventHandler = createAbstraction<IEventHandler<UserDeletedEvent>>(
    "AdminUsers/UserDeletedEventHandler"
);

export namespace UserDeletedEventHandler {
    export type Interface = IEventHandler<UserDeletedEvent>;
    export type Event = UserDeletedEvent;
}

export interface IUsersRevision {
    /** Changes whenever a user is created, updated or deleted. */
    readonly list: number;
    /** Changes whenever the given user is updated. */
    user(id: string): number;
    listChanged(): void;
    userChanged(id: string): void;
}

/**
 * Tells the Users view when what it loaded is out of date. The view keeps the users list and the
 * open user in component state rather than in a shared cache, so it watches these numbers and reads
 * again when one moves.
 */
export const UsersRevision = createAbstraction<IUsersRevision>("AdminUsers/UsersRevision");

export namespace UsersRevision {
    export type Interface = IUsersRevision;
}
