import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, createModelEntry, expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview, startEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext, type UserContextParams } from "~tests/__helpers/userContext.js";
import {
    NOBODY,
    OTHER_REVIEWER,
    REASSIGNER,
    REQUESTER,
    REVIEWER
} from "~tests/__helpers/identities.js";
import { CMS_READER, CMS_WRITER, WORKFLOWS_REASSIGN } from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { createWbReview } from "~tests/__helpers/wbReview.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingCmsEntryAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { throwOnListModels } from "~tests/__helpers/ThrowingListModels.js";
import { failListModels } from "~tests/__helpers/FailingListModels.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { seedFailedStep, seedReviewOnTarget } from "~tests/__helpers/seeds.js";
import { ListCmsEntryReviewsUseCase } from "~/features/wrappers/ListCmsEntryReviews/index.js";

/**
 * Admin stores the workflow; REQUESTER asks for a review of "Ann" (root folder) and of "Locked"
 * ("folder-locked"). Both first steps wait in the pool of the reviewers' team.
 */
const createScenario = async () => {
    const admin = await createUserContext();
    expectOk(await storeWorkflow(admin));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, lockedEntry, review, lockedReview };
};

/**
 * A context that counts the engine's calls and can throw on target reads and access checks; setup
 * contexts do not.
 */
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

const list = (context: CmsContext, input: ListCmsEntryReviewsUseCase.Input) => {
    return context.container.resolve(ListCmsEntryReviewsUseCase).execute(input);
};

