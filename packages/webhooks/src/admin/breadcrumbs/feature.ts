import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { WebhooksListBreadcrumb } from "./WebhooksListBreadcrumb.js";
import { WebhookDeliveriesBreadcrumb } from "./WebhookDeliveriesBreadcrumb.js";
import { WebhookSettingsBreadcrumb } from "./WebhookSettingsBreadcrumb.js";
import { WebhookFormBreadcrumb } from "./WebhookFormBreadcrumb.js";

export const WebhooksBreadcrumbsFeature = createFeature({
    name: "WebhooksBreadcrumbs",
    register(container: Container) {
        container.register(WebhooksListBreadcrumb);
        container.register(WebhookDeliveriesBreadcrumb);
        container.register(WebhookSettingsBreadcrumb);
        container.register(WebhookFormBreadcrumb);
    }
});
