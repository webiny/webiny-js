### Task 5: `InspectRoutingUseCase` and `ListStepCandidatesUseCase`

Spec 6, 10 (`inspectRouting`, `listStepCandidates`), 13.2, 13.3; D45, D48, D61, D95, D97, D104, D118, D128, D132; R111, R112, R120, R121, R126, R127, R129; A47. Two internal engine use cases (explicit inputs, no permission checks, D132) that the 4.3 / 4.4 wrappers call. Both go through 4.1 Task 2's `RoutingEvaluatorService`, so the inspector, the candidate lists and step reach can never disagree.

- `InspectRoutingUseCase.execute({ stepConfig, model, requesterId, folder, now })` (R121) validates the unsaved `stepConfig` with `reviewStepConfigSchema` (invalid → `WorkflowValidationError`, message `The step configuration is invalid: <first issue>`) and, as save does, refuses a team target outside the step's teams (`Routing rule "<ruleId>" targets a team that is not one of the step's teams.`), then runs `RoutingEvaluatorService.evaluate` with `workflowId: null` (an unsaved workflow has no round-robin history), `stepId: ""`, `pickedUserId: null` and the folder-level read scope `{ type: "folder", folderId: folder?.id ?? null }` (A47: model read plus folder content read, root = model read only). It returns `RoutingInspection { owner: { id, displayName } | null, source, ruleId, strategy, trace, skipped }`, without records or load numbers (D104). The inspector is editor-only, so the trace shows an excluded rule target's own reason (or `"Excluded from reviews."` when it has none), and `skipped` lists the skipped people `{ userId, displayName, reason }` with the same reasons (R129, D118); records keep the fixed reasons (4.1 Task 2). The input carries the target folder as `{ id, type } | null` (R121): rule folder conditions compare the folder `type` (R113), and the app wrapper derives it (`cms:<modelId>`, `wb:page`). `strategy` is the step's configured strategy; `source` says what decided.
- `ListStepCandidatesUseCase.execute(input)` (R120) takes either form:
  - request dialog `{ workflowId, stepId, model, targetId, targetRevisionId, requesterId }`: the step config from the stored workflow (`WorkflowRepository.get`; the workflow must be bound to `model`, the step must exist and be a review step), the step's `teams`, read checks against the target revision;
  - reassign `{ reviewId, stepId }`: from the review snapshot (`ReviewRepository.get`), the step's `candidateTeamIds` once reached (a team rule may have narrowed them), else the snapshot config's `teams`; the requester is the review's `createdBy`; read checks against the review's revision.
  It calls `RoutingEvaluatorService.listMembers` (members except the requester, active exclusions, one read check per member as the request identity, SEC-66) and returns `StepCandidate { id, displayName, excluded, excludedReason }` sorted by `displayName` (then `id`): `excluded` when actively excluded or unable to read; `excludedReason` is the exclusion's own reason, `"Excluded from reviews."` for an exclusion without one, `"Cannot read this content."` for no read access, `null` when not excluded. No workload counts (D104). The wrappers null `excludedReason` for viewers without `editor` / `reassign` (D97, 4.3 / 4.4).
- Both turn a `RoutingDependencyError` into their failed result and catch a throwing port into `RoutingDependencyError`, so neither rejects.

**Files:**
- Modify: `packages/api-workflows/src/domain/routing/types.ts`
- Create: `packages/api-workflows/src/features/routing/InspectRouting/abstractions.ts`
- Create: `packages/api-workflows/src/features/routing/InspectRouting/InspectRoutingUseCase.ts`
- Create: `packages/api-workflows/src/features/routing/InspectRouting/feature.ts`
- Create: `packages/api-workflows/src/features/routing/InspectRouting/index.ts`
- Create: `packages/api-workflows/src/features/routing/ListStepCandidates/abstractions.ts`
- Create: `packages/api-workflows/src/features/routing/ListStepCandidates/ListStepCandidatesUseCase.ts`
- Create: `packages/api-workflows/src/features/routing/ListStepCandidates/feature.ts`
- Create: `packages/api-workflows/src/features/routing/ListStepCandidates/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/src/domain/routing/redactStepCandidates.ts`
- Create: `packages/api-workflows/__tests__/routing/InspectRouting.test.ts`
- Create: `packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts`
- Create: `packages/api-workflows/__tests__/routing/redactStepCandidates.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts`

**Interfaces:**
- Consumes:
  - 4.1 Task 2: `RoutingEvaluatorService` (`~/features/routing/RoutingEvaluatorService/index.js`): `evaluate(params: RoutingEvaluateParams): Promise<Result<RoutingEvaluation, RoutingDependencyError>>`, `listMembers(params: RoutingMembersParams): Promise<Result<RoutingMember[], RoutingDependencyError>>` (both may throw). Types (`~/domain/routing/types.js`): `RoutingEvaluateParams { config; model; workflowId: string | null; stepId; requesterId; pickedUserId: string | null; folder: TargetContextFolder | null; read: RoutingReadScope; now: Date }`, `RoutingEvaluation { owner: RoutingUser | null; source: RoutingSource; ruleId: string | null; strategy: RoutingStrategy; candidateTeamIds; reason; records; trace: RoutingTraceEntry[]; skipped: RoutingSkippedUser[] }`, `RoutingSkippedUser { userId: string; displayName: string | null; reason: string }`, `RoutingMembersParams { teamIds: string[]; requesterId: string; model: string; read: RoutingReadScope; now: Date }`, `RoutingMember { id; displayName; teamIds; exclusion: WorkflowExclusion | null; canRead: boolean }`, `RoutingUser`, `RoutingSource`, `RoutingTraceEntry { ruleId: string; outcome: "matched" | "notMatched" | "skipped"; reason: string | null }`. `RoutingDependencyError` (`~/domain/routing/errors.js`), `ROUTING_SKIP_REASONS` (`~/domain/routing/reasons.js`). Test helpers: `createRoutingContext`, `resetRoutingFakes`, `ROUTING_USERS`, `FakeListUsers` (`calls`, `failuresLeft`, constructor `(users: FakeUser[])`, `watch`), `FakeWorkflowSettings.exclusions`, `readableUsers`, `readChecks`, `throwingReadChecks`.
  - Existing: `reviewStepConfigSchema`, `parseReviewStepConfig`, `REVIEW_STEP_TYPE`, `WorkflowRepository.get(id)` (`WorkflowNotFoundError`, `WorkflowPersistenceError`), `ReviewRepository.get(id)` (`ReviewNotFoundError`, `ReviewPersistenceError`), `WorkflowValidationError`, `ReviewValidationError`, `TargetContextFolder`, `RoutingStrategy`.
- Produces:
  - Types (`~/domain/routing/types.js`): `RoutingInspection { owner: RoutingUser | null; source: RoutingSource; ruleId: string | null; strategy: RoutingStrategy; trace: RoutingTraceEntry[]; skipped: RoutingSkippedUser[] }`; `StepCandidate { id: string; displayName: string; excluded: boolean; excludedReason: string | null }`.
  - `InspectRoutingUseCase` (`~/features/routing/InspectRouting/index.js`), `execute(input: InspectRoutingInput): Promise<Result<RoutingInspection, InspectRoutingUseCase.Error>>`, `InspectRoutingInput { stepConfig: unknown; model: string; requesterId: string; folder: TargetContextFolder | null; now: Date }`, `Error = WorkflowValidationError | RoutingDependencyError`. Feature `InspectRoutingFeature`.
  - `ListStepCandidatesUseCase` (`~/features/routing/ListStepCandidates/index.js`), `execute(input: ListStepCandidatesInput): Promise<Result<StepCandidate[], ListStepCandidatesUseCase.Error>>`, `ListStepCandidatesInput = ListRequestStepCandidatesInput | ListReviewStepCandidatesInput`, `ListRequestStepCandidatesInput { workflowId: string; stepId: string; model: string; targetId: string; targetRevisionId: string; requesterId: string }`, `ListReviewStepCandidatesInput { reviewId: string; stepId: string }`, `Error = WorkflowNotFoundError | WorkflowPersistenceError | ReviewNotFoundError | ReviewPersistenceError | ReviewValidationError | RoutingDependencyError`. Messages: `The workflow "<name>" is not bound to the model "<model>".`, `Step "<stepId>" does not exist in workflow "<name>".` / `Step "<stepId>" does not exist in this review.`, `Step "<title>" is not a review step.`. Feature `ListStepCandidatesFeature`.
  - `redactStepCandidates(candidates: StepCandidate[], permissions: WorkflowsPermissionSet): StepCandidate[]` (`~/domain/routing/redactStepCandidates.js`, pure; R127): keeps `excludedReason` for `editor` or `reassign`, nulls it otherwise, `excluded` untouched, order kept. 4.3 Task 9 and 4.4 Task 12 use it in their candidate wrappers.
  - Excluded-reason constants used by the rows: `ROUTING_SKIP_REASONS.excluded` (no own reason) and `ROUTING_SKIP_REASONS.cannotRead`.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/routing/InspectRouting.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createRoutingContext, resetRoutingFakes } from "~tests/__helpers/routingContext.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import {
    ARTICLE_MODEL,
    NOW,
    requester,
    REVIEW_TEAM_ID,
    targetContext
} from "~tests/__helpers/fixtures.js";
import { InspectRoutingUseCase } from "~/features/routing/InspectRouting/index.js";

const userRule = (id: string, userId: string) => {
    return { id, conditions: {}, target: { type: "user", id: userId } };
};

const stepConfig = (rules: unknown[] = []) => {
    return {
        teams: [REVIEW_TEAM_ID],
        assignment: { strategy: "none", allowManualPick: false, rules }
    };
};

const setup = async () => {
    const routing = await createRoutingContext();
    routing.users.calls.length = 0;
    return { ...routing, inspect: routing.context.container.resolve(InspectRoutingUseCase) };
};

describe("InspectRoutingUseCase (D45, D118, R121)", () => {
    beforeEach(() => {
        resetRoutingFakes();
    });

    it("evaluates unsaved rules with folder-level read checks and returns the trace", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-anna");

        const result = await inspect.execute({
            stepConfig: stepConfig([userRule("rule-dan", "user-dan"), userRule("rule-anna", "user-anna")]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.isOk()).toBe(true);
        expect(result.value).toEqual({
            owner: { id: "user-anna", displayName: "Anna" },
            source: "rule",
            ruleId: "rule-anna",
            strategy: "none",
            trace: [
                { ruleId: "rule-dan", outcome: "skipped", reason: "Not a member of the step's teams." },
                { ruleId: "rule-anna", outcome: "matched", reason: null }
            ],
            skipped: [
                { userId: "user-dan", displayName: null, reason: "Not a member of the step's teams." }
            ]
        });
        expect(readChecks).toEqual([
            {
                userId: "user-anna",
                scope: "folder",
                targetRevisionId: null,
                folderId: "folder-1",
                authorizationEnabled: true
            }
        ]);
    });

    it("shows an excluded target's own reason to the editor, and the fixed one without it (R129, D118)", async () => {
        const { inspect, settings } = await setup();
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
        settings.exclusions = [{ userId: "user-anna", reason: "On leave" }, { userId: "user-bob" }];

        const result = await inspect.execute({
            stepConfig: stepConfig([
                userRule("rule-anna", "user-anna"),
                userRule("rule-bob", "user-bob")
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [
                { ruleId: "rule-anna", outcome: "skipped", reason: "On leave" },
                { ruleId: "rule-bob", outcome: "skipped", reason: "Excluded from reviews." }
            ],
            skipped: [
                { userId: "user-anna", displayName: "Anna", reason: "On leave" },
                { userId: "user-bob", displayName: "Bob", reason: "Excluded from reviews." }
            ]
        });
        // The records keep the fixed reason (D89, D97); the inspection returns no records (D104).
        expect(result.value).not.toHaveProperty("records");
    });

    it("checks the model only for a target in the root folder", async () => {
        const { inspect } = await setup();
        readableUsers.add("user-anna");

        await inspect.execute({
            stepConfig: stepConfig([userRule("rule-anna", "user-anna")]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(readChecks).toMatchObject([{ userId: "user-anna", scope: "folder", folderId: null }]);
    });

    it("returns the pool without rules or strategy", async () => {
        const { inspect } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig(),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        });

        expect(result.value).toEqual({
            owner: null,
            source: "pool",
            ruleId: null,
            strategy: "none",
            trace: [],
            skipped: []
        });
    });

    it("refuses a team target outside the step's teams, as save does, before any lookup", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig([
                { id: "rule-legal", conditions: {}, target: { type: "team", id: "team-legal" } }
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'Routing rule "rule-legal" targets a team that is not one of the step\'s teams.'
        );
        expect(users.calls).toEqual([]);
    });

    it("refuses an invalid step config before any lookup", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: { teams: [REVIEW_TEAM_ID], assignment: { strategy: "fastest" } },
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toMatch(/^The step configuration is invalid: /);
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("returns the routing dependency error when a lookup fails or a read check throws", async () => {
        const { inspect, users } = await setup();
        throwingReadChecks.add("user-anna");
        const input = {
            stepConfig: stepConfig([userRule("rule-anna", "user-anna")]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: targetContext.folder,
            now: new Date(NOW)
        };

        users.failuresLeft = 1;
        const failed = await inspect.execute(input);
        const thrown = await inspect.execute(input);

        expect(failed.error.code).toBe("Workflows/Routing/Dependency");
        expect(failed.error.message).toBe("Storage is not available.");
        expect(thrown.error.code).toBe("Workflows/Routing/Dependency");
        expect(thrown.error.message).toBe("The read check crashed.");
    });
});
```

