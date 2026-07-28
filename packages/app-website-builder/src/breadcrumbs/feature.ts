import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { PagesBreadcrumb } from "./PagesBreadcrumb.js";
import { RedirectsBreadcrumb } from "./RedirectsBreadcrumb.js";

export const WebsiteBuilderBreadcrumbsFeature = createFeature({
    name: "WebsiteBuilderBreadcrumbs",
    register(container: Container) {
        container.register(PagesBreadcrumb);
        container.register(RedirectsBreadcrumb);
    }
});
