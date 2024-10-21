import { FolderPermission } from "~/types";

export interface FolderDto {
    title: string;
    slug: string;
    permissions: FolderPermission[];
    type: string;
    parentId: string | null;
}
