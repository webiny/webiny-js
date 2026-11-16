import { createFeature } from "@webiny/feature/admin";
import { UsersRevision as RevisionAbstraction } from "./abstractions.js";
import { UsersRevision } from "./UsersRevision.js";
import { MarkUsersChanged } from "./MarkUsersChanged.js";

/** Keeps the Users view current when admin users are created, updated or deleted on the server. */
export const UserEventsFeature = createFeature({
    name: "AdminUsers/UserEvents",
    register(container) {
        container.register(UsersRevision).inSingletonScope();
        container.register(MarkUsersChanged);
    },
    resolve(container) {
        return {
            revision: container.resolve(RevisionAbstraction)
        };
    }
});
