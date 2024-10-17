import { FolderPermission } from "~/types";

export interface CreateFolderParams {
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    permissions: FolderPermission[];
}

export interface ICreateFolderUseCase {
    execute: (params: CreateFolderParams) => Promise<void>;
}
