import type { PageDto } from "~/domain/Page/index.js";
import type { FolderTableRow, RecordTableRow } from "@webiny/app-aco/table.types.js";
import type {
    CmsContentEntryLive,
    CmsContentEntrySystem
} from "@webiny/app-headless-cms-common/types/index.js";

export interface WbIdentity {
    id: string;
    displayName: string;
    type: string;
}

export interface WbSystem extends CmsContentEntrySystem {
    //
}

export type WbLive = CmsContentEntryLive;

export interface WbLocation {
    folderId: string;
}

export interface WbError {
    code: string;
    message: string;
    data?: Record<string, any> | null;
    stack?: string;
}

export interface WbListMeta {
    cursor: string | null;
    totalCount: number;
    hasMoreItems: boolean;
}

export type TableItem = FolderTableRow | RecordTableRow<PageDto>;