Create `packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createRoutingContext, resetRoutingFakes } from "~tests/__helpers/routingContext.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { FakeReviewTargetLoader } from "~tests/__helpers/FakeReviewTargetLoader.js";
import {
    readableUsers,
    readChecks,
    throwingReadChecks
} from "~tests/__helpers/FakeReviewTargetReadAccess.js";
import { createRequestInput } from "~tests/__helpers/reviewContext.js";
import {
    ARTICLE_MODEL,
    createWorkflowValues,
    editor,
    expectOk,
    requester,
    REVIEW_TEAM_ID
} from "~tests/__helpers/fixtures.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { RequestReviewUseCase } from "~/features/review/RequestReview/index.js";
import { ListStepCandidatesUseCase } from "~/features/routing/ListStepCandidates/index.js";

const PAST = "2000-01-01T00:00:00.000Z";

const REQUEST_INPUT = {
    workflowId: "workflow-1",
    stepId: "legal",
    model: ARTICLE_MODEL,
    targetId: "article-1",
    targetRevisionId: "article-1#0001",
    requesterId: requester.id
};

/** Anna can read; Bob is excluded with a reason; Cara's exclusion expired, but she cannot read. */
const EXPECTED_ROWS = [
    { id: "user-anna", displayName: "Anna", excluded: false, excludedReason: null },
    { id: "user-bob", displayName: "Bob", excluded: true, excludedReason: "On leave" },
    {
        id: "user-cara",
        displayName: "Cara",
        excluded: true,
        excludedReason: "Cannot read this content."
    }
];

const setup = async () => {
    const routing = await createRoutingContext({
        setup: container => {
            container.register(FakeReviewTargetLoader);
        }
    });
    const { container } = routing.context;
    expectOk(
        await container
            .resolve(StoreWorkflowUseCase)
            .execute({ workflow: createWorkflowValues(), actor: editor })
    );
    routing.settings.exclusions = [
        { userId: "user-bob", reason: "On leave" },
        { userId: "user-cara", reason: "Holiday", endsOn: PAST }
    ];
    routing.users.calls.length = 0;
    return { ...routing, listCandidates: container.resolve(ListStepCandidatesUseCase) };
};

describe("ListStepCandidatesUseCase (D97, D128, R120)", () => {
    beforeEach(() => {
        resetRoutingFakes();
        readableUsers.add("user-anna");
        readableUsers.add("user-bob");
    });

    it("lists the members of a stored step for a request, without the requester", async () => {
        const { listCandidates, users } = await setup();

        const rows = expectOk(await listCandidates.execute(REQUEST_INPUT));

        expect(rows).toEqual(EXPECTED_ROWS);
        expect(users.calls).toEqual([
            { input: { where: { teams_in: [REVIEW_TEAM_ID] } }, authorizationEnabled: false }
        ]);
        expect(readChecks.map(check => [check.userId, check.scope, check.targetRevisionId])).toEqual([
            ["user-anna", "target", "article-1#0001"],
            ["user-bob", "target", "article-1#0001"],
            ["user-cara", "target", "article-1#0001"]
        ]);
        expect(readChecks.every(check => check.authorizationEnabled)).toBe(true);
    });

    it("lists the members of a review's step for reassign, from the snapshot", async () => {
        const { context, listCandidates } = await setup();
        const review = expectOk(
            await context.container.resolve(RequestReviewUseCase).execute(createRequestInput())
        );
        readChecks.length = 0;

        const rows = expectOk(await listCandidates.execute({ reviewId: review.id, stepId: "legal" }));

        expect(rows).toEqual(EXPECTED_ROWS);
        expect(readChecks.map(check => check.targetRevisionId)).toEqual([
            review.targetRevisionId,
            review.targetRevisionId,
            review.targetRevisionId
        ]);
    });

    it("sorts by display name, not by id", async () => {
        const users = new FakeListUsers([
            { id: "user-a", displayName: "Zoe", teams: [REVIEW_TEAM_ID] },
            { id: "user-b", displayName: "Adam", teams: [REVIEW_TEAM_ID] }
        ]);
        const routing = await createRoutingContext({
            setup: container => {
                container.registerInstance(ListUsersUseCase, users);
            }
        });
        expectOk(
            await routing.context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues(), actor: editor })
        );
        readableUsers.add("user-a");
        readableUsers.add("user-b");

        const rows = expectOk(
            await routing.context.container
                .resolve(ListStepCandidatesUseCase)
                .execute(REQUEST_INPUT)
        );

        expect(rows.map(row => row.displayName)).toEqual(["Adam", "Zoe"]);
    });

    it("gives an exclusion without its own reason the fixed reason", async () => {
        const { listCandidates, settings } = await setup();
        settings.exclusions = [{ userId: "user-anna" }];

        const rows = expectOk(await listCandidates.execute(REQUEST_INPUT));

        expect(rows[0]).toEqual({
            id: "user-anna",
            displayName: "Anna",
            excluded: true,
            excludedReason: "Excluded from reviews."
        });
    });

    it("refuses an unknown workflow, an unbound model, an unknown step and an unknown review", async () => {
        const { listCandidates } = await setup();

        const noWorkflow = await listCandidates.execute({ ...REQUEST_INPUT, workflowId: "nope" });
        const otherModel = await listCandidates.execute({ ...REQUEST_INPUT, model: "cms.recipe" });
        const noStep = await listCandidates.execute({ ...REQUEST_INPUT, stepId: "nope" });
        const noReview = await listCandidates.execute({ reviewId: "review-missing", stepId: "legal" });

        expect(noWorkflow.error.code).toBe("Workflows/Workflow/NotFound");
        expect(otherModel.error.code).toBe("Workflows/Review/Validation");
        expect(otherModel.error.message).toBe(
            'The workflow "Article review" is not bound to the model "cms.recipe".'
        );
        expect(noStep.error.code).toBe("Workflows/Review/Validation");
        expect(noStep.error.message).toBe('Step "nope" does not exist in workflow "Article review".');
        expect(noReview.error.code).toBe("Workflows/Review/NotFound");
        expect(readChecks).toEqual([]);
    });

    it("returns the routing dependency error when a lookup fails or a read check throws", async () => {
        const { listCandidates, users } = await setup();
        throwingReadChecks.add("user-bob");

        users.failuresLeft = 1;
        const failed = await listCandidates.execute(REQUEST_INPUT);
        const thrown = await listCandidates.execute(REQUEST_INPUT);

        expect(failed.error.code).toBe("Workflows/Routing/Dependency");
        expect(failed.error.message).toBe("Storage is not available.");
        expect(thrown.error.code).toBe("Workflows/Routing/Dependency");
        expect(thrown.error.message).toBe("The read check crashed.");
    });
});
```

