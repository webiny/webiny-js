import { CmsIdentity, CmsEntryStatus } from "@webiny/app-headless-cms-common/types";
import { FolderItem } from "@webiny/app-aco/types";

interface BaseEntry {
    id: string;
    title: string;
    description?: string;
    image?: string;
    createdBy: string;
    savedOn: string;
    status?: string;
    version?: number;
    selectable: boolean;
}

export interface RecordEntry extends BaseEntry {
    type: "RECORD";
    original: CmsContentEntryRecord;
}

export interface FolderEntry extends BaseEntry {
    type: "FOLDER";
    original: FolderItem;
}

export type Entry = RecordEntry | FolderEntry;

export interface CmsContentEntryRecord {
    id: string;
    entryId: string;
    modelId: string;
    image?: string;
    createdBy: CmsIdentity;
    createdOn: string;
    savedOn: string;
    status: CmsEntryStatus;
    version: number;
    locked: boolean;
}
