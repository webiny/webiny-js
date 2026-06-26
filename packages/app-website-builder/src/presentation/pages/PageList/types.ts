import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco";
import type { PageDto } from "~/domain/Page/index.js";

export type TableRow = FolderTableRow | RecordTableRow<PageDto>;
