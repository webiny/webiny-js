import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { RequestReviewUseCase } from "@webiny/api-workflows/features/review/RequestReview/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import {
    ReviewPersistenceError,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import { CmsEntryTargetReader } from "~/features/target/CmsEntryTargetReader/index.js";
import { CmsEntryAccess } from "~/features/target/CmsEntryAccess/index.js";
import { isCmsNamespace } from "~/utils/appName.js";
import { RequestCmsEntryReviewUseCase as UseCase } from "./abstractions.js";

/**
 * A target the user cannot see (no model access) or of another app is reported as not found, like
 * the CMS hides it (R46); a visible target without write access is not authorized (D77).
 */
class RequestCmsEntryReviewUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private targets: CmsEntryTargetReader.Interface,
        private access: CmsEntryAccess.Interface,
        private requestReview: RequestReviewUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        let target: CmsEntryTargetReader.Target | null = null;
        if (isCmsNamespace(input.model)) {
            try {
                target = await this.targets.read({
                    model: input.model,
                    targetRevisionId: input.targetRevisionId
                });
            } catch (error) {
                return Result.fail(
                    new ReviewPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
        }
        if (!target || target.entry.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: input.model,
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
            model: input.model,
            targetId: input.targetId,
            targetRevisionId: input.targetRevisionId,
            title: input.title,
            picks: input.picks,
            actor: actor.value
        });
    }
}

export const RequestCmsEntryReviewUseCase = UseCase.createImplementation({
    implementation: RequestCmsEntryReviewUseCaseImpl,
    dependencies: [CurrentReviewViewer, CmsEntryTargetReader, CmsEntryAccess, RequestReviewUseCase]
});
