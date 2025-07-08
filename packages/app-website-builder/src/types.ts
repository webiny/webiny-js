import type { PageDto } from "~/features/pages/index.js";
import type { FolderTableItem, RecordTableItem } from "@webiny/app-aco/table.types.js";

export interface WbIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface WbLocation {
    folderId: string;
}

export interface WbError {
    code: string;
    message: string;
    data?: Record<string, any> | null;
}

export interface WbListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export type EntryTableItem = PageDto & RecordTableItem;

export type TableItem = FolderTableItem | EntryTableItem;
