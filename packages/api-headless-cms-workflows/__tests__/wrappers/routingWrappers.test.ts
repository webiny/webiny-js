import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import type { ReviewReassignTargetInvalidErrorData } from "@webiny/api-workflows/domain/review/errors.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";
import { SaveWorkflowSettingsUseCase } from "@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js";
import { createWorkflowValuesWithAssignment, storeWorkflow } from "~tests/__workflows/workflow.js";
import { AUTHOR_NAMESPACE, createAuthorEntry, expectOk } from "~tests/__helpers/entries.js";
import { cancelEntryReview, requestEntryReview, STEP_ID } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    toActor
} from "~tests/__helpers/identities.js";
import {
    CMS_READER,
    CMS_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/permissions.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { addTestFolder, failingFolderReads, testFolders } from "~tests/__helpers/FakeFolders.js";
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
import { throwOnWorkflowsPermissions } from "~tests/__helpers/ThrowingWorkflowsPermissions.js";
import { createExtraModelPlugins } from "~tests/__cms/extraModels.js";
import { ReassignCmsEntryReviewStepUseCase } from "~/features/wrappers/ReassignCmsEntryReviewStep/index.js";
import { ListCmsEntryStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryStepCandidates/index.js";
import { ListCmsEntryReviewStepCandidatesUseCase } from "~/features/wrappers/ListCmsEntryReviewStepCandidates/index.js";
import { InspectCmsEntryRoutingUseCase } from "~/features/wrappers/InspectCmsEntryRouting/index.js";
import { CmsEntryFolderExistsUseCase } from "~/features/wrappers/CmsEntryFolderExists/index.js";

/** CMS permissions of the users routing evaluates as candidates (`CandidateReadAccess`). */
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: CMS_WRITER,
    [REVIEWER.id]: CMS_READER,
    [OTHER_REVIEWER.id]: CMS_READER
};

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...CMS_READER];
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...CMS_READER];
const ON_HOLIDAY = "On holiday.";

/**
 * Admin stores the workflow (pool of "team-1": REQUESTER, REVIEWER, OTHER_REVIEWER), excludes
 * OTHER_REVIEWER ("On holiday.") and REQUESTER asks for reviews of "Ann" (root) and "Locked"
 * ("folder-locked"). Both steps wait in the pool.
 */
const createScenario = async () => {
    const admin = await createUserContext({
        legacyPlugins: [registerTestUsers],
        permissionsByIdentity: CANDIDATE_PERMISSIONS
    });
    // The request picker lists only for a step that allows a pick (D22).
    expectOk(
        await storeWorkflow(
            admin,
            createWorkflowValuesWithAssignment({
                strategy: "none",
                allowManualPick: true,
                rules: []
            })
        )
    );
    expectOk(
        await admin.container.resolve(SaveWorkflowSettingsUseCase).execute({
            exclusions: [{ userId: OTHER_REVIEWER.id, reason: ON_HOLIDAY }]
        })
    );
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const lockedEntry = await createAuthorEntry(admin, {
        name: "Locked",
        folderId: "folder-locked"
    });
    const review = await requestEntryReview(admin, entry);
    const lockedReview = await requestEntryReview(admin, lockedEntry);
    return { admin, entry, lockedEntry, review, lockedReview };
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
            ...createExtraModelPlugins(),
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
        .resolve(ReassignCmsEntryReviewStepUseCase)
        .execute({ reviewId, stepId: STEP_ID, userId });
};

/** The revision a request dialog asks about. */
interface TargetRevision {
    entryId: string;
    id: string;
}

const listRequestCandidates = (
    context: CmsContext,
    entry: TargetRevision,
    model: string = AUTHOR_NAMESPACE
) => {
    return context.container.resolve(ListCmsEntryStepCandidatesUseCase).execute({
        workflowId: "workflow-1",
        stepId: STEP_ID,
        model,
        targetId: entry.entryId,
        targetRevisionId: entry.id
    });
};

const listReviewCandidates = (context: CmsContext, reviewId: string) => {
    return context.container
        .resolve(ListCmsEntryReviewStepCandidatesUseCase)
        .execute({ reviewId, stepId: STEP_ID });
};

