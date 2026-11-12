import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { UserUpdatedEventHandler } from "./abstractions.js";

export interface UserUpdatedPayload {
    id: string;
}

/** An admin user changed, and the Users view may still show the old copy. */
export class UserUpdatedEvent extends BaseEvent<UserUpdatedPayload> {
    readonly eventType = "AdminUsers/UserUpdated" as const;

    getHandlerAbstraction() {
        return UserUpdatedEventHandler;
    }
}
