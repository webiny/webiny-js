import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { EntryRevisionAfterDeleteEvent } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.js";
import { EntryRevisionBeforeDeleteEvent } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.js";
import { EntryRevisionAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { EntryRevisionBeforeDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { getAuthorModel } from "~tests/__helpers/entries.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import { countEngineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";

const BLOCK_HANDLER = "BlockRevisionDeleteWhileInReviewImpl";
const CLEANUP_HANDLER = "DeleteReviewsOnRevisionDeleteImpl";

/** Only the workflow handlers: other packages' handlers are not under test here. */
const pickByName = <THandler extends object>(handlers: THandler[], name: string): THandler[] => {
    return handlers.filter(handler => handler.constructor.name === name);
};

/**
 * Website Builder pages are entries of a private CMS model. The CMS revision hooks must ignore a
 * private model (A87), so deleting a page revision runs only the Website Builder hooks
 * (`BlockPageRevisionDeleteWhileInReview`, `DeleteReviewsOnPageRevisionDelete`).
 */
describe("CMS revision hooks ignore the private model (A87, R52)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    it("neither blocks nor cleans up for a private model's revision, even with a review in progress", async () => {
        const context = await createTestContext({ legacyPlugins: [countEngineCalls] });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        const model = await getAuthorModel(context);
        const privateModel = { ...model, isPrivate: true };
        engineCalls.length = 0;
        const block = pickByName(
            context.container.resolveAll(EntryRevisionBeforeDeleteEventHandler),
            BLOCK_HANDLER
        );
        const cleanup = pickByName(
            context.container.resolveAll(EntryRevisionAfterDeleteEventHandler),
            CLEANUP_HANDLER
        );

        await block[0].handle(new EntryRevisionBeforeDeleteEvent({ entry, model: privateModel }));
        await cleanup[0].handle(new EntryRevisionAfterDeleteEvent({ entry, model: privateModel }));

        expect(block).toHaveLength(1);
        expect(cleanup).toHaveLength(1);
        expect(engineCalls).toEqual([]);
        const stored = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("still blocks the same revision on a public model (control)", async () => {
        const context = await createTestContext({ legacyPlugins: [countEngineCalls] });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        const model = await getAuthorModel(context);
        const block = pickByName(
            context.container.resolveAll(EntryRevisionBeforeDeleteEventHandler),
            BLOCK_HANDLER
        );

        await expect(
            block[0].handle(new EntryRevisionBeforeDeleteEvent({ entry, model }))
        ).rejects.toMatchObject({ code: "Workflows/Review/ActiveReviewOnTrash" });
    });
});
