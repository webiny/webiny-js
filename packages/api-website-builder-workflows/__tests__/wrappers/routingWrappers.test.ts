import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewReassignTargetInvalidErrorData } from "@webiny/api-workflows/domain/review/errors.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import type { WbPage } from "@webiny/api-website-builder/domain/page/abstractions.js";
import { SaveWorkflowSettingsUseCase } from "@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    cancelPageReview,
    requestPageReview,
    STEP_ID,
    storeWbWorkflowWithAssignment
} from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    toActor,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { createWbFolder, failFolderReads, registerAco } from "~tests/__helpers/aco.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    mismatchedTargetRevisions,
    nullTargetRevisions,
    scriptTargetReads,
    targetReads,
    throwingTargetRevisions
} from "~tests/__helpers/ScriptedWbPageTargetReads.js";
import {
    throwingAccessChecks,
    throwOnAccessChecks
} from "~tests/__helpers/ThrowingWbPageAccess.js";
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { ReassignWebsiteBuilderPageReviewStepUseCase } from "~/features/wrappers/ReassignWebsiteBuilderPageReviewStep/index.js";
import { ListWebsiteBuilderPageStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageStepCandidates/index.js";
import { ListWebsiteBuilderPageReviewStepCandidatesUseCase } from "~/features/wrappers/ListWebsiteBuilderPageReviewStepCandidates/index.js";
import { InspectWebsiteBuilderPageRoutingUseCase } from "~/features/wrappers/InspectWebsiteBuilderPageRouting/index.js";
import { WebsiteBuilderPageFolderExistsUseCase } from "~/features/wrappers/WebsiteBuilderPageFolderExists/index.js";

/** Page permissions of the users routing evaluates as candidates (`CandidateReadAccess`). */
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER,
    [OTHER_REVIEWER.id]: WB_READER
};

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...WB_READER];
const ON_HOLIDAY = "On holiday.";

/**
 * Admin stores the pages workflow (pool of "team-1": REQUESTER, REVIEWER, OTHER_REVIEWER),
 * excludes OTHER_REVIEWER ("On holiday.") and REQUESTER asks for reviews of "Page A" (root) and
 * "Locked" ("folder-locked"). Both steps wait in the pool.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    // The request picker lists only for a step that allows a pick (D22).
    await storeWbWorkflowWithAssignment(admin, {
        strategy: "none",
        allowManualPick: true,
        rules: []
    });
    expectOk(
        await admin.container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [{ userId: OTHER_REVIEWER.id, reason: ON_HOLIDAY }]
        })
    );
    const page = await createPage(admin, { title: "Page A" });
    const lockedPage = await createPage(admin, { title: "Locked", folderId: "folder-locked" });
    const review = await requestPageReview(admin, page);
    const lockedReview = await requestPageReview(admin, lockedPage);
    return { admin, page, lockedPage, review, lockedReview };
};

/** REVIEWER cannot read "folder-locked"; the requester, the reassigner and OTHER_REVIEWER can. */
const lockFolderForReviewer = () => {
    folderLevels.set(
        "folder-locked",
        new Map([
            [REQUESTER.id, "owner"],
            [REASSIGNER.id, "owner"],
            [EDITOR.id, "owner"],
            [OTHER_REVIEWER.id, "viewer"]
        ])
    );
};

/** A context as the identity with the directory, counting the engine's calls. */
const asUser = (
    identity: IdentityData | null,
    permissions: SecurityPermission[],
    legacyPlugins: unknown[] = []
): Promise<CmsContext> => {
    return createUserContext({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [
            registerTestUsers,
            countEngineCalls,
            scriptTargetReads,
            throwOnAccessChecks,
            ...legacyPlugins
        ]
    });
};

const reassign = (context: CmsContext, reviewId: string, userId: string) => {
    return context.container
        .resolve(ReassignWebsiteBuilderPageReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, userId });
};

const listRequestCandidates = (context: CmsContext, page: WbPage, workflowId = "wb-workflow") => {
    return context.container.resolve(ListWebsiteBuilderPageStepCandidatesUseCase).execute({
        workflowId,
        stepId: STEP_ID,
        targetId: page.entryId,
        targetRevisionId: page.id
    });
};

