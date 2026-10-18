import { createFeature } from "@webiny/feature/api";
import { CmsEntryReviewGuardService } from "./CmsEntryReviewGuardService/CmsEntryReviewGuardService.js";
import { StoreCmsEntryWorkflowFeature } from "./StoreCmsEntryWorkflow/feature.js";
import { DeleteCmsEntryWorkflowFeature } from "./DeleteCmsEntryWorkflow/feature.js";
import { ListCmsEntryWorkflowsFeature } from "./ListCmsEntryWorkflows/feature.js";
import { GetCmsEntryWorkflowFeature } from "./GetCmsEntryWorkflow/feature.js";
import { ListCmsEntryWorkflowModelsFeature } from "./ListCmsEntryWorkflowModels/feature.js";
import { RequestCmsEntryReviewFeature } from "./RequestCmsEntryReview/feature.js";
import { GetCmsEntryReviewFeature } from "./GetCmsEntryReview/feature.js";
import { GetCmsEntryTargetReviewFeature } from "./GetCmsEntryTargetReview/feature.js";
import { GetCmsEntryReviewStepRunFeature } from "./GetCmsEntryReviewStepRun/feature.js";
import { ListCmsEntryReviewsFeature } from "./ListCmsEntryReviews/feature.js";
import { StartCmsEntryReviewStepFeature } from "./StartCmsEntryReviewStep/feature.js";
import { TakeOverCmsEntryReviewStepFeature } from "./TakeOverCmsEntryReviewStep/feature.js";
import { ApproveCmsEntryReviewStepFeature } from "./ApproveCmsEntryReviewStep/feature.js";
import { RejectCmsEntryReviewStepFeature } from "./RejectCmsEntryReviewStep/feature.js";
import { CancelCmsEntryReviewFeature } from "./CancelCmsEntryReview/feature.js";
import { CancelCmsEntryReviewsForDeleteFeature } from "./CancelCmsEntryReviewsForDelete/feature.js";
import { ReassignCmsEntryReviewStepFeature } from "./ReassignCmsEntryReviewStep/feature.js";
import { RestartCmsEntryReviewStepFeature } from "./RestartCmsEntryReviewStep/feature.js";
import { ListCmsEntryStepCandidatesFeature } from "./ListCmsEntryStepCandidates/feature.js";
import { ListCmsEntryReviewStepCandidatesFeature } from "./ListCmsEntryReviewStepCandidates/feature.js";
import { InspectCmsEntryRoutingFeature } from "./InspectCmsEntryRouting/feature.js";
import { CmsEntryFolderExistsFeature } from "./CmsEntryFolderExists/feature.js";

/**
 * The Headless CMS wrapper use cases (D132, D133, R45): identity, `workflows` permission and target
 * access, then the internal api-workflows use case. `CmsWorkflowsSchemaFactory` puts them on the
 * `cms` root of `/graphql` (D136, R88).
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
        ListCmsEntryWorkflowModelsFeature.register(container);

        // Reviews
        RequestCmsEntryReviewFeature.register(container);
        GetCmsEntryReviewFeature.register(container);
        GetCmsEntryTargetReviewFeature.register(container);
        GetCmsEntryReviewStepRunFeature.register(container);
        ListCmsEntryReviewsFeature.register(container);
        StartCmsEntryReviewStepFeature.register(container);
        TakeOverCmsEntryReviewStepFeature.register(container);
        ApproveCmsEntryReviewStepFeature.register(container);
        RejectCmsEntryReviewStepFeature.register(container);
        CancelCmsEntryReviewFeature.register(container);
        ReassignCmsEntryReviewStepFeature.register(container);
        RestartCmsEntryReviewStepFeature.register(container);

        // Routing: candidates for the request and reassign dialogs, the editor's
        // inspector and folder existence (R120, R121, R125)
        ListCmsEntryStepCandidatesFeature.register(container);
        ListCmsEntryReviewStepCandidatesFeature.register(container);
        InspectCmsEntryRoutingFeature.register(container);
        CmsEntryFolderExistsFeature.register(container);

        // Confirm path for trash and delete with a review in progress (D134)
        CancelCmsEntryReviewsForDeleteFeature.register(container);
    }
});