Create `packages/api-workflows/__tests__/routing/redactStepCandidates.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { StepCandidate } from "~/domain/routing/types.js";
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import { redactStepCandidates } from "~/domain/routing/redactStepCandidates.js";

const CANDIDATES: StepCandidate[] = [
    { id: "user-anna", displayName: "Anna", excluded: true, excludedReason: "On leave" },
    { id: "user-ben", displayName: "Ben", excluded: false, excludedReason: null },
    {
        id: "user-cara",
        displayName: "Cara",
        excluded: true,
        excludedReason: "Cannot read this content."
    }
];

const NONE: WorkflowsPermissionSet = { fullAccess: false, editor: false, reassign: false };

describe("redactStepCandidates (D97, R120)", () => {
    it("keeps the reasons for editor, reassign and full access", () => {
        expect(redactStepCandidates(CANDIDATES, { ...NONE, editor: true })).toEqual(CANDIDATES);
        expect(redactStepCandidates(CANDIDATES, { ...NONE, reassign: true })).toEqual(CANDIDATES);
        expect(
            redactStepCandidates(CANDIDATES, { fullAccess: true, editor: true, reassign: true })
        ).toEqual(CANDIDATES);
    });

    it("drops every reason for anyone else and keeps who is excluded, in order", () => {
        expect(redactStepCandidates(CANDIDATES, NONE)).toEqual([
            { id: "user-anna", displayName: "Anna", excluded: true, excludedReason: null },
            { id: "user-ben", displayName: "Ben", excluded: false, excludedReason: null },
            { id: "user-cara", displayName: "Cara", excluded: true, excludedReason: null }
        ]);
    });

    it("does not change the input", () => {
        const input = CANDIDATES.map(candidate => ({ ...candidate }));

        redactStepCandidates(input, NONE);

        expect(input).toEqual(CANDIDATES);
    });
});
```

