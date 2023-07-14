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

export interface CmsEntryAcoFolderValues {
    parentId?: string | null;
}
export type CmsEntryAcoFolder = CmsEntry<CmsEntryAcoFolderValues>;

export interface ListLocalesParams {
    tenant: Tenant;
}
