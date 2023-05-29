import { CmsContentEntry, CmsContentEntryStatusType } from "~/types";
import { FolderItem } from "@webiny/app-aco/types";

interface BaseEntry {
    id: string;
    title: string;
    description?: string;
    image?: string;
    createdBy: string;
    savedOn: string;
    version?: number;
    selectable: boolean;
}

export interface RecordEntry extends BaseEntry {
    type: "RECORD";
    original: CmsContentEntry;
    status: CmsContentEntryStatusType;
}

export interface FolderEntry extends BaseEntry {
    type: "FOLDER";
    original: FolderItem;
    status?: never;
}

export type Entry = RecordEntry | FolderEntry;
