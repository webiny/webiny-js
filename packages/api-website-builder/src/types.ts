import { TenancyContext } from "@webiny/api-tenancy/types";
import { Context as BaseContext } from "@webiny/handler/types";
import { I18NContext } from "@webiny/api-i18n/types";
import {
    type GetPermissions,
    SecurityContext,
    type SecurityIdentity
} from "@webiny/api-security/types";
import { AdminUsersContext } from "@webiny/api-admin-users/types";
import { CmsContext, type CmsIdentity } from "@webiny/api-headless-cms/types";
import type { WbPageCrud, WbPagesStorageOperations } from "~/page/page.types";

export interface WbLocation {
    folderId: string;
}

export type WbIdentity = CmsIdentity;

export interface WbListMeta {
    hasMoreItems: boolean;
    totalCount: number;
    cursor: string | null;
}

export interface WebsiteBuilderContextObject {
    page: WbPageCrud;
}

export interface WebsiteBuilderContext
    extends BaseContext,
        I18NContext,
        TenancyContext,
        SecurityContext,
        AdminUsersContext,
        CmsContext {
    websiteBuilder: WebsiteBuilderContextObject;
}

export interface WebsiteBuilderStorageOperations {
    pages: WbPagesStorageOperations;
}

export interface WebsiteBuilderConfig {
    storageOperations: WebsiteBuilderStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    getPermissions: GetPermissions;
    WEBINY_VERSION: string;
}
