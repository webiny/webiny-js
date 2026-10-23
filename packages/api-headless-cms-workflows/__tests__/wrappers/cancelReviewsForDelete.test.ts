import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import {
    AUTHOR_NAMESPACE,
    createAuthorEntry,
    expectOk,
    getAuthorModel
} from "~tests/__helpers/entries.js";
import { approveEntryReview, requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { toActor, WRITER } from "~tests/__helpers/identities.js";
import { CMS_DELETER, CMS_WRITER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    missingTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { CancelCmsEntryReviewsForDeleteUseCase } from "~/features/wrappers/CancelCmsEntryReviewsForDelete/index.js";

/** Admin stores the workflow; REQUESTER's review is in progress on one entry. */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const review = await requestEntryReview(admin, entry);
    return { admin, entry, review };
};

/** WRITER with delete rights and no workflows permission, recording events (R80). */
const createDeleterContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: WRITER,
        permissions: CMS_DELETER,
        legacyPlugins: [
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            (container: Container) => {
                container.registerDecorator(RecordingEventPublisher);
            }
        ]
    });
};

const trash = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: false });
};

const cancelForDelete = (
    context: CmsContext,
    input: CancelCmsEntryReviewsForDeleteUseCase.Input
) => {
    return context.container.resolve(CancelCmsEntryReviewsForDeleteUseCase).execute(input);
};

const cancelledFacts = () => {
    return recordedEvents
        .filter(event => event.eventType === "Workflows/Review/Cancelled")
        .map(event => event.payload.fact);
};

