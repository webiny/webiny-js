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
import { WbPageCrud } from "~/context/pages/pages.types";
import { WbRedirectCrud } from "~/context/redirects/redirects.types";

export interface WbLocation {
    folderId: string;
}

export type WbIdentity = CmsIdentity;

export interface WebsiteBuilderContextObject {
    pages: WbPageCrud;
    redirects: WbRedirectCrud;
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

export interface WebsiteBuilderConfig<TStorageOperations> {
    storageOperations: TStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    getPermissions: GetPermissions;
}
