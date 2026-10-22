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
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageDeniedFolders } from "~/features/target/WbPageDeniedFolders/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { isWbWorkflow } from "../shared/wbWorkflows.js";
import { DeleteWebsiteBuilderPageWorkflowUseCase as UseCase } from "./abstractions.js";

class DeleteWebsiteBuilderPageWorkflowUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private permissions: WorkflowsPermissions.Interface,
        private getWorkflow: GetWorkflowUseCase.Interface,
        private deleteWorkflow: DeleteWorkflowUseCase.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private readableBlockingReviews: ReadableBlockingReviewsService.Interface,
        private deniedFolders: WbPageDeniedFolders.Interface
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
        if (!isWbWorkflow(existing.value)) {
            return Result.fail(new WorkflowNotFoundError({ id: input.id }));
        }

        const deleted = await this.deleteWorkflow.execute({ id: input.id, actor: actor.value });
        if (deleted.isFail() && deleted.error instanceof WorkflowHasActiveReviewsError) {
            // The first 5 the caller can read, at most 50 checked; the count stays exact (D115, R76).
            // The pages are read in one batch and checked in memory (Q79); a failed read throws,
            // which the service counts as unreadable.
            const reviews = await this.readableBlockingReviews.filter(
                deleted.error.data.reviews,
                async blockingReviews => {
                    const targetRevisionIds = blockingReviews
                        .filter(review => review.model === WB_PAGE_NAMESPACE)
                        .map(review => review.targetRevisionId);
                    const read = await this.targets.readMany({
                        model: WB_PAGE_NAMESPACE,
                        targetRevisionIds
                    });
                    const targets = new Map(read.map(target => [target.page.id, target]));
                    const folderRule = await this.deniedFolders.createFolderReadRule();

                    const readable: WorkflowBlockingReview[] = [];
                    for (const review of blockingReviews) {
                        const target = targets.get(review.targetRevisionId);
                        if (!target || review.model !== WB_PAGE_NAMESPACE) {
                            continue;
                        }
                        if (target.page.entryId !== review.targetId) {
                            continue;
                        }
                        if (await this.access.canRead(target, folderRule)) {
                            readable.push(review);
                        }
                    }
                    return readable;
                }
            );
            return Result.fail(
                new WorkflowHasActiveReviewsError({ count: deleted.error.data.count, reviews })
            );
        }
        return deleted;
    }
}

export const DeleteWebsiteBuilderPageWorkflowUseCase = UseCase.createImplementation({
    implementation: DeleteWebsiteBuilderPageWorkflowUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        GetWorkflowUseCase,
        DeleteWorkflowUseCase,
        WbPageTargetReader,
        WbPageAccess,
        ReadableBlockingReviewsService,
        WbPageDeniedFolders
    ]
});