const inspect = (context: CmsContext, input: InspectCmsEntryRoutingUseCase.Input) => {
    return context.container.resolve(InspectCmsEntryRoutingUseCase).execute(input);
};

const folderExists = (context: CmsContext, id: string, type: string) => {
    return context.container.resolve(CmsEntryFolderExistsUseCase).execute({ id, type });
};

/** One rule: entries under "folder-parent" (descendants included) go to REVIEWER. */
const FOLDER_RULE_CONFIG = {
    teams: [REVIEW_TEAM],
    assignment: {
        strategy: "none",
        allowManualPick: false,
        rules: [
            {
                id: "rule-1",
                conditions: {
                    folder: { id: "folder-parent", type: "cms:author", includeDescendants: true }
                },
                target: { type: "user", id: REVIEWER.id }
            }
        ]
    }
};

describe("CMS reassign wrapper", () => {
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
        await cancelEntryReview(admin, lockedReview);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const missingStep = await reassigner.container
            .resolve(ReassignCmsEntryReviewStepUseCase)
            .execute({ reviewId: review.id, stepId: "step-missing", userId: REVIEWER.id });
        const cancelled = await reassign(reassigner, lockedReview.id, REVIEWER.id);

        expect(missingStep.error.code).toBe("Workflows/Review/StepNotCurrent");
        expect(cancelled.error.code).toBe("Workflows/Review/InvalidState");
        expect(engineCalls.filter(call => call === "ReassignReviewStep")).toHaveLength(2);
    });

    it("refuses a viewer without reassign, before the engine (R125)", async () => {
        const { review } = await createScenario();
        const reviewer = await asUser(REVIEWER, CMS_READER);

        const result = await reassign(reviewer, review.id, OTHER_REVIEWER.id);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "reassign this step" });
        expect(engineCalls).not.toContain("ReassignReviewStep");
    });

    it("refuses a reassigner without read access to the target, before the engine", async () => {
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

    it("reports a Website Builder review as not found (R46)", async () => {
        const wbReview = await createWbReview();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await reassign(reassigner, wbReview.id, REVIEWER.id);

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

describe("CMS step candidate wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
        throwingAccessChecks.clear();
        throwingTargetRevisions.clear();
    });

    it("lists the team without the requester, by name, without reasons for a plain requester (R120)", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const candidates = expectOk(await listRequestCandidates(requester, entry));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                excluded: true,
                excludedReason: null
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                excluded: false,
                excludedReason: null
            }
        ]);
        expect(engineCalls).toContain("ListStepCandidates");
    });

    it("shows the reasons to a requester with editor, including no read access (D97)", async () => {
        const { lockedEntry } = await createScenario();
        lockFolderForReviewer();
        const requester = await asUser(REQUESTER, [WORKFLOWS_EDITOR, ...CMS_WRITER]);

        const candidates = expectOk(await listRequestCandidates(requester, lockedEntry));

        expect(candidates).toEqual([
            {
                id: OTHER_REVIEWER.id,
                displayName: OTHER_REVIEWER.displayName,
                excluded: true,
                excludedReason: ON_HOLIDAY
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                excluded: true,
                excludedReason: "Cannot read this content."
            }
        ]);
    });

    it("shows the reasons to a requester with reassign but not editor", async () => {
        const { lockedEntry } = await createScenario();
        lockFolderForReviewer();
        const reassigner = await asUser(REASSIGNER, [WORKFLOWS_REASSIGN, ...CMS_WRITER]);

        const candidates = expectOk(await listRequestCandidates(reassigner, lockedEntry));

        expect(candidates.find(item => item.id === REVIEWER.id)).toMatchObject({
            excluded: true,
            excludedReason: "Cannot read this content."
        });
    });

    it("reports a target whose entry differs from the target id as not found", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const result = await listRequestCandidates(requester, {
            entryId: "entry-other",
            id: entry.id
        });

        expect(result.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses a viewer without write access to the target, before the engine (R125)", async () => {
        const { entry } = await createScenario();
        const reader = await asUser(READER, CMS_READER);

        const result = await listRequestCandidates(reader, entry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports another app's namespace and a missing revision as not found (R46)", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const otherApp = await listRequestCandidates(requester, entry, "wb.page");
        const missing = await listRequestCandidates(requester, {
            entryId: entry.entryId,
            id: `${entry.entryId}#0009`
        });

        expect(otherApp.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(missing.error.code).toBe("Workflows/Review/TargetNotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("fails with a persistence error when the target read or write check throws (R87)", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        throwingTargetRevisions.add(entry.id);
        const readFailed = await listRequestCandidates(requester, entry);
        throwingTargetRevisions.clear();
        throwingAccessChecks.add("canWrite");
        const checkFailed = await listRequestCandidates(requester, entry);

        expect(readFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(checkFailed.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses a writer without write access to the entry's folder, before the engine", async () => {
        const { lockedEntry } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REQUESTER.id, "viewer"]]));
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const result = await listRequestCandidates(requester, lockedEntry);

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list the step's candidates" });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("fails with a persistence error when the viewer's permissions fail to load (R87)", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER, [throwOnWorkflowsPermissions]);

        const result = await listRequestCandidates(requester, entry);

        expect(result.error.code).toBe("Workflows/Review/Persistence");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("refuses an anonymous identity before the engine (R87)", async () => {
        const { entry } = await createScenario();
        const anonymous = await asUser(null, []);

        const result = await listRequestCandidates(anonymous, entry);

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a workflow that does not exist as not found, before the engine", async () => {
        const { entry } = await createScenario();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const result = await requester.container
            .resolve(ListCmsEntryStepCandidatesUseCase)
            .execute({
                workflowId: "workflow-missing",
                stepId: STEP_ID,
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                targetRevisionId: entry.id
            });

        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("reports a Website Builder workflow as not found, before the engine (R46, R128)", async () => {
        const { entry } = await createScenario();
        await createWbReview();
        const requester = await asUser(REQUESTER, CMS_WRITER);

        const result = await requester.container
            .resolve(ListCmsEntryStepCandidatesUseCase)
            .execute({
                workflowId: "wb-workflow",
                stepId: STEP_ID,
                model: AUTHOR_NAMESPACE,
                targetId: entry.entryId,
                targetRevisionId: entry.id
            });

        expect(result.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "wb-workflow" }
        });
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
                excluded: true,
                excludedReason: ON_HOLIDAY
            },
            {
                id: REVIEWER.id,
                displayName: REVIEWER.displayName,
                excluded: false,
                excludedReason: null
            }
        ]);
    });

    it("refuses a review step's candidates without reassign or read access, before the engine", async () => {
        const { review, lockedReview } = await createScenario();
        folderLevels.set("folder-locked", new Map([[REASSIGNER.id, "no-access"]]));
        const reviewer = await asUser(REVIEWER, CMS_READER);
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
        await cancelEntryReview(admin, lockedReview);
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const unknownStep = await reassigner.container
            .resolve(ListCmsEntryReviewStepCandidatesUseCase)
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

    it("reports a Website Builder review as not found for its candidates (R46)", async () => {
        const wbReview = await createWbReview();
        const reassigner = await asUser(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await listReviewCandidates(reassigner, wbReview.id);

        expect(result.error.code).toBe("Workflows/Review/NotFound");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });
});

describe("CMS inspector and folder existence wrappers", () => {
    beforeEach(() => {
        engineCalls.length = 0;
        addTestFolder({ id: "folder-parent", type: "cms:author" });
        addTestFolder({ id: "folder-child", type: "cms:author", parentId: "folder-parent" });
    });

    afterEach(() => {
        testFolders.clear();
        failingFolderReads.clear();
        folderLevels.clear();
    });

    it("inspects an unsaved config for a requester and a folder (R121)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const inChild = expectOk(
            await inspect(editor, {
                stepConfig: FOLDER_RULE_CONFIG,
                model: AUTHOR_NAMESPACE,
                requesterId: REQUESTER.id,
                folderId: "folder-child"
            })
        );
        const inRoot = expectOk(
            await inspect(editor, {
                stepConfig: FOLDER_RULE_CONFIG,
                model: AUTHOR_NAMESPACE,
                requesterId: REQUESTER.id,
                folderId: null
            })
        );

        expect(inChild).toEqual({
            owner: { id: REVIEWER.id, displayName: REVIEWER.displayName },
            source: "rule",
            ruleId: "rule-1",
            strategy: "none",
            trace: [{ ruleId: "rule-1", outcome: "matched", reason: null, failedConditions: [] }],
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
                    ruleId: "rule-1",
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

    it("treats the root folder id and an explicit null as no folder", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);
        const input = {
            stepConfig: FOLDER_RULE_CONFIG,
            model: AUTHOR_NAMESPACE,
            requesterId: REQUESTER.id
        };

        const inRootId = expectOk(await inspect(editor, { ...input, folderId: "root" }));
        const inNull = expectOk(await inspect(editor, { ...input, folderId: null }));

        for (const inspection of [inRootId, inNull]) {
            expect(inspection).toMatchObject({ owner: null, source: "pool", ruleId: null });
            expect(inspection.trace).toEqual([
                {
                    ruleId: "rule-1",
                    outcome: "notMatched",
                    reason: null,
                    failedConditions: ["folder"]
                }
            ]);
        }
    });

    it("skips a rule user who cannot read the folder (R121, A47)", async () => {
        await createScenario();
        folderLevels.set("folder-child", new Map([[REVIEWER.id, "no-access"]]));
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const inspection = expectOk(
            await inspect(editor, {
                stepConfig: FOLDER_RULE_CONFIG,
                model: AUTHOR_NAMESPACE,
                requesterId: REQUESTER.id,
                folderId: "folder-child"
            })
        );

        expect(inspection.owner).toBeNull();
        expect(inspection.trace).toEqual([
            {
                ruleId: "rule-1",
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
        const requester = await asUser(REQUESTER, CMS_WRITER);
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);

        const refused = await inspect(requester, {
            stepConfig: FOLDER_RULE_CONFIG,
            model: AUTHOR_NAMESPACE,
            requesterId: REQUESTER.id
        });
        expect(engineCalls).not.toContain("InspectRouting");
        const invalid = await inspect(editor, {
            stepConfig: { teams: [REVIEW_TEAM], assignment: { strategy: "fastest" } },
            model: AUTHOR_NAMESPACE,
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
            stepConfig: { ...FOLDER_RULE_CONFIG, teams: [] },
            model: AUTHOR_NAMESPACE,
            requesterId: REQUESTER.id
        });

        expect(result.error).toMatchObject({
            code: "Workflows/Workflow/Validation",
            message: "The step configuration is invalid: the step needs at least one team."
        });
        expect(engineCalls).toContain("InspectRouting");
    });

    it("refuses another app's namespace and maps a throwing permission check (R87)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);
        const throwing = await asUser(EDITOR, EDITOR_PERMISSIONS, [throwOnWorkflowsPermissions]);
        const input = { stepConfig: FOLDER_RULE_CONFIG, requesterId: REQUESTER.id };

        const otherApp = await inspect(editor, { ...input, model: "wb.page" });
        const failed = await inspect(throwing, { ...input, model: AUTHOR_NAMESPACE });

        expect(otherApp.error).toMatchObject({
            code: "Workflows/Workflow/Validation",
            message: "Routing can only be inspected for a CMS model."
        });
        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(engineCalls).not.toContain("InspectRouting");
    });

    it("answers folder existence for an editor only (D69, R125)", async () => {
        await createScenario();
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);
        const reader = await asUser(READER, CMS_READER);

        expect(expectOk(await folderExists(editor, "folder-child", "cms:author"))).toBe(true);
        expect(expectOk(await folderExists(editor, "folder-child", "cms:book"))).toBe(false);
        expect(expectOk(await folderExists(editor, "folder-missing", "cms:author"))).toBe(false);
        const refused = await folderExists(reader, "folder-child", "cms:author");
        expect(refused.error.code).toBe("Workflows/NotAuthorized");
        expect(refused.error.data).toEqual({ action: "check folders" });
    });

    it("maps a failed folder read and refuses an anonymous identity (R87)", async () => {
        await createScenario();
        failingFolderReads.add("folder-child");
        const editor = await asUser(EDITOR, EDITOR_PERMISSIONS);
        const anonymous = await asUser(null, []);

        const failed = await folderExists(editor, "folder-child", "cms:author");
        const refused = await folderExists(anonymous, "folder-child", "cms:author");

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(refused.error.code).toBe("Workflows/NotAuthenticated");
    });
});
