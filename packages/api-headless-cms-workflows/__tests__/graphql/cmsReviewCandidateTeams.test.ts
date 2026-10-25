import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { TeamStorageError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
import type { ListTeamsInput } from "@webiny/api-core/features/security/teams/shared/types.js";
import type { WorkflowValues } from "@webiny/api-workflows/domain/workflow/types.js";
import { createWorkflowValues } from "~tests/__workflows/workflow.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createGraphQLClient } from "~tests/__helpers/graphql.js";
import type { GraphQLClient } from "~tests/__helpers/graphql.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { REVIEWER } from "~tests/__helpers/identities.js";
import { CMS_READER } from "~tests/__helpers/permissions.js";
import { CMS_WRITER } from "~tests/__helpers/permissions.js";
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
class FailingListTeamsImpl implements ListTeamsUseCase.Interface {
    public constructor(private decoratee: ListTeamsUseCase.Interface) {}

    public async execute(): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        return Result.fail(new TeamStorageError(new Error("Storage is not available.")));
    }
}

const FailingListTeams = ListTeamsUseCase.createDecorator({
    decorator: FailingListTeamsImpl,
    dependencies: []
});

/** The `id_in` of every team list, one entry per call. Clear it per test. */
const teamLists: string[][] = [];

class RecordingListTeamsImpl implements ListTeamsUseCase.Interface {
    public constructor(private decoratee: ListTeamsUseCase.Interface) {}

    public async execute(
        params?: ListTeamsInput
    ): ReturnType<ListTeamsUseCase.Interface["execute"]> {
        teamLists.push([...(params?.where?.id_in ?? [])]);
        return this.decoratee.execute(params);
    }
}

const RecordingListTeams = ListTeamsUseCase.createDecorator({
    decorator: RecordingListTeamsImpl,
    dependencies: []
});

const registerTeamsAndRecordLists = (container: Container) => {
    registerTeams(container);
    container.registerDecorator(RecordingListTeams);
};

const registerTeams = (container: Container) => {
    container.registerInstance(TeamFactory, new ReviewTeamFactory());
};

const registerTeamsAndFailingLookup = (container: Container) => {
    registerTeams(container);
    container.registerDecorator(FailingListTeams);
    captureLoggedErrors(container);
};

const ERROR = "error { code message data }";
const META = "meta { cursor hasMoreItems }";
const STEPS = "steps { id candidateTeamIds candidateTeams { id name } }";
const REVIEW = `id title state ${STEPS}`;

const GET_REVIEW = /* GraphQL */ `
    query GetReview($id: ID!) {
        cms {
            getCmsEntryReview(id: $id) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const GET_TARGET_REVIEW = /* GraphQL */ `
    query GetTargetReview($modelId: ID!, $revisionId: ID!) {
        cms {
            getCmsEntryTargetReview(modelId: $modelId, revisionId: $revisionId) {
                data { review { ${REVIEW} } }
                ${ERROR}
            }
        }
    }
`;

const LIST_REVIEWS = /* GraphQL */ `
    query ListReviews($list: WorkflowsReviewListKind!) {
        cms {
            listCmsEntryReviews(list: $list) {
                data { review { ${REVIEW} } }
                ${META}
                ${ERROR}
            }
        }
    }
`;

const REQUEST_REVIEW = /* GraphQL */ `
    mutation RequestReview($modelId: ID!, $revisionId: ID!, $title: String) {
        cms {
            requestCmsEntryReview(modelId: $modelId, revisionId: $revisionId, title: $title) {
                data { ${REVIEW} }
                ${ERROR}
            }
        }
    }
