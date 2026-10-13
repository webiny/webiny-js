import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { seedAssignments } from "~tests/__helpers/assignments.js";
import {
    EDITOR,
    NOBODY,
    REASSIGNER,
    REVIEWER,
    WB_READER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { failListReviewAssignments } from "~tests/__helpers/FailingListReviewAssignments.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { failGetTargetReview } from "~tests/__helpers/FailingGetTargetReview.js";
import {
    scriptTargetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { GetWebsiteBuilderPageReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageReview/index.js";
import { GetWebsiteBuilderPageTargetReviewUseCase } from "~/features/wrappers/GetWebsiteBuilderPageTargetReview/index.js";

/**
 * Admin stores the pages workflow; REQUESTER's review of a root page with two seeded log records,
 * a locked page with a review, and a page without one.
 */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const quietPage = await createPage(admin, { title: "Quiet page" });
    const review = await requestPageReview(admin, page);
    await requestPageReview(admin, lockedPage);
    const assignments = await seedAssignments(admin, review);
    return { admin, page, lockedPage, quietPage, review, assignments };
};

const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[],
    legacyPlugins: unknown[] = []
) => {
    return createUserContext({
        identity,
        permissions,
        legacyPlugins: [countEngineCalls, scriptTargetReads, throwOnAccessChecks, ...legacyPlugins]
    });
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetWebsiteBuilderPageReviewUseCase).execute({ id });
};

const getTargetReview = (context: CmsContext, targetRevisionId: string) => {
    return context.container
        .resolve(GetWebsiteBuilderPageTargetReviewUseCase)
        .execute({ targetRevisionId });
};

describe("WB target review and assignment entries", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingTargetRevisions.clear();
        throwingAccessChecks.clear();
    });

    it("drops skip entries from the review read for a plain reviewer (D89, D127)", async () => {
        const { review, assignments } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await getReview(reviewer, review.id));

        expect(result.review.steps[0].assignments.map(record => record.id)).toEqual([
            assignments.outcome.id
        ]);
        expect(result.flags.canStart).toBe(true);
        expect(engineCalls).toEqual(["GetReview", "ListReviewAssignments"]);
    });

    it("keeps skip entries for editor and reassign, newest first", async () => {
        const { review, assignments } = await createScenario();
        const editor = await asUser(EDITOR, [...WB_READER, WORKFLOWS_EDITOR]);
        const reassigner = await asUser(REASSIGNER, [...WB_READER, WORKFLOWS_REASSIGN]);

        const asEditor = expectOk(await getReview(editor, review.id));
        const asReassigner = expectOk(await getReview(reassigner, review.id));

        const expected = [assignments.outcome.id, assignments.skip.id];
        expect(asEditor.review.steps[0].assignments.map(record => record.id)).toEqual(expected);
        expect(asReassigner.review.steps[0].assignments.map(record => record.id)).toEqual(expected);
        expect(asEditor.review.steps[0].assignments[1]).toMatchObject({
            kind: "skip",
            userId: REVIEWER.id,
            reason: "pick excluded"
        });
    });

    it("fails get review with the assignment persistence error when the log read fails (R87)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER, [failListReviewAssignments]);

        const result = await getReview(reviewer, review.id);

        expect(result.error.code).toBe("Workflows/Assignment/Persistence");
    });

    it("returns the active review of a page revision with flags and redacted entries", async () => {
        const { page, review, assignments } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await getTargetReview(reviewer, page.id));

        expect(result?.review.id).toBe(review.id);
        expect(result?.flags.canStart).toBe(true);
        expect(result?.review.steps[0].assignments.map(record => record.id)).toEqual([
            assignments.outcome.id
        ]);
        expect(engineCalls).toEqual(["GetTargetReview", "ListReviewAssignments"]);
    });

    it("keeps skip entries in the target review for an editor", async () => {
        const { page, assignments } = await createScenario();
        const editor = await asUser(EDITOR, [...WB_READER, WORKFLOWS_EDITOR]);

        const result = expectOk(await getTargetReview(editor, page.id));

        expect(result?.review.steps[0].assignments.map(record => record.id)).toEqual([
            assignments.outcome.id,
            assignments.skip.id
        ]);
    });

    it("returns null for a revision without an active review", async () => {
        const { quietPage } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = expectOk(await getTargetReview(reviewer, quietPage.id));

        expect(result).toBeNull();
        expect(engineCalls).toEqual(["GetTargetReview"]);
    });

    it("refuses a page the viewer cannot read, a missing revision, a trashed page and no page permission, before the engine (R108)", async () => {
        const { admin, page, lockedPage, quietPage } = await createScenario();
        expectOk(await admin.container.resolve(TrashPageUseCase).execute({ id: quietPage.id }));
        folderLevels.set("folder-locked", new Map([[REVIEWER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, WB_READER);
        const nobody = await asUser(NOBODY, []);

        const folderDenied = await getTargetReview(reviewer, lockedPage.id);
        const missing = await getTargetReview(reviewer, `${page.entryId}#0009`);
        const trashed = await getTargetReview(reviewer, quietPage.id);
        const permissionDenied = await getTargetReview(nobody, page.id);

        for (const result of [folderDenied, missing, trashed, permissionDenied]) {
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "view this review" });
        }
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        const { page, review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER, [throwOnWorkflowsPermissions]);

        const byTarget = await getTargetReview(reviewer, page.id);
        const byReview = await getReview(reviewer, review.id);

        expect(byTarget.error.code).toBe("Workflows/Review/Persistence");
        expect(byReview.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails with a persistence error when the target read or the read check throws (R87)", async () => {
        const { page } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        throwingTargetRevisions.add(page.id);
        const readThrows = await getTargetReview(reviewer, page.id);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canRead");
        const checkThrows = await getTargetReview(reviewer, page.id);

        expect(readThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(checkThrows.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual([]);
    });

    it("fails the target review with the assignment persistence error when the log read fails (R87)", async () => {
        const { page } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER, [failListReviewAssignments]);

        const result = await getTargetReview(reviewer, page.id);

        expect(result.error.code).toBe("Workflows/Assignment/Persistence");
    });

    it("refuses an anonymous identity, before the engine", async () => {
        const { page } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await getTargetReview(anonymous, page.id);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).toEqual([]);
    });

    it("fails the target review with the engine's error when the review lookup fails (R87)", async () => {
        const { page } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER, [failGetTargetReview]);

        const result = await getTargetReview(reviewer, page.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
    });
});
