import { createAbstraction } from "@webiny/feature/admin";
import type { ModelGroupDto } from "../listModelGroups/abstractions.js";

// Use Case

export interface CreateModelGroupParams {
    name: string;
    slug: string;
    description?: string;
    icon: string;
}

export interface ICreateModelGroupUseCase {
    execute: (params: CreateModelGroupParams) => Promise<ModelGroupDto>;
}

export const CreateModelGroupUseCase =
    createAbstraction<ICreateModelGroupUseCase>("CreateModelGroupUseCase");

export namespace CreateModelGroupUseCase {
    export type Interface = ICreateModelGroupUseCase;
    export type Params = CreateModelGroupParams;
}

// Repository

export interface ICreateModelGroupRepository {
    execute: (params: CreateModelGroupParams) => Promise<ModelGroupDto>;
}

export const CreateModelGroupRepository = createAbstraction<ICreateModelGroupRepository>(
    "CreateModelGroupRepository"
);

export namespace CreateModelGroupRepository {
    export type Interface = ICreateModelGroupRepository;
}

// Gateway

export interface ICreateModelGroupGateway {
    execute: (data: CreateModelGroupParams) => Promise<ModelGroupDto>;
}

export const CreateModelGroupGateway =
    createAbstraction<ICreateModelGroupGateway>("CreateModelGroupGateway");

export namespace CreateModelGroupGateway {
    export type Interface = ICreateModelGroupGateway;
}
