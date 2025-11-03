import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { GetTenantLinkByIdentityInput, TenantLink } from "../shared/types.js";

export interface IGetTenantLinkByIdentityErrors {
    // No additional errors beyond repository errors
}

type GetTenantLinkByIdentityError =
    | IGetTenantLinkByIdentityErrors[keyof IGetTenantLinkByIdentityErrors]
    | TenantLinksRepository.Error;

export interface IGetTenantLinkByIdentity {
    execute<TLink extends TenantLink = TenantLink>(
        input: GetTenantLinkByIdentityInput
    ): Promise<Result<TLink | null, GetTenantLinkByIdentityError>>;
}

export const GetTenantLinkByIdentity =
    createAbstraction<IGetTenantLinkByIdentity>("GetTenantLinkByIdentity");

export namespace GetTenantLinkByIdentity {
    export type Interface = IGetTenantLinkByIdentity;
    export type Error = GetTenantLinkByIdentityError;
}
