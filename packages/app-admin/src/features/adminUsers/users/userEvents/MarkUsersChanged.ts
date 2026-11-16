import { RecordChangedEventHandler } from "@webiny/app/features/recordChanges/index.js";
import { UsersRevision } from "./abstractions.js";

// Sent by the api for admin users; see `USER_RECORD_TYPE` in @webiny/api-core.
const USER_RECORD_TYPE = "adminUsers.user";

/**
 * Every change moves the list. An update also moves the user, so an open form for it reads it again.
 * A deleted user's open form is left alone: reading it back would fail, and the form already handles
 * a failed read by going back to the list with an error.
 */
class MarkUsersChangedImpl implements RecordChangedEventHandler.Interface {
    constructor(private revision: UsersRevision.Interface) {}

    async handle(event: RecordChangedEventHandler.Event): Promise<void> {
        const { type, id, change } = event.payload;
        if (type !== USER_RECORD_TYPE) {
            return;
        }

        this.revision.listChanged();
        if (change === "updated") {
            this.revision.userChanged(id);
        }
    }
}

export const MarkUsersChanged = RecordChangedEventHandler.createImplementation({
    implementation: MarkUsersChangedImpl,
    dependencies: [UsersRevision]
});
