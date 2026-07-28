import { createFeature } from "@webiny/feature/admin";
import { Container } from "@webiny/di";
import { ContentReviewsBreadcrumb } from "./ContentReviewsBreadcrumb.js";
import { WorkflowsBreadcrumb } from "./WorkflowsBreadcrumb.js";

export const WebsiteBuilderWorkflowsBreadcrumbsFeature = createFeature({
    name: "WebsiteBuilderWorkflowsBreadcrumbs",
    register(container: Container) {
        container.register(ContentReviewsBreadcrumb);
        container.register(WorkflowsBreadcrumb);
    }
});
