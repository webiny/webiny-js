import { FolderPermission } from "~/types";

export interface UpdateFolderParams {
    id: string;
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    permissions: FolderPermission[];
}

export interface IUpdateFolderUseCase {
    execute: (params: UpdateFolderParams) => Promise<void>;
}