const listReviewCandidates = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(ListWebsiteBuilderPageReviewStepCandidatesUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const inspect = (context: CmsContext, input: InspectWebsiteBuilderPageRoutingUseCase.Input) => {
    return context.container.resolve(InspectWebsiteBuilderPageRoutingUseCase).execute(input);
};

const folderExists = (context: CmsContext, id: string) => {
    return context.container.resolve(WebsiteBuilderPageFolderExistsUseCase).execute({ id });
};

/** An unsaved step config with one rule: pages under the folder (descendants) go to REVIEWER. */
const folderRuleConfig = (folderId: string) => {
    return {
        teams: [REVIEW_TEAM],
        assignment: {
            strategy: "none",
            allowManualPick: false,
            rules: [
                {
                    id: "rule-campaigns",
                    conditions: {
                        folder: { id: folderId, type: "wb:page", includeDescendants: true }
                    },
                    target: { type: "user", id: REVIEWER.id }
                }
            ]
        }
    };
};

/** Real ACO folders: Marketing > Campaigns > Spring (pages) and Articles (`cms:article`). */
const createFolders = async () => {
    const admin = await createUserContext({ legacyPlugins: [registerAco] });
    const marketing = await createWbFolder(admin, { title: "Marketing", slug: "marketing" });
    const campaigns = await createWbFolder(admin, {
        title: "Campaigns",
        slug: "campaigns",
        parentId: marketing.id
    });
    const spring = await createWbFolder(admin, {
        title: "Spring",
        slug: "spring",
        parentId: campaigns.id
    });
    const articles = await createWbFolder(admin, {
        title: "Articles",
        slug: "articles",
        type: "cms:article"
    });
    return { campaigns, spring, articles };
};

describe("WB reassign wrapper", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("reassigns a pool step to a team member (R119)", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const reassigned = expectOk(await reassign(reassigner, review.id, REVIEWER.id));

        expect(reassigned.currentStepState).toBe("inReview");
        expect(reassigned.currentOwnerId).toBe(REVIEWER.id);
        expect(reassigned.steps[0].assignment).toMatchObject({
            source: "reassign",
            by: toActor(REASSIGNER)
        });
        expect(engineCalls).toContain("ReassignReviewStep");
    });

    it("refuses the current owner in the engine", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);
        expectOk(await reassign(reassigner, review.id, REVIEWER.id));

        const again = await reassign(reassigner, review.id, REVIEWER.id);

        expect(again.error.code).toBe("Workflows/Review/AlreadyOwner");
    });

    it("refuses a user who cannot review the step, with the fixed reason (R112)", async () => {
        const { review, lockedReview } = await createScenario();
        lockFolderForReviewer();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const notMember = await reassign(reassigner, review.id, READER.id);
        const requester = await reassign(reassigner, review.id, REQUESTER.id);
        const excluded = await reassign(reassigner, review.id, OTHER_REVIEWER.id);
        const cannotRead = await reassign(reassigner, lockedReview.id, REVIEWER.id);

        const reasons = [notMember, requester, excluded, cannotRead].map(result => {
            expect(result.error.code).toBe("Workflows/Review/ReassignTargetInvalid");
            return (result.error.data as ReviewReassignTargetInvalidErrorData).reason;
        });
        expect(reasons).toEqual([
            "Not a member of the step's teams.",
            "The requester cannot review.",
            "Excluded from reviews.",
            "Cannot read this content."
        ]);
    });

    it("passes the engine's step guard errors through unchanged", async () => {
        const { admin, review, lockedReview } = await createScenario();
        await cancelPageReview(admin, lockedReview);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const missingStep = await reassigner.container
            .resolve(ReassignWebsiteBuilderPageReviewStepUseCase)
            .execute({ reviewId: review.id, stepId: "step-missing", userId: REVIEWER.id });
        const cancelled = await reassign(reassigner, lockedReview.id, REVIEWER.id);

        expect(missingStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(engineCalls.filter(call => call === "ReassignReviewStep")).toHaveLength(2);
    });

    it("refuses a viewer without reassign, before the engine (R125)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, WB_READER);

        const result = await reassign(reviewer, review.id, OTHER_REVIEWER.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "reassign this step" });
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("refuses a reassigner without read access to the page, before the engine", async () => {
        const { lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await reassign(reassigner, lockedReview.id, REVIEWER.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "reassign this step" });
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS, [
            throwOnWorkflowsPermissions
        ]);

        const result = await reassign(reassigner, review.id, REVIEWER.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("reports a Headless CMS review as not found (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await reassign(reassigner, cmsReview.id, REVIEWER.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("refuses an anonymous identity and fails with a persistence error when the read check throws (R87)", async () => {
        const { review } = await createScenario();
        const anonymous = await asUser(null, []);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const refused = await reassign(anonymous, review.id, REVIEWER.id);
        throwingAccessChecks.add("canRead");
        engineCalls.length = 0;
        const failed = await reassign(reassigner, review.id, REVIEWER.id);

        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
        expect(failed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).toEqual(["GetReview"]);
    });
});

