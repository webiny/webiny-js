export interface Tenant {
    data: {
        id: string;
        name: string;
    };
}

export interface I18NLocale {
    code: string;
}

export interface Identity {
    id: string;
    displayName: string | null;
    type: string;
}

export interface CmsEntryValues {
    [key: string]: any;
}

export type CmsEntryStatus = "published" | "unpublished" | "draft";

export interface CmsEntry<T = CmsEntryValues> {
    webinyVersion: string;
    tenant: string;
    entryId: string;
    id: string;
    createdBy: Identity;
    ownedBy: Identity;
    modifiedBy?: Identity | null;
    createdOn: string;
    savedOn: string;
    modelId: string;
    locale: string;
    location: {
        folderId: string;
    };
    publishedOn?: string;
    version: number;
    locked: boolean;
    status: CmsEntryStatus;
    values: T;
    meta?: {
        [key: string]: any;
    };
}

export interface FileSearchRecordValues {
    "object@location": {
        "text@folderId": string;
    };
    "text@type": "FmFile";
    "wby-aco-json@data": {
        aliases: string[];
        size: number;
        createdBy: {
            type: string;
            displayName: string;
            id: string;
        };
        meta: {
            private: boolean;
            width?: number;
            height?: number;
        };
        name: string;
        id: string;
        type: string;
        createdOn: string;
        key: string;
    };
    "text@tags": string[];
}

export interface FileEntryValues {
    "object@meta": {
        "boolean@private": boolean;
        "number@width"?: number;
        "number@height"?: number;
    };
    "object@location": {
        "text@folderId": string;
    };
    "text@key": string;
    "text@aliases": string[];
    "number@size": number;
    "text@name": string;
    "text@type": string;
    "text@tags": string[];
}

export interface ListLocalesParams {
    tenant: Tenant;
}

export interface File {
    id: string;
    key: string;
    size: number;
    type: string;
    name: string;
    meta: Record<string, any>;
    tags: string[];
    aliases: string[];
    createdOn: string;
    createdBy: Identity;
    tenant: string;
    locale: string;
    webinyVersion: string;
    /**
     * User can add new fields to the File object so we must allow it in the types.
     */
    [key: string]: any;
}

export interface FileItem {
    data: File;
}
