import { describe, expect, it } from "vitest";
import type { Abstraction } from "@webiny/di";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import { ReviewTargetLoader } from "@webiny/api-workflows/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { ReviewTargetReadAccess } from "@webiny/api-workflows/features/review/ReviewTargetReadAccess/index.js";
import { createContextHandler } from "./__handler/context.js";
import { CmsEntryReviewNamespace } from "~/features/target/CmsEntryReviewNamespace/index.js";
import { StoreCmsEntryWorkflowUseCase } from "~/features/wrappers/StoreCmsEntryWorkflow/index.js";
import { DeleteCmsEntryWorkflowUseCase } from "~/features/wrappers/DeleteCmsEntryWorkflow/index.js";
import { ListCmsEntryWorkflowsUseCase } from "~/features/wrappers/ListCmsEntryWorkflows/index.js";
import { GetCmsEntryWorkflowUseCase } from "~/features/wrappers/GetCmsEntryWorkflow/index.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";
import { StartCmsEntryReviewStepUseCase } from "~/features/wrappers/StartCmsEntryReviewStep/index.js";
import { TakeOverCmsEntryReviewStepUseCase } from "~/features/wrappers/TakeOverCmsEntryReviewStep/index.js";
import { ApproveCmsEntryReviewStepUseCase } from "~/features/wrappers/ApproveCmsEntryReviewStep/index.js";
import { RejectCmsEntryReviewStepUseCase } from "~/features/wrappers/RejectCmsEntryReviewStep/index.js";
import { CancelCmsEntryReviewUseCase } from "~/features/wrappers/CancelCmsEntryReview/index.js";
import { CancelCmsEntryReviewsForDeleteUseCase } from "~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js";

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
        expect(container.resolveAll(CmsEntryReviewNamespace)).toHaveLength(1);
        const wrappers: Abstraction<any>[] = [
            StoreCmsEntryWorkflowUseCase,
            DeleteCmsEntryWorkflowUseCase,
            ListCmsEntryWorkflowsUseCase,
            GetCmsEntryWorkflowUseCase,
            RequestCmsEntryReviewUseCase,
            GetCmsEntryReviewUseCase,
            StartCmsEntryReviewStepUseCase,
            TakeOverCmsEntryReviewStepUseCase,
            ApproveCmsEntryReviewStepUseCase,
            RejectCmsEntryReviewStepUseCase,
            CancelCmsEntryReviewUseCase,
            CancelCmsEntryReviewsForDeleteUseCase
        ];
        for (const abstraction of wrappers) {
            expect(container.resolveAll(abstraction)).toHaveLength(1);
        }
    });
});
