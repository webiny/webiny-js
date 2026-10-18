import { describe, expect, it } from "vitest";
import type { Abstraction } from "@webiny/di";
import { createTestWcpLicense } from "@webiny/wcp/testing/createTestWcpLicense.js";
import { PROJECT_PACKAGE_FEATURE_NAME } from "@webiny/wcp/types.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { ReviewTargetFolderChain } from "@webiny/api-workflows/features/review/ReviewTargetFolderChain/index.js";
import { ReviewTargetEditor } from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import { ReviewTargetLink } from "@webiny/api-workflows/features/notifications/ReviewTargetLink/index.js";
import { createContextHandler } from "./__handler/context.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";
import { StoreCmsEntryWorkflowUseCase } from "~/features/wrappers/StoreCmsEntryWorkflow/index.js";
import { DeleteCmsEntryWorkflowUseCase } from "~/features/wrappers/DeleteCmsEntryWorkflow/index.js";
import { ListCmsEntryWorkflowsUseCase } from "~/features/wrappers/ListCmsEntryWorkflows/index.js";
import { GetCmsEntryWorkflowUseCase } from "~/features/wrappers/GetCmsEntryWorkflow/index.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { GetCmsEntryReviewStepRunUseCase } from "~/features/wrappers/GetCmsEntryReviewStepRun/index.js";
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";
import { ListCmsEntryWorkflowModelsUseCase } from "~/features/wrappers/ListCmsEntryWorkflowModels/index.js";
import { StartCmsEntryReviewStepUseCase } from "~/features/wrappers/StartCmsEntryReviewStep/index.js";
import { TakeOverCmsEntryReviewStepUseCase } from "~/features/wrappers/TakeOverCmsEntryReviewStep/index.js";
import { ApproveCmsEntryReviewStepUseCase } from "~/features/wrappers/ApproveCmsEntryReviewStep/index.js";
import { RejectCmsEntryReviewStepUseCase } from "~/features/wrappers/RejectCmsEntryReviewStep/index.js";
import { CancelCmsEntryReviewUseCase } from "~/features/wrappers/CancelCmsEntryReview/index.js";
import { CancelCmsEntryReviewsForDeleteUseCase } from "~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js";
import { ReassignCmsEntryReviewStepUseCase } from "~/features/wrappers/ReassignCmsEntryReviewStep/index.js";
import { RestartCmsEntryReviewStepUseCase } from "~/features/wrappers/RestartCmsEntryReviewStep/index.js";
import { ListCmsEntryStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryStepCandidates/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryReviewStepCandidates/index.js";
import { InspectCmsEntryRoutingUseCase } from "~/features/wrappers/InspectCmsEntryRouting/index.js";
import { CmsEntryFolderExistsUseCase } from "~/features/wrappers/CmsEntryFolderExists/index.js";
import { CmsEntryReviewGuardService } from "~/features/wrappers/CmsEntryReviewGuardService/index.js";
import { CmsEntryFolderExistsService } from "~/features/target/CmsEntryFolderExistsService/index.js";

const WRAPPERS: Abstraction<unknown>[] = [
    StoreCmsEntryWorkflowUseCase,
    DeleteCmsEntryWorkflowUseCase,
    ListCmsEntryWorkflowsUseCase,
    GetCmsEntryWorkflowUseCase,
    ListCmsEntryWorkflowModelsUseCase,
    RequestCmsEntryReviewUseCase,
    GetCmsEntryReviewUseCase,
    GetCmsEntryTargetReviewUseCase,
    GetCmsEntryReviewStepRunUseCase,
    ListCmsEntryReviewsUseCase,
    StartCmsEntryReviewStepUseCase,
    TakeOverCmsEntryReviewStepUseCase,
    ApproveCmsEntryReviewStepUseCase,
    RejectCmsEntryReviewStepUseCase,
    CancelCmsEntryReviewUseCase,
    CancelCmsEntryReviewsForDeleteUseCase,
    ReassignCmsEntryReviewStepUseCase,
    RestartCmsEntryReviewStepUseCase,
    ListCmsEntryStepCandidatesUseCase,
    ListCmsEntryReviewStepCandidatesUseCase,
    InspectCmsEntryRoutingUseCase,
    CmsEntryFolderExistsUseCase,
    CmsEntryReviewGuardService,
    CmsEntryFolderExistsService
];

describe("CmsWorkflowsFeature registration", () => {
    it("registers the core workflows feature only once", async () => {
        const { context } = createContextHandler();
        const ctx = await context();

        expect(ctx.container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
    });

    it("registers one cms adapter port of each kind and every wrapper once", async () => {
        const { context } = createContextHandler();
        const { container } = await context();

        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetReadAccess)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(1);
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(1);
        expect(container.resolveAll(CmsEntryReviewNamespace)).toHaveLength(1);
        for (const abstraction of WRAPPERS) {
            expect(container.resolveAll(abstraction)).toHaveLength(1);
        }
    });

    it("registers no wrapper and no guard without the advancedPublishingWorkflow license", async () => {
        const license = createTestWcpLicense();
        license.package.features[PROJECT_PACKAGE_FEATURE_NAME.APW] = { enabled: false };
        const { context } = createContextHandler({ testProjectLicense: license });
        const { container } = await context();

        for (const abstraction of WRAPPERS) {
            expect(container.resolveAll(abstraction)).toHaveLength(0);
        }
        expect(container.resolveAll(ReviewTargetFolderChain)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetEditor)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetLink)).toHaveLength(0);
    });
});
