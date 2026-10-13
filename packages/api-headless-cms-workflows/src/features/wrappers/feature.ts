import { createFeature } from "@webiny/feature/api";
import { CmsEntryReviewGuardService } from "./CmsEntryReviewGuardService/CmsEntryReviewGuardService.js";
import { StoreCmsEntryWorkflowFeature } from "./StoreCmsEntryWorkflow/feature.js";
import { DeleteCmsEntryWorkflowFeature } from "./DeleteCmsEntryWorkflow/feature.js";
import { ListCmsEntryWorkflowsFeature } from "./ListCmsEntryWorkflows/feature.js";
import { GetCmsEntryWorkflowFeature } from "./GetCmsEntryWorkflow/feature.js";
import { RequestCmsEntryReviewFeature } from "./RequestCmsEntryReview/feature.js";
import { GetCmsEntryReviewFeature } from "./GetCmsEntryReview/feature.js";
import { GetCmsEntryTargetReviewFeature } from "./GetCmsEntryTargetReview/feature.js";
import { ListCmsEntryReviewsFeature } from "./ListCmsEntryReviews/feature.js";
import { StartCmsEntryReviewStepFeature } from "./StartCmsEntryReviewStep/feature.js";
import { TakeOverCmsEntryReviewStepFeature } from "./TakeOverCmsEntryReviewStep/feature.js";
import { ApproveCmsEntryReviewStepFeature } from "./ApproveCmsEntryReviewStep/feature.js";
import { RejectCmsEntryReviewStepFeature } from "./RejectCmsEntryReviewStep/feature.js";
import { CancelCmsEntryReviewFeature } from "./CancelCmsEntryReview/feature.js";
import { CancelCmsEntryReviewsForDeleteFeature } from "./CancelCmsEntryReviewsForDelete/feature.js";

/**
 * The Headless CMS wrapper use cases (D132, D133, R45): identity, `workflows` permission and target
 * access, then the internal api-workflows use case. Phase 3 puts GraphQL on top of them.
 */
export const CmsWrappersFeature = createFeature({
    name: "CmsWorkflows/Wrappers",
    register(container) {
        container.register(CmsEntryReviewGuardService);

        // Workflows
        StoreCmsEntryWorkflowFeature.register(container);
        DeleteCmsEntryWorkflowFeature.register(container);
        ListCmsEntryWorkflowsFeature.register(container);
        GetCmsEntryWorkflowFeature.register(container);

        // Reviews
        RequestCmsEntryReviewFeature.register(container);
        GetCmsEntryReviewFeature.register(container);
        GetCmsEntryTargetReviewFeature.register(container);
        ListCmsEntryReviewsFeature.register(container);
        StartCmsEntryReviewStepFeature.register(container);
        TakeOverCmsEntryReviewStepFeature.register(container);
        ApproveCmsEntryReviewStepFeature.register(container);
        RejectCmsEntryReviewStepFeature.register(container);
        CancelCmsEntryReviewFeature.register(container);

        // Confirm path for trash and delete with a review in progress (D134)
        CancelCmsEntryReviewsForDeleteFeature.register(container);
    }
});
