import type { Context as BaseContext } from "@webiny/handler/types.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPageCrud } from "~/context/pages/pages.types.js";
import type { WbRedirectCrud } from "~/context/redirects/redirects.types.js";
import type { Context as TasksContext } from "@webiny/tasks";
import type { ApiCoreContext } from "@webiny/api-core/types/core.js";
import type { GetPermissions, SecurityIdentity } from "@webiny/api-core/types/security.js";

export interface WebsiteBuilderContextObject {
    pages: WbPageCrud;
    redirects: WbRedirectCrud;
}

export interface WebsiteBuilderContext
    extends BaseContext,
        ApiCoreContext,
        CmsContext,
        TasksContext {
    websiteBuilder: WebsiteBuilderContextObject;
}

export interface WebsiteBuilderConfig<TStorageOperations> {
    storageOperations: TStorageOperations;
    getTenantId: () => string;
    getLocaleCode: () => string;
    getIdentity: () => SecurityIdentity;
    getPermissions: GetPermissions;
}
