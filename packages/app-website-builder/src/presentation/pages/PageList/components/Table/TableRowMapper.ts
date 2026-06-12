import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import type { FolderDto } from "@webiny/app-aco/domain/folder/FolderDto.js";
import { type Page, PageDtoMapper, type PageDto } from "~/domain/Page/index.js";

export type PageTableRow = RecordTableRow<PageDto>;
export type TableRow = FolderTableRow | PageTableRow;

export class TableRowMapper {
    static fromPage(page: Page): TableRow {
        return {
            id: page.entryId,
            $type: "RECORD",
            $selectable: true,
            data: PageDtoMapper.toDTO(page)
        };
    }

    static fromFolder(folder: FolderDto): TableRow {
        return {
            id: folder.id,
            $type: "FOLDER",
            $selectable: false,
            data: folder
        };
    }
}
