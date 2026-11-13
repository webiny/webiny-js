import { BaseEvent } from "@webiny/app/features/eventPublisher/index.js";
import { UserCreatedEventHandler } from "./abstractions.js";

export interface UserCreatedPayload {
    id: string;
}

/** An admin user now exists that the Users view may not have loaded. */
export class UserCreatedEvent extends BaseEvent<UserCreatedPayload> {
    readonly eventType = "AdminUsers/UserCreated" as const;

    getHandlerAbstraction() {
        return UserCreatedEventHandler;
    }
}
