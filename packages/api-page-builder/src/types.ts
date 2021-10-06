export * from "./graphql/types";

// DB types.
export enum TYPE {
    PAGE = "pb.page",
    PAGE_LATEST = "pb.page.l",
    PAGE_PUBLISHED = "pb.page.p",
    PAGE_PUBLISHED_PATH = "pb.page.p.path"
}

// Entities.
export type PageElement = {
    name: string;
    type: "element" | "block";
    category: string;
    content: File;
    preview: File;
    createdOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

export type Menu = {
    title: string;
    slug: string;
    description: string;
    items: Record<string, any>;
    createdOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

export type Category = {
    name: string;
    slug: string;
    url: string;
    layout: string;
    createdOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

export type PageStatus =
    | "published"
    | "unpublished"
    | "reviewRequested"
    | "changesRequested"
    | "draft";
export type PageSpecialType = "home" | "notFound";

export type Page = {
    id: string;
    pid: string;
    locale: string;
    tenant: string;
    title: string;
    editor: string;
    createdFrom: string;
    path: string;
    category: string;
    content: Record<string, any>;
    publishedOn: string;
    version: number;
    settings?: {
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
            tags: string[];
            snippet: string;
            layout: string;
            image: File;
        };
    };
    locked: boolean;
    status: PageStatus;
    visibility: {
        list: { latest: boolean; published: boolean };
        get: { latest: boolean; published: boolean };
    };
    home: boolean;
    notFound: boolean;
    createdOn: string;
    savedOn: string;
    createdBy: {
        type: string;
        id: string;
        displayName: string;
    };
    ownedBy: {
        type: string;
        id: string;
        displayName: string;
    };
};

export type File = {
    id: string;
    src: string;
};

export type DefaultSettings = {
    name: string;
    websiteUrl: string;
    websitePreviewUrl: string;
    favicon: File;
    logo: File;
    prerendering: {
        app: {
            url: string;
        };
        storage: {
            name: string;
        };
        meta: Record<string, any>;
    };
    social: {
        facebook: string;
        twitter: string;
        instagram: string;
        image: File;
    };
    pages: {
        home: string;
        notFound: string;
    };
};
