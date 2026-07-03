import { createAbstraction } from "@webiny/feature/admin";

// Use Case

export interface IListModelGroupsUseCase {
    execute: () => Promise<ModelGroupDto[]>;
}

export const ListModelGroupsUseCase =
    createAbstraction<IListModelGroupsUseCase>("ListModelGroupsUseCase");

export namespace ListModelGroupsUseCase {
    export type Interface = IListModelGroupsUseCase;
}

// Repository

export interface IListModelGroupsRepository {
    execute: () => Promise<ModelGroupDto[]>;
}

export const ListModelGroupsRepository = createAbstraction<IListModelGroupsRepository>(
    "ListModelGroupsRepository"
);

export namespace ListModelGroupsRepository {
    export type Interface = IListModelGroupsRepository;
}

// Gateway

export interface ModelGroupDto {
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    createdOn: string;
    plugin: boolean;
    createdBy: {
        id: string;
        displayName: string;
        type: string;
    };
    contentModels: { modelId: string; name: string; icon: string }[];
}

export interface IListModelGroupsGateway {
    execute: () => Promise<ModelGroupDto[]>;
}

export const ListModelGroupsGateway =
    createAbstraction<IListModelGroupsGateway>("ListModelGroupsGateway");

export namespace ListModelGroupsGateway {
    export type Interface = IListModelGroupsGateway;
}
