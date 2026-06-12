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
