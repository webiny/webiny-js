export * from "./graphql/types";

// DB types.
export enum TYPE {
    PAGE = "pb.page",
    PAGE_LATEST = "pb.page.l",
    PAGE_PUBLISHED = "pb.page.p",
    PAGE_PUBLISHED_PATH = "pb.page.p.path"
}

// Represents a database entry that contains information (exact page ID) about the latest revision of a page.
export type DbPageLatest = {
    PK: string;
    SK: string;
    TYPE: TYPE.PAGE_LATEST;
    locale: string;
    tenant: string;
    id: string;
};

// Represents a database entry that contains information (exact page ID) about the published revision of a page.
// It also contains the path with which the page was published. This entry is used to query published pages by ID.
// Note that if this entry exists, the `DbPagePublishedPath` entry also exists and that the `id` and `path` fields
// on these two database entries are always in sync.
export type DbPagePublished = {
    PK: string;
    SK: string;
    TYPE: TYPE.PAGE_PUBLISHED;
    locale: string;
    tenant: string;
    id: string;
    path: string;
};

// Represents a database entry that contains information (exact page URL path) about the published revision of a page.
// It also contains the ID with which the page was published. This entry is used to query published pages by path.
// Note that if this entry exists, the `DbPagePublished` entry also exists and that the `id` and `path` fields
// on these two database entries are always in sync.
export type DbPagePublishedPath = {
    PK: string;
    SK: string;
    TYPE: TYPE.PAGE_PUBLISHED_PATH;
    locale: string;
    tenant: string;
    path: string;
    id: string;
};

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
export type PageSpecialType = "home" | "error" | "notFound";

export type Page = {
    id: string;
    pid: string;
    title: string;
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
    home: boolean;
    error: boolean;
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
        error: string;
    };
};

export type InstallSettings = {
    installed: boolean;
};
