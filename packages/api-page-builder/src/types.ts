export * from "./graphql/types";

// DB types.
export enum TYPE {
    PAGE = "pb.page",
    PAGE_LATEST = "pb.page.l",
    PAGE_PUBLISHED = "pb.page.p",
    PAGE_PUBLISHED_PATH = "pb.page.p.path"
}

// Entities.
export interface PageElement {
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
}

export interface Menu {
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
    /**
     * Added with storage operations.
     * TODO: add via upgrade script.
     */
    tenant: string;
    locale: string;
}

export interface Category {
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
    /**
     * Added with storage operations.
     * TODO: add via upgrade script.
     */
    tenant: string;
    locale: string;
}

export type PageStatus =
    | "published"
    | "unpublished"
    | "reviewRequested"
    | "changesRequested"
    | "draft";
export type PageSpecialType = "home" | "notFound";

export interface Page {
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
}

export interface File {
    id: string;
    src: string;
}

export interface DefaultSettings {
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
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsGetParams {
    where: {
        tenant: string;
        locale: string;
        slug: string;
    };
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsListParams {
    where: {
        tenant: string;
        locale: string;
        createdBy?: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsCreateParams {
    input: Record<string, any>;
    category: Category;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: Category;
    category: Category;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperationsDeleteParams {
    category: Category;
}

/**
 * @category StorageOperations
 * @category CategoryStorageOperations
 */
export interface CategoryStorageOperations {
    /**
     * Get the category by given slug.
     */
    get(params: CategoryStorageOperationsGetParams): Promise<Category | null>;
    /**
     * List all the categories.
     */
    list(params: CategoryStorageOperationsListParams): Promise<Category[]>;
    create(params: CategoryStorageOperationsCreateParams): Promise<Category>;
    update(params: CategoryStorageOperationsUpdateParams): Promise<Category>;
    delete(params: CategoryStorageOperationsDeleteParams): Promise<Category>;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsGetParams {
    where: {
        slug: string;
        tenant: string;
        locale: string;
    };
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsListParams {
    where: {
        tenant: string;
        locale: string;
        createdBy?: string;
    };
    sort?: string[];
    limit?: number;
    after?: string | null;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsCreateParams {
    input: Record<string, any>;
    menu: Menu;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsUpdateParams {
    input: Record<string, any>;
    original: Menu;
    menu: Menu;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperationsDeleteParams {
    menu: Menu;
}

/**
 * @category StorageOperations
 * @category MenuStorageOperations
 */
export interface MenuStorageOperations {
    /**
     * Get a single menu item by given params.
     */
    get(params: MenuStorageOperationsGetParams): Promise<Menu>;
    /**
     * Get all menu items by given params.
     */
    list(params: MenuStorageOperationsListParams): Promise<Menu[]>;
    create(params: MenuStorageOperationsCreateParams): Promise<Menu>;
    update(params: MenuStorageOperationsUpdateParams): Promise<Menu>;
    delete(params: MenuStorageOperationsDeleteParams): Promise<Menu>;
}