In `packages/api-workflows/__tests__/registration.test.ts`, add after the `ListReviewAssignmentsUseCase` import:

```ts
import { InspectRoutingUseCase } from "~/features/routing/InspectRouting/index.js";
import { ListStepCandidatesUseCase } from "~/features/routing/ListStepCandidates/index.js";
```

and after `expect(container.resolveAll(ListReviewAssignmentsUseCase)).toHaveLength(1);`:

```ts
        expect(container.resolveAll(InspectRoutingUseCase)).toHaveLength(1);
        expect(container.resolveAll(ListStepCandidatesUseCase)).toHaveLength(1);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/routing/InspectRouting.test.ts packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts packages/api-workflows/__tests__/routing/redactStepCandidates.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/routing/InspectRouting/index.js`, `~/features/routing/ListStepCandidates/index.js` and `~/domain/routing/redactStepCandidates.js`.

- [ ] **Step 3: The result types and the redaction**

In `packages/api-workflows/src/domain/routing/types.ts`, append:

```ts

/** What the rule inspector shows for an unsaved step config (R121): no records, no load numbers (D104). */
export interface RoutingInspection {
    owner: RoutingUser | null;
    source: RoutingSource;
    ruleId: string | null;
    /** The step's configured strategy. */
    strategy: RoutingStrategy;
    /** Excluded rule targets show the exclusion's own reason; editor only (R129, D118). */
    trace: RoutingTraceEntry[];
    /** The skipped people with the trace's reasons (R129, D118). */
    skipped: RoutingSkippedUser[];
}

/**
 * A row of the request dialog's picker or the reassign dialog (R120, D128). `excludedReason`: the
 * exclusion's own reason, a fixed reason, or `null`; the wrappers null it for viewers without
 * `editor` / `reassign` (D97). No workload counts (D104).
 */
export interface StepCandidate {
    id: string;
    displayName: string;
    excluded: boolean;
    excludedReason: string | null;
}
```

