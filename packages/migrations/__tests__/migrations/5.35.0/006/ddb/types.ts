import { Identity } from "~/migrations/5.35.0/006/types";

export interface OriginalPageRecord {
    PK: string;
    SK: string;
    TYPE: string;
    category: "static";
    content: {
        compression: "jsonpack";
        content: string;
    };
    createdBy: Identity;
    createdOn: string;
    editor: "page-builder";
    id: string;
    locale: string;
    locked: boolean;
    ownedBy: Identity;
    path: string;
    pid: string;
    publishedOn: string;
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
    status: "published" | "draft" | "unpublished";
    tenant: string;
    title: string;
    titleLC: string;
    version: number;
    webinyVersion: "0.0.0";
    _ct: string;
    _et: "PbPages";
    _md: string;
}
