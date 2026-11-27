import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { AdminUsersRepository } from "~/features/users/shared/abstractions.js";

export interface IdentityTenant {
    id: string;
    name: string;
}

type ResolveIdentityTenantsError = AdminUsersRepository.Error;

export interface IResolveIdentityTenantsUseCase {
    /**
     * List the enabled, installed tenants in which the identity has a user record.
     */
    execute(identityId: string): Promise<Result<IdentityTenant[], ResolveIdentityTenantsError>>;
}

/** Find the tenants an identity can log into. */
export const ResolveIdentityTenantsUseCase = createAbstraction<IResolveIdentityTenantsUseCase>(
    "ResolveIdentityTenantsUseCase"
);

export namespace ResolveIdentityTenantsUseCase {
    export type Interface = IResolveIdentityTenantsUseCase;
    export type Tenant = IdentityTenant;
    export type Error = ResolveIdentityTenantsError;
    export type Return = Promise<Result<IdentityTenant[], ResolveIdentityTenantsError>>;
}
