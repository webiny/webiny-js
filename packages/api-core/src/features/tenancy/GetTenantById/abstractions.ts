import { type Result, createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types.js";

export type GetTenantByIdError = { type: "NOT_FOUND" } | { type: "UNKNOWN"; cause: Error };

// Use Case Abstraction
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

// Repository Abstraction
export interface IGetTenantByIdRepository {
    getById(id: string): Promise<Tenant | null>;
}

export const GetTenantByIdRepository =
    createAbstraction<IGetTenantByIdRepository>("GetTenantByIdRepository");

export namespace GetTenantByIdRepository {
    export type Interface = IGetTenantByIdRepository;
}

// Gateway Abstraction
export interface IGetTenantByIdGateway {
    getTenantById(id: string): Promise<Tenant | null>;
}

export const GetTenantByIdGateway =
    createAbstraction<IGetTenantByIdGateway>("GetTenantByIdGateway");

export namespace GetTenantByIdGateway {
    export type Interface = IGetTenantByIdGateway;
}