describe("WB step candidate wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        targetReads.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
        nullTargetRevisions.clear();
        mismatchedTargetRevisions.clear();
    });

    it("lists the team without the requester, by name, without reasons for a plain requester (R120)", async () => {
        const { page } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        const candidates = expectOk(await listRequestCandidates(requester, page));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                teamIds: [REVIEW_TEAM],
                excluded: true,
                excludedReason: null
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                teamIds: [REVIEW_TEAM],
                excluded: false,
                excludedReason: null
            }
        ]);
        expect(engineCalls).toContain("ListStepCandidates");
    });

    it("shows the reasons to a requester with editor, including no read access (D97)", async () => {
        const { lockedPage } = await createScenario();
        lockFolderForReviewer();
        const requester = await asUser(REQUESTER, [WORKFLOWS_EDITOR, ...WB_WRITER]);

        const candidates = expectOk(await listRequestCandidates(requester, lockedPage));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                teamIds: [REVIEW_TEAM],
                excluded: true,
                excludedReason: ON_HOLIDAY
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                teamIds: [REVIEW_TEAM],
                excluded: true,
                excludedReason: "Cannot read this content."
            }
        ]);
    });

    it("shows the reasons to a requester with reassign but not editor", async () => {
        const { lockedPage } = await createScenario();
        lockFolderForReviewer();
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...WB_WRITER]);

        const candidates = expectOk(await listRequestCandidates(reassigner, lockedPage));

        expect(candidates.find(item => item.id === REVIEWER.id)).toMatchObject({
            excluded: true,
            excludedReason: "Cannot read this content."
        });
    });

    it("refuses a viewer without page write permission before reading the page (R75, R125)", async () => {
        const { page } = await createScenario();
        const reader = await asUser(READER, WB_READER);

        targetReads.length = 0;

        const result = await listRequestCandidates(reader, page);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
        expect(targetReads).toEqual([]);
    });

    it("refuses a writer without write access to the page's folder, before the engine", async () => {
        const { lockedPage } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "viewer"]]));
        const requester = await asUser(REQUESTER, WB_WRITER);

        const result = await listRequestCandidates(requester, lockedPage);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a missing revision and another page's revision as not found (R46)", async () => {
        const { page } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        nullTargetRevisions.add(page.id);
        const missing = await listRequestCandidates(requester, page);
        nullTargetRevisions.clear();
        mismatchedTargetRevisions.add(page.id);
        const otherPage = await listRequestCandidates(requester, page);

        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(otherPage.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("fails with a persistence error when the page read or a write check throws (R87)", async () => {
        const { page } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);

        throwingTargetRevisions.add(page.id);
        const readFailed = await listRequestCandidates(requester, page);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canWrite");
        const checkFailed = await listRequestCandidates(requester, page);
        throwingAccessChecks.clear();
        throwingAccessChecks.add("canWriteAnyPage");
        const permissionFailed = await listRequestCandidates(requester, page);

        expect(readFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(checkFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(permissionFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        const { page } = await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER, [throwOnWorkflowsPermissions]);

        const result = await listRequestCandidates(requester, page);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a missing workflow and a Headless CMS workflow as not found, before the engine (R46, R128)", async () => {
        const { admin, page } = await createScenario();
        await createCmsReview(admin);
        const requester = await asUser(REQUESTER, WB_WRITER);

        const missing = await listRequestCandidates(requester, page, "workflow-missing");
        const cmsWorkflow = await listRequestCandidates(requester, page, "cms-workflow");

        expect(missing.error.code).toBe("Workflows/Workflow/NotFound");
        expect(cmsWorkflow.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "cms-workflow" }
        });
        expect(JSON.stringify(cmsWorkflow.error)).not.toContain("Pages review");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses an anonymous identity before the engine (R87)", async () => {
        const { page } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await listRequestCandidates(anonymous, page);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("lists a review step's candidates with reasons for a reassigner", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const candidates = expectOk(await listReviewCandidates(reassigner, review.id));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                teamIds: [REVIEW_TEAM],
                excluded: true,
                excludedReason: ON_HOLIDAY
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                teamIds: [REVIEW_TEAM],
                excluded: false,
                excludedReason: null
            }
        ]);
    });

    it("refuses a review step's candidates without reassign or read access, before the engine", async () => {
        const { review, lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, WB_READER);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const withoutReassign = await listReviewCandidates(reviewer, review.id);
        const withoutRead = await listReviewCandidates(reassigner, lockedReview.id);

        for (const result of [withoutReassign, withoutRead]) {
            expect(result.error.code).toBe("Workflows/NotAuthorized");
            expect(result.error.data).toEqual({ action: "list the step's candidates" });
        }
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("passes the engine's step errors through for a review step's candidates", async () => {
        const { admin, review, lockedReview } = await createScenario();
        await cancelPageReview(admin, lockedReview);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const unknownStep = await reassigner.container
            .resolve(ListWebsiteBuilderPageReviewStepCandidatesUseCase)
            .execute({ reviewId: review.id, stepId: "step-missing" });
        const cancelled = await listReviewCandidates(reassigner, lockedReview.id);

        expect(unknownStep.error).toMatchObject({
            code: "Workflows/Review/Validation",
            message: 'Step "step-missing" does not exist in this review.'
        });
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(engineCalls.filter(call => call === "ListStepCandidates")).toHaveLength(2);
    });

    it("fails with a persistence error for a review step's candidates when the viewer's permissions fail to load (R87)", async () => {
        const { review } = await createScenario();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS, [
            throwOnWorkflowsPermissions
        ]);

        const result = await listReviewCandidates(reassigner, review.id);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a Headless CMS review as not found for its candidates (R46)", async () => {
        const cmsReview = await createCmsReview(await createUserContext());
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await listReviewCandidates(reassigner, cmsReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });
});