(`RoutingStrategy` and `RoutingSkippedUser` are already in that file from 4.1 Task 2.)

Create `packages/api-workflows/src/domain/routing/redactStepCandidates.ts`:

```ts
import type { WorkflowsPermissionSet } from "~/domain/permissions/types.js";
import type { StepCandidate } from "./types.js";

/**
 * The step candidates one viewer may see (D89, D97, R120). Pure. `editor` and `reassign` (full
 * access sets both) see why a person is excluded; everyone else sees only that they are, because an
 * exclusion's reason is personal. Order is kept.
 */
export const redactStepCandidates = (
    candidates: StepCandidate[],
    permissions: WorkflowsPermissionSet
): StepCandidate[] => {
    if (permissions.editor || permissions.reassign) {
        return candidates.map(candidate => ({ ...candidate }));
    }
    return candidates.map(candidate => ({ ...candidate, excludedReason: null }));
};
```

- [ ] **Step 4: `InspectRoutingUseCase`**

Create `packages/api-workflows/src/features/routing/InspectRouting/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { TargetContextFolder } from "~/domain/review/types.js";
import type { RoutingInspection } from "~/domain/routing/types.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";

export interface InspectRoutingInput {
    /** The step config as the editor holds it, unsaved; validated here. */
    stepConfig: unknown;
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    requesterId: string;
    /** The target folder with its app type (`cms:<modelId>`, `wb:page`); `null` for the root. */
    folder: TargetContextFolder | null;
    now: Date;
}

export interface IInspectRoutingUseCaseErrors {
    validation: WorkflowValidationError;
    routing: RoutingDependencyError;
}

type UseCaseError = IInspectRoutingUseCaseErrors[keyof IInspectRoutingUseCaseErrors];

export interface IInspectRoutingUseCase {
    execute(input: InspectRoutingInput): Promise<Result<RoutingInspection, UseCaseError>>;
}

/**
 * The rule inspector (spec 6, D45, D95, D118, R121): what routing would do with an unsaved step
 * config for a requester and folder, with the per-rule trace. Internal (D132): the app wrappers
 * check `editor`. Read access is evaluated at folder level (A47).
 */
export const InspectRoutingUseCase =
    createAbstraction<IInspectRoutingUseCase>("InspectRoutingUseCase");

export namespace InspectRoutingUseCase {
    export type Interface = IInspectRoutingUseCase;
    export type Input = InspectRoutingInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<RoutingInspection, UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/routing/InspectRouting/InspectRoutingUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import type { RoutingEvaluation } from "~/domain/routing/types.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { InspectRoutingUseCase as UseCase } from "./abstractions.js";

class InspectRoutingUseCaseImpl implements UseCase.Interface {
    constructor(private routing: RoutingEvaluatorService.Interface) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const parsed = reviewStepConfigSchema.safeParse(input.stepConfig);
        if (!parsed.success) {
            const [issue] = parsed.error.issues;
            return Result.fail(
                new WorkflowValidationError(
                    `The step configuration is invalid: ${issue?.message ?? "unknown error"}`
                )
            );
        }
        // Save refuses a team target outside the step's teams (spec 6); the inspector does too.
        for (const rule of parsed.data.assignment.rules) {
            if (rule.target.type === "team" && !parsed.data.teams.includes(rule.target.id)) {
                return Result.fail(
                    new WorkflowValidationError(
                        `Routing rule "${rule.id}" targets a team that is not one of the step's teams.`
                    )
                );
            }
        }

        // An unsaved config has no stored workflow: no round-robin history, no pick. Read access
        // is checked at folder level as the request identity (A47, SEC-66).
        let evaluated: Result<RoutingEvaluation, RoutingDependencyError>;
        try {
            evaluated = await this.routing.evaluate({
                config: parsed.data,
                model: input.model,
                workflowId: null,
                stepId: "",
                requesterId: input.requesterId,
                pickedUserId: null,
                folder: input.folder ? { ...input.folder } : null,
                read: { type: "folder", folderId: input.folder?.id ?? null },
                now: input.now
            });
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(error instanceof Error ? error : new Error(String(error)))
            );
        }
        if (evaluated.isFail()) {
            return Result.fail(evaluated.error);
        }
        const evaluation = evaluated.value;

        return Result.ok({
            owner: evaluation.owner
                ? { id: evaluation.owner.id, displayName: evaluation.owner.displayName }
                : null,
            source: evaluation.source,
            ruleId: evaluation.ruleId,
            strategy: evaluation.strategy,
            trace: evaluation.trace.map(entry => ({ ...entry })),
            skipped: evaluation.skipped.map(item => ({ ...item }))
        });
    }
}

