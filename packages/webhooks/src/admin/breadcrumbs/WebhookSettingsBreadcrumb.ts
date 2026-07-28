import { createImplementation } from "@webiny/di";
import { Breadcrumb } from "@webiny/app-admin";
import type { BreadcrumbTrailItem } from "@webiny/app-admin";
import { Routes } from "~/admin/routes.js";

/**
 * Static breadcrumb trail for the webhook settings page: `Webhooks › Settings`. The home
 * entry is prepended by the header.
 */
class WebhookSettingsBreadcrumbImpl implements Breadcrumb.Interface {
    name = "webhooks.settings";
    route = Routes.Settings;

    getTrail(): BreadcrumbTrailItem[] {
        return [{ label: "Webhooks", to: { route: Routes.List } }, { label: "Settings" }];
    }
}

export const WebhookSettingsBreadcrumb = createImplementation({
    abstraction: Breadcrumb,
    implementation: WebhookSettingsBreadcrumbImpl,
    dependencies: []
});
