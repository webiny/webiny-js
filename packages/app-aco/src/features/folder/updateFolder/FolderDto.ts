import { FolderPermission } from "~/types";

export interface FolderDto {
    id: string;
    title: string;
    slug: string;
    permissions: FolderPermission[];
    parentId: string | null;
}
