import { createAbstraction } from "@webiny/feature/admin";
import type { ModelGroupDto } from "../listModelGroups/abstractions.js";

// Use Case

export interface UpdateModelGroupParams {
    id: string;
    name: string;
    slug: string;
    description?: string;
    icon: string;
}

export interface IUpdateModelGroupUseCase {
    execute: (params: UpdateModelGroupParams) => Promise<ModelGroupDto>;
}

export const UpdateModelGroupUseCase =
    createAbstraction<IUpdateModelGroupUseCase>("UpdateModelGroupUseCase");

export namespace UpdateModelGroupUseCase {
    export type Interface = IUpdateModelGroupUseCase;
    export type Params = UpdateModelGroupParams;
}

// Repository

export interface IUpdateModelGroupRepository {
    execute: (params: UpdateModelGroupParams) => Promise<ModelGroupDto>;
}

export const UpdateModelGroupRepository = createAbstraction<IUpdateModelGroupRepository>(
    "UpdateModelGroupRepository"
);

export namespace UpdateModelGroupRepository {
    export type Interface = IUpdateModelGroupRepository;
}

// Gateway

export interface IUpdateModelGroupGateway {
    execute: (id: string, data: Omit<UpdateModelGroupParams, "id">) => Promise<ModelGroupDto>;
}

export const UpdateModelGroupGateway =
    createAbstraction<IUpdateModelGroupGateway>("UpdateModelGroupGateway");

export namespace UpdateModelGroupGateway {
    export type Interface = IUpdateModelGroupGateway;
}
