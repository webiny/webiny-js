import { describe, expect, it } from "vitest";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { ListWorkflowsUseCase } from "~/features/workflow/ListWorkflows/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { GetReviewUseCase } from "~/features/review/GetReview/index.js";
import { StartReviewStepUseCase } from "~/features/review/StartReviewStep/index.js";
import { TakeOverReviewStepUseCase } from "~/features/review/TakeOverReviewStep/index.js";
import { ApproveReviewStepUseCase } from "~/features/review/ApproveReviewStep/index.js";
import { RejectReviewStepUseCase } from "~/features/review/RejectReviewStep/index.js";
import { CancelReviewUseCase } from "~/features/review/CancelReview/index.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { ReviewStepReacher } from "~/features/review/ReviewStepReacher/abstractions.js";
import { ReviewTargetLoader } from "~/features/review/ReviewTargetLoader/index.js";
import { ReviewTargetSync } from "~/features/review/ReviewTargetSync/index.js";
import { StepAssignmentResolver } from "~/features/review/StepAssignmentResolver/index.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { AssignmentRepository } from "~/domain/assignment/abstractions/AssignmentRepository.js";
import { GetWorkflowSettingsUseCase } from "~/features/settings/GetWorkflowSettings/index.js";
import { SaveWorkflowSettingsUseCase } from "~/features/settings/SaveWorkflowSettings/index.js";

describe("WorkflowsFeature registration", () => {
    it("registers every workflows abstraction once (D18)", async () => {
        const { context } = await createContextHandler();
        const { container } = context;

        expect(container.resolveAll(GetWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListWorkflowsUseCase)).toHaveLength(1);
        expect(container.resolveAll(StoreWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(DeleteWorkflowUseCase)).toHaveLength(1);
        expect(container.resolveAll(RequestReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(GetReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(StartReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(TakeOverReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(ApproveReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(RejectReviewStepUseCase)).toHaveLength(1);
        expect(container.resolveAll(CancelReviewUseCase)).toHaveLength(1);
        expect(container.resolveAll(ReviewSaver)).toHaveLength(1);
        expect(container.resolveAll(ReviewStepReacher)).toHaveLength(1);
        // No default loader or sync: phase 2 registers one per namespace.
        expect(container.resolveAll(ReviewTargetLoader)).toHaveLength(0);
        expect(container.resolveAll(ReviewTargetSync)).toHaveLength(0);
        expect(container.resolveAll(StepAssignmentResolver)).toHaveLength(1);
        expect(container.resolveAll(ReviewRepository)).toHaveLength(1);
        expect(container.resolveAll(AssignmentRepository)).toHaveLength(1);
        expect(container.resolveAll(GetWorkflowSettingsUseCase)).toHaveLength(1);
        expect(container.resolveAll(SaveWorkflowSettingsUseCase)).toHaveLength(1);
    });

    it("does not register the old workflow state model", async () => {
        const { context } = await createContextHandler();

        const result = await context.container.resolve(GetModelUseCase).execute("wbyWorkflowState");

        expect(result.isFail()).toBe(true);
    });
});
