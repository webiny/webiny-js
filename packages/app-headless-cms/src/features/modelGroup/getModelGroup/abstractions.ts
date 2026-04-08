import { createAbstraction } from "@webiny/feature/admin";
import type { ModelGroupDto } from "../listModelGroups/abstractions.js";

// Use Case

export interface IGetModelGroupUseCase {
    execute: (id: string) => Promise<ModelGroupDto>;
}

export const GetModelGroupUseCase =
    createAbstraction<IGetModelGroupUseCase>("GetModelGroupUseCase");

export namespace GetModelGroupUseCase {
    export type Interface = IGetModelGroupUseCase;
}

// Repository

export interface IGetModelGroupRepository {
    execute: (id: string) => Promise<ModelGroupDto>;
}

export const GetModelGroupRepository =
    createAbstraction<IGetModelGroupRepository>("GetModelGroupRepository");

export namespace GetModelGroupRepository {
    export type Interface = IGetModelGroupRepository;
}

// Gateway

export interface IGetModelGroupGateway {
    execute: (id: string) => Promise<ModelGroupDto>;
}

export const GetModelGroupGateway =
    createAbstraction<IGetModelGroupGateway>("GetModelGroupGateway");

export namespace GetModelGroupGateway {
    export type Interface = IGetModelGroupGateway;
}
