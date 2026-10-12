import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Writes `system.workflow` on the page revision (spec 4.5, D52, R63). The page model is read as the
 * current identity (A19); only the system write runs without authorization, so a reviewer with
 * read access can move the review on. Pages are CMS entries, so this is the same
 * `UpdateEntrySystemUseCase` the CMS adapter uses; it does not publish `EntryBeforeUpdate` (D62).
 * Any throw becomes a failed result, so the review stays saved (R16).
 */
class WbPageReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private pageModelProvider: PageModelProvider.Interface,
        private updateEntrySystem: UpdateEntrySystemUseCase.Interface
    ) {}

    public canSync(model: string): boolean {
        return model === WB_PAGE_NAMESPACE;
    }

    public async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        try {
            const model = await this.pageModelProvider.get();
            const updated = await this.identityContext.withoutAuthorization(() => {
                return this.updateEntrySystem.execute(model, params.review.targetRevisionId, {
                    workflow: params.systemWorkflow
                });
            });
            if (updated.isFail()) {
                return Result.fail(updated.error);
            }
            return Result.ok();
        } catch (error) {
            return Result.fail(error instanceof Error ? error : new Error(String(error)));
        }
    }
}

export const WbPageReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: WbPageReviewTargetSyncImpl,
    dependencies: [IdentityContext, PageModelProvider, UpdateEntrySystemUseCase]
});
