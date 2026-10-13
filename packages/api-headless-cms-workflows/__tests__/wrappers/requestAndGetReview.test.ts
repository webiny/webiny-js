import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { readEntry, requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { NOBODY, READER, REQUESTER, REVIEWER, toActor } from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { RequestCmsEntryReviewUseCase } from "~/features/wrappers/RequestCmsEntryReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";

/** Admin stores the workflow and creates an entry in the root and one in "folder-locked". */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    return { admin, entry, lockedEntry };
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

const request = (context: CmsContext, entry: CmsEntry) => {
    return context.container.resolve(RequestCmsEntryReviewUseCase).execute({
        model: AUTHOR_NAMESPACE,
        targetId: entry.entryId,
        targetRevisionId: entry.id
    });
};

const requestWithTitle = (context: CmsContext, entry: CmsEntry, title: string) => {
    return context.container.resolve(RequestCmsEntryReviewUseCase).execute({
        model: AUTHOR_NAMESPACE,
        targetId: entry.entryId,
        targetRevisionId: entry.id,
        title
    });
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetCmsEntryReviewUseCase).execute({ id });
};

describe("CMS request and get review wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("requests a review for a user with write access, as that user", async () => {
        const { admin, entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const review = expectOk(await request(requester, entry));

        expect(review.createdBy).toEqual(toActor(REQUESTER));
        expect((await readEntry(admin, entry.id)).system?.workflow?.reviewState).toBe("inProgress");
    });

    it("refuses a request without write access (D77)", async () => {
        const { entry } = await createScenario();
        const reader = await createUserContext({ identity: READER, permissions: CMS_READER });

        const result = await request(reader, entry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "request a review" });
    });

    it("refuses a request without folder write access", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "viewer"]]));
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const result = await request(requester, lockedEntry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "request a review" });
        expect(engineCalls).toEqual([]);
    });

    it("reports a target the user cannot see or of another app as not found (R46)", async () => {
        const { entry } = await createScenario();
        const nobody = await createUserContext({ identity: NOBODY, permissions: [] });
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const hidden = await request(nobody, entry);
        const otherApp = await requester.container.resolve(RequestCmsEntryReviewUseCase).execute({
            model: "wb.page",
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });

        expect(hidden.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
    });

    it("rejects a pick on a step without manual picks (R61)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await requester.container.resolve(RequestCmsEntryReviewUseCase).execute({
            model: AUTHOR_NAMESPACE,
            targetId: entry.entryId,
            targetRevisionId: entry.id,
            picks: [{ stepId: STEP_ID, userId: REVIEWER.id }]
        });

        expect(result.error.code).toBe("Workflows/Review/Validation");
    });

    it("returns the review with the viewer's flags (spec 5.3)", async () => {
        const { admin, entry } = await createScenario();
        const review = await requestEntryReview(admin, entry);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

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

    it("refuses get review without read access to the target", async () => {
        const { admin, lockedEntry } = await createScenario();
        const review = await requestEntryReview(admin, lockedEntry);
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        const nobody = await createUserContext({ identity: NOBODY, permissions: [] });

        const folderDenied = await getReview(reviewer, review.id);
        const modelDenied = await getReview(nobody, review.id);

        expect(folderDenied.error.code).toBe("Workflows/NotAuthorized");
        expect(folderDenied.error.data).toEqual({ action: "view this review" });
        expect(modelDenied.error.code).toBe("Workflows/NotAuthorized");
        expect(modelDenied.error.data).toEqual({ action: "view this review" });
    });

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const result = await getReview(reviewer, wbReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
    });

    it("refuses an anonymous identity, before the engine", async () => {
        const { admin, entry } = await createScenario();
        const review = await requestEntryReview(admin, entry);
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const requested = await request(anonymous, entry);
        const viewed = await getReview(anonymous, review.id);

        expect(requested.error.code).toBe("Workflows/NotAuthenticated");
        expect(viewed.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("does not call the engine when a request is refused", async () => {
        const { entry } = await createScenario();
        const reader = await createCountingContext({ identity: READER, permissions: CMS_READER });
        const nobody = await createCountingContext({ identity: NOBODY, permissions: [] });

        await request(reader, entry);
        await request(nobody, entry);
        await request(reader, { ...entry, entryId: "another-entry" });

        expect(engineCalls).not.toContain("RequestReview");
    });

    it("reports a target id that is not the revision's entry as not found", async () => {
        const { entry } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const result = await request(requester, { ...entry, entryId: "another-entry" });

        expect(result.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the target read throws", async () => {
        const { admin, entry } = await createScenario();
        const review = await requestEntryReview(admin, entry);
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });
        throwingTargetRevisions.add(entry.id);

        const requested = await request(requester, entry);
        const viewed = await getReview(requester, review.id);

        expect(requested.error.code).toBe("Workflows/Review/Persistence");
        expect(viewed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("RequestReview");
    });

    it("fails a request with a persistence error when the write check throws (R87)", async () => {
        const { entry } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });
        throwingAccessChecks.add("canWrite");

        const result = await request(requester, entry);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails get review with a persistence error when the read check throws (R87)", async () => {
        const { admin, entry } = await createScenario();
        const review = await requestEntryReview(admin, entry);
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });
        throwingAccessChecks.add("canRead");

        const result = await getReview(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["GetReview"]);
    });

    it("requests a review with the given title (R89)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const review = expectOk(await requestWithTitle(requester, entry, "  Spring launch  "));

        expect(review.title).toBe("Spring launch");
    });

    it("rejects a title shorter than 5 characters (R89)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const result = await requestWithTitle(requester, entry, " abc ");

        expect(result.error.code).toBe("Workflows/Review/Validation");
        expect(result.error.message).toBe("The review title must have at least 5 characters.");
    });

    it("uses the entry title when the title is empty (R89)", async () => {
        const { entry } = await createScenario();
        const requester = await createUserContext({ identity: REQUESTER, permissions: CMS_WRITER });

        const review = expectOk(await requestWithTitle(requester, entry, "   "));

        expect(review.title).toBe("Ann");
    });
});
