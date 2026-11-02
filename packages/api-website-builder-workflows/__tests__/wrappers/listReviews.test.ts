import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewWithViewerFlags } from "@webiny/api-workflows/domain/review/types.js";
import { ReviewRepository } from "@webiny/api-workflows/domain/review/abstractions/ReviewRepository.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, startPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    OTHER_REVIEWER,
    REASSIGNER,
    REQUESTER,
    REVIEWER,
    WB_OWN_WRITER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_REASSIGN,
    WRITER
} from "~tests/__helpers/identities.js";
import {
    folderLevels,
    folderPermissionLists
} from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { scriptTargetReads, targetReads } from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    cmsEntryReads,
    countCmsEntryReads,
    resetCmsEntryReads
} from "~tests/__helpers/CountingCmsEntryReads.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { ListWebsiteBuilderPageReviewsUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";
import type { ListWebsiteBuilderPageReviewsInput } from "~/features/wrappers/ListWebsiteBuilderPageReviews/index.js";

/**
 * Admin stores the pages workflow; REQUESTER's reviews of a root page and of a page in
 * "folder-locked" (both awaiting team-1), then a Headless CMS review in the same team.
 */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const review = await requestPageReview(admin, page);
    // The order tests compare `lastChangedOn`; keep the two requests in different milliseconds.
    await new Promise(resolve => setTimeout(resolve, 5));
    const lockedReview = await requestPageReview(admin, lockedPage);
    const cmsReview = await createCmsReview(admin);
    return { admin, page, lockedPage, review, lockedReview, cmsReview };
};

/**
 * A context as the identity that counts the engine's calls, the target reads and the CMS entry
 * reads; setup contexts do not.
 */
const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[],
    legacyPlugins: unknown[] = []
) => {
    return createUserContext({
        identity,
        permissions,
        legacyPlugins: [countEngineCalls, scriptTargetReads, countCmsEntryReads, ...legacyPlugins]
    });
};

const list = (context: CmsContext, input: ListWebsiteBuilderPageReviewsInput) => {
    return context.container.resolve(ListWebsiteBuilderPageReviewsUseCase).execute(input);
};

const reviewIds = (rows: ReviewWithViewerFlags[]): string[] => {
    return rows.map(row => row.review.id);
};

