import { afterEach, beforeEach, describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import type { IdentityData } from "@webiny/api-core/features/security/IdentityContext/index.js";
import type { SecurityPermission } from "@webiny/api-core/types/security.js";
import { SaveWorkflowSettingsUseCase } from "@webiny/api-workflows/features/settings/SaveWorkflowSettings/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    requestPageReview,
    STEP_ID,
    storeWbWorkflowWithAssignment
} from "~tests/__helpers/engine.js";
import { createCmsReview } from "~tests/__helpers/cmsReview.js";
import { registerTestUsers } from "~tests/__helpers/FakeListUsers.js";
import { createWbFolder, registerAco } from "~tests/__helpers/aco.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { countEngineCalls, engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import {
    EDITOR,
    OTHER_REVIEWER,
    READER,
    REASSIGNER,
    REQUESTER,
    REVIEW_TEAM,
    REVIEWER,
    WB_READER,
    WB_WRITER,
    WORKFLOWS_EDITOR,
    WORKFLOWS_REASSIGN
} from "~tests/__helpers/identities.js";
import {
    asGraphQLUser,
    FOLDER_EXISTS,
    GET_REVIEW,
    INSPECT_ROUTING,
    LIST_REVIEW_STEP_CANDIDATES,
    LIST_STEP_CANDIDATES,
    REASSIGN_STEP
} from "~tests/__helpers/graphql.js";

/** Page permissions of the users routing evaluates as candidates. */
const CANDIDATE_PERMISSIONS: Record<string, SecurityPermission[]> = {
    [REQUESTER.id]: WB_WRITER,
    [REVIEWER.id]: WB_READER,
    [OTHER_REVIEWER.id]: WB_READER
};

const REASSIGNER_PERMISSIONS = [WORKFLOWS_REASSIGN, ...WB_READER];
const EDITOR_PERMISSIONS = [WORKFLOWS_EDITOR, ...WB_READER];
const ON_HOLIDAY = "On holiday.";

