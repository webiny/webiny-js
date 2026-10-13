import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { RequestWebsiteBuilderPageReviewUseCase as UseCase } from "./abstractions.js";

/**
 * As WB's own `UpdatePageUseCase`, the entity-level page permission is checked before the page is
 * loaded, so a user without page permissions learns nothing about which pages exist (R75). A page
 * the user cannot see is reported as not found; a visible page without write access is not
 * authorized (D77).
 */
class RequestWebsiteBuilderPageReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private requestReview: RequestReviewUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        let canWriteAnyPage: boolean;
        try {
            canWriteAnyPage = await this.access.canWriteAnyPage();
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canWriteAnyPage) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "request a review" }));
        }

        let target: WbPageTargetReader.Target | null;
        try {
            target = await this.targets.read({
                model: WB_PAGE_NAMESPACE,
                targetRevisionId: input.targetRevisionId
            });
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!target || target.page.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: WB_PAGE_NAMESPACE,
                    targetRevisionId: input.targetRevisionId
                })
            );
        }
        let canWrite: boolean;
        try {
            canWrite = await this.access.canWrite(target);
        } catch (error) {
            return Result.fail(
                new ReviewPersistenceError(
                    error instanceof Error ? error : new Error(String(error))
                )
            );
        }
        if (!canWrite) {
            return Result.fail(new WorkflowsNotAuthorizedError({ action: "request a review" }));
        }

        return this.requestReview.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            title: input.title,
            picks: input.picks,
            actor: actor.value
        });
    }
}

export const RequestWebsiteBuilderPageReviewUseCase = UseCase.createImplementation({
    implementation: RequestWebsiteBuilderPageReviewUseCaseImpl,
    dependencies: [CurrentReviewViewer, WbPageTargetReader, WbPageAccess, RequestReviewUseCase]
});
