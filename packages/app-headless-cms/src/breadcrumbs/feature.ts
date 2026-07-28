import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { ContentEntriesBreadcrumb } from "./ContentEntriesBreadcrumb.js";
import { ContentModelsBreadcrumb } from "./ContentModelsBreadcrumb.js";
import { ContentModelGroupsBreadcrumb } from "./ContentModelGroupsBreadcrumb.js";

export const CmsBreadcrumbsFeature = createFeature({
    name: "CmsBreadcrumbs",
    register(container: Container) {
        container.register(ContentEntriesBreadcrumb);
        container.register(ContentModelsBreadcrumb);
        container.register(ContentModelGroupsBreadcrumb);
    }
});
