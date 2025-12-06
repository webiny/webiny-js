import { createAbstraction } from "@webiny/feature/admin";
import type { Folder } from "~/domain/folder/Folder.js";
import type { CmsIdentity, FolderPermission } from "~/types.js";

// Use Case

export interface CreateFolderParams {
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    permissions: FolderPermission[];
    extensions?: Record<string, any>;
}

export interface ICreateFolderUseCase {
    execute: (params: CreateFolderParams) => Promise<void>;
}

export const CreateFolderUseCase = createAbstraction<ICreateFolderUseCase>("CreateFolderUseCase");

export namespace CreateFolderUseCase {
    export type Interface = ICreateFolderUseCase;
    export type Params = CreateFolderParams;
}

// Repository

export interface ICreateFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}

export const CreateFolderRepository =
    createAbstraction<ICreateFolderRepository>("CreateFolderRepository");

export namespace CreateFolderRepository {
    export type Interface = ICreateFolderRepository;
}

// Gateway
export interface FolderGatewayOutputDto {
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
    path: string;
    createdBy: CmsIdentity;
    createdOn: string;
    savedBy: CmsIdentity;
    savedOn: string;
    modifiedBy: CmsIdentity | null;
    modifiedOn: string | null;
    extensions: Record<string, any>;
}

export interface ICreateFolderGateway {
    execute: (folderDto: FolderDto) => Promise<FolderGatewayOutputDto>;
}

export const CreateFolderGateway = createAbstraction<ICreateFolderGateway>("CreateFolderGateway");
export namespace CreateFolderGateway {
    export type Interface = ICreateFolderGateway;
}

export interface FolderDto {
    title: string;
    slug: string;
    permissions: FolderPermission[];
    type: string;
    parentId: string | null;
    extensions: Record<string, any>;
}