export const InspectRoutingUseCase = UseCase.createImplementation({
    implementation: InspectRoutingUseCaseImpl,
    dependencies: [RoutingEvaluatorService]
});
```

Create `packages/api-workflows/src/features/routing/InspectRouting/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { InspectRoutingUseCase } from "./InspectRoutingUseCase.js";

export const InspectRoutingFeature = createFeature({
    name: "Workflows/InspectRouting",
    register(container) {
        container.register(InspectRoutingUseCase);
    }
});
```

Create `packages/api-workflows/src/features/routing/InspectRouting/index.ts`:

```ts
export { InspectRoutingUseCase } from "./abstractions.js";
export type { InspectRoutingInput } from "./abstractions.js";
export type {
    RoutingInspection,
    RoutingSkippedUser,
    RoutingTraceEntry
} from "~/domain/routing/types.js";
```

- [ ] **Step 5: `ListStepCandidatesUseCase`**

Create `packages/api-workflows/src/features/routing/ListStepCandidates/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { StepCandidate } from "~/domain/routing/types.js";
import type { RoutingDependencyError } from "~/domain/routing/errors.js";
import type {
    ReviewNotFoundError,
    ReviewPersistenceError,
    ReviewValidationError
} from "~/domain/review/errors.js";
import type { WorkflowNotFoundError, WorkflowPersistenceError } from "~/domain/workflow/errors.js";

