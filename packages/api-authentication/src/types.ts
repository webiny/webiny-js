import { Context } from "@webiny/handler/types";

export interface AuthenticationContext<TIdentity = Identity> extends Context {
    authentication: Authentication<TIdentity>;
}

export interface Authenticator<TIdentity = Identity> {
    (token: string): Promise<TIdentity>;
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
    displayName: string;
    [key: string]: any;
}
