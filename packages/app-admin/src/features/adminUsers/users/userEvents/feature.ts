import { createFeature } from "@webiny/feature/admin";
import { UsersRevision as RevisionAbstraction } from "./abstractions.js";
import { UsersRevision } from "./UsersRevision.js";
import {
    MarkListOnUserCreated,
    MarkListOnUserDeleted,
    MarkUserOnUserUpdated
} from "./MarkUsersChanged.js";
import { UserWebsocketMessages } from "./UserWebsocketMessages.js";

/** Keeps the Users view current when admin users are created, updated or deleted on the server. */
export const UserEventsFeature = createFeature({
    name: "AdminUsers/UserEvents",
    register(container) {
        container.register(UsersRevision).inSingletonScope();
        container.register(MarkListOnUserCreated);
        container.register(MarkUserOnUserUpdated);
        container.register(MarkListOnUserDeleted);
        container.register(UserWebsocketMessages);
    },
    resolve(container) {
        return {
            revision: container.resolve(RevisionAbstraction)
        };
    }
});
