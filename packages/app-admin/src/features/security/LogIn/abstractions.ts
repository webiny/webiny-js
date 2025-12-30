import { createAbstraction } from "@webiny/feature/admin";
import { AuthenticationContext } from "~/features/security/AuthenticationContext/index.js";
import type { Identity } from "~/domain/Identity.js";
import type { Tenant } from "~/features/tenancy/abstractions.js";

// Use Case
export interface ILoginParams {
    idTokenProvider: AuthenticationContext.IdTokenProvider;
    logoutCallback?: AuthenticationContext.LogoutCallback;
}

export interface ILogInUseCase {
    execute(params: ILoginParams): Promise<void>;
}
export const LogInUseCase = createAbstraction<ILogInUseCase>("LogInUseCase");

export namespace LogInUseCase {
    export type Interface = ILogInUseCase;
    export type Params = ILoginParams;
}

// Repository
export interface IIdentityDTO {
    id: string;
    type: string;
    displayName: string;
    permissions: Identity.Permission[];
    currentTenant: Tenant;
    defaultTenant: Tenant;
    profile?: Identity.Profile;
}

export interface ILogInRepository {
    login(): Promise<Identity>;
}

export const LogInRepository = createAbstraction<ILogInRepository>("LogInRepository");

export namespace LogInRepository {
    export type Interface = ILogInRepository;
    export type IdentityDTO = IIdentityDTO;
}

// Gateway
export interface ILogInGateway {
    execute(): Promise<IIdentityDTO>;
}

export const LogInGateway = createAbstraction<ILogInGateway>("LogInGateway");

export namespace LogInGateway {
    export type Interface = ILogInGateway;
}

// Identity Mapper
export interface IIdentityMapper {
    toIdentity(dto: IIdentityDTO): Identity;
}

export const IdentityMapper = createAbstraction<IIdentityMapper>("IdentityMapper");

export namespace IdentityMapper {
    export type Interface = IIdentityMapper;
}