`;

const TYPE_FIELDS = /* GraphQL */ `
    query TypeFields($name: String!) {
        __type(name: $name) {
            fields {
                name
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

/** The test workflow, whose only step lists a live and a deleted team. */
const createTwoTeamWorkflow = (): WorkflowValues => {
    const values = createWorkflowValues();
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

/** Runs an operation and returns `data.cms`; a GraphQL-level error fails the test. */
const run = async (client: GraphQLClient, query: string, variables?: Record<string, unknown>) => {
    const body = await client(query, variables);
    expect(body.errors).toBeUndefined();
    return body.data.cms;
};

/** Admin stores the two-team workflow and "Ann" has a review; "Bob" has none. */
const createScenario = async () => {
    const admin = await createUserContext({ legacyPlugins: [registerTeams] });
    expectOk(await storeWorkflow(admin, createTwoTeamWorkflow()));
    const entry = await createAuthorEntry(admin, { name: "Ann" });
    const unreviewedEntry = await createAuthorEntry(admin, { name: "Bob" });
    const review = await requestEntryReview(admin, entry);
    return { admin, entry, unreviewedEntry, review };
};

describe("CMS review candidateTeams (R208, Q7)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("returns the team names on the review read by id, for a viewer without security.team, keeping a deleted team's id but not its name", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [registerTeams]
        });

        const result = await run(reviewer, GET_REVIEW, { id: review.id });

        expect(result.getCmsEntryReview.error).toBeNull();
        expect(result.getCmsEntryReview.data.review.steps).toEqual([EXPECTED_STEP]);
    });

    it("returns the team names on the target review read", async () => {
        const { entry } = await createScenario();
        const reviewer = createGraphQLClient({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [registerTeams]
        });

        const result = await run(reviewer, GET_TARGET_REVIEW, {
            modelId: "author",
            revisionId: entry.id
        });

        expect(result.getCmsEntryTargetReview.error).toBeNull();
        expect(result.getCmsEntryTargetReview.data.review.steps).toEqual([EXPECTED_STEP]);
    });

    it("returns the team names on every row of a review list", async () => {
        await createScenario();
        const reviewer = createGraphQLClient({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [registerTeams]
        });

        const result = await run(reviewer, LIST_REVIEWS, { list: "pool" });

        expect(result.listCmsEntryReviews.error).toBeNull();
        expect(result.listCmsEntryReviews.data).toHaveLength(1);
        expect(result.listCmsEntryReviews.data[0].review.steps).toEqual([EXPECTED_STEP]);
    });

    it("reads the team names of every row of a review list with one team list (Q79)", async () => {
        const { admin } = await createScenario();
        for (const name of ["Cid", "Dee"]) {
            await requestEntryReview(admin, await createAuthorEntry(admin, { name }));
        }
        const reviewer = createGraphQLClient({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [registerTeamsAndRecordLists]
        });
        teamLists.length = 0;

        const result = await run(reviewer, LIST_REVIEWS, { list: "pool" });

        expect(result.listCmsEntryReviews.error).toBeNull();
        expect(result.listCmsEntryReviews.data).toHaveLength(3);
        for (const row of result.listCmsEntryReviews.data) {
            expect(row.review.steps).toEqual([EXPECTED_STEP]);
        }
        const candidateTeamLists = teamLists.filter(ids => ids.includes(LIVE_TEAM));
        expect(candidateTeamLists).toEqual([[LIVE_TEAM, DELETED_TEAM]]);
    });

    it("returns the team names on the result of the request mutation", async () => {
        const { unreviewedEntry } = await createScenario();
        const requester = createGraphQLClient({
            identity: REQUESTER,
            permissions: CMS_WRITER,
            legacyPlugins: [registerTeams]
        });

        const result = await run(requester, REQUEST_REVIEW, {
            modelId: "author",
            revisionId: unreviewedEntry.id,
            title: "Spring launch"
        });

        expect(result.requestCmsEntryReview.error).toBeNull();
        expect(result.requestCmsEntryReview.data.steps).toEqual([EXPECTED_STEP]);
    });

    it("still returns the review, with no team names and one log, when the team lookup fails", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [registerTeamsAndFailingLookup]
        });

        const result = await run(reviewer, GET_REVIEW, { id: review.id });

        expect(result.getCmsEntryReview.error).toBeNull();
        expect(result.getCmsEntryReview.data.review.id).toBe(review.id);
        expect(result.getCmsEntryReview.data.review.steps).toEqual([
            { id: "step-1", candidateTeamIds: [LIVE_TEAM, DELETED_TEAM], candidateTeams: [] }
        ]);
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("Could not look up the candidate teams of a review.");
    });

    it("exposes only id and name on WorkflowsTeam in the CMS schema", async () => {
        const reader = createGraphQLClient({ legacyPlugins: [registerTeams] });

        const body = await reader(TYPE_FIELDS, { name: "WorkflowsTeam" });

        expect(body.errors).toBeUndefined();
        const names = body.data.__type.fields.map((field: FieldRow) => field.name);
        expect(names.sort()).toEqual(["id", "name"]);
    });
});
