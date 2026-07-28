import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/routes.js";

/**
 * Static breadcrumb trail for the GraphQL Playground page: `Dev Tools › GraphQL Playground`.
 * The home entry is prepended by the header.
 */
class ApiPlaygroundBreadcrumbImpl implements Breadcrumb.Interface {
    name = "devTools.graphqlPlayground";
    route = Routes.ApiPlayground;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Dev Tools" }, { label: "GraphQL Playground" }];
    }
}

export const ApiPlaygroundBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: ApiPlaygroundBreadcrumbImpl,
    dependencies: []
});
