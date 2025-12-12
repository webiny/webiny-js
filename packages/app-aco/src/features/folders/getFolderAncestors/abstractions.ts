import { createAbstraction } from "@webiny/feature/admin";
import type { FolderPermission } from "@webiny/shared-aco/flp/flp.types.js";

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

export interface IGetFolderAncestorsUseCase {
    execute: (id: string) => FolderDto[];
}

export const GetFolderAncestorsUseCase = createAbstraction<IGetFolderAncestorsUseCase>(
    "GetFolderAncestorsUseCase"
);

export namespace GetFolderAncestorsUseCase {
    export type Interface = IGetFolderAncestorsUseCase;
}

// Repository

export interface IGetFolderAncestorsRepository {
    execute: (id: string) => FolderDto[];
}

export const GetFolderAncestorsRepository = createAbstraction<IGetFolderAncestorsRepository>(
    "GetFolderAncestorsRepository"
);

export namespace GetFolderAncestorsRepository {
    export type Interface = IGetFolderAncestorsRepository;
}
