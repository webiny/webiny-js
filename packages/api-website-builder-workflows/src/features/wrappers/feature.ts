import { createFeature } from "@webiny/feature/api";
import { WbPageReviewGuardService } from "./WbPageReviewGuardService/WbPageReviewGuardService.js";
import { StoreWebsiteBuilderPageWorkflowFeature } from "./StoreWebsiteBuilderPageWorkflow/feature.js";
import { DeleteWebsiteBuilderPageWorkflowFeature } from "./DeleteWebsiteBuilderPageWorkflow/feature.js";
import { ListWebsiteBuilderPageWorkflowsFeature } from "./ListWebsiteBuilderPageWorkflows/feature.js";
import { GetWebsiteBuilderPageWorkflowFeature } from "./GetWebsiteBuilderPageWorkflow/feature.js";
import { RequestWebsiteBuilderPageReviewFeature } from "./RequestWebsiteBuilderPageReview/feature.js";
import { GetWebsiteBuilderPageReviewFeature } from "./GetWebsiteBuilderPageReview/feature.js";
import { GetWebsiteBuilderPageTargetReviewFeature } from "./GetWebsiteBuilderPageTargetReview/feature.js";
import { ListWebsiteBuilderPageReviewsFeature } from "./ListWebsiteBuilderPageReviews/feature.js";
import { StartWebsiteBuilderPageReviewStepFeature } from "./StartWebsiteBuilderPageReviewStep/feature.js";
import { TakeOverWebsiteBuilderPageReviewStepFeature } from "./TakeOverWebsiteBuilderPageReviewStep/feature.js";
import { ApproveWebsiteBuilderPageReviewStepFeature } from "./ApproveWebsiteBuilderPageReviewStep/feature.js";
import { RejectWebsiteBuilderPageReviewStepFeature } from "./RejectWebsiteBuilderPageReviewStep/feature.js";
import { CancelWebsiteBuilderPageReviewFeature } from "./CancelWebsiteBuilderPageReview/feature.js";
import { CancelWebsiteBuilderPageReviewsForDeleteFeature } from "./CancelWebsiteBuilderPageReviewsForDelete/feature.js";

/**
 * The Website Builder wrapper use cases (D132, D133, R45): identity, `workflows` permission and page
 * access, then the internal api-workflows use case. `WebsiteBuilderWorkflowsSchemaFactory` puts
 * them on the `websiteBuilder` root of `/graphql` (D136, R88).
 */
export const WbWrappersFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Wrappers",
    register(container) {
        container.register(WbPageReviewGuardService);

        // Workflows
        StoreWebsiteBuilderPageWorkflowFeature.register(container);
        DeleteWebsiteBuilderPageWorkflowFeature.register(container);
        ListWebsiteBuilderPageWorkflowsFeature.register(container);
        GetWebsiteBuilderPageWorkflowFeature.register(container);

        // Reviews
        RequestWebsiteBuilderPageReviewFeature.register(container);
        GetWebsiteBuilderPageReviewFeature.register(container);
        GetWebsiteBuilderPageTargetReviewFeature.register(container);
        ListWebsiteBuilderPageReviewsFeature.register(container);
        StartWebsiteBuilderPageReviewStepFeature.register(container);
        TakeOverWebsiteBuilderPageReviewStepFeature.register(container);
        ApproveWebsiteBuilderPageReviewStepFeature.register(container);
        RejectWebsiteBuilderPageReviewStepFeature.register(container);
        CancelWebsiteBuilderPageReviewFeature.register(container);

        // Confirm path for trash and delete with a review in progress (D134)
        CancelWebsiteBuilderPageReviewsForDeleteFeature.register(container);
    }
});
