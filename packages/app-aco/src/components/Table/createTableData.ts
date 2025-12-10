import type { FolderDto } from "~/domain/folder/FolderDto.js";
import type { FolderTableRow, RecordTableRow } from "~/table.types.js";

export const createRecordsData = <T extends { id: string; $selectable?: boolean }>(
    items: T[]
): RecordTableRow<T>[] => {
    console.log({
        items
    });
    return items.map(item => ({
        id: item.id,
        $type: "RECORD",
        $selectable: item.$selectable !== undefined ? item.$selectable : true,
        data: item
    }));
};

export const createFoldersData = (items: FolderDto[]): FolderTableRow[] => {
    return items.map(item => ({
        id: item.id,
        $type: "FOLDER",
        $selectable: false,
        data: item
    }));
};
