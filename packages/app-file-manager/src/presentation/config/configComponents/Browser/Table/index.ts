import type { ColumnConfig } from "./Column.js";
import { Column } from "./Column.js";
import type { ThumbnailConfig } from "./Thumbnail.js";
import { Thumbnail } from "./Thumbnail.js";

export interface TableConfig {
    columns: ColumnConfig[];
    cellThumbnails: ThumbnailConfig[];
}

export const Table = {
    Column,
    Cell: {
        Thumbnail
    }
};
