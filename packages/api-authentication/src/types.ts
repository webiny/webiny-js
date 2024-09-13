import { Context } from "@webiny/handler/types";

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

    // These are used with 3rd party IdPs (Okta, Auth0), where, within the `getIdentity` callback,
    // the group and team information is retrieved from the IdP and the verified auth token. See:
    // - https://www.webiny.com/docs/enterprise/okta-integration#3-configure-okta-in-the-graph-ql-api
    // - https://www.webiny.com/docs/enterprise/auth0-integration#3-configure-auth0-in-the-graph-ql-api

    // @deprecated Use `groups` instead.
    group?: string;

    // @deprecated Use `teams` instead.
    team?: string;

    // Using these properties assigning multiple groups or teams.
    groups?: string[];
    teams?: string[];

    [key: string]: any;
}
