import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import type { Folder } from "@webiny/app-aco/domain/folder/Folder.js";
import { FolderDtoMapper } from "@webiny/app-aco/domain/folder/FolderDtoMapper.js";
import { type Redirect, type RedirectDto, RedirectDtoMapper } from "~/domain/Redirect/index.js";

export type RedirectTableRow = RecordTableRow<RedirectDto>;
export type TableRow = FolderTableRow | RedirectTableRow;
/**
 * This mapper converts a Redirect domain object to data format suitable for rendering with the Table component.
 */
export class TableRowMapper {
    static fromRedirect(redirect: Redirect): TableRow {
        return {
            id: redirect.id,
            $type: "RECORD",
            $selectable: true,
            data: RedirectDtoMapper.toDTO(redirect)
        };
    }

    static fromFolder(folder: Folder): TableRow {
        return {
            id: folder.id,
            $type: "FOLDER",
            $selectable: false,
            data: FolderDtoMapper.toDTO(folder)
        };
    }
}
