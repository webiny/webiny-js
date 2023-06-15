import { Identity, Page } from "~/migrations/5.35.0/006/types";

export interface OriginalDynamoDbPageRecord {
    PK: string;
    SK: string;
    TYPE: string;
    category: "static" | string;
    content: {
        compression: "jsonpack";
        content: string;
    };
    createdBy: Identity;
    createdOn: string;
    editor: "page-builder" | string;
    id: string;
    locale: string;
    locked: boolean;
    ownedBy: Identity;
    path: string;
    pid: string;
    publishedOn: string | null;
    savedOn: string;
    settings: {
        general: {
            image?: string | null;
            layout: "static";
            snippet?: string | null;
            tags: string[];
        };
        seo: {
            description?: string | null;
            meta: any[];
            title: null;
        };
        social: {
            description?: string | null;
            image?: string | null;
            meta: any[];
            title?: string | null;
        };
    };
    status: string;
    tenant: string;
    title: string;
    titleLC: string;
    version: number;
    webinyVersion: string;
    _ct: string;
    _et: string;
    _md: string;
}

export interface OriginalDynamoElasticsearchDbPageRecord {
    PK: string;
    SK: string;
    index: string;
    _ct: string;
    _md: string;
    _et: string;
    data: Page & {
        __type: string;
        latest: boolean;
        titleLC: string;
        tags: string[];
        snippet: null;
        images: null;
    };
}

export interface OriginalElasticsearchPageRecord extends Page {
    __type: string;
    latest: boolean;
    titleLC: string;
    tags: string[];
    snippet: null;
    images: null;
}
