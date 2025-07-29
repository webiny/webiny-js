import type { FolderPermission } from "@webiny/shared-aco/flp/flp.types.js";

export interface FolderDto {
    id: string;
    title: string;
    slug: string;
    permissions: FolderPermission[];
    type: string;
    parentId: string | null;
}
