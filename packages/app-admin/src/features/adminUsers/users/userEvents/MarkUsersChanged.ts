import {
    UserCreatedEventHandler,
    UserDeletedEventHandler,
    UserUpdatedEventHandler,
    UsersRevision
} from "./abstractions.js";

/** A new user belongs in the list. */
class MarkListOnUserCreatedImpl implements UserCreatedEventHandler.Interface {
    constructor(private revision: UsersRevision.Interface) {}

    async handle(): Promise<void> {
        this.revision.listChanged();
    }
}

export const MarkListOnUserCreated = UserCreatedEventHandler.createImplementation({
    implementation: MarkListOnUserCreatedImpl,
    dependencies: [UsersRevision]
});

/** An updated user changes its row in the list, and the form if that user is open. */
class MarkUserOnUserUpdatedImpl implements UserUpdatedEventHandler.Interface {
    constructor(private revision: UsersRevision.Interface) {}

    async handle(event: UserUpdatedEventHandler.Event): Promise<void> {
        this.revision.listChanged();
        this.revision.userChanged(event.payload.id);
    }
}

export const MarkUserOnUserUpdated = UserUpdatedEventHandler.createImplementation({
    implementation: MarkUserOnUserUpdatedImpl,
    dependencies: [UsersRevision]
});

/**
 * A deleted user leaves the list. An open form for it is left alone: reading it back would fail, and
 * the form already handles a failed read by going back to the list with an error.
 */
class MarkListOnUserDeletedImpl implements UserDeletedEventHandler.Interface {
    constructor(private revision: UsersRevision.Interface) {}

    async handle(): Promise<void> {
        this.revision.listChanged();
    }
}

export const MarkListOnUserDeleted = UserDeletedEventHandler.createImplementation({
    implementation: MarkListOnUserDeletedImpl,
    dependencies: [UsersRevision]
});
