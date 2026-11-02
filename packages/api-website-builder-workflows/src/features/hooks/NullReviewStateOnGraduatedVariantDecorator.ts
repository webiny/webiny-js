import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { GraduateVariantUseCase } from "@webiny/api-website-builder/features/experiments/GraduateVariant/index.js";

// The part of `system` this decorator reads; the CMS type leaves `system` open for extension.
interface PageSystemWithWorkflow {
    workflow?: unknown;
}

/**
 * A graduated variant is a new page revision, so it starts without a review state (spec 4.5,
 * D59). Graduation creates the revision through the CMS directly and the page model publishes no
 * CMS entry events, so no revision-create rule runs. After a successful graduation this clears
 * the revision's `system.workflow` with the same system write the review sync uses (only the
 * system write runs without authorization). The revision and the graduated experiment already
 * exist, so a failed write is logged with the page id, not returned, and the page keeps the
 * copied state.
 */
class NullReviewStateOnGraduatedVariantDecoratorImpl implements GraduateVariantUseCase.Interface {
    public constructor(
        private identityContext: IdentityContext.Interface,
        private pageModelProvider: PageModelProvider.Interface,
        private updateEntrySystem: UpdateEntrySystemUseCase.Interface,
        private logger: Logger.Interface,
        private decoratee: GraduateVariantUseCase.Interface
    ) {}

    public async execute(params: GraduateVariantUseCase.Params): GraduateVariantUseCase.Return {
        const result = await this.decoratee.execute(params);
        if (result.isFail()) {
            return result;
        }
        const page = result.value;
        const system: PageSystemWithWorkflow | undefined = page.system;
        if (!system?.workflow) {
            return result;
        }

        const model = await this.pageModelProvider.get();
        const updated = await this.identityContext.withoutAuthorization(() => {
            return this.updateEntrySystem.execute(model, page.id, { workflow: null });
        });
        if (updated.isFail()) {
            this.logger.error(
                { err: updated.error, pageId: page.id },
                "Could not clear the review state of a graduated variant revision; it keeps the copied state."
            );
            return result;
        }
        const cleared = { ...page.system, workflow: null };
        return Result.ok({ ...page, system: cleared });
    }
}

export const NullReviewStateOnGraduatedVariantDecorator = GraduateVariantUseCase.createDecorator({
    decorator: NullReviewStateOnGraduatedVariantDecoratorImpl,
    dependencies: [IdentityContext, PageModelProvider, UpdateEntrySystemUseCase, Logger]
});
