import { createAbstraction } from "@webiny/feature/admin";
import type { FolderGqlDto } from "./FolderGqlDto.js";

export interface LoadFolderHierarchyGatewayResponse {
    parents: FolderGqlDto[];
    siblings: FolderGqlDto[];
}

export interface ILoadFolderHierarchyUseCase {
    execute: (id: string) => Promise<void>;
}

export interface ILoadFolderHierarchyRepository {
    execute: (id: string) => Promise<void>;
}

export interface ILoadFolderHierarchyGateway {
    execute: (type: string, id: string) => Promise<LoadFolderHierarchyGatewayResponse>;
}

export const LoadFolderHierarchyUseCase = createAbstraction<ILoadFolderHierarchyUseCase>(
    "LoadFolderHierarchyUseCase"
);

export namespace LoadFolderHierarchyUseCase {
    export type Interface = ILoadFolderHierarchyUseCase;
}

export const LoadFolderHierarchyRepository = createAbstraction<ILoadFolderHierarchyRepository>(
    "LoadFolderHierarchyRepository"
);

export namespace LoadFolderHierarchyRepository {
    export type Interface = ILoadFolderHierarchyRepository;
}

export const LoadFolderHierarchyGateway = createAbstraction<ILoadFolderHierarchyGateway>(
    "LoadFolderHierarchyGateway"
);

export namespace LoadFolderHierarchyGateway {
    export type Interface = ILoadFolderHierarchyGateway;
}
