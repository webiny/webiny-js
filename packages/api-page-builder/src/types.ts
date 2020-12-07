import { Plugin } from "@webiny/plugins/types";
import { Context } from "@webiny/handler/types";
import { I18NContentContext } from "@webiny/api-i18n-content/types";
import { DbContext } from "@webiny/handler-db/types";
import { SecurityContext, SecurityPermission } from "@webiny/api-security/types";
import { TenancyContext } from "@webiny/api-security-tenancy/types";
import { I18NContext } from "@webiny/api-i18n/types";

// Entities.
export type File = {
    id: string;
    src: string;
};

export type Settings = {
    name: string;
    domain: string;
    favicon: File;
    logo: File;
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

// TODO
export type Page = Record<string, any>;
export type PageElement = Record<string, any>;
export type Menu = Record<string, any>;
export type Category = Record<string, any>;

// CRUD types.
export type SortOrder = "asc" | "desc";
export type ListPagesArgs = {
    limit?: number;
    page?: number;
    where?: { category?: string; status?: string };
    sort?: { createdOn?: SortOrder; title?: SortOrder };
};

export type ListMeta = {
    page: number;
    limit: number;
    totalCount: number;
    totalPages?: number;
    from?: number;
    to?: number;
    nextPage?: number;
    previousPage?: number;
};

export type PagesCrud = {
    get(id: string): Promise<Page>;
    listLatest(args: ListPagesArgs): Promise<[Page[], ListMeta]>;
    listPublished(args: ListPagesArgs): Promise<[Page[], ListMeta]>;
    getPublished(args: { id?: string; url?: string }): Promise<Page>;
    listPageRevisions(id: string): Promise<Page[]>;
    create(category: string): Promise<Page>;
    createFrom(page: string): Promise<Page>;
    update(id: string, data: Record<string, any>): Promise<Page>;
    delete(id: string): Promise<[Page, Page]>;
    publish(id: string): Promise<Page>;
    unpublish(id: string): Promise<Page>;
    requestReview(id: string): Promise<Page>;
    requestChanges(id: string): Promise<Page>;
    setAsHomepage(id: string): Promise<Page>;
};

export type PageElementsCrud = {
    get(id: string): Promise<Category>;
    list(): Promise<Category[]>;
    create(data: Record<string, any>): Promise<Category>;
    update(id: string, data: Record<string, any>): Promise<Category>;
    delete(id: string): Promise<Category>;
};

export type CategoriesCrud = {
    get(slug: string): Promise<Category>;
    list(): Promise<Category[]>;
    create(data: Record<string, any>): Promise<Category>;
    update(slug: string, data: Record<string, any>): Promise<Category>;
    delete(slug: string): Promise<Category>;
};

export type MenusCrud = {
    get(slug: string): Promise<Category>;
    list(): Promise<Category[]>;
    create(data: Record<string, any>): Promise<Category>;
    update(slug: string, data: Record<string, any>): Promise<Category>;
    delete(slug: string): Promise<Category>;
};

export type SettingsCrud = {
    get: () => Promise<Settings>;
    update: (data: Record<string, any>) => Promise<Settings>;
    getSettingsCacheKey: () => string;
};

export type PbContext = Context<
    I18NContentContext,
    I18NContext,
    DbContext,
    SecurityContext,
    TenancyContext,
    {
        pageBuilder: Record<string, any> & {
            pages: PagesCrud;
            pageElements: PageElementsCrud;
            categories: CategoriesCrud;
            menus: MenusCrud;
            settings: SettingsCrud;
        };
    }
>;

// Permissions.
export type PbSecurityPermission<TName, TExtraProps = {}> = SecurityPermission<{
    name: TName;

    // Can user operate only on content he created?
    own?: boolean;

    // Determines which of the following actions are allowed:
    // "r" - read
    // "w" - write
    // "d" - delete
    rwd?: string;
}> &
    TExtraProps;

export type MenuSecurityPermission = PbSecurityPermission<"pb.menu">;
export type CategorySecurityPermission = PbSecurityPermission<"pb.category">;
export type PageElementSecurityPermission = PbSecurityPermission<"pb.pageElement">;

export type PageSecurityPermission = PbSecurityPermission<
    "pb.page",
    {
        // Determines which of the following actions are allowed:
        // "r" - request review (for unpublished page)
        // "c" - request change (for unpublished page on which a review was requested)
        // "p" - publish
        // "u" - unpublish
        rcpu: string;
    }
>;

// Plugins.
export type InstallPlugin = Plugin<{
    name: "pb-install";
    before: (params: { context: Context; data: any }) => void;
    after: (params: { context: Context; data: any }) => void;
}>;

// Installer plugin.
export type PageHookPlugin = Plugin<{
    type: "pb-page-hook";
    beforeDelete?: (page: Page) => void | Promise<void>;
    afterDelete?: (page: Page) => void | Promise<void>;
    beforePublish?: (page: Page) => void | Promise<void>;
    afterPublish?: (page: Page) => void | Promise<void>;
    beforeUnpublish?: (page: Page) => void | Promise<void>;
    afterUnpublish?: (page: Page) => void | Promise<void>;
}>;