describe("WB review list wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        targetReads.length = 0;
        resetCmsEntryReads();
    });

    afterEach(() => {
        folderLevels.clear();
        folderPermissionLists.count = 0;
    });

    it("lists the pool of page reviews with the viewer's flags, never a Headless CMS review (R46)", async () => {
        const { review, lockedReview, cmsReview } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await list(reviewer, { list: "pool" }));

        expect(reviewIds(result.items)).toEqual([review.id, lockedReview.id]);
        expect(reviewIds(result.items)).not.toContain(cmsReview.id);
        expect(result.items[0].flags).toEqual({
            canStart: true,
            canTakeOver: false,
            canApprove: false,
            canReject: false,
            canCancel: false,
            canReassign: false,
            canRestart: false
        });
        expect(result.meta.hasMoreItems).toBe(false);
        expect(engineCalls).toEqual(["ListReviews"]);
    });

    it("does not list a review of a page in a folder the viewer cannot read (D76)", async () => {
        const { review } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await list(reviewer, { list: "pool" }));

        expect(reviewIds(result.items)).toEqual([review.id]);
    });

    it("does not list a page review without page read permission, before the engine", async () => {
        await createScenario();
        const reviewer = await asUser(REVIEWER, []);

        const result = expectOk(await list(reviewer, { list: "pool" }));

        expect(result).toEqual({ items: [], meta: { cursor: null, hasMoreItems: false } });
        expect(engineCalls).toEqual([]);
    });

    it("lists only the reviews of the viewer's own pages with an own-only permission", async () => {
        const { admin } = await createScenario();
        const ownWriterSetup = await createUserContext({
            identity: WRITER,
            permissions: WB_OWN_WRITER
        });
        const ownPage = await createPage(ownWriterSetup, { title: "Own" });
        const ownReview = await requestPageReview(admin, ownPage, WRITER);
        const othersPage = await createPage(admin, { title: "Others" });
        const othersReview = await requestPageReview(admin, othersPage, WRITER);
        const ownWriter = await asUser(WRITER, WB_OWN_WRITER);
        const writer = await asUser(WRITER, WB_WRITER);

        const ownOnly = expectOk(await list(ownWriter, { list: "myRequests" }));
        const all = expectOk(await list(writer, { list: "myRequests" }));

        expect(reviewIds(ownOnly.items)).toEqual([ownReview.id]);
        expect(reviewIds(all.items).sort()).toEqual([ownReview.id, othersReview.id].sort());
    });

    it("lists with a fixed number of storage reads and no page read, whatever the number of rows (Q78)", async () => {
        const { admin } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, WB_READER);

        resetCmsEntryReads();
        const few = expectOk(await list(reviewer, { list: "pool" }));
        const fewReads = { ...cmsEntryReads };
        const fewFolderLists = folderPermissionLists.count;
        for (const title of ["Page B", "Page C", "Page D", "Page E", "Page F"]) {
            const page = await createPage(admin, { title });
            await requestPageReview(admin, page);
        }
        const more = await asUser(REVIEWER, WB_READER);
        resetCmsEntryReads();
        folderPermissionLists.count = 0;
        const many = expectOk(await list(more, { list: "pool" }));

        expect(few.items).toHaveLength(1);
        expect(many.items).toHaveLength(6);
        expect(cmsEntryReads).toEqual(fewReads);
        expect(cmsEntryReads.getRevisionById).toBe(0);
        expect(cmsEntryReads.getEntryById).toBe(0);
        expect(cmsEntryReads.getEntriesByIds).toBe(1);
        expect(folderPermissionLists.count).toBe(fewFolderLists);
        expect(fewFolderLists).toBe(1);
        expect(cmsEntryReads.getUniqueFieldValues).toBe(1);
        expect(targetReads).toEqual([]);
    });

    it("reads no folder rules when no page has an active review", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        await createCmsReview(admin);
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await list(reviewer, { list: "pool" }));

        expect(result.items).toEqual([]);
        expect(cmsEntryReads.getUniqueFieldValues).toBe(1);
        expect(folderPermissionLists.count).toBe(0);
    });

    it("lists my requests newest first (D119)", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = expectOk(await list(requester, { list: "myRequests" }));

        expect(reviewIds(result.items)).toEqual([lockedReview.id, review.id]);
        expect(result.items[0].flags.canCancel).toBe(true);
    });

    it("filters my requests by review state and refuses state filters on other lists (R91)", async () => {
        const { review, lockedReview } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);
        const reviewer = await asUser(REVIEWER, WB_READER);

        const inProgress = expectOk(
            await list(requester, { list: "myRequests", where: { reviewState: "inProgress" } })
        );
        const approved = expectOk(
            await list(requester, { list: "myRequests", where: { reviewState: "approved" } })
        );
        const refused = await list(reviewer, { list: "pool", where: { stepState: "awaiting" } });

        expect(reviewIds(inProgress.items)).toEqual([lockedReview.id, review.id]);
        expect(approved.items).toEqual([]);
        expect(refused.error.code).toBe("Workflows/Review/Validation");
    });

    it("lists assigned to me and team in review once a reviewer started a step", async () => {
        const { admin, review, lockedReview } = await createScenario();
        await startPageReview(admin, review);
        const reviewer = await asUser(REVIEWER, WB_READER);
        const otherReviewer = await asUser(OTHER_REVIEWER, WB_READER);

        const assigned = expectOk(await list(reviewer, { list: "assignedToMe" }));
        const teamInReview = expectOk(await list(otherReviewer, { list: "teamInReview" }));
        const pool = expectOk(await list(otherReviewer, { list: "pool" }));

        expect(reviewIds(assigned.items)).toEqual([review.id]);
        expect(assigned.items[0].flags).toMatchObject({ canApprove: true, canReject: true });
        expect(reviewIds(teamInReview.items)).toEqual([review.id]);
        expect(teamInReview.items[0].flags).toMatchObject({ canTakeOver: true, canApprove: false });
        expect(reviewIds(pool.items)).toEqual([lockedReview.id]);
    });

    it("filters by title", async () => {
        const { lockedReview } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(
            await list(reviewer, { list: "pool", where: { titleContains: "Locked" } })
        );

        expect(reviewIds(result.items)).toEqual([lockedReview.id]);
    });

    it("pages with the engine's cursor without losing or repeating a row (R92)", async () => {
        const { review, lockedReview } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const first = expectOk(await list(reviewer, { list: "pool", limit: 1 }));
        const second = expectOk(
            await list(reviewer, { list: "pool", limit: 1, after: first.meta.cursor })
        );

        expect(reviewIds(first.items)).toEqual([review.id]);
        expect(first.meta.hasMoreItems).toBe(true);
        expect(typeof first.meta.cursor).toBe("string");
        expect(reviewIds(second.items)).toEqual([lockedReview.id]);
        expect(second.meta.hasMoreItems).toBe(false);
    });

    it("refuses the failed steps list without reassign, before the engine (R95)", async () => {
        await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await list(reviewer, { list: "failedSteps" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list failed steps" });
        expect(engineCalls).toEqual([]);
    });

    it("lists a failed AI step for a viewer with reassign (D112)", async () => {
        const { admin, review } = await createScenario();
        // Seeded straight through the repository so the test controls the failed step exactly (the
        // runner produces them for real, R146).
        expectOk(
            await admin.container.resolve(ReviewRepository).update({
                ...review,
                currentStepState: "failed",
                currentStepType: "ai",
                steps: review.steps.map(step => {
                    return { ...step, type: "ai", state: "failed" };
                })
            })
        );
        const reassigner = await asUser(REASSIGNER, [...WB_READER, WORKFLOWS_REASSIGN]);

        const result = expectOk(await list(reassigner, { list: "failedSteps" }));

        expect(reviewIds(result.items)).toEqual([review.id]);
        expect(result.items[0].review.currentStepType).toBe("ai");
        expect(engineCalls).toEqual(["ListReviews"]);
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER, [throwOnWorkflowsPermissions]);

        const result = await list(reviewer, { list: "pool" });

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("refuses an anonymous identity, before the engine", async () => {
        await createScenario();
        const anonymous = await asUser(null, []);

        const result = await list(anonymous, { list: "pool" });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("lists a failed automation step for a viewer with reassign (D112)", async () => {
        const { admin, review } = await createScenario();
        expectOk(
            await admin.container.resolve(ReviewRepository).update({
                ...review,
                currentStepState: "failed",
                currentStepType: "automation",
                steps: review.steps.map(step => {
                    return { ...step, type: "automation", state: "failed" };
                })
            })
        );
        const reassigner = await asUser(REASSIGNER, [...WB_READER, WORKFLOWS_REASSIGN]);

        const result = expectOk(await list(reassigner, { list: "failedSteps" }));

        expect(reviewIds(result.items)).toEqual([review.id]);
        expect(result.items[0].review.currentStepType).toBe("automation");
    });
});
