import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { ContentReviewsBreadcrumb } from "./ContentReviewsBreadcrumb.js";

export const WorkflowsBreadcrumbsFeature = createFeature({
    name: "WorkflowsBreadcrumbs",
    register(container: Container) {
        container.register(ContentReviewsBreadcrumb);
    }
});