const REVISION_ID_ERROR = {
    code: "Workflows/Review/Validation",
    message: "The revision id is not valid.",
    data: null
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

class ReviewTeamFactory implements TeamFactory.Interface {
    public async execute(): TeamFactory.Return {
        return [{ name: "Marketing", slug: REVIEW_TEAM, description: "Marketing.", roles: [] }];
    }
}

const registerTeams = (container: Container) => {
    container.registerInstance(TeamFactory, new ReviewTeamFactory());
};

/** A `/graphql` user with the directory, real ACO folders and the engine call counter. */
const graphQLUserFor = (identity: IdentityData | null, permissions: SecurityPermission[]) => {
    return asGraphQLUser({
        identity,
        permissions,
        permissionsByIdentity: CANDIDATE_PERMISSIONS,
        legacyPlugins: [registerAco, registerTestUsers, registerTeams, countEngineCalls]
    });
};

/** Runs an operation and returns `data.websiteBuilder`; a GraphQL-level error fails the test. */
const run = async (
    user: ReturnType<typeof asGraphQLUser>,
    query: string,
    variables?: Record<string, unknown>
) => {
    const body = await user.run(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.websiteBuilder;
};

/**
 * Admin stores the pages workflow (pool of "team-1"), excludes OTHER_REVIEWER ("On holiday.")
 * and REQUESTER asks for a review of "Page A" (root). The step waits in the pool. "Quiet page"
 * has no review.
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
    const quietPage = await createPage(admin, { title: "Quiet page" });
    const review = await requestPageReview(admin, page);
    return { admin, page, quietPage, review };
};

/** Real ACO folders: Campaigns > Spring (pages). */
const createFolders = async () => {
    const admin = await createUserContext({ legacyPlugins: [registerAco] });
    const campaigns = await createWbFolder(admin, { title: "Campaigns", slug: "campaigns" });
    const spring = await createWbFolder(admin, {
        title: "Spring",
        slug: "spring",
        parentId: campaigns.id
    });
    return { campaigns, spring };
};

describe("WB routing GraphQL", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("reassigns a step and returns the refusal and the engine's error with code and data (R124, R125)", async () => {
        const { review } = await createScenario();
        const reassigner = graphQLUserFor(REASSIGNER, REASSIGNER_PERMISSIONS);
        const reviewer = graphQLUserFor(REVIEWER, WB_READER);
        const step = { reviewId: review.id, stepId: STEP_ID };

        const refused = await run(reviewer, REASSIGN_STEP, { ...step, userId: OTHER_REVIEWER.id });
        const reassigned = await run(reassigner, REASSIGN_STEP, { ...step, userId: REVIEWER.id });
        const invalid = await run(reassigner, REASSIGN_STEP, { ...step, userId: READER.id });

        expect(refused.reassignWebsiteBuilderPageReviewStep).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to reassign this step.",
                data: { action: "reassign this step" }
            }
        });
        expect(reassigned.reassignWebsiteBuilderPageReviewStep.error).toBeNull();
        expect(reassigned.reassignWebsiteBuilderPageReviewStep.data).toMatchObject({
            id: review.id,
            currentStepState: "inReview",
            steps: [{ id: STEP_ID, state: "inReview", owner: { id: REVIEWER.id } }]
        });
        expect(invalid.reassignWebsiteBuilderPageReviewStep.data).toBeNull();
        expect(invalid.reassignWebsiteBuilderPageReviewStep.error).toMatchObject({
            code: "Workflows/Review/ReassignTargetInvalid",
            data: { userId: READER.id, reason: "Not a member of the step's teams." }
        });
    });

    it("reports a Headless CMS review as not found and leaves it unchanged (R46)", async () => {
        const admin = await createUserContext({ legacyPlugins: [registerTestUsers] });
        const cmsReview = await createCmsReview(admin);
        const reassigner = graphQLUserFor(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await run(reassigner, REASSIGN_STEP, {
            reviewId: cmsReview.id,
            stepId: STEP_ID,
            userId: REVIEWER.id
        });
        const candidates = await run(reassigner, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: cmsReview.id,
            stepId: STEP_ID
        });

        for (const response of [
            result.reassignWebsiteBuilderPageReviewStep,
            candidates.listWebsiteBuilderPageReviewStepCandidates
        ]) {
            expect(response.data).toBeNull();
            expect(response.error).toMatchObject({
                code: "Workflows/Review/NotFound",
                data: { id: cmsReview.id }
            });
        }
        expect(engineCalls).not.toContain("ReassignReviewStep");
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("lists the request candidates by revision id, redacted for a plain requester (R120)", async () => {
        const { quietPage } = await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);
        const requesterWithEditor = graphQLUserFor(REQUESTER, [WORKFLOWS_EDITOR, ...WB_WRITER]);
        const variables = { workflowId: "wb-workflow", stepId: STEP_ID, revisionId: quietPage.id };

        const plain = await run(requester, LIST_STEP_CANDIDATES, variables);
        const withEditor = await run(requesterWithEditor, LIST_STEP_CANDIDATES, variables);

        expect(plain.listWebsiteBuilderPageStepCandidates).toEqual({
            data: [
                {
                    id: OTHER_REVIEWER.id,
                    displayName: OTHER_REVIEWER.displayName,
                    excluded: true,
                    excludedReason: null,
                    teams: ["Marketing"]
                },
                {
                    id: REVIEWER.id,
                    displayName: REVIEWER.displayName,
                    excluded: false,
                    excludedReason: null,
                    teams: ["Marketing"]
                }
            ],
            error: null
        });
        expect(withEditor.listWebsiteBuilderPageStepCandidates.data[0].excludedReason).toBe(
            ON_HOLIDAY
        );
    });

    it("reports a Headless CMS workflow as not found (R46, R128)", async () => {
        const { admin, quietPage } = await createScenario();
        await createCmsReview(admin);
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        const result = await run(requester, LIST_STEP_CANDIDATES, {
            workflowId: "cms-workflow",
            stepId: STEP_ID,
            revisionId: quietPage.id
        });

        expect(result.listWebsiteBuilderPageStepCandidates.data).toBeNull();
        expect(result.listWebsiteBuilderPageStepCandidates.error).toMatchObject({
            code: "Workflows/Workflow/NotFound",
            data: { id: "cms-workflow" }
        });
        expect(engineCalls).not.toContain("ListStepCandidates");
    });

    it("returns the revision id validation error before the wrapper (R107)", async () => {
        await createScenario();
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);

        for (const revisionId of ["", "#0001", "abc", "abc#x", "abc#0"]) {
            const result = await run(requester, LIST_STEP_CANDIDATES, {
                workflowId: "wb-workflow",
                stepId: STEP_ID,
                revisionId
            });

            expect(result.listWebsiteBuilderPageStepCandidates).toEqual({
                data: null,
                error: REVISION_ID_ERROR
            });
        }
        expect(engineCalls).toEqual([]);
    });

    it("lists a review step's candidates with reasons for a reassigner", async () => {
        const { review } = await createScenario();
        const reassigner = graphQLUserFor(REASSIGNER, REASSIGNER_PERMISSIONS);

        const result = await run(reassigner, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: review.id,
            stepId: STEP_ID
        });

        expect(result.listWebsiteBuilderPageReviewStepCandidates).toEqual({
            data: [
                {
                    id: OTHER_REVIEWER.id,
                    displayName: OTHER_REVIEWER.displayName,
                    excluded: true,
                    excludedReason: ON_HOLIDAY,
                    teams: ["Marketing"]
                },
                {
                    id: REVIEWER.id,
                    displayName: REVIEWER.displayName,
                    excluded: false,
                    excludedReason: null,
                    teams: ["Marketing"]
                }
            ],
            error: null
        });
    });

    it("inspects an unsaved config for an editor and refuses everyone else (R121)", async () => {
        await createScenario();
        const { campaigns, spring } = await createFolders();
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);
        const requester = graphQLUserFor(REQUESTER, WB_WRITER);
        const variables = { stepConfig: folderRuleConfig(campaigns.id), requesterId: REQUESTER.id };

        const inSpring = await run(editor, INSPECT_ROUTING, { ...variables, folderId: spring.id });
        const inRoot = await run(editor, INSPECT_ROUTING, variables);
        const refused = await run(requester, INSPECT_ROUTING, variables);

        expect(inSpring.inspectWebsiteBuilderPageRouting).toEqual({
            data: {
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
            },
            error: null
        });
        expect(inRoot.inspectWebsiteBuilderPageRouting.data).toEqual({
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
        expect(refused.inspectWebsiteBuilderPageRouting).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to inspect routing.",
                data: { action: "inspect routing" }
            }
        });
    });

    it("returns the step config validation error of the inspector", async () => {
        await createScenario();
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);

        const result = await run(editor, INSPECT_ROUTING, {
            stepConfig: { teams: [REVIEW_TEAM], assignment: { strategy: "fastest" } },
            requesterId: REQUESTER.id
        });

        expect(result.inspectWebsiteBuilderPageRouting.data).toBeNull();
        expect(result.inspectWebsiteBuilderPageRouting.error.code).toBe(
            "Workflows/Workflow/Validation"
        );
    });

    it("answers page folder existence for an editor only (D69, R125)", async () => {
        await createScenario();
        const { spring } = await createFolders();
        const editor = graphQLUserFor(EDITOR, EDITOR_PERMISSIONS);
        const reader = graphQLUserFor(READER, WB_READER);

        const found = await run(editor, FOLDER_EXISTS, { id: spring.id });
        const missing = await run(editor, FOLDER_EXISTS, { id: "folder-gone" });
        const refused = await run(reader, FOLDER_EXISTS, { id: spring.id });

        expect(found.websiteBuilderPageFolderExists).toEqual({ data: true, error: null });
        expect(missing.websiteBuilderPageFolderExists).toEqual({ data: false, error: null });
        expect(refused.websiteBuilderPageFolderExists).toEqual({
            data: null,
            error: {
                code: "Workflows/NotAuthorized",
                message: "You are not allowed to check folders.",
                data: { action: "check folders" }
            }
        });
    });

    it("returns the anonymous refusal with its code and keeps the review unchanged", async () => {
        const { review } = await createScenario();
        const anonymous = graphQLUserFor(null, []);
        const admin = asGraphQLUser();

        const candidates = await run(anonymous, LIST_REVIEW_STEP_CANDIDATES, {
            reviewId: review.id,
            stepId: STEP_ID
        });
        const reassign = await run(anonymous, REASSIGN_STEP, {
            reviewId: review.id,
            stepId: STEP_ID,
            userId: REVIEWER.id
        });
        const read = await run(admin, GET_REVIEW, { id: review.id });

        expect(candidates.listWebsiteBuilderPageReviewStepCandidates.error.code).toBe(
            "Workflows/NotAuthenticated"
        );
        expect(reassign.reassignWebsiteBuilderPageReviewStep.error.code).toBe(
            "Workflows/NotAuthenticated"
        );
        expect(read.getWebsiteBuilderPageReview.data.review).toMatchObject({
            currentStepState: "awaiting",
            steps: [{ id: STEP_ID, state: "awaiting", owner: null }]
        });
    });
});
