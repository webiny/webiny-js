import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { TeamStorageError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
import { StoreWorkflowUseCase } from "@webiny/api-workflows/features/workflow/StoreWorkflow/index.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { expectOk } from "~tests/__helpers/pages.js";
import { createWbWorkflowValues } from "~tests/__helpers/engine.js";
import { requestPageReview } from "~tests/__helpers/engine.js";
import { WB_ADMIN_ACTOR } from "~tests/__helpers/engine.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { REVIEWER } from "~tests/__helpers/identities.js";
import { WB_READER } from "~tests/__helpers/identities.js";
import { WB_WRITER } from "~tests/__helpers/identities.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";
import { TYPE_FIELDS } from "~tests/__helpers/graphql.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";

/** The first team exists (defined in code); the second one was deleted after the workflow was saved. */
const LIVE_TEAM = "team-1";
const DELETED_TEAM = "team-gone";

class ReviewTeamFactory implements TeamFactory.Interface {
    public async execute(): TeamFactory.Return {
        return [{ name: "Reviewers", slug: LIVE_TEAM, description: "Reviews.", roles: [] }];
    }
}

/** The team lookup fails with a storage error. */
class FailingGetTeamImpl implements GetTeamUseCase.Interface {
    public constructor(private decoratee: GetTeamUseCase.Interface) {}

    public async execute(): ReturnType<GetTeamUseCase.Interface["execute"]> {
        return Result.fail(new TeamStorageError(new Error("Storage is not available.")));
    }
}

const FailingGetTeam = GetTeamUseCase.createDecorator({
    decorator: FailingGetTeamImpl,
    dependencies: []
});

const registerTeams = (container: Container) => {
    container.registerInstance(TeamFactory, new ReviewTeamFactory());
};

const registerTeamsAndFailingLookup = (container: Container) => {
    registerTeams(container);
    container.registerDecorator(FailingGetTeam);
    captureLoggedErrors(container);
};

const ERROR = "error { code message data }";
const STEPS = "steps { id candidateTeamIds candidateTeams { id name } }";
const REVIEW = `id title state ${STEPS}`;

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageReview(id: $id) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const GET_TARGET_REVIEW = /* GraphQL */ `
    query GetTargetReview($revisionId: ID!) {
        websiteBuilder {
            getWebsiteBuilderPageTargetReview(revisionId: $revisionId) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const LIST_REVIEWS = /* GraphQL */ `
    query ListReviews($list: WorkflowsReviewListKind!) {
        websiteBuilder {
            listWebsiteBuilderPageReviews(list: $list) {
                data { review { ${REVIEW} } }
                meta { cursor hasMoreItems }
                ${ERROR}
            }
        }
    }
`;

const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview($revisionId: ID!, $title: String) {
        websiteBuilder {
            requestWebsiteBuilderPageReview(revisionId: $revisionId, title: $title) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

interface TeamRow {
    id: string;
    name: string;
}

interface StepRow {
    id: string;
    candidateTeamIds: string[];
    candidateTeams: TeamRow[];
}

interface FieldRow {
    name: string;
}

const EXPECTED_STEP: StepRow = {
    id: "step-1",
    candidateTeamIds: [LIVE_TEAM, DELETED_TEAM],
    candidateTeams: [{ id: LIVE_TEAM, name: "Reviewers" }]
};

/** The pages workflow, whose only step lists a live and a deleted team. */
const createTwoTeamWorkflow = (): WorkflowValues => {
    const values = createWbWorkflowValues();
    return {
        ...values,
        steps: values.steps.map(step => {
            return {
                ...step,
                config: {
                    teams: [LIVE_TEAM, DELETED_TEAM],
                    assignment: { strategy: "none", allowManualPick: false, rules: [] }
                }
            };
        })
    };
};

/** Admin stores the two-team workflow; "Page A" has a review, "Quiet page" has none. */
const createScenario = async () => {
    const admin = await createUserContext({ legacyPlugins: [registerTeams] });
    expectOk(
        await admin.container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createTwoTeamWorkflow(), actor: WB_ADMIN_ACTOR })
    );
    const page = await createPage(admin, { title: "Page A" });
    const quietPage = await createPage(admin, { title: "Quiet page" });
    const review = await requestPageReview(admin, page);
    return { admin, page, quietPage, review };
};

describe("WB review candidateTeams (R208, Q7)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("returns the team names on the review read by id, for a viewer without security.team", async () => {
        const { review } = await createScenario();
        const reader = asGraphQLUser({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [registerTeams]
        });

        const body = await reader.run(GET_REVIEW, { id: review.id });

        const result = body.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(result.error).toBeNull();
        expect(result.data.review.steps).toEqual([EXPECTED_STEP]);
    });

    it("returns the team names on the target review read", async () => {
        const { page } = await createScenario();
        const reader = asGraphQLUser({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [registerTeams]
        });

        const body = await reader.run(GET_TARGET_REVIEW, { revisionId: page.id });

        const result = body.data.websiteBuilder.getWebsiteBuilderPageTargetReview;
        expect(result.error).toBeNull();
        expect(result.data.review.steps).toEqual([EXPECTED_STEP]);
    });

    it("returns the team names on every row of a review list", async () => {
        await createScenario();
        const reader = asGraphQLUser({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [registerTeams]
        });

        const body = await reader.run(LIST_REVIEWS, { list: "pool" });

        const result = body.data.websiteBuilder.listWebsiteBuilderPageReviews;
        expect(result.error).toBeNull();
        expect(result.data).toHaveLength(1);
        expect(result.data[0].review.steps).toEqual([EXPECTED_STEP]);
    });

    it("returns the team names on the result of the request mutation", async () => {
        const { quietPage } = await createScenario();
        const requester = asGraphQLUser({
            identity: REQUESTER,
            permissions: WB_WRITER,
            legacyPlugins: [registerTeams]
        });

        const body = await requester.run(REQUEST_REVIEW, {
            revisionId: quietPage.id,
            title: "Homepage launch"
        });

        const result = body.data.websiteBuilder.requestWebsiteBuilderPageReview;
        expect(result.error).toBeNull();
        expect(result.data.steps).toEqual([EXPECTED_STEP]);
    });

    it("keeps the id of a deleted team in candidateTeamIds and leaves it out of candidateTeams", async () => {
        const { review } = await createScenario();
        const reader = asGraphQLUser({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [registerTeams]
        });

        const body = await reader.run(GET_REVIEW, { id: review.id });

        const [step] = body.data.websiteBuilder.getWebsiteBuilderPageReview.data.review.steps;
        expect(step.candidateTeamIds).toEqual([LIVE_TEAM, DELETED_TEAM]);
        expect(step.candidateTeams).toEqual([{ id: LIVE_TEAM, name: "Reviewers" }]);
    });

    it("still returns the review, with no team names and one log, when the team lookup fails", async () => {
        const { review } = await createScenario();
        const reader = asGraphQLUser({
            identity: REVIEWER,
            permissions: WB_READER,
            legacyPlugins: [registerTeamsAndFailingLookup]
        });

        const body = await reader.run(GET_REVIEW, { id: review.id });

        const result = body.data.websiteBuilder.getWebsiteBuilderPageReview;
        expect(result.error).toBeNull();
        expect(result.data.review.id).toBe(review.id);
        expect(result.data.review.steps).toEqual([
            { id: "step-1", candidateTeamIds: [LIVE_TEAM, DELETED_TEAM], candidateTeams: [] }
        ]);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the candidate teams of a review.");
    });

    it("exposes only id and name on WorkflowsTeam in the WB schema", async () => {
        const admin = asGraphQLUser({ legacyPlugins: [registerTeams] });

        const body = await admin.run(TYPE_FIELDS, { name: "WorkflowsTeam" });

        expect(body.errors).toBeUndefined();
        const names = body.data.__type.fields.map((field: FieldRow) => field.name);
        expect(names.sort()).toEqual(["id", "name"]);
    });
});
