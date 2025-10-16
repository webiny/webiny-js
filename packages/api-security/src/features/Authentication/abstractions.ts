import { createAbstraction } from "@webiny/feature/api";
import type { Authenticator, Identity } from "@webiny/api-authentication/types.js";

export interface IAuthenticationService {
    /**
     * Authenticate a token and return the identity.
     */
    // TODO: for now we simply mimic the v5 behavior, and return void.
    // TODO: later we need to move authentication logic from the internal context object
    // TODO: and return an Identity from this method!
    authenticate(token: string): Promise<void>;

    /**
     * Add an authenticator strategy (e.g., JWT, API Key, OAuth)
     */
    addAuthenticator(authenticator: Authenticator<Identity>): void;

    /**
     * Get all registered authenticators
     */
    getAuthenticators(): Authenticator[];
}

export const AuthenticationService =
    createAbstraction<IAuthenticationService>("AuthenticationService");

export namespace AuthenticationService {
    export type Interface = IAuthenticationService;
}
