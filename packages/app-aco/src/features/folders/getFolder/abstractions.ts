import { createAbstraction } from "@webiny/feature/admin";
import type { CmsIdentity, FolderPermission } from "~/types.js";

// DTOs
export interface FolderDto {
    id: string;
    title: string;
    slug: string;
    permissions: FolderPermission[];
    hasNonInheritedPermissions: boolean;
    canManagePermissions: boolean;
    canManageStructure: boolean;
    canManageContent: boolean;
    type: string;
    parentId: string | null;
    createdBy: CmsIdentity;
    createdOn: string;
    savedBy: CmsIdentity;
    savedOn: string;
    modifiedBy: CmsIdentity | null;
    modifiedOn: string | null;
}

// Use Case

export interface IGetFolderUseCase {
    execute: (id: string) => Promise<void>;
}

export const GetFolderUseCase = createAbstraction<IGetFolderUseCase>("GetFolderUseCase");

export namespace GetFolderUseCase {
    export type Interface = IGetFolderUseCase;
}

// Repository

export interface IGetFolderRepository {
    execute: (id: string) => Promise<void>;
}

export const GetFolderRepository = createAbstraction<IGetFolderRepository>("GetFolderRepository");

export namespace GetFolderRepository {
    export type Interface = IGetFolderRepository;
}

// Gateway

export interface IGetFolderGateway {
    execute: (id: string) => Promise<FolderDto>;
}

export const GetFolderGateway = createAbstraction<IGetFolderGateway>("GetFolderGateway");

export namespace GetFolderGateway {
    export type Interface = IGetFolderGateway;
}
