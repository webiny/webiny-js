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
    settings: Record<string, any>;
    locked: boolean;
    status: string;
    createdOn: string;
    savedOn: string;
    createdBy: Identity;
    ownedBy: Identity;
    webinyVersion: string;
}

export interface ListLocalesParams {
    tenant: Tenant;
}
