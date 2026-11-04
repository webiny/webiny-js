### Task 2: CMS and WB end-to-end `candidateTeams` tests

Spec 13.1; user answer Q7; R208, A68, A69; Review Focus 2. Task 1 put the field on the shared `WorkflowsReviewStep`, so the CMS and WB wrappers should return it without change. This task proves that end to end in both apps, for every read and for the request mutation, for a viewer without `security.team`, for a deleted team, and for a failing lookup.

- CMS: `getCmsEntryReview`, `getCmsEntryTargetReview`, `listCmsEntryReviews` and `requestCmsEntryReview` select `steps { id candidateTeamIds candidateTeams { id name } }`. WB: the four matching `...WebsiteBuilderPage...` operations.
- The workflow's step lists `team-1` (a code team named "Reviewers", registered through the api-core `TeamFactory`) and `team-gone` (never registered, as a deleted team). Every response keeps `candidateTeamIds: ["team-1", "team-gone"]` and returns `candidateTeams: [{ id: "team-1", name: "Reviewers" }]`.
- The reading identities (`REVIEWER` with CMS or WB read permissions, no `security.team`) get the names, which proves the `withoutAuthorization` lookup through the real wrappers.
- A failing team lookup (a `GetTeamUseCase` decorator returning a storage failure) leaves the review readable with `candidateTeams: []` and one logged `Could not look up the candidate teams of a review.`.
- `__type(name: "WorkflowsTeam")` in each app's schema lists exactly `id` and `name`.
- No source change was needed: both wrappers pass the review through unchanged (`ReviewEntryMapper` and `attachAssignmentRecords` keep `candidateTeamIds` on the step shape).

**Files:**
- Create: `packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCandidateTeams.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageReviewCandidateTeams.test.ts`
- Existing, must stay green: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts`, `packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts`

**Interfaces:**
- Consumes: Task 1 (`WorkflowsReviewStep.candidateTeams`, `WorkflowsTeam`); existing harnesses `createUserContext` and `createGraphQLClient` (CMS `__tests__/__helpers/`), `createUserContext` and `asGraphQLUser` (WB `__tests__/__helpers/`), `storeWorkflow`, `createWorkflowValues` (CMS `__tests__/__workflows/workflow.ts`), `createWbWorkflowValues`, `requestPageReview`, `WB_ADMIN_ACTOR` (WB `__helpers/engine.ts`), `createPage`, `expectOk` (WB `__helpers/pages.ts`), `createAuthorEntry`, `requestEntryReview`, `TeamFactory`, `GetTeamUseCase`, `TYPE_FIELDS` (WB `__helpers/graphql.ts`).
- Produces: proof only, no export (confidence for Tasks 11 and 12).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCandidateTeams.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TeamFactory } from "@webiny/api-core/features/security/teams/shared/abstractions.js";
import { TeamStorageError } from "@webiny/api-core/features/security/teams/shared/errors.js";
import { GetTeamUseCase } from "@webiny/api-core/features/security/teams/GetTeam/index.js";
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

    it("returns the team names on the review read by id, for a viewer without security.team", async () => {
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

    it("keeps the id of a deleted team in candidateTeamIds and leaves it out of candidateTeams", async () => {
        const { review } = await createScenario();
        const reviewer = createGraphQLClient({
            identity: REVIEWER,
            permissions: CMS_READER,
            legacyPlugins: [registerTeams]
        });

        const result = await run(reviewer, GET_REVIEW, { id: review.id });

        const [step] = result.getCmsEntryReview.data.review.steps;
        expect(step.candidateTeamIds).toEqual([LIVE_TEAM, DELETED_TEAM]);
        expect(step.candidateTeams).toEqual([{ id: LIVE_TEAM, name: "Reviewers" }]);
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
        const names = body.data.__type.fields.map((field: { name: string }) => field.name);
        expect(names.sort()).toEqual(["id", "name"]);
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageReviewCandidateTeams.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests**

```bash
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCandidateTeams.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviewCandidateTeams.test.ts 2>&1 | tail -50
```

Expected: PASS at once (proof-only task; a failure points at a Task 1 gap). Both test handlers already register `SendMailFeature` (commit 843e5eddaa).

- [ ] **Step 3: Implement**

No change.

- [ ] **Step 4: Run the new tests on both storages, expect pass**

```bash
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCandidateTeams.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsReviewCandidateTeams.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviewCandidateTeams.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageReviewCandidateTeams.test.ts 2>&1 | tail -50
```

Expected: PASS (7 tests each).

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageReviews.test.ts 2>&1 | tail -50
yarn check:test:types -p api-headless-cms-workflows,api-website-builder-workflows --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/api-website-builder-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "test(workflows): prove candidateTeams in the CMS and WB reviews" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.
