import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { ContentEntriesBreadcrumb } from "./ContentEntriesBreadcrumb.js";

export const CmsBreadcrumbsFeature = createFeature({
    name: "CmsBreadcrumbs",
    register(container: Container) {
        container.register(ContentEntriesBreadcrumb);
    }
});
