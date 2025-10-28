import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { ListTenantLinksByIdentityInput, TenantLink } from "../shared/types.js";

export interface IListTenantLinksByIdentityErrors {
    // No additional errors beyond repository errors
}

type ListTenantLinksByIdentityError =
    | IListTenantLinksByIdentityErrors[keyof IListTenantLinksByIdentityErrors]
    | TenantLinksRepository.Error;

export interface IListTenantLinksByIdentity {
    execute(
        input: ListTenantLinksByIdentityInput
    ): Promise<Result<TenantLink[], ListTenantLinksByIdentityError>>;
}

export const ListTenantLinksByIdentity = createAbstraction<IListTenantLinksByIdentity>(
    "ListTenantLinksByIdentity"
);

export namespace ListTenantLinksByIdentity {
    export type Interface = IListTenantLinksByIdentity;
    export type Error = ListTenantLinksByIdentityError;
}
