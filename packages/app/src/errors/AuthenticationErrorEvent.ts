import { AuthenticationErrorEventHandler } from "./abstractions.js";
import { BaseEvent } from "~/features/eventPublisher/index.js";

export interface AuthenticationErrorPayload {
    message: string;
    code: string;
}

export class AuthenticationErrorEvent extends BaseEvent<AuthenticationErrorPayload> {
    eventType = "Authentication/Error" as const;

    getHandlerAbstraction() {
        return AuthenticationErrorEventHandler;
    }
}
