import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { UsersBreadcrumb } from "./UsersBreadcrumb.js";
import { AccountBreadcrumb } from "./AccountBreadcrumb.js";

export const CognitoBreadcrumbsFeature = createFeature({
    name: "CognitoBreadcrumbs",
    register(container: Container) {
        container.register(UsersBreadcrumb);
        container.register(AccountBreadcrumb);
    }
});
