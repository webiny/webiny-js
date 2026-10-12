import { EntryRevisionBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";

/**
 * Every new revision starts without a review state (spec 4.5, D59). One handler for CMS entries,
 * Website Builder pages and any app built on CMS entries; CMS copies `original.system` otherwise.
 * Mutates the entry the use case persists next.
 */
class NullReviewStateOnRevisionCreateImpl
    implements EntryRevisionBeforeCreateEventHandler.Interface
{
    public async handle(event: EntryRevisionBeforeCreateEventHandler.Event): Promise<void> {
        const { entry } = event.payload;
        entry.system = { ...entry.system, workflow: null };
    }
}

export const NullReviewStateOnRevisionCreate =
    EntryRevisionBeforeCreateEventHandler.createImplementation({
        implementation: NullReviewStateOnRevisionCreateImpl,
        dependencies: []
    });
