import { createAbstraction, type Result } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";

// Use case

export type UpdateTenantError =
    | { type: "NOT_FOUND" }
    | { type: "NOT_ALLOWED" }
    | { type: "UNKNOWN"; cause: Error };

export interface IUpdateTenantUseCase {
    execute(id: string, data: Partial<Tenant>): Promise<Result<Tenant, UpdateTenantError>>;
}

export const UpdateTenantUseCase = createAbstraction<IUpdateTenantUseCase>("UpdateTenantUseCase");

export namespace UpdateTenantUseCase {
    export type Interface = IUpdateTenantUseCase;
    export type Error = UpdateTenantError;
    export type Result = ReturnType<IUpdateTenantUseCase["execute"]>;
}

// Repository

export interface IUpdateTenantRepository {
    execute(tenant: Tenant): Promise<void>;
}

export const UpdateTenantRepository =
    createAbstraction<IUpdateTenantRepository>("UpdateTenantRepository");

export namespace UpdateTenantRepository {
    export type Interface = IUpdateTenantRepository;
    export type Result = ReturnType<IUpdateTenantRepository["execute"]>;
}
