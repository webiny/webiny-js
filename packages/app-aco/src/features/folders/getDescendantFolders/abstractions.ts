import { createAbstraction } from "@webiny/feature/admin";
import type { FolderPermission } from "~/types.js";

// DTOs
export interface FolderDto {
    id: string;
    title: string;
    slug: string;
    permissions: FolderPermission[];
    type: string;
    parentId: string | null;
}

// Use Case

export interface IGetDescendantFoldersUseCase {
    execute: (id: string) => FolderDto[];
}

export const GetDescendantFoldersUseCase = createAbstraction<IGetDescendantFoldersUseCase>(
    "GetDescendantFoldersUseCase"
);

export namespace GetDescendantFoldersUseCase {
    export type Interface = IGetDescendantFoldersUseCase;
}

// Repository

export interface IGetDescendantFoldersRepository {
    execute: (id: string) => FolderDto[];
}

export const GetDescendantFoldersRepository = createAbstraction<IGetDescendantFoldersRepository>(
    "GetDescendantFoldersRepository"
);

export namespace GetDescendantFoldersRepository {
    export type Interface = IGetDescendantFoldersRepository;
}
