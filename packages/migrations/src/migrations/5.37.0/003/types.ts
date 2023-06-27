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
    publishedOn?: string;
    version: number;
    locked: boolean;
    status: CmsEntryStatus;
    values: T;
    meta?: {
        [key: string]: any;
    };
}

export interface PageSettings {
    social?: {
        title: string;
        description: string;
        image: File;
        meta: Array<{ property: string; content: string }>;
    };
    seo?: {
        title: string;
        description: string;
        meta: Array<{ name: string; content: string }>;
    };
    general?: {
        tags?: string[];
        snippet?: string;
        layout?: string;
        image?: File;
    };
    [key: string]: any;
}

export type PageStatus = "published" | "unpublished" | "draft";

export interface Page {
    id: string;
    pid: string;
    locale: string;
    tenant: string;
    title: string;
    editor: string;
    createdFrom: string | null;
    path: string;
    category: string;
    content: Record<string, any> | null;
    publishedOn: string | null;
    version: number;
    settings: PageSettings;
    locked: boolean;
    status: string;
    createdOn: string;
    savedOn: string;
    createdBy: Identity;
    ownedBy: Identity;
    webinyVersion: string;
}

interface BaseAcoSearchRecord {
    id: string;
    locale: string;
    tenant: string;
    entryId: string;
    modelId: string;
    webinyVersion: string;
}

export interface AcoSearchRecord extends BaseAcoSearchRecord {
    values: AcoSearchRecordValues;
}

interface AcoSearchRecordValues {
    ["text@title"]: string;
    ["text@content"]: string;
    ["text@type"]: string;
    ["text@tags"]?: string[];
    ["object@data"]: {
        ["text@id"]: string;
        ["text@pid"]: string;
        ["text@title"]: string;
        ["text@status"]: string;
        ["object@createdBy"]: {
            ["text@id"]: string;
            ["text@displayName"]: string | null;
            ["text@type"]: string;
        };
        ["datetime@createdOn"]: string;
        ["datetime@savedOn"]: string;
        ["boolean@locked"]: boolean;
        ["text@path"]: string;
        ["number@version"]: number;
    };
    ["object@location"]?: {
        ["text@folderId"]?: string;
    };
}

interface ExistingAcoSearchRecordValues extends Omit<AcoSearchRecordValues, "object@data"> {
    ["wby-aco-json@data"]: {
        id: string;
        pid: string;
        title: string;
        status: string;
        createdBy: Identity;
        createdOn: string;
        savedOn: string;
        locked: boolean;
        path: string;
        version: number;
    };
}
/**
 * Existing ACO Search Record has values data in a custom json field.
 * We removed that field in 5.37.0, so we need to remap the data.
 */
export interface ExistingAcoSearchRecord extends BaseAcoSearchRecord {
    values: ExistingAcoSearchRecordValues;
}

export interface ListLocalesParams {
    tenant: Tenant;
}
