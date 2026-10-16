import { createFeature } from "@webiny/feature/admin";
import { WbReviewGetPageFieldSelection } from "./WbReviewGetPageFieldSelection.js";

export const PageGetWorkflowsFeature = createFeature({
    name: "PageGetWorkflows",
    register(container) {
        container.register(WbReviewGetPageFieldSelection);
    }
});
