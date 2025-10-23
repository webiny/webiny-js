import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { ListTenantLinksByTypeInput, TenantLink } from "../shared/types.js";

export interface IListTenantLinksByTypeErrors {
    // No additional errors beyond repository errors
}

type ListTenantLinksByTypeError =
    | IListTenantLinksByTypeErrors[keyof IListTenantLinksByTypeErrors]
    | TenantLinksRepository.Error;

export interface IListTenantLinksByType {
    execute<TLink extends TenantLink = TenantLink>(
        input: ListTenantLinksByTypeInput
    ): Promise<Result<TLink[], ListTenantLinksByTypeError>>;
}

export const ListTenantLinksByType = createAbstraction<IListTenantLinksByType>(
    "ListTenantLinksByType"
);

export namespace ListTenantLinksByType {
    export type Interface = IListTenantLinksByType;
    export type Error = ListTenantLinksByTypeError;
}
