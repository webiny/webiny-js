import { createAbstraction, Result } from "@webiny/feature/api";
import type { Tenant, ListTenantsParams } from "~/types.js";

// Use Case Abstraction
export interface IListTenantsUseCase {
    execute(params?: ListTenantsParams): Promise<Result<Tenant[]>>;
}

export const ListTenantsUseCase = createAbstraction<IListTenantsUseCase>("ListTenantsUseCase");

export namespace ListTenantsUseCase {
    export type Interface = IListTenantsUseCase;
}

// Repository Abstraction
export interface IListTenantsRepository {
    list(params?: ListTenantsParams): Promise<Tenant[]>;
}

export const ListTenantsRepository =
    createAbstraction<IListTenantsRepository>("ListTenantsRepository");

export namespace ListTenantsRepository {
    export type Interface = IListTenantsRepository;
}

// Gateway Abstraction
export interface IListTenantsGateway {
    listTenants(params?: ListTenantsParams): Promise<Tenant[]>;
}

export const ListTenantsGateway = createAbstraction<IListTenantsGateway>("ListTenantsGateway");

export namespace ListTenantsGateway {
    export type Interface = IListTenantsGateway;
}
