import type { Identity } from "@webiny/api-authentication/types";
import { createAbstraction } from "@webiny/feature/api";

export type AuthenticationToken = string;

export interface IIdentityContext {
    /**
     * Get the current identity in the execution context.
     * Takes into account withIdentity() scopes.
     */
    getIdentity<TIdentity extends Identity = Identity>(): TIdentity | undefined;

    /**
     * Set the identity for the current request/context.
     * Called once per request after authentication.
     */
    setIdentity(identity: Identity): void;

    /**
     * Get the authentication token for the current request.
     */
    getToken(): AuthenticationToken | undefined;

    /**
     * Execute a callback with a temporary identity override.
     * Creates a new execution scope where getIdentity() returns the override.
     */
    withIdentity<T>(identity: Identity | undefined, cb: () => Promise<T>): Promise<T>;
}

export const IdentityContext = createAbstraction<IIdentityContext>("IdentityContext");

export namespace IdentityContext {
    export type Interface = IIdentityContext;
}
