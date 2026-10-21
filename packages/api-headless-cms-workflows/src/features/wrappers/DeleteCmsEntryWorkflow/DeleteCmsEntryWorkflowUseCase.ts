import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { WorkflowsPermissions } from "@webiny/api-workflows/features/permissions/WorkflowsPermissions/index.js";
import { GetWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetWorkflow/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    WorkflowHasActiveReviewsError,
    WorkflowNotFoundError,
    WorkflowPersistenceError
} from "@webiny/api-workflows/domain/workflow/errors.js";
import { ReadableBlockingReviewsService } from "@webiny/api-workflows/features/workflow/ReadableBlockingReviews/index.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsWorkflow } from "../shared/cmsWorkflows.js";
import { DeleteCmsEntryWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteCmsEntryWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private deleteWorkflow: DeleteWorkflowUseCase.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private readableBlockingReviews: ReadableBlockingReviewsService.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
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
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "manage workflows" }));
        }

        const existing = await this.getWorkflow.execute({ id: input.id });
        if (existing.isFail()) {
            return Result.fail(existing.error);
        }
        if (!isCmsWorkflow(existing.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }

        const deleted = await this.deleteWorkflow.execute({ id: input.id, actor: actor.value });
        if (deleted.isFail() && deleted.error instanceof WorkflowHasActiveReviewsError) {
            // The first 5 the caller can read, at most 50 checked; the count stays exact (D115, R76).
            // A failed read throws, which the service counts as unreadable.
            const reviews = await this.readableBlockingReviews.filter(
                deleted.error.data.reviews,
                async review => {
                    const target = await this.targets.read({
                        model: review.model,
                        targetRevisionId: review.targetRevisionId
                    });
                    if (target === null || target.entry.entryId !== review.targetId) {
                        return false;
                    }
                    return this.access.canRead(target);
                }
            );
            return Result.fail(
                new WorkflowHasActiveReviewsError({ count: deleted.error.data.count, reviews })
            );
        }
        return deleted;
    }
}

export const DeleteCmsEntryWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteCmsEntryWorkflowUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        GetWorkflowUseCase,
        DeleteWorkflowUseCase,
        CmsEntryTargetReader,
        CmsEntryAccess,
        ReadableBlockingReviewsService
    ]
});
