import type { Authenticator } from "@webiny/api-authentication/types";
import { AuthenticationService as ServiceAbstraction } from "./abstractions.js";
import type { Security } from "~/types.js";

export class AuthenticationService implements ServiceAbstraction.Interface {
    private context: Security;

    constructor(context: Security) {
        this.context = context;
    }

    addAuthenticator(authenticator: Authenticator): void {
        this.context.addAuthenticator(authenticator);
    }

    getAuthenticators(): Authenticator[] {
        return this.context.getAuthenticators();
    }

    async authenticate(token: string): Promise<void> {
        return this.context.authenticate(token);
    }
}
