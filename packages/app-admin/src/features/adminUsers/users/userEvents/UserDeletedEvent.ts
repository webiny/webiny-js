import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { UserDeletedEventHandler } from "./abstractions.js";

export interface UserDeletedPayload {
    id: string;
}

/** An admin user no longer exists, and the Users view may still list it. */
export class UserDeletedEvent extends BaseEvent<UserDeletedPayload> {
    readonly eventType = "AdminUsers/UserDeleted" as const;

    getHandlerAbstraction() {
        return UserDeletedEventHandler;
    }
}
