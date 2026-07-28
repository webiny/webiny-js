import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { ApiPlaygroundBreadcrumb } from "./ApiPlaygroundBreadcrumb.js";

export const ApiPlaygroundBreadcrumbsFeature = createFeature({
    name: "ApiPlaygroundBreadcrumbs",
    register(container: Container) {
        container.register(ApiPlaygroundBreadcrumb);
    }
});
