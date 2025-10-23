import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { DeleteTenantLinkInput } from "../shared/types.js";

export interface IDeleteTenantLinksErrors {
    // No additional errors beyond repository errors for batch delete
}

type DeleteTenantLinksError =
    | IDeleteTenantLinksErrors[keyof IDeleteTenantLinksErrors]
    | TenantLinksRepository.Error;

export interface IDeleteTenantLinks {
    execute(inputs: DeleteTenantLinkInput[]): Promise<Result<void, DeleteTenantLinksError>>;
}

export const DeleteTenantLinks = createAbstraction<IDeleteTenantLinks>("DeleteTenantLinks");

export namespace DeleteTenantLinks {
    export type Interface = IDeleteTenantLinks;
    export type Error = DeleteTenantLinksError;
}
