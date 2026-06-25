export { createRecordsData } from "@webiny/app-admin/components/Table/createTableData.js";

import type { FolderDto } from "~/domain/folder/FolderDto.js";
import type { FolderTableRow } from "~/table.types.js";

export const createFoldersData = (items: FolderDto[]): FolderTableRow[] => {
    return items.map(item => ({
        id: item.id,
        $type: "FOLDER",
        $selectable: false,
        data: item
    }));
};

export interface FolderSortConfig {
    field: string;
    direction: "ASC" | "DESC";
}

const FOLDER_SORT_FIELDS: Record<string, (folder: FolderDto) => string> = {
    name: f => f.title,
    title: f => f.title,
    createdOn: f => f.createdOn,
    savedOn: f => f.savedOn,
    modifiedOn: f => f.modifiedOn ?? f.savedOn,
    createdBy: f => f.createdBy.displayName,
    savedBy: f => f.savedBy.displayName,
    modifiedBy: f => (f.modifiedBy ? f.modifiedBy.displayName : f.savedBy.displayName)
};

export function sortFolders(folders: FolderDto[], sort: FolderSortConfig | undefined): FolderDto[] {
    if (!sort || folders.length === 0) {
        return folders;
    }

    const accessor = FOLDER_SORT_FIELDS[sort.field];
    if (!accessor) {
        return folders;
    }

    const desc = sort.direction === "DESC";

    return folders.slice().sort((a, b) => {
        const cmp = accessor(a).localeCompare(accessor(b));
        return desc ? -cmp : cmp;
    });
}
