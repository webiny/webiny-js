import { createFeature } from "@webiny/feature/admin";
import { WbReviewListPagesFieldSelection } from "./WbReviewListPagesFieldSelection.js";
import { WbReviewTableRowMapperDecorator } from "./WbReviewTableRowMapperDecorator.js";

export const PageListWorkflowsFeature = createFeature({
    name: "PageListWorkflows",
    register(container) {
        container.register(WbReviewListPagesFieldSelection);
        container.registerDecorator(WbReviewTableRowMapperDecorator);
    }
});
