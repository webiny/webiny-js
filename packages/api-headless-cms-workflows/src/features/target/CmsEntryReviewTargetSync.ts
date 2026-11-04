import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { GetModelUseCase } from "@webiny/api-headless-cms/features/contentModel/GetModel/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { ReviewTargetSync } from "@webiny/api-workflows/features/review/ReviewTargetSync/index.js";
import { getModelIdFromAppName, isCmsNamespace } from "~/utils/appName.js";

/**
 * Writes `system.workflow` on the CMS revision (spec 4.5, D52, R63). The model is read as the
 * current identity, never without authorization: an access-free read could fill the tenant-keyed
 * CMS model cache with an unfiltered list (A19). Only the system write runs without authorization,
 * so a reviewer with read access can move the review on. `UpdateEntrySystemUseCase` publishes
 * `EntryBeforeUpdateSystem`, not `EntryBeforeUpdate`, so the save block does not apply (D62).
 */
class CmsEntryReviewTargetSyncImpl implements ReviewTargetSync.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private getModel: GetModelUseCase.Interface,
        private updateEntrySystem: UpdateEntrySystemUseCase.Interface
    ) {}

    public canSync(model: string): boolean {
        return isCmsNamespace(model);
    }

    public async sync(params: ReviewTargetSync.Params): ReviewTargetSync.Return {
        const modelId = getModelIdFromAppName(params.review.model);
        if (!modelId) {
            return Result.fail(
                new Error(`"${params.review.model}" is not a Headless CMS review namespace.`)
            );
        }

        try {
            const model = await this.getModel.execute(modelId);
            if (model.isFail()) {
                return Result.fail(model.error);
            }

            const updated = await this.identityContext.withoutAuthorization(() => {
                return this.updateEntrySystem.execute(model.value, params.review.targetRevisionId, {
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

export const CmsEntryReviewTargetSync = ReviewTargetSync.createImplementation({
    implementation: CmsEntryReviewTargetSyncImpl,
    dependencies: [IdentityContext, GetModelUseCase, UpdateEntrySystemUseCase]
});
