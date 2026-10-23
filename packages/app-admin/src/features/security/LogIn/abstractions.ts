import { createAbstraction } from "@webiny/feature/admin";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import type { Identity, IRole, ITeam } from "~/domain/Identity.js";
import type { Tenant } from "~/features/tenancy/abstractions.js";

// Use Case
export interface ILoginParams {
    idTokenProvider: AuthenticationContext.IdTokenProvider;
    logoutCallback?: AuthenticationContext.LogoutCallback;
}

export type LogInResult =
    /** The identity is set: the user is logged in. */
    | { type: "loggedIn" }
    /** The current tenant was changed, and the app reloads to log in on it. */
    | { type: "switchingTenant"; tenantId: string }
    /** The user has to pick one of these tenants. */
    | { type: "selectTenant"; tenants: Tenant[] }
    /** The user can't access any tenant. */
    | { type: "noTenantAccess" };

export interface ILogInUseCase {
    /**
     * Log in on the current tenant. Errors that aren't about the tenant are thrown.
     */
    execute(params: ILoginParams): Promise<LogInResult>;
}
export const LogInUseCase = createAbstraction<ILogInUseCase>("LogInUseCase");

export namespace LogInUseCase {
    export type Interface = ILogInUseCase;
    export type Params = ILoginParams;
    export type Result = LogInResult;
}

// Repository
export interface IIdentityDTO {
    id: string;
    type: string;
    displayName: string;
    roles: IRole[];
    teams: ITeam[];
    permissions: Identity.Permission[];
    currentTenant: Tenant;
    defaultTenant: Tenant;
    /** The enabled tenants in which the identity has a user record. */
    tenants?: Tenant[];
    profile: Identity.Profile;
}

/** What `security.login` returned: the identity, or the tenants the user has to log into instead. */
export type LogInStep<TIdentity> =
    /** The user is logged in on the current tenant. */
    | { step: "done"; identity: TIdentity }
    /** The user has no access to the current tenant, but has access to these. */
    | { step: "selectTenant"; tenants: Tenant[] };

export interface ILogInRepository {
    /**
     * Log in on the current tenant. A failed login throws a `LogInError`.
     */
    login(): Promise<LogInStep<Identity>>;
}

export const LogInRepository = createAbstraction<ILogInRepository>("LogInRepository");

export namespace LogInRepository {
    export type Interface = ILogInRepository;
    export type IdentityDTO = IIdentityDTO;
    export type Result = LogInStep<Identity>;
}

// Gateway
export interface ILogInGateway {
    /**
     * Run `security.login`. An error in the response, or a failed request, throws a `LogInError`.
     */
    execute(): Promise<LogInStep<IIdentityDTO>>;
}

export const LogInGateway = createAbstraction<ILogInGateway>("LogInGateway");

export namespace LogInGateway {
    export type Interface = ILogInGateway;
    export type Result = LogInStep<IIdentityDTO>;
}

// Identity Mapper
export interface IIdentityMapper {
    toIdentity(dto: IIdentityDTO): Identity;
}

export const IdentityMapper = createAbstraction<IIdentityMapper>("IdentityMapper");

export namespace IdentityMapper {
    export type Interface = IIdentityMapper;
}
