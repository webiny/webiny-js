import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { SdkPlaygroundBreadcrumb } from "./SdkPlaygroundBreadcrumb.js";

export const SdkPlaygroundBreadcrumbsFeature = createFeature({
    name: "SdkPlaygroundBreadcrumbs",
    register(container: Container) {
        container.register(SdkPlaygroundBreadcrumb);
    }
});
