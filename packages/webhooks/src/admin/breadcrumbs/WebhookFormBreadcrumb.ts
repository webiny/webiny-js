import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the webhook edit form: `Webhooks › Webhook`. The home entry is
 * prepended by the header.
 */
class WebhookFormBreadcrumbImpl implements Breadcrumb.Interface {
    name = "webhooks.form";
    route = Routes.Form;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Webhooks", to: { route: Routes.List } }, { label: "Webhook" }];
    }
}

export const WebhookFormBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: WebhookFormBreadcrumbImpl,
    dependencies: []
});
