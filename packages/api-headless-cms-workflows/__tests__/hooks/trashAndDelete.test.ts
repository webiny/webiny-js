import { beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { DeleteMultipleEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { WorkflowBypassService } from "@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { failGetBoundWorkflow } from "~tests/__helpers/FailingGetBoundWorkflow.js";
import { failListTargetReviews } from "~tests/__helpers/FailingListTargetReviews.js";
import {
    failDeleteTargetReviews,
    throwDeleteTargetReviews
} from "~tests/__helpers/FailingDeleteTargetReviews.js";
import { WRITER } from "~tests/__helpers/identities.js";
import { CMS_OWN_DELETER } from "~tests/__helpers/permissions.js";
import {
    approveEntryReview,
    cancelEntryReview,
    readEntry,
    requestEntryReview
} from "~tests/__helpers/engine.js";

const trash = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: false });
};

const deletePermanently = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: true });
};

const createSecondRevision = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return expectOk(
        await context.container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, entry.id, { values: {} })
    );
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetReviewUseCase).execute({ id });
};

beforeEach(() => {
    engineCalls.length = 0;
    loggedErrors.length = 0;
});

describe("CMS trash with a review in progress (D134)", () => {
    it("refuses to trash an entry with a review in progress", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);

        const refused = await trash(context, entry);

        expect(refused.isFail()).toBe(true);
        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toEqual({
            model: "cms.author",
            action: "trash",
            reviews: [
                {
                    reviewId: review.id,
                    model: "cms.author",
                    targetId: entry.entryId,
                    targetRevisionId: entry.id,
                    title: "Ann",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Step 1"
                }
            ]
        });
        expect((await readEntry(context, entry.id)).id).toBe(entry.id);
    });

    it("does not exempt trash or permanent delete from the bypass (D134, R150)", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        const bypass = context.container.resolve(WorkflowBypassService);

        const trashed = await bypass.run(() => trash(context, entry));
        const deleted = await bypass.run(() => deletePermanently(context, entry));

        expect(trashed.isFail()).toBe(true);
        expect(trashed.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(deleted.isFail()).toBe(true);
        expect(deleted.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
    });

    it("trashes the entry once the review is cancelled, and keeps the cancelled review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        await cancelEntryReview(context, review);

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
        expect(expectOk(await getReview(context, review.id)).state).toBe("cancelled");
    });

    it("trashes an entry whose review is approved and keeps the review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
        expect(expectOk(await getReview(context, review.id)).state).toBe("approved");
    });

    it("trashes entries of an unbound model without looking up reviews", async () => {
        const context = await createTestContext({
            withWorkflow: false,
            legacyPlugins: [failListTargetReviews]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
    });

    it("refuses the trash when the review lookup fails on a bound model (fail closed)", async () => {
        const context = await createTestContext({
            legacyPlugins: [failListTargetReviews]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const refused = await trash(context, entry);

        expect(refused.error.code).toBe("Workflows/Review/Persistence");
    });
});

describe("CMS trash and delete when the workflow binding lookup fails (A38)", () => {
    const failingBinding = [failGetBoundWorkflow];

    it("refuses trash and permanent delete (fail closed)", async () => {
        const context = await createTestContext({
            withWorkflow: false,
            legacyPlugins: failingBinding
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const trashed = await trash(context, entry);
        const deleted = await deletePermanently(context, entry);

        expect(trashed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(deleted.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("refuses deleteMultiple (fail closed)", async () => {
        const context = await createTestContext({
            withWorkflow: false,
            legacyPlugins: failingBinding
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const model = await getAuthorModel(context);

        const refused = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [entry.id] });

        expect(refused.error.code).toBe("Workflows/Workflow/Persistence");
    });
});

describe("CMS delete with a review in progress (D134)", () => {
    it("refuses to delete an entry permanently with a review in progress", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);

        const refused = await deletePermanently(context, entry);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({ action: "delete" });
    });

    it("refuses to delete a revision under review and deletes its reviews after cancel", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "Ann" });
        const firstReview = await approveEntryReview(
            context,
            await requestEntryReview(context, first)
        );
        const second = await createSecondRevision(context, first);
        const secondReview = await requestEntryReview(context, second);
        const model = await getAuthorModel(context);
        const deleteRevision = context.container.resolve(DeleteEntryRevisionUseCase);

        const refused = await deleteRevision.execute(model, second.id);
        await cancelEntryReview(context, secondReview);
        const deleted = await deleteRevision.execute(model, second.id);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({
            action: "delete",
            reviews: [{ reviewId: secondReview.id }]
        });
        expect(deleted.isOk()).toBe(true);
        expect((await getReview(context, secondReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect(expectOk(await getReview(context, firstReview.id)).id).toBe(firstReview.id);
    });

    it("refuses deleteMultiple when an entry has a review in progress", async () => {
        const context = await createTestContext();
        const free = await createAuthorEntry(context, { name: "Free" });
        const busy = await createAuthorEntry(context, { name: "Busy" });
        const review = await requestEntryReview(context, busy);
        const model = await getAuthorModel(context);

        const refused = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [free.id, busy.id] });

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({
            action: "delete",
            reviews: [{ reviewId: review.id, targetId: busy.entryId }]
        });
        expect((await readEntry(context, free.id)).id).toBe(free.id);
    });

    it("refuses deleteMultiple when a non-latest revision has the review in progress", async () => {
        const context = await createTestContext();
        const model = await getAuthorModel(context);
        const first = await createAuthorEntry(context, { name: "Ann" });
        // OpenSearch deleteMultiple needs a published record; created as published (R83).
        const latest = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, first.id, { values: {}, status: "published" })
        );
        const review = await requestEntryReview(context, first);

        const refused = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [latest.id] });

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({
            action: "delete",
            reviews: [{ reviewId: review.id, targetRevisionId: first.id }]
        });
    });

    it("neither blocks on nor cleans up an entry the caller cannot access in deleteMultiple", async () => {
        const admin = await createTestContext();
        const hidden = await createAuthorEntry(admin, { name: "Hidden" });
        const hiddenReview = await requestEntryReview(admin, hidden);
        const writer = await createTestContext({
            withWorkflow: false,
            identity: WRITER,
            permissions: CMS_OWN_DELETER
        });
        const model = await getAuthorModel(writer);
        // OpenSearch deleteMultiple needs a published record; created as published (R83).
        const own = expectOk(
            await writer.container.resolve(CreateEntryUseCase).execute(model, {
                values: { name: "Own" },
                status: "published",
                location: { folderId: "root" }
            })
        );

        const deleted = await writer.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [hidden.id, own.id] });

        expect(deleted.isOk()).toBe(true);
        expect((await readEntry(admin, hidden.id)).id).toBe(hidden.id);
        expect(expectOk(await getReview(admin, hiddenReview.id)).state).toBe("inProgress");
    });
});

