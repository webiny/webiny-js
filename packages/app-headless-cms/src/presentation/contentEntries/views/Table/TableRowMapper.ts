import { CmsContentEntry } from "~/types.js";
import { TableRowMapper as Abstraction } from "./abstractions.js";
import type { IEntryTableRow, IFolderTableRow } from "./abstractions.js";
import type { FolderDto } from "@webiny/app-aco";

class TableRowMapperImpl implements Abstraction.Interface {
    fromEntry(entry: CmsContentEntry): IEntryTableRow {
        return {
            id: entry.id,
            $type: "RECORD",
            $selectable: true,
            data: entry
        };
    }
}

export const TableRowMapper = Abstraction.createImplementation({
    implementation: TableRowMapperImpl,
    dependencies: []
});

export function folderToTableRow(folder: FolderDto): IFolderTableRow {
    return {
        id: folder.id,
        $type: "FOLDER",
        $selectable: false,
        data: folder
    };
}