describe("WB inspector and folder existence wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("inspects an unsaved config for a requester and a page folder (R121)", async () => {
        await createScenario();
        const { campaigns, spring } = await createFolders();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco]);

        const inSpring = expectOk(
            await inspect(editor, {
                stepConfig: folderRuleConfig(campaigns.id),
                requesterId: REQUESTER.id,
                folderId: spring.id
            })
        );
        const inRoot = expectOk(
            await inspect(editor, {
                stepConfig: folderRuleConfig(campaigns.id),
                requesterId: REQUESTER.id,
                folderId: "root"
            })
        );

        expect(inSpring).toEqual({
            owner: { id: REVIEWER.id, displayName: REVIEWER.displayName },
            source: "rule",
            ruleId: "rule-campaigns",
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-campaigns",
                    outcome: "matched",
                    reason: null,
                    failedConditions: []
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
        expect(inRoot).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                {
                    ruleId: "rule-campaigns",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ],
            skipped: [],
            narrowedTeamId: null,
            candidateIds: [],
            candidateCount: 0
        });
    });

    it("treats an explicit null and a missing folder id as no folder", async () => {
        await createScenario();
        const { campaigns } = await createFolders();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco]);
        const input = { stepConfig: folderRuleConfig(campaigns.id), requesterId: REQUESTER.id };

        const inNull = expectOk(await inspect(editor, { ...input, folderId: null }));
        const inMissing = expectOk(await inspect(editor, input));

        for (const inspection of [inNull, inMissing]) {
            expect(inspection).toMatchObject({ owner: null, source: "pool", ruleId: null });
            expect(inspection.trace).toEqual([
                {
                    ruleId: "rule-campaigns",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ]);
        }
    });

    it("skips a rule user who cannot read the folder (R121, A47)", async () => {
        await createScenario();
        const { campaigns, spring } = await createFolders();
        folderLevels.set(spring.id, new Map([[REVIEWER.id, "no-access"]]));
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco]);

        const inspection = expectOk(
            await inspect(editor, {
                stepConfig: folderRuleConfig(campaigns.id),
                requesterId: REQUESTER.id,
                folderId: spring.id
            })
        );

        expect(inspection.owner).toBeNull();
        expect(inspection.trace).toEqual([
            {
                ruleId: "rule-campaigns",
                outcome: "skipped",
                reason: "Cannot read this content.",
                failedConditions: []
            }
        ]);
        expect(inspection.skipped).toEqual([
            {
                userId: REVIEWER.id,
                displayName: REVIEWER.displayName,
                reason: "Cannot read this content."
            }
        ]);
    });

    it("refuses a non-editor before the engine and returns the engine's validation error (R125)", async () => {
        await createScenario();
        const requester = await asUser(REQUESTER, WB_WRITER);
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const refused = await inspect(requester, {
            stepConfig: folderRuleConfig("folder-1"),
            requesterId: REQUESTER.id
        });
        expect(engineCalls).not.toContain("InspectRouting");
        const invalid = await inspect(editor, {
            stepConfig: { teams: [REVIEW_TEAM], assignment: { strategy: "fastest" } },
            requesterId: REQUESTER.id
        });

        expect(refused.error.code).toBe("Workflows/NotAuthorized");
        expect(refused.error.data).toEqual({ action: "inspect routing" });
        expect(invalid.error.code).toBe("Workflows/Workflow/Validation");
    });

    it("passes the engine's refusal of a config without teams through unchanged", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const result = await inspect(editor, {
            stepConfig: { ...folderRuleConfig("folder-1"), teams: [] },
            requesterId: REQUESTER.id
        });

        expect(result.error).toMatchObject({
            code: "Workflows/Workflow/Validation",
            message: "The step configuration is invalid: the step needs at least one team."
        });
        expect(engineCalls).toContain("InspectRouting");
    });

    it("maps a throwing permission check and refuses an anonymous identity (R87)", async () => {
        await createScenario();
        const throwing = await asUser(EDITOR, EDITOR_PERMISSIONS, [throwOnWorkflowsPermissions]);
        const anonymous = await asUser(null, []);
        const input = { stepConfig: folderRuleConfig("folder-1"), requesterId: REQUESTER.id };

        const failed = await inspect(throwing, input);
        const refused = await inspect(anonymous, input);

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).not.toContain("InspectRouting");
    });

    it("answers page folder existence for an editor only (D69, R125)", async () => {
        await createScenario();
        const { spring, articles } = await createFolders();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco]);
        const reader = await asUser(READER, WB_READER, [registerAco]);

        expect(expectOk(await folderExists(editor, spring.id))).toBe(true);
        expect(expectOk(await folderExists(editor, articles.id))).toBe(false);
        expect(expectOk(await folderExists(editor, "folder-missing"))).toBe(false);
        const refused = await folderExists(reader, spring.id);
        expect(refused.error.code).toBe("Workflows/NotAuthorized");
        expect(refused.error.data).toEqual({ action: "check folders" });
    });

    it("maps a failed folder read and refuses an anonymous identity (R87)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS, [registerAco, failFolderReads]);
        const anonymous = await asUser(null, []);

        const failed = await folderExists(editor, "folder-1");
        const refused = await folderExists(anonymous, "folder-1");

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
    });
});
