import { FolderPermission } from "~/types";

export interface DeleteFolderParams {
    id: string;
    title: string;
    slug: string;
    type: string;
    parentId: string | null;
    permissions: FolderPermission[];
}

export interface IDeleteFolderUseCase {
    execute: (params: DeleteFolderParams) => Promise<void>;
}
