import { Context } from "@webiny/fastify/types";

export interface AuthenticationContext<TIdentity = Identity> extends Context {
    authentication: Authentication<TIdentity>;
}

export interface Authenticator<TIdentity = Identity> {
    (token: string): Promise<TIdentity | null>;
}

export interface Authentication<TIdentity = Identity> {
    getIdentity<TIdentity extends Identity = Identity>(): TIdentity;
    setIdentity(identity: TIdentity): void;
    addAuthenticator(authenticator: Authenticator<TIdentity>): void;
    getAuthenticators(): Authenticator[];
    authenticate(token: string): Promise<void>;
}

export interface Identity {
    id: string;
    type: string;
    displayName: string | null;
    [key: string]: any;
}