describe("CMS trash and delete on a private model (R52)", () => {
    it("neither blocks nor cleans up: the engine deletes its own review and assignment entries", async () => {
        // The workflow, review and assignment models are private. Their entries fire the same CMS
        // events, and the engine deletes them through `DeleteEntryUseCase`, so the handlers must
        // skip private models or the engine would call itself.
        const context = await createTestContext({
            privateModel: true,
            withWorkflow: false,
            legacyPlugins: [countEngineCalls]
        });
        const model = await getAuthorModel(context);
        const trashed = await createAuthorEntry(context, { name: "Trashed" });
        const deleted = await createAuthorEntry(context, { name: "Deleted" });
        const revised = await createAuthorEntry(context, { name: "Revised" });
        const revision = await createSecondRevision(context, revised);
        const bulk = await createAuthorEntry(context, { name: "Bulk" });
        // OpenSearch deleteMultiple needs the published record.
        expectOk(await context.container.resolve(PublishEntryUseCase).execute(model, bulk.id));
        engineCalls.length = 0;

        expect((await trash(context, trashed)).isOk()).toBe(true);
        expect((await deletePermanently(context, deleted)).isOk()).toBe(true);
        expect(
            (
                await context.container
                    .resolve(DeleteEntryRevisionUseCase)
                    .execute(model, revision.id)
            ).isOk()
        ).toBe(true);
        expect(
            (
                await context.container
                    .resolve(DeleteMultipleEntriesUseCase)
                    .execute(model, { entries: [bulk.id] })
            ).isOk()
        ).toBe(true);

        expect(engineCalls).toEqual([]);
    });
});

