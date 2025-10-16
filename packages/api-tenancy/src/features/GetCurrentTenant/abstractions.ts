import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";

export interface IGetCurrentTenantUseCase {
    execute(): Result<Tenant>;
}

export const GetCurrentTenantUseCase =
    createAbstraction<IGetCurrentTenantUseCase>("GetCurrentTenantUseCase");

export namespace GetCurrentTenantUseCase {
    export type Interface = IGetCurrentTenantUseCase;
    export type Result = ReturnType<IGetCurrentTenantUseCase["execute"]>;
}
