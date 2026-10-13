import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import {
    AUTHOR_NAMESPACE,
    createAuthorEntry,
    expectOk,
    getAuthorModel
} from "~tests/__helpers/entries.js";
import { requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import { EDITOR, NOBODY, REASSIGNER, REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER, WORKFLOWS_EDITOR, WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { failListReviewAssignments } from "~tests/__helpers/FailingListReviewAssignments.js";
import { SKIP_RECORD_REASON, seedAssignmentRecords } from "~tests/__helpers/seeds.js";
import { GetCmsEntryTargetReviewUseCase } from "~/features/wrappers/GetCmsEntryTargetReview/index.js";
import { GetCmsEntryReviewUseCase } from "~/features/wrappers/GetCmsEntryReview/index.js";

/**
 * Admin stores the workflow, creates "Ann" (reviewed), "Bob" (no review) and "Locked" (reviewed,
 * in "folder-locked").
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const unreviewedEntry = await createAuthorEntry(admin, { name: "Bob" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, unreviewedEntry, lockedEntry, review, lockedReview };
};

const createCountingContext = (params: UserContextParams) => {
    return createUserContext({
        ...params,
        legacyPlugins: [
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...(params.legacyPlugins ?? [])
        ]
    });
};

const getTargetReview = (context: CmsContext, entry: CmsEntry, model = AUTHOR_NAMESPACE) => {
    return context.container
        .resolve(GetCmsEntryTargetReviewUseCase)
        .execute({ model, targetRevisionId: entry.id });
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetCmsEntryReviewUseCase).execute({ id });
};

const trash = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: false });
};

describe("CMS target review wrapper and assignment entries", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("returns the active review of a revision with the viewer's flags", async () => {
        const { entry, review } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const result = expectOk(await getTargetReview(reviewer, entry));

        expect(result?.review.id).toBe(review.id);
        expect(result?.flags).toMatchObject({ canStart: true, canCancel: false });
        // The request wrote the pool outcome when the step was reached (R117).
        expect(result?.review.steps.map(step => step.id)).toEqual([STEP_ID]);
        expect(result?.review.steps[0].assignments).toMatchObject([
            {
                kind: "outcome",
                source: "pool",
                userId: null,
                ruleId: null,
                reason: null,
                reviewId: review.id
            }
        ]);
    });

    it("returns null for a revision without a review", async () => {
        const { unreviewedEntry } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const result = await getTargetReview(reviewer, unreviewedEntry);

        expect(result.isOk()).toBe(true);
        expect(result.value).toBeNull();
    });

    it("refuses a revision in a folder the viewer cannot read, before the engine", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const result = await getTargetReview(reviewer, lockedEntry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "view this review" });
        expect(engineCalls).toEqual([]);
    });

    it("refuses a revision the viewer cannot read, that does not exist or is trashed, before the engine (R108)", async () => {
        const { admin, entry, unreviewedEntry } = await createScenario();
        expectOk(await trash(admin, unreviewedEntry));
        const nobody = await createCountingContext({ identity: NOBODY, permissions: [] });
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const hidden = await getTargetReview(nobody, entry);
        const missing = await reviewer.container
            .resolve(GetCmsEntryTargetReviewUseCase)
            .execute({ model: AUTHOR_NAMESPACE, targetRevisionId: "missing#0001" });
        const trashed = await getTargetReview(reviewer, unreviewedEntry);

        for (const result of [hidden, missing, trashed]) {
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "view this review" });
        }
        expect(engineCalls).toEqual([]);
    });

    it("reports another app's namespace as not found (R46, R108)", async () => {
        const { entry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const otherApp = await getTargetReview(reviewer, entry, "wb.page");

        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(otherApp.error.data).toEqual({ model: "wb.page", targetRevisionId: entry.id });
        expect(engineCalls).toEqual([]);
    });

    it("refuses an anonymous identity, before the engine", async () => {
        const { entry } = await createScenario();
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const result = await getTargetReview(anonymous, entry);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        const { entry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [throwOnWorkflowsPermissions]
        });

        const result = await getTargetReview(reviewer, entry);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the target read or the read check throws (R87)", async () => {
        const { entry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        throwingTargetRevisions.add(entry.id);
        const readThrows = await getTargetReview(reviewer, entry);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canRead");
        const checkThrows = await getTargetReview(reviewer, entry);

        expect(readThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(checkThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("drops skip entries from the review read for a plain reviewer", async () => {
        const { admin, entry, review } = await createScenario();
        await seedAssignmentRecords(admin, review);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const byId = expectOk(await getReview(reviewer, review.id));
        const byRevision = expectOk(await getTargetReview(reviewer, entry));

        expect(byId.review.steps[0].assignments.map(record => record.kind)).toEqual(["outcome"]);
        expect(byRevision?.review.steps[0].assignments.map(record => record.kind)).toEqual([
            "outcome"
        ]);
        expect(byId.review.steps[0].assignments[0]).toMatchObject({
            reviewId: review.id,
            stepId: STEP_ID,
            userId: null,
            source: "pool"
        });
    });

    it("keeps skip entries for editor and reassign and drops them for everyone else", async () => {
        const { admin, entry, review } = await createScenario();
        await seedAssignmentRecords(admin, review);
        const editor = await createUserContext({
            identity: EDITOR,
            permissions: [WORKFLOWS_EDITOR, ...CMS_READER]
        });
        const reassigner = await createUserContext({
            identity: REASSIGNER,
            permissions: [WORKFLOWS_REASSIGN, ...CMS_READER]
        });

        const asEditor = expectOk(await getReview(editor, review.id));
        const asReassigner = expectOk(await getTargetReview(reassigner, entry));

        expect(asEditor.review.steps[0].assignments.map(record => record.kind)).toEqual([
            "skip",
            "outcome"
        ]);
        expect(asEditor.review.steps[0].assignments[0].reason).toBe(SKIP_RECORD_REASON);
        expect(asReassigner?.review.steps[0].assignments.map(record => record.kind)).toEqual([
            "skip",
            "outcome"
        ]);
    });

    it("fails the review read when the assignment log cannot be read (R96, R87)", async () => {
        const { entry, review } = await createScenario();
        const reviewer = await createUserContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [failListReviewAssignments]
        });

        const byId = await getReview(reviewer, review.id);
        const byRevision = await getTargetReview(reviewer, entry);

        expect(byId.error.code).toBe("Workflows/Assignment/Persistence");
        expect(byRevision.error.code).toBe("Workflows/Assignment/Persistence");
    });
});
