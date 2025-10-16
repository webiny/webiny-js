import { type Result, createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";

export type GetTenantByIdError = { type: "NOT_FOUND" } | { type: "UNKNOWN"; cause: Error };

export interface IGetTenantByIdUseCase {
    execute(id: string): Promise<Result<Tenant, GetTenantByIdError>>;
}

export const GetTenantByIdUseCase =
    createAbstraction<IGetTenantByIdUseCase>("GetTenantByIdUseCase");

export namespace GetTenantByIdUseCase {
    export type Interface = IGetTenantByIdUseCase;
    export type Error = GetTenantByIdError;
    export type Result = ReturnType<IGetTenantByIdUseCase["execute"]>;
}
