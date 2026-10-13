import { Result } from "@webiny/feature/api";
import zod from "zod";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { WorkflowsNotAuthorizedError } from "~/domain/permissions/errors.js";
import { WorkflowPersistenceError } from "~/domain/workflow/errors.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/WorkflowValidator.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { CurrentReviewViewer } from "~/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "~/features/permissions/WorkflowsPermissions/index.js";
import { ListWorkflowStepTypesUseCase as UseCase } from "./abstractions.js";

class ListWorkflowStepTypesUseCaseImpl implements UseCase.Interface {
    constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private featureFlags: FeatureFlags.Interface
    ) {}

    async execute(): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }
        let canEdit: boolean;
        try {
            canEdit = await this.permissions.canEdit();
        } catch (error) {
            return Result.fail(
                new WorkflowPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canEdit) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "list the step types" }));
        }

        // AI steps need the AI powerups entitlement (D130).
        const aiAvailable = this.featureFlags.get().isEnabled("aiPowerups");
        return Result.ok([
            {
                type: REVIEW_STEP_TYPE,
                title: "Review",
                available: true,
                unavailableReason: null,
                configSchema: zod.toJSONSchema(reviewStepConfigSchema)
            },
            {
                type: "ai",
                title: "AI",
                available: aiAvailable,
                unavailableReason: aiAvailable ? null : "AI powerups are not enabled.",
                configSchema: null
            },
            {
                // Needs an automation definition covering the model; none exist before phase 5.
                type: "automation",
                title: "Automation",
                available: false,
                unavailableReason: "No automation is defined.",
                configSchema: null
            }
        ]);
    }
}

export const ListWorkflowStepTypesUseCase = UseCase.createImplementation({
    implementation: ListWorkflowStepTypesUseCaseImpl,
    dependencies: [CurrentReviewViewer, WorkflowsPermissions, FeatureFlags]
});
