import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { UpdateEntrySystemUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntrySystem/index.js";
import { PageModelProvider } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { PageAfterCreateRevisionFromEventHandler } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";

// The part of `system` this handler reads; the CMS type leaves `system` open for extension.
interface PageSystemWithWorkflow {
    workflow?: unknown;
}

/**
 * Every new page revision starts without a review state (spec 4.5, D59). The page model publishes
 * no CMS entry events and the CMS copies `system` from the source revision, so after Website
 * Builder creates the revision this clears its `system.workflow` with the same system write the
 * review sync uses (only the system write runs without authorization), and updates the page the
 * use case returns. The revision already exists, so a failed write is logged with the page id,
 * not thrown: the revision keeps the copied state, which stays visible in the log instead of a
 * failed request that a retry would turn into another revision.
 */
class NullReviewStateOnPageRevisionCreateImpl
    implements PageAfterCreateRevisionFromEventHandler.Interface
{
    public constructor(
        private identityContext: IdentityContext.Interface,
        private pageModelProvider: PageModelProvider.Interface,
        private updateEntrySystem: UpdateEntrySystemUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: PageAfterCreateRevisionFromEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        const system: PageSystemWithWorkflow | undefined = page.system;
        if (!system?.workflow) {
            return;
        }

        const model = await this.pageModelProvider.get();
        const updated = await this.identityContext.withoutAuthorization(() => {
            return this.updateEntrySystem.execute(model, page.id, { workflow: null });
        });
        if (updated.isFail()) {
            this.logger.error(
                { err: updated.error, pageId: page.id },
                "Could not clear the review state of a new page revision; it keeps the copied state."
            );
            return;
        }
        const cleared = { ...page.system, workflow: null };
        page.system = cleared;
    }
}

export const NullReviewStateOnPageRevisionCreate =
    PageAfterCreateRevisionFromEventHandler.createImplementation({
        implementation: NullReviewStateOnPageRevisionCreateImpl,
        dependencies: [IdentityContext, PageModelProvider, UpdateEntrySystemUseCase, Logger]
    });
