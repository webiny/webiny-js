import { createAbstraction } from "@webiny/feature/admin";
import type { Folder } from "~/domain/folder/Folder.js";
import type { FolderDto } from "~/domain/folder/FolderDto.js";
import type { FolderPermission } from "~/types.js";

export interface FolderGatewayDto {
    id: string;
    title: string;
    slug: string;
    permissions: FolderPermission[];
    parentId: string | null;
    extensions: Record<string, any>;
}

export interface UpdateFolderParams {
    id: string;
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    permissions: FolderPermission[];
    extensions?: Record<string, any>;
}

export interface IUpdateFolderUseCase {
    execute: (params: UpdateFolderParams) => Promise<void>;
}

export interface IUpdateFolderRepository {
    execute: (folder: Folder) => Promise<void>;
}

export interface IUpdateFolderGateway {
    execute: (folder: FolderGatewayDto) => Promise<FolderDto>;
}

export const UpdateFolderUseCase = createAbstraction<IUpdateFolderUseCase>("UpdateFolderUseCase");

export namespace UpdateFolderUseCase {
    export type Interface = IUpdateFolderUseCase;
    export type Params = UpdateFolderParams;
}

export const UpdateFolderRepository =
    createAbstraction<IUpdateFolderRepository>("UpdateFolderRepository");

export namespace UpdateFolderRepository {
    export type Interface = IUpdateFolderRepository;
}

export const UpdateFolderGateway = createAbstraction<IUpdateFolderGateway>("UpdateFolderGateway");

export namespace UpdateFolderGateway {
    export type Interface = IUpdateFolderGateway;
}