/** The request dialog's picker: the stored workflow's step, before a review exists. */
export interface ListRequestStepCandidatesInput {
    workflowId: string;
    stepId: string;
    /** Namespace id, e.g. "cms.article" or "wb.page"; the workflow must be bound to it. */
    model: string;
    targetId: string;
    targetRevisionId: string;
    requesterId: string;
}

/** The reassign dialog: the step of an existing review, from its snapshot. */
export interface ListReviewStepCandidatesInput {
    reviewId: string;
    stepId: string;
}

export type ListStepCandidatesInput = ListRequestStepCandidatesInput | ListReviewStepCandidatesInput;

export interface IListStepCandidatesUseCaseErrors {
    workflowNotFound: WorkflowNotFoundError;
    workflowPersistence: WorkflowPersistenceError;
    reviewNotFound: ReviewNotFoundError;
    reviewPersistence: ReviewPersistenceError;
    validation: ReviewValidationError;
    routing: RoutingDependencyError;
}

type UseCaseError = IListStepCandidatesUseCaseErrors[keyof IListStepCandidatesUseCaseErrors];

export interface IListStepCandidatesUseCase {
    execute(input: ListStepCandidatesInput): Promise<Result<StepCandidate[], UseCaseError>>;
}

/**
 * Who could take a step (spec 10, D97, D104, D128, R120): every member of the step's teams except
 * the requester, by display name, with exclusion and read access. Internal (D132): the wrappers
 * check write access (request) or `reassign` and read access (reassign), and null
 * `excludedReason` for viewers without `editor` / `reassign`.
 */
export const ListStepCandidatesUseCase = createAbstraction<IListStepCandidatesUseCase>(
    "ListStepCandidatesUseCase"
);

export namespace ListStepCandidatesUseCase {
    export type Interface = IListStepCandidatesUseCase;
    export type Input = ListStepCandidatesInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<StepCandidate[], UseCaseError>>;
}
```

Create `packages/api-workflows/src/features/routing/ListStepCandidates/ListStepCandidatesUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { ReviewValidationError } from "~/domain/review/errors.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { REVIEW_STEP_TYPE } from "~/domain/workflow/WorkflowValidator.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { RoutingDependencyError } from "~/domain/routing/errors.js";
import { ROUTING_SKIP_REASONS } from "~/domain/routing/reasons.js";
import type { RoutingMember, RoutingMembersParams, StepCandidate } from "~/domain/routing/types.js";
import { RoutingEvaluatorService } from "~/features/routing/RoutingEvaluatorService/index.js";
import { ListStepCandidatesUseCase as UseCase } from "./abstractions.js";

/** A member as a picker row (R120): the exclusion's own reason first, then no read access. */
const toStepCandidate = (member: RoutingMember): StepCandidate => {
    if (member.exclusion) {
        return {
            id: member.id,
            displayName: member.displayName,
            excluded: true,
            excludedReason: member.exclusion.reason || ROUTING_SKIP_REASONS.excluded
        };
    }
    return {
        id: member.id,
        displayName: member.displayName,
        excluded: !member.canRead,
        excludedReason: member.canRead ? null : ROUTING_SKIP_REASONS.cannotRead
    };
};

class ListStepCandidatesUseCaseImpl implements UseCase.Interface {
    constructor(
        private workflowRepository: WorkflowRepository.Interface,
        private reviewRepository: ReviewRepository.Interface,
        private routing: RoutingEvaluatorService.Interface
    ) {}