describe("CMS cancel-for-delete wrapper (D134)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        missingTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("lets a user who may trash the content cancel its review, then trash it", async () => {
        const { admin, entry, review } = await createScenario();
        const deleter = await createDeleterContext();

        const refused = await trash(deleter, entry);
        const cancelled = expectOk(
            await cancelForDelete(deleter, {
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                action: "trash"
            })
        );
        const trashed = await trash(deleter, entry);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(cancelled.map(item => item.id)).toEqual([review.id]);
        expect(cancelledFacts()).toEqual([
            expect.objectContaining({ actor: toActor(WRITER), reason: "content trashed" })
        ]);
        expect(trashed.isOk()).toBe(true);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("cancelled");
    });

    it("cancels only the deleted revision's review, with the delete reason", async () => {
        const { admin, entry } = await createScenario();
        // Revision 1's review is in progress; revision 2 gets its own.
        const model = await getAuthorModel(admin);
        const second = expectOk(
            await admin.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, entry.id, { values: {} })
        );
        const secondReview = await requestEntryReview(admin, second);
        const deleter = await createDeleterContext();

        const cancelled = expectOk(
            await cancelForDelete(deleter, {
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                targetRevisionId: second.id,
                action: "delete"
            })
        );
        const deleted = await deleter.container
            .resolve(DeleteEntryRevisionUseCase)
            .execute(model, second.id);

        expect(cancelled.map(item => item.id)).toEqual([secondReview.id]);
        expect(cancelledFacts()).toEqual([expect.objectContaining({ reason: "content deleted" })]);
        expect(deleted.isOk()).toBe(true);
    });

    it("refuses a user who cannot delete the content, and keeps the review", async () => {
        const { admin, entry, review } = await createScenario();
        const writer = await createUserContext({
            identity: WRITER,
            permissions: CMS_WRITER,
            legacyPlugins: [countEngineCalls]
        });

        const result = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel the review to delete this content" });
        expect(engineCalls).toEqual([]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("answers a user without delete permission the same for an entry with and without a review (R86)", async () => {
        const { admin, entry } = await createScenario();
        const idle = await createAuthorEntry(admin, { name: "Bob" });
        const writer = await createUserContext({
            identity: WRITER,
            permissions: CMS_WRITER,
            legacyPlugins: [countEngineCalls]
        });

        const withReview = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });
        const withoutReview = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: idle.entryId,
            action: "trash"
        });
        const missing = await cancelForDelete(writer, {
            model: AUTHOR_NAMESPACE,
            targetId: "missing-entry",
            action: "trash"
        });

        expect(withReview.error.code).toBe("Workflows/NotAuthorized");
        expect(withoutReview.error.code).toBe(withReview.error.code);
        expect(withoutReview.error.data).toEqual(withReview.error.data);
        expect(missing.error.code).toBe(withReview.error.code);
        expect(missing.error.data).toEqual(withReview.error.data);
        expect(engineCalls).toEqual([]);
    });

    it("cancels nothing for a user who cannot delete this entry, the same as for an entry without a review (R86)", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Locked", folderId: "folder-locked" });
        const review = await requestEntryReview(admin, entry);
        const idle = await createAuthorEntry(admin, { name: "Idle", folderId: "folder-locked" });
        // ACO `viewer` may read but not write or delete folder content.
        folderLevels.set("folder-locked", new Map([[WRITER.id, "viewer"]]));
        const deleter = await createDeleterContext();

        const withReview = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });
        const withoutReview = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: idle.entryId,
            action: "trash"
        });

        expect(expectOk(withReview)).toEqual([]);
        expect(expectOk(withoutReview)).toEqual([]);
        expect(engineCalls).toEqual(["ListTargetReviews", "ListTargetReviews"]);
        expect(cancelledFacts()).toEqual([]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("cancels nothing when no review is in progress", async () => {
        const admin = await createUserContext();
        expectOk(await storeWorkflow(admin));
        const entry = await createAuthorEntry(admin, { name: "Ann" });
        await approveEntryReview(admin, await requestEntryReview(admin, entry));
        const deleter = await createDeleterContext();

        const cancelled = expectOk(
            await cancelForDelete(deleter, {
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                action: "trash"
            })
        );

        expect(cancelled).toEqual([]);
    });

    it("reports another app's namespace as not found and refuses an anonymous identity", async () => {
        const { entry } = await createScenario();
        const deleter = await createDeleterContext();
        const anonymous = await createUserContext({ identity: null, permissions: [] });

        const otherApp = await cancelForDelete(deleter, {
            model: "wb.page",
            targetId: entry.entryId,
            action: "trash"
        });
        const unauthenticated = await cancelForDelete(anonymous, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(unauthenticated.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("reports a wb.page review's target as not found without calling the engine", async () => {
        await createWbReview();
        const deleter = await createDeleterContext();
        engineCalls.length = 0;

        const result = await cancelForDelete(deleter, {
            model: "wb.page",
            targetId: "page-1",
            action: "trash"
        });

        expect(result.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(result.error.data).toEqual({ model: "wb.page", targetId: "page-1" });
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the target read throws, and cancels nothing", async () => {
        const { admin, entry, review } = await createScenario();
        const deleter = await createDeleterContext();
        throwingTargetRevisions.add(entry.id);

        const result = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["ListTargetReviews"]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("fails with a persistence error when the model-level delete check throws (R87)", async () => {
        const { admin, entry, review } = await createScenario();
        const deleter = await createDeleterContext();
        throwingAccessChecks.add("canDeleteAnyEntry");

        const result = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("fails with a persistence error when the entry delete check throws (R87)", async () => {
        const { admin, entry, review } = await createScenario();
        const deleter = await createDeleterContext();
        throwingAccessChecks.add("canDelete");

        const result = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["ListTargetReviews"]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("reports a missing or mismatched target by the entry id, and cancels nothing", async () => {
        const { entry } = await createScenario();
        const deleter = await createDeleterContext();

        missingTargetRevisions.add(entry.id);
        const missing = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });
        missingTargetRevisions.clear();
        mismatchedTargetRevisions.add(entry.id);
        const mismatched = await cancelForDelete(deleter, {
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            action: "trash"
        });

        const data = { model: AUTHOR_NAMESPACE, targetId: entry.entryId };
        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(missing.error.data).toEqual(data);
        expect(mismatched.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(mismatched.error.data).toEqual(data);
        expect(engineCalls).toEqual(["ListTargetReviews", "ListTargetReviews"]);
    });
});
