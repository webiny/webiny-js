import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { UpdateTenantLinkInput } from "../shared/types.js";

export interface IUpdateTenantLinksErrors {
    // No additional errors beyond repository errors for batch update
}

type UpdateTenantLinksError =
    | IUpdateTenantLinksErrors[keyof IUpdateTenantLinksErrors]
    | TenantLinksRepository.Error;

export interface IUpdateTenantLinks {
    execute(inputs: UpdateTenantLinkInput[]): Promise<Result<void, UpdateTenantLinksError>>;
}

export const UpdateTenantLinks = createAbstraction<IUpdateTenantLinks>("UpdateTenantLinks");

export namespace UpdateTenantLinks {
    export type Interface = IUpdateTenantLinks;
    export type Error = UpdateTenantLinksError;
}
