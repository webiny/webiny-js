import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { readPage, requestPageReview, STEP_ID, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    NOBODY,
    READER,
    REQUESTER,
    REVIEWER,
    toActor,
    WB_READER,
    WB_WRITER
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { GetCmsEntryReviewUseCase } from "@webiny/api-headless-cms-workflows/features/wrappers/GetCmsEntryReview/index.js";
import { RequestWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/RequestWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";

/** Admin stores the pages workflow and creates a page in the root and one in "folder-locked". */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    return { admin, page, lockedPage };
};

/**
 * A context that counts the engine's calls and can throw on target reads and access checks; setup
 * contexts do not.
 */
const createCountingContext = (params: UserContextParams) => {
    return createUserContext({
        ...params,
        legacyPlugins: [countEngineCalls, scriptTargetReads, throwOnAccessChecks]
    });
};

const request = (context: CmsContext, page: WbPage) => {
    return context.container
        .resolve(RequestWebsiteBuilderPageReviewUseCase)
        .execute({ targetId: page.entryId, targetRevisionId: page.id });
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetWebsiteBuilderPageReviewUseCase).execute({ id });
};

describe("WB request and get review wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("requests a review for a user with write access, as that user", async () => {
        const { admin, page } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: WB_WRITER });

        const review = expectOk(await request(requester, page));

        expect(review.model).toBe("wb.page");
        expect(review.createdBy).toEqual(toActor(REQUESTER));
        expect((await readPage(admin, page.id)).system?.workflow?.reviewState).toBe("inProgress");
    });

    it("refuses a request without write access (D77)", async () => {
        const { page } = await createScenario();
        const reader = await createCountingContext({ identity: READER, permissions: WB_READER });

        const result = await request(reader, page);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "request a review" });
        expect(engineCalls).toEqual([]);
    });

    it("refuses a request without folder write access", async () => {
        const { lockedPage } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "viewer"]]));
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: WB_WRITER
        });

        const result = await request(requester, lockedPage);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "request a review" });
        expect(engineCalls).toEqual([]);
    });

    it("refuses a user without page permissions before loading the page (R75)", async () => {
        const { page } = await createScenario();
        const nobody = await createCountingContext({ identity: NOBODY, permissions: [] });
        const requestReview = nobody.container.resolve(RequestWebsiteBuilderPageReviewUseCase);

        const existing = await requestReview.execute({
            targetId: page.entryId,
            targetRevisionId: page.id
        });
        const missing = await requestReview.execute({
            targetId: page.entryId,
            targetRevisionId: `${page.entryId}#0009`
        });

        expect(existing.error.code).toBe("Workflows/NotAuthorized");
        expect(missing.error.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual([]);
    });

    it("reports a missing page as not found for a user with page permissions", async () => {
        const { page } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: WB_WRITER
        });

        const result = await requester.container
            .resolve(RequestWebsiteBuilderPageReviewUseCase)
            .execute({ targetId: page.entryId, targetRevisionId: `${page.entryId}#0009` });

        expect(result.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).toEqual([]);
    });

    it("rejects a pick on a step without manual picks (R61)", async () => {
        const { page } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: WB_WRITER });

        const result = await requester.container
            .resolve(RequestWebsiteBuilderPageReviewUseCase)
            .execute({
                targetId: page.entryId,
                targetRevisionId: page.id,
                picks: [{ stepId: STEP_ID, userId: REVIEWER.id }]
            });

        expect(result.error.code).toBe("Workflows/Review/Validation");
    });

    it("returns the review with the viewer's flags (spec 5.3)", async () => {
        const { admin, page } = await createScenario();
        const review = await requestPageReview(admin, page);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: WB_READER });
        const requester = await createUserContext({ identity: REQUESTER, permissions: WB_WRITER });

        const asReviewer = expectOk(await getReview(reviewer, review.id));
        const asRequester = expectOk(await getReview(requester, review.id));

        expect(asReviewer.review.id).toBe(review.id);
        expect(asReviewer.flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(asRequester.flags).toMatchObject({ canStart: false, canCancel: true });
    });

    it("refuses get review without read access to the page", async () => {
        const { admin, lockedPage } = await createScenario();
        const review = await requestPageReview(admin, lockedPage);
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: WB_READER });
        const nobody = await createUserContext({ identity: NOBODY, permissions: [] });

        const folderDenied = await getReview(reviewer, review.id);
        const permissionDenied = await getReview(nobody, review.id);

        expect(folderDenied.error.code).toBe("Workflows/NotAuthorized");
        expect(folderDenied.error.data).toEqual({ action: "view this review" });
        expect(permissionDenied.error.code).toBe("Workflows/NotAuthorized");
        expect(permissionDenied.error.data).toEqual({ action: "view this review" });
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const admin = await createUserContext();
        const cmsReview = await createCmsReview(admin);
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: WB_READER
        });
        engineCalls.length = 0;

        const result = await getReview(reviewer, cmsReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).toEqual(["GetReview"]);
    });

    it("reports a page review as not found through the Headless CMS wrapper (R46)", async () => {
        const { admin, page } = await createScenario();
        const review = await requestPageReview(admin, page);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: WB_READER });

        const result = await reviewer.container
            .resolve(GetCmsEntryReviewUseCase)
            .execute({ id: review.id });

        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });

    it("refuses an anonymous identity, before the engine", async () => {
        const { admin, page } = await createScenario();
        const review = await requestPageReview(admin, page);
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const requested = await request(anonymous, page);
        const viewed = await getReview(anonymous, review.id);

        expect(requested.error.code).toBe("Workflows/NotAuthenticated");
        expect(viewed.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("reports a target id that is not the revision's page as not found", async () => {
        const { page } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: WB_WRITER
        });

        const result = await request(requester, { ...page, entryId: "another-page" });

        expect(result.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).toEqual([]);
    });

    it("refuses get review when the revision is another page's (D2)", async () => {
        const { admin, page } = await createScenario();
        const review = await requestPageReview(admin, page);
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: WB_READER
        });
        mismatchedTargetRevisions.add(page.id);

        const result = await getReview(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(engineCalls).toEqual(["GetReview"]);
    });

    it("fails with a persistence error when the target read throws", async () => {
        const { admin, page } = await createScenario();
        const review = await requestPageReview(admin, page);
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: WB_WRITER
        });
        throwingTargetRevisions.add(page.id);

        const requested = await request(requester, page);
        const viewed = await getReview(requester, review.id);

        expect(requested.error.code).toBe("Workflows/Review/Persistence");
        expect(viewed.error.code).toBe("Workflows/Review/Persistence");
        // The request stops before the engine; the get reads the review, then the page.
        expect(engineCalls).toEqual(["GetReview"]);
    });

    it("fails a request with a persistence error when the entity write check throws (R87)", async () => {
        const { page } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: WB_WRITER
        });
        throwingAccessChecks.add("canWriteAnyPage");

        const result = await request(requester, page);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails a request with a persistence error when the write check throws (R87)", async () => {
        const { page } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: WB_WRITER
        });
        throwingAccessChecks.add("canWrite");

        const result = await request(requester, page);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails get review with a persistence error when the read check throws (R87)", async () => {
        const { admin, page } = await createScenario();
        const review = await requestPageReview(admin, page);
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: WB_READER
        });
        throwingAccessChecks.add("canRead");

        const result = await getReview(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["GetReview"]);
    });
});
