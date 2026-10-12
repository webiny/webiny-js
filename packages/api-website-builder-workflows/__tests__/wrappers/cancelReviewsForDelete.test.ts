import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { approvePageReview, requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { toActor, WB_DELETER, WB_WRITER, WRITER } from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    nullTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import {
    RecordingEventPublisher,
    recordedEvents
} from "~tests/__helpers/RecordingEventPublisher.js";
import { CancelCmsEntryReviewsForDeleteUseCase } from "@webiny/api-headless-cms-workflows/features/wrappers/CancelCmsEntryReviewsForDelete/index.js";
import { PAGE_MODEL_ID } from "@webiny/api-website-builder/domain/page/page.model.js";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.js";

/** Admin stores the pages workflow; REQUESTER's review is in progress on one page. */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const review = await requestPageReview(admin, page);
    return { admin, page, review };
};

/** WRITER with page delete rights and no workflows permission, recording events (R80). */
const createDeleterContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: WRITER,
        permissions: WB_DELETER,
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

const cancelForDelete = (
    context: CmsContext,
    input: CancelWebsiteBuilderPageReviewsForDeleteUseCase.Input
) => {
    return context.container
        .resolve(CancelWebsiteBuilderPageReviewsForDeleteUseCase)
        .execute(input);
};

describe("WB cancel-for-delete wrapper (D134)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
        nullTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("lets a user who may trash the page cancel its review, then trash it", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = await createDeleterContext();
        const trashPage = deleter.container.resolve(TrashPageUseCase);

        await expect(trashPage.execute({ id: page.id })).rejects.toMatchObject({
            code: "Workflows/Review/ActiveReviewOnTrash"
        });
        const cancelled = expectOk(
            await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" })
        );
        const trashed = await trashPage.execute({ id: page.id });

        expect(cancelled.map(item => item.id)).toEqual([review.id]);
        const facts = recordedEvents
            .filter(event => event.eventType === "Workflows/Review/Cancelled")
            .map(event => event.payload.fact);
        expect(facts).toEqual([
            expect.objectContaining({ actor: toActor(WRITER), reason: "content trashed" })
        ]);
        expect(trashed.isOk()).toBe(true);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("cancelled");
    });

    it("refuses a user who cannot delete the page, and keeps the review", async () => {
        const { admin, page, review } = await createScenario();
        const writer = await createUserContext({
            identity: WRITER,
            permissions: WB_WRITER,
            legacyPlugins: [countEngineCalls]
        });

        const result = await cancelForDelete(writer, { targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel the review to delete this content" });
        expect(engineCalls).toEqual([]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("answers a user without page delete permission the same for a page with and without a review (R86)", async () => {
        const { admin, page } = await createScenario();
        const idle = await createPage(admin, { title: "Page B" });
        const writer = await createUserContext({
            identity: WRITER,
            permissions: WB_WRITER,
            legacyPlugins: [countEngineCalls]
        });

        const withReview = await cancelForDelete(writer, {
            targetId: page.entryId,
            action: "trash"
        });
        const withoutReview = await cancelForDelete(writer, {
            targetId: idle.entryId,
            action: "trash"
        });
        const missing = await cancelForDelete(writer, {
            targetId: "missing-page",
            action: "trash"
        });

        expect(withReview.error.code).toBe("Workflows/NotAuthorized");
        expect(withoutReview.error.code).toBe(withReview.error.code);
        expect(withoutReview.error.data).toEqual(withReview.error.data);
        expect(missing.error.code).toBe(withReview.error.code);
        expect(missing.error.data).toEqual(withReview.error.data);
        expect(engineCalls).toEqual([]);
    });

    it("refuses a user without folder delete access", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
        await requestPageReview(admin, page);
        // ACO `viewer` may read but not write or delete folder content.
        folderLevels.set("folder-locked", new Map([[WRITER.id, "viewer"]]));
        const deleter = await createDeleterContext();

        const result = await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual(["ListTargetReviews"]);
    });

    it("cancels nothing when no review is in progress", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        await approvePageReview(admin, await requestPageReview(admin, page));
        const deleter = await createDeleterContext();

        const cancelled = expectOk(
            await cancelForDelete(deleter, { targetId: page.entryId, action: "delete" })
        );

        expect(cancelled).toEqual([]);
        expect(engineCalls).toEqual(["ListTargetReviews"]);
    });

    it("cancels nothing for a Headless CMS entry's review, and refuses an anonymous identity", async () => {
        const admin = await createUserContext();
        const cmsReview = await createCmsReview(admin);
        const deleter = await createDeleterContext();
        const anonymous = await createUserContext({
            identity: null,
            permissions: [],
            legacyPlugins: [countEngineCalls]
        });
        engineCalls.length = 0;

        const otherApp = expectOk(
            await cancelForDelete(deleter, { targetId: cmsReview.targetId, action: "trash" })
        );
        const unauthenticated = await cancelForDelete(anonymous, {
            targetId: cmsReview.targetId,
            action: "trash"
        });

        expect(otherApp).toEqual([]);
        expect(engineCalls).toEqual(["ListTargetReviews"]);
        expect(unauthenticated.error.code).toBe("Workflows/NotAuthenticated");
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: cmsReview.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("is not cancelled through the Headless CMS wrapper (R46)", async () => {
        const { admin, page, review } = await createScenario();

        const result = await admin.container
            .resolve(CancelCmsEntryReviewsForDeleteUseCase)
            .execute({ model: `cms.${PAGE_MODEL_ID}`, targetId: page.entryId, action: "trash" });

        // The CMS wrapper does not serve the private page model, so it cancels nothing.
        expect(result.error.code).toBe("Workflows/NotAuthorized");
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("reports a missing target by the page id, and cancels nothing", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = await createDeleterContext();
        nullTargetRevisions.add(page.id);

        const result = await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(result.error.data).toEqual({ model: "wb.page", targetId: page.entryId });
        expect(engineCalls).toEqual(["ListTargetReviews"]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("fails with a persistence error when the target read throws, and cancels nothing", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = await createDeleterContext();
        throwingTargetRevisions.add(page.id);

        const result = await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["ListTargetReviews"]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("fails with a persistence error when the entity-level delete check throws (R87)", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = await createDeleterContext();
        throwingAccessChecks.add("canDeleteAnyPage");

        const result = await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("fails with a persistence error when the page delete check throws (R87)", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = await createDeleterContext();
        throwingAccessChecks.add("canDelete");

        const result = await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["ListTargetReviews"]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("reports a mismatched target by the page id, and cancels nothing", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = await createDeleterContext();
        mismatchedTargetRevisions.add(page.id);

        const result = await cancelForDelete(deleter, { targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(result.error.data).toEqual({ model: "wb.page", targetId: page.entryId });
        expect(engineCalls).toEqual(["ListTargetReviews"]);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });
});
