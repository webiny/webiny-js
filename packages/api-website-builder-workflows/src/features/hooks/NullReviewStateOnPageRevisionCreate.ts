import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
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
 * use case returns. A failed write rejects, so the caller never sees the copied review state as
 * current.
 */
class NullReviewStateOnPageRevisionCreateImpl
    implements PageAfterCreateRevisionFromEventHandler.Interface
{
    public constructor(
        private identityContext: IdentityContext.Interface,
        private pageModelProvider: PageModelProvider.Interface,
        private updateEntrySystem: UpdateEntrySystemUseCase.Interface
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
            throw updated.error;
        }
        const cleared = { ...page.system, workflow: null };
        page.system = cleared;
    }
}

export const NullReviewStateOnPageRevisionCreate =
    PageAfterCreateRevisionFromEventHandler.createImplementation({
        implementation: NullReviewStateOnPageRevisionCreateImpl,
        dependencies: [IdentityContext, PageModelProvider, UpdateEntrySystemUseCase]
    });
