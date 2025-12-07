import { createAbstraction } from "@webiny/feature/admin";
import type { FolderGqlDto } from "./FolderGqlDto.js";

export interface IListFoldersByParentIdsUseCase {
    execute: (parentIds?: string[]) => Promise<void>;
}

export interface IListFoldersByParentIdsRepository {
    execute: (parentIds: string[]) => Promise<void>;
}

export interface IListFoldersByParentIdsGateway {
    execute: (type: string, parentIds: string[]) => Promise<FolderGqlDto[]>;
}

export const ListFoldersByParentIdsUseCase = createAbstraction<IListFoldersByParentIdsUseCase>(
    "ListFoldersByParentIdsUseCase"
);

export namespace ListFoldersByParentIdsUseCase {
    export type Interface = IListFoldersByParentIdsUseCase;
}

export const ListFoldersByParentIdsRepository = createAbstraction<IListFoldersByParentIdsRepository>(
    "ListFoldersByParentIdsRepository"
);

export namespace ListFoldersByParentIdsRepository {
    export type Interface = IListFoldersByParentIdsRepository;
}

export const ListFoldersByParentIdsGateway = createAbstraction<IListFoldersByParentIdsGateway>(
    "ListFoldersByParentIdsGateway"
);

export namespace ListFoldersByParentIdsGateway {
    export type Interface = IListFoldersByParentIdsGateway;
}