    async execute(input: UseCase.Input): UseCase.Return {
        const now = new Date();
        let params: RoutingMembersParams;

        if ("reviewId" in input) {
            // Reassign: the review's snapshot, with the teams the step was reached with.
            const loaded = await this.reviewRepository.get(input.reviewId);
            if (loaded.isFail()) {
                return Result.fail(loaded.error);
            }
            const review = loaded.value;
            const step = review.steps.find(item => item.id === input.stepId);
            if (!step) {
                return Result.fail(
                    new ReviewValidationError(`Step "${input.stepId}" does not exist in this review.`)
                );
            }
            const config = step.type === REVIEW_STEP_TYPE ? parseReviewStepConfig(step.config) : null;
            if (!config) {
                return Result.fail(
                    new ReviewValidationError(`Step "${step.title}" is not a review step.`)
                );
            }
            params = {
                teamIds:
                    step.candidateTeamIds.length > 0 ? [...step.candidateTeamIds] : [...config.teams],
                requesterId: review.createdBy.id,
                model: review.model,
                read: {
                    type: "target",
                    targetId: review.targetId,
                    targetRevisionId: review.targetRevisionId
                },
                now
            };
        } else {
            // Request: the stored workflow's step, before any review exists.
            const loaded = await this.workflowRepository.get(input.workflowId);
            if (loaded.isFail()) {
                return Result.fail(loaded.error);
            }
            const workflow = loaded.value;
            if (!workflow.models.includes(input.model)) {
                return Result.fail(
                    new ReviewValidationError(
                        `The workflow "${workflow.name}" is not bound to the model "${input.model}".`
                    )
                );
            }
            const step = workflow.steps.find(item => item.id === input.stepId);
            if (!step) {
                return Result.fail(
                    new ReviewValidationError(
                        `Step "${input.stepId}" does not exist in workflow "${workflow.name}".`
                    )
                );
            }
            const config = step.type === REVIEW_STEP_TYPE ? parseReviewStepConfig(step.config) : null;
            if (!config) {
                return Result.fail(
                    new ReviewValidationError(`Step "${step.title}" is not a review step.`)
                );
            }
            params = {
                teamIds: [...config.teams],
                requesterId: input.requesterId,
                model: input.model,
                read: {
                    type: "target",
                    targetId: input.targetId,
                    targetRevisionId: input.targetRevisionId
                },
                now
            };
        }

        // Members, exclusions and read checks (as the request identity, SEC-66) in one place.
        let listed: Result<RoutingMember[], RoutingDependencyError>;
        try {
            listed = await this.routing.listMembers(params);
        } catch (error) {
            return Result.fail(
                new RoutingDependencyError(error instanceof Error ? error : new Error(String(error)))
            );
        }
        if (listed.isFail()) {
            return Result.fail(listed.error);
        }

        return Result.ok(
            listed.value
                .map(toStepCandidate)
                .sort((a, b) => {
                    return a.displayName.localeCompare(b.displayName) || a.id.localeCompare(b.id);
                })
        );
    }
}

export const ListStepCandidatesUseCase = UseCase.createImplementation({
    implementation: ListStepCandidatesUseCaseImpl,
    dependencies: [WorkflowRepository, ReviewRepository, RoutingEvaluatorService]
});
```

Create `packages/api-workflows/src/features/routing/ListStepCandidates/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ListStepCandidatesUseCase } from "./ListStepCandidatesUseCase.js";

export const ListStepCandidatesFeature = createFeature({
    name: "Workflows/ListStepCandidates",
    register(container) {
        container.register(ListStepCandidatesUseCase);
    }
});
```

Create `packages/api-workflows/src/features/routing/ListStepCandidates/index.ts`:

```ts
export { ListStepCandidatesUseCase } from "./abstractions.js";
export type {
    ListRequestStepCandidatesInput,
    ListReviewStepCandidatesInput,
    ListStepCandidatesInput
} from "./abstractions.js";
export type { StepCandidate } from "~/domain/routing/types.js";
```

- [ ] **Step 6: Register**

In `packages/api-workflows/src/WorkflowsFeature.ts`, add after the `RoutingStrategyFeature` import (4.1 Task 3):

```ts
import { InspectRoutingFeature } from "~/features/routing/InspectRouting/feature.js";
import { ListStepCandidatesFeature } from "~/features/routing/ListStepCandidates/feature.js";
```

and after `RoutingStrategyFeature.register(container);` (4.1 Task 3):

```ts
        // Routing reads for the editor's inspector and the request and reassign dialogs (R120, R121)
        InspectRoutingFeature.register(container);
        ListStepCandidatesFeature.register(container);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/routing/InspectRouting.test.ts packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts packages/api-workflows/__tests__/routing/redactStepCandidates.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/routing/InspectRouting.test.ts packages/api-workflows/__tests__/routing/ListStepCandidates.test.ts packages/api-workflows/__tests__/routing/RoutingEvaluatorService.test.ts packages/api-workflows/__tests__/routing/redactStepCandidates.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the routing inspector, the step candidate list and the candidate redaction

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
