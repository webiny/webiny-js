import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";

export interface IGetRootTenantUseCase {
    execute(): Promise<Result<Tenant>>;
}

export const GetRootTenantUseCase =
    createAbstraction<IGetRootTenantUseCase>("GetRootTenantUseCase");

export namespace GetRootTenantUseCase {
    export type Interface = IGetRootTenantUseCase;
    export type Result = ReturnType<IGetRootTenantUseCase["execute"]>;
}
