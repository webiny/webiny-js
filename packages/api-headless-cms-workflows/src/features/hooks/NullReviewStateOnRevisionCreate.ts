import { EntryRevisionBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";

/**
 * Every new revision starts without a review state (spec 4.5, D59). Covers CMS entries; CMS
 * copies `original.system` otherwise. Website Builder pages publish no CMS entry events, so their
 * adapter clears the state on its own page events. Mutates the entry the use case persists next.
 * A new revision created with `status: "published"` on a bound model needs no review, on purpose:
 * data transfer from other systems (D134 point 2, R83). No handler guards the status here.
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