describe("CMS review list wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("lists the pool with the viewer's flags per row (A43)", async () => {
        const { review, lockedReview } = await createScenario();
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const page = expectOk(await list(reviewer, { list: "pool" }));

        expect(page.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(page.items[0].flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(page.meta).toEqual({ cursor: null, hasMoreItems: false });
    });

    it("does not list a review of an entry in a folder the viewer cannot read", async () => {
        const { review } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });

        const page = expectOk(await list(reviewer, { list: "pool" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
        expect(page.items.map(item => item.review.title)).toEqual(["Ann"]);
    });

    it("lists the reviews assigned to me and the team's reviews in review", async () => {
        const { admin, review } = await createScenario();
        await startEntryReview(admin, review, REVIEWER);
        const reviewer = await createUserContext({ identity: REVIEWER, permissions: CMS_READER });
        const otherReviewer = await createUserContext({
            identity: OTHER_REVIEWER,
            permissions: CMS_READER
        });

        const assigned = expectOk(await list(reviewer, { list: "assignedToMe" }));
        const teamInReview = expectOk(await list(otherReviewer, { list: "teamInReview" }));
        const ownTeamInReview = expectOk(await list(reviewer, { list: "teamInReview" }));

        expect(assigned.items.map(item => item.review.id)).toEqual([review.id]);
        expect(assigned.items[0].flags.canApprove).toBe(true);
        expect(teamInReview.items.map(item => item.review.id)).toEqual([review.id]);
        expect(teamInReview.items[0].flags.canApprove).toBe(false);
        expect(ownTeamInReview.items).toEqual([]);
    });

    it("lists only the requests of the viewer", async () => {
        const { admin, review, lockedReview } = await createScenario();
        const otherEntry = await createAuthorEntry(admin, { name: "Other" });
        await requestEntryReview(admin, otherEntry, OTHER_REVIEWER);
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const page = expectOk(await list(requester, { list: "myRequests" }));

        expect(page.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(page.items.every(item => item.flags.canCancel)).toBe(true);
    });

    it("does not list the reviews of another app (R46)", async () => {
        const { review, lockedReview } = await createScenario();
        await createWbReview();
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const page = expectOk(await list(requester, { list: "myRequests" }));

        expect(page.items.map(item => item.review.model)).toEqual(["cms.author", "cms.author"]);
        expect(page.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
    });

    it("lists only the given model and returns an empty page for a model it cannot list (R94)", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const author = expectOk(
            await list(requester, { list: "myRequests", where: { modelId: "author" } })
        );
        engineCalls.length = 0;
        const unknown = expectOk(
            await list(requester, { list: "myRequests", where: { modelId: "book" } })
        );

        expect(author.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(unknown).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("filters by title", async () => {
        const { lockedReview } = await createScenario();
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const page = expectOk(
            await list(requester, { list: "myRequests", where: { titleContains: "Lock" } })
        );

        expect(page.items.map(item => item.review.id)).toEqual([lockedReview.id]);
    });

    it("refuses the failed steps list without reassign", async () => {
        await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });

        const result = await list(reviewer, { list: "failedSteps" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list failed steps" });
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("lists failed AI and automation steps for a viewer with reassign (D112)", async () => {
        const { admin, review } = await createScenario();
        await seedFailedStep(admin, review);
        const reassigner = await createUserContext({
            identity: REASSIGNER,
            permissions: [...CMS_READER, WORKFLOWS_REASSIGN]
        });

        const page = expectOk(await list(reassigner, { list: "failedSteps" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
        expect(page.items[0].review.currentStepType).toBe("ai");
    });

    it("pages with the cursor without losing or repeating a review", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await createUserContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });

        const first = expectOk(await list(requester, { list: "myRequests", limit: 1 }));
        const second = expectOk(
            await list(requester, { list: "myRequests", limit: 1, after: first.meta.cursor })
        );

        expect(first.items).toHaveLength(1);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(first.meta.cursor).toEqual(expect.any(String));
        expect(second.items).toHaveLength(1);
        expect([...first.items, ...second.items].map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
    });

    it("returns an empty page for a viewer who can read no model, before the engine", async () => {
        await createScenario();
        const nobody = await createCountingContext({ identity: NOBODY, permissions: [] });

        const page = expectOk(await list(nobody, { list: "pool" }));

        expect(page).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [throwOnWorkflowsPermissions]
        });

        const result = await list(reviewer, { list: "pool" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("refuses an anonymous identity, before the engine", async () => {
        await createScenario();
        const anonymous = await createCountingContext({ identity: null, permissions: [] });

        const result = await list(anonymous, { list: "pool" });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("counts a target read or read check that throws as unreadable (R92)", async () => {
        const { review, lockedEntry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });
        throwingTargetRevisions.add(lockedEntry.id);

        const page = expectOk(await list(reviewer, { list: "pool" }));
        throwingAccessChecks.add("canRead");
        const nothingReadable = expectOk(await list(reviewer, { list: "pool" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
        expect(nothingReadable.items).toEqual([]);
    });

    it("fails with a persistence error when the model list throws (R87)", async () => {
        await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [throwOnListModels]
        });

        const result = await list(reviewer, { list: "pool" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("treats an empty model id as a model that matches nothing, before the engine", async () => {
        await createScenario();
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER
        });
        engineCalls.length = 0;

        const page = expectOk(
            await list(requester, { list: "myRequests", where: { modelId: "" } })
        );

        expect(page).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        expect(engineCalls).not.toContain("ListReviews");
    });

    it("does not list a review of a model that cannot be bound, even when asked for it", async () => {
        const { review, lockedReview } = await createScenario();
        const admin = await createUserContext({ legacyPlugins: createExtraModelPlugins() });
        const unpublishable = await createModelEntry(admin, "siteSetting", { name: "Footer" });
        await seedReviewOnTarget(admin, review, {
            id: "review-site-setting",
            model: "cms.siteSetting",
            targetId: unpublishable.entryId,
            targetRevisionId: unpublishable.id
        });
        const requester = await createCountingContext({
            identity: REQUESTER,
            permissions: CMS_WRITER,
            legacyPlugins: createExtraModelPlugins()
        });
        engineCalls.length = 0;

        const all = expectOk(await list(requester, { list: "myRequests" }));
        const asked = expectOk(
            await list(requester, { list: "myRequests", where: { modelId: "siteSetting" } })
        );

        expect(all.items.map(item => item.review.id).sort()).toEqual(
            [review.id, lockedReview.id].sort()
        );
        expect(asked).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
    });

    it("does not list a review whose target is another entry's revision", async () => {
        const { review, lockedEntry } = await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER
        });
        mismatchedTargetRevisions.add(lockedEntry.id);

        const page = expectOk(await list(reviewer, { list: "pool" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
    });

    it("lists a failed automation step for a viewer with reassign (D112)", async () => {
        const { admin, review } = await createScenario();
        await seedFailedStep(admin, review, "automation");
        const reassigner = await createUserContext({
            identity: REASSIGNER,
            permissions: [...CMS_READER, WORKFLOWS_REASSIGN]
        });

        const page = expectOk(await list(reassigner, { list: "failedSteps" }));

        expect(page.items.map(item => item.review.id)).toEqual([review.id]);
        expect(page.items[0].review.currentStepType).toBe("automation");
    });

    it("fails with a persistence error when the model list fails (R87)", async () => {
        await createScenario();
        const reviewer = await createCountingContext({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [failListModels]
        });

        const result = await list(reviewer, { list: "pool" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListReviews");
    });
});
