import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "~/presentation/breadcrumbs/index.js";
import type { BreadcrumbTrailItem } from "~/presentation/breadcrumbs/index.js";
import { Routes } from "~/presentation/accessManagement/routes.js";

/**
 * Static breadcrumb trail for the API keys list: `Access Management › API Keys`. The home
 * entry is prepended by the header.
 */
class ApiKeysBreadcrumbImpl implements Breadcrumb.Interface {
    name = "accessManagement.apiKeys";
    route = Routes.ApiKeys.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Access Management" }, { label: "API Keys" }];
    }
}

export const ApiKeysBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ApiKeysBreadcrumbImpl,
    dependencies: []
});
