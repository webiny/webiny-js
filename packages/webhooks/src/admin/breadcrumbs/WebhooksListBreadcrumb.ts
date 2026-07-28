import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the webhooks list: `Webhooks`. The home entry is prepended by
 * the header.
 */
class WebhooksListBreadcrumbImpl implements Breadcrumb.Interface {
    name = "webhooks.list";
    route = Routes.List;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Webhooks" }];
    }
}

export const WebhooksListBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: WebhooksListBreadcrumbImpl,
    dependencies: []
});
