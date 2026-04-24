import { type Result, createAbstraction } from "@webiny/feature/api";
import type { Tenant } from "~/types/tenancy.js";

export type GetTenantByIdError = { type: "NOT_FOUND" } | { type: "UNKNOWN"; cause: Error };

export interface IGetTenantByIdUseCase {
    execute(id: string): Promise<Result<Tenant, GetTenantByIdError>>;
}

/** Retrieve a tenant by its ID. */
export const GetTenantByIdUseCase = createAbstraction<IGetTenantByIdUseCase>(
    "Tenancy/GetTenantByIdUseCase"
);

export namespace GetTenantByIdUseCase {
    export type Interface = IGetTenantByIdUseCase;
    export type Error = GetTenantByIdError;
    export type Result = ReturnType<IGetTenantByIdUseCase["execute"]>;
}

export interface IGetTenantByIdRepository {
    getById(id: string): Promise<Tenant | null>;
}

/** Fetch a tenant by ID from storage. */
export const GetTenantByIdRepository = createAbstraction<IGetTenantByIdRepository>(
    "Tenancy/GetTenantByIdRepository"
);

export namespace GetTenantByIdRepository {
    export type Interface = IGetTenantByIdRepository;
}

export interface IGetTenantByIdGateway {
    getTenantById(id: string): Promise<Tenant | null>;
}

/** Storage gateway for tenant retrieval by ID. */
export const GetTenantByIdGateway = createAbstraction<IGetTenantByIdGateway>(
    "Tenancy/GetTenantByIdGateway"
);

export namespace GetTenantByIdGateway {
    export type Interface = IGetTenantByIdGateway;
}
