import { createAbstraction } from "@webiny/feature/api";
import { Result } from "@webiny/feature/api";
import { TenantLinksRepository } from "../shared/abstractions.js";
import type { CreateTenantLinkInput } from "../shared/types.js";

export interface ICreateTenantLinksErrors {
    // No additional errors beyond repository errors for batch create
}

type CreateTenantLinksError =
    | ICreateTenantLinksErrors[keyof ICreateTenantLinksErrors]
    | TenantLinksRepository.Error;

export interface ICreateTenantLinks {
    execute(inputs: CreateTenantLinkInput[]): Promise<Result<void, CreateTenantLinksError>>;
}

export const CreateTenantLinks = createAbstraction<ICreateTenantLinks>("CreateTenantLinks");

export namespace CreateTenantLinks {
    export type Interface = ICreateTenantLinks;
    export type Error = CreateTenantLinksError;
}
