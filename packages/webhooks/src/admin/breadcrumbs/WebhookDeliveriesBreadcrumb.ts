import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the webhook deliveries log: `Webhooks › Delivery Log`. The home
 * entry is prepended by the header.
 */
class WebhookDeliveriesBreadcrumbImpl implements Breadcrumb.Interface {
    name = "webhooks.deliveries";
    route = Routes.Deliveries;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Webhooks", to: { route: Routes.List } }, { label: "Delivery Log" }];
    }
}

export const WebhookDeliveriesBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: WebhookDeliveriesBreadcrumbImpl,
    dependencies: []
});
