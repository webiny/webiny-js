import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { ListTenantLinksByTenantInput, TenantLink } from "../shared/types.js";

export interface IListTenantLinksByTenantErrors {
    // No additional errors beyond repository errors
}

type ListTenantLinksByTenantError =
    | IListTenantLinksByTenantErrors[keyof IListTenantLinksByTenantErrors]
    | TenantLinksRepository.Error;

export interface IListTenantLinksByTenant {
    execute(
        input: ListTenantLinksByTenantInput
    ): Promise<Result<TenantLink[], ListTenantLinksByTenantError>>;
}

export const ListTenantLinksByTenant =
    createAbstraction<IListTenantLinksByTenant>("ListTenantLinksByTenant");

export namespace ListTenantLinksByTenant {
    export type Interface = IListTenantLinksByTenant;
    export type Error = ListTenantLinksByTenantError;
}