describe("CMS review cleanup after a permanent delete (R56, R81)", () => {
    it("deletes the reviews of a permanently deleted entry", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        expectOk(await deletePermanently(context, entry));

        expect((await getReview(context, review.id)).error.code).toBe("Workflows/Review/NotFound");
    });

    it("deletes the reviews of entries deleted in bulk, with one review list and one delete call", async () => {
        const context = await createTestContext({ legacyPlugins: [countEngineCalls] });
        const first = await createAuthorEntry(context, { name: "First" });
        const second = await createAuthorEntry(context, { name: "Second" });
        const firstReview = await approveEntryReview(
            context,
            await requestEntryReview(context, first)
        );
        const secondReview = await approveEntryReview(
            context,
            await requestEntryReview(context, second)
        );
        // OpenSearch deleteMultiple needs the published records.
        const model = await getAuthorModel(context);
        const publish = context.container.resolve(PublishEntryUseCase);
        expectOk(await publish.execute(model, first.id));
        expectOk(await publish.execute(model, second.id));
        engineCalls.length = 0;

        expectOk(
            await context.container
                .resolve(DeleteMultipleEntriesUseCase)
                .execute(model, { entries: [first.id, second.id] })
        );

        // The block check lists the reviews of both entries once, the cleanup deletes them once.
        const reviewCalls = engineCalls.filter(call => {
            return call !== "GetBoundWorkflow" && call !== "ListWorkflows";
        });
        expect(reviewCalls).toEqual(["ListReviewsByTargets", "DeleteTargetReviews"]);

        expect((await getReview(context, firstReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect((await getReview(context, secondReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
    });

    it("keeps the delete when the review cleanup fails and logs it (R81)", async () => {
        const context = await createTestContext({
            legacyPlugins: [captureLoggedErrors, failDeleteTargetReviews]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        const deleted = await deletePermanently(context, entry);

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            {
                message: "Could not delete the reviews of a deleted entry; they are left orphaned.",
                fields: expect.objectContaining({ model: "cms.author", targetId: entry.entryId })
            }
        ]);
        // The review is orphaned (A34).
        expect(expectOk(await getReview(context, review.id)).id).toBe(review.id);
    });

    it("keeps every delete when the review cleanup throws and logs it (R81)", async () => {
        const context = await createTestContext({
            legacyPlugins: [captureLoggedErrors, throwDeleteTargetReviews]
        });
        const model = await getAuthorModel(context);
        const single = await createAuthorEntry(context, { name: "Single" });
        const revised = await createAuthorEntry(context, { name: "Revised" });
        const revision = await createSecondRevision(context, revised);
        // OpenSearch deleteMultiple needs a published record; created as published (R83).
        const bulk = expectOk(
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                values: { name: "Bulk" },
                status: "published",
                location: { folderId: "root" }
            })
        );

        const deleted = await deletePermanently(context, single);
        const revisionDeleted = await context.container
            .resolve(DeleteEntryRevisionUseCase)
            .execute(model, revision.id);
        const bulkDeleted = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [bulk.id] });

        expect(deleted.isOk()).toBe(true);
        expect(revisionDeleted.isOk()).toBe(true);
        expect(bulkDeleted.isOk()).toBe(true);
        expect(loggedErrors.map(logged => logged.message)).toEqual([
            "Could not delete the reviews of a deleted entry; they are left orphaned.",
            "Could not delete the reviews of a deleted revision; they are left orphaned.",
            "Could not delete the reviews of deleted entries; they are left orphaned."
        ]);
        expect(loggedErrors.map(logged => logged.fields)).toEqual([
            expect.objectContaining({ model: "cms.author", targetId: single.entryId }),
            expect.objectContaining({ model: "cms.author", targetRevisionId: revision.id }),
            expect.objectContaining({ model: "cms.author", targetIds: [bulk.entryId] })
        ]);
    });
});
