### Task 6: Save-time validation of rule user targets

Spec 6 ("Rule targets are also validated when the workflow is saved"), 4.1; phase 1a A7 (deferred here); D48; R87, R122. `WorkflowValidator` (pure, static) already checks that team targets are among the step's teams and leaves user targets to phase 4 (comment in `validateReviewConfig`). The membership check needs a user lookup, so it runs inline in `StoreWorkflowUseCase`, right after the pure validation and before any read of the stored workflow:

- For every review step with at least one rule whose target is `user`: one api-core `ListUsersUseCase.execute({ where: { id_in: <the step's user target ids, de-duplicated>, teams_in: <the step's teams> } })` inside `IdentityContext.withoutAuthorization` (only that call; `ListUsers` needs `adminUsers.user`, D48).
- A user target the lookup does not return (unknown, deleted, or in none of the step's teams) fails the save with `WorkflowValidationError` and the exact message `Rule <ruleId> targets a user who is not a member of the step's teams.` (the first offending rule, in step and rule order).
- A failed or throwing lookup fails the save with `WorkflowPersistenceError` (R87).
- No user targets: no lookup.

Create and update both run the check; nothing is stored and no event is published when it fails. A later team change can still invalidate a saved rule; evaluation then skips it (4.1, spec 6).

Routing tests from 4.1 that store workflows with user-target rules must keep passing: their users come from 4.1 Task 2's `FakeListUsers` (`ROUTING_USERS`), and Step 6 runs them.

**Files:**
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`
- Modify: `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts` (comment only)
- Create: `packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts`

**Interfaces:**
- Consumes:
  - api-core: `ListUsersUseCase` (`@webiny/api-core/features/users/ListUsers/index.js`), `execute(input?: ListUsersInput): Promise<Result<AdminUser[], ListUsersUseCase.Error>>` with `ListUsersInput { where?: { id_in?: string[]; teams_in?: string[] } }`; `IdentityContext` (`@webiny/api-core/features/security/IdentityContext/index.js`), `withoutAuthorization<T>(cb: () => Promise<T>): Promise<T>`.
  - Phase 1a: `WorkflowValidator.validate(values): Result<WorkflowValues, WorkflowValidationError>` (review step `config` is the parsed `ReviewStepConfig`), `REVIEW_STEP_TYPE` (`~/domain/workflow/WorkflowValidator.js`), `parseReviewStepConfig(config: unknown): ReviewStepConfig | null` (`~/domain/workflow/reviewStepConfigSchema.js`), `WorkflowValidationError(message)`, `WorkflowPersistenceError(error)`.
  - 4.1 Task 2 (test helper `~tests/__helpers/FakeListUsers.js`): `class FakeListUsers implements ListUsersUseCase.Interface` with `constructor(users: FakeUser[])`, `FakeUser { id: string; displayName: string; teams: string[] }`, `calls: ListUsersCall[]` (`{ input: ListUsersInput; authorizationEnabled: boolean | null }`), `failuresLeft` (fails with `UserStorageError`, message `"Storage is not available."`), `watch(identityContext)`; registered with `container.registerInstance(ListUsersUseCase, fake)`.
- Produces:
  - `StoreWorkflowUseCase` dependencies become `[WorkflowRepository, EventPublisher, IdentityContext, ListUsersUseCase]`; behaviour as above. No new exported names.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createReviewStep,
    createWorkflowValues,
    editor,
    expectOk,
    OTHER_TEAM_ID,
    REVIEW_TEAM_ID
} from "~tests/__helpers/fixtures.js";
import { FakeListUsers, type FakeUser } from "~tests/__helpers/FakeListUsers.js";
import {
    RecordingEventPublisher,
    recordedEvents,
    workflowEventTypes
} from "~tests/__helpers/RecordingEventPublisher.js";
import type { WorkflowValues } from "~/domain/workflow/types.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";

const MEMBER_ID = "user-member";
const SECOND_MEMBER_ID = "user-second-member";
const OUTSIDER_ID = "user-outsider";
const DELETED_ID = "user-deleted";

const USERS: FakeUser[] = [
    { id: MEMBER_ID, displayName: "Mia Member", teams: [REVIEW_TEAM_ID] },
    { id: SECOND_MEMBER_ID, displayName: "Sam Second", teams: [OTHER_TEAM_ID] },
    { id: OUTSIDER_ID, displayName: "Otto Outsider", teams: ["team-x"] }
];

/** Every user lookup throws, as a crashed storage driver does. */
class ThrowingListUsers implements ListUsersUseCase.Interface {
    public async execute(): ReturnType<ListUsersUseCase.Interface["execute"]> {
        throw new Error("Users are down.");
    }
}

const userRule = (id: string, userId: string) => {
    return { id, conditions: {}, target: { type: "user", id: userId } };
};

const teamRule = (id: string, teamId: string) => {
    return { id, conditions: {}, target: { type: "team", id: teamId } };
};

/** "legal" (team REVIEW_TEAM_ID) has `rules`; "editorial" (team OTHER_TEAM_ID) `editorialRules`. */
const createValues = (rules: unknown[], editorialRules: unknown[] = []): WorkflowValues => {
    return createWorkflowValues({
        steps: [
            createReviewStep({ id: "legal", title: "Legal review", rules }),
            createReviewStep({
                id: "editorial",
                title: "Editorial review",
                teams: [OTHER_TEAM_ID],
                rules: editorialRules
            })
        ]
    });
};

const setup = async (listUsers: ListUsersUseCase.Interface | null = null) => {
    const users = new FakeListUsers(USERS);
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, listUsers ?? users);
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    users.watch(context.container.resolve(IdentityContext));
    const store = context.container.resolve(StoreWorkflowUseCase);
    recordedEvents.length = 0;
    return {
        users,
        storeWorkflow: {
            execute: (workflow: WorkflowValues, savedOn?: string) => {
                return store.execute({ workflow, savedOn, actor: editor });
            }
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase)
    };
};

describe("StoreWorkflowUseCase: rule user targets (spec 6, R122)", () => {
    it("stores user targets that are members of the step's teams, one lookup per step, without authorization", async () => {
        const { storeWorkflow, users } = await setup();

        const stored = await storeWorkflow.execute(
            createValues(
                [
                    userRule("rule-1", MEMBER_ID),
                    teamRule("rule-2", REVIEW_TEAM_ID),
                    userRule("rule-3", MEMBER_ID)
                ],
                [userRule("rule-4", SECOND_MEMBER_ID)]
            )
        );

        expect(stored.isOk()).toBe(true);
        expect(users.calls).toEqual([
            {
                input: { where: { id_in: [MEMBER_ID], teams_in: [REVIEW_TEAM_ID] } },
                authorizationEnabled: false
            },
            {
                input: { where: { id_in: [SECOND_MEMBER_ID], teams_in: [OTHER_TEAM_ID] } },
                authorizationEnabled: false
            }
        ]);
    });

    it("does not look users up when no rule targets a user", async () => {
        const { storeWorkflow, users } = await setup();

        const stored = await storeWorkflow.execute(
            createValues([teamRule("rule-1", REVIEW_TEAM_ID)])
        );

        expect(stored.isOk()).toBe(true);
        expect(users.calls).toEqual([]);
    });

    it("refuses a user target outside the step's teams and stores nothing", async () => {
        const { storeWorkflow, getWorkflow } = await setup();

        const result = await storeWorkflow.execute(
            createValues([userRule("rule-1", MEMBER_ID), userRule("rule-2", OUTSIDER_ID)])
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "Rule rule-2 targets a user who is not a member of the step's teams."
        );
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
        expect(workflowEventTypes()).toEqual([]);
    });

    it("refuses a user target that does not exist (deleted user)", async () => {
        const { storeWorkflow } = await setup();

        const result = await storeWorkflow.execute(
            createValues([], [userRule("rule-9", DELETED_ID)])
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "Rule rule-9 targets a user who is not a member of the step's teams."
        );
    });

    it("checks user targets on update too and keeps the stored workflow", async () => {
        const { storeWorkflow, getWorkflow } = await setup();
        const created = expectOk(await storeWorkflow.execute(createValues([])));

        const result = await storeWorkflow.execute(
            createValues([userRule("rule-1", OUTSIDER_ID)]),
            created.savedOn
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        const read = expectOk(await getWorkflow.execute({ id: "workflow-1" }));
        expect(read.savedOn).toBe(created.savedOn);
    });

    it("returns the persistence error when the lookup fails (R87)", async () => {
        const { storeWorkflow, getWorkflow, users } = await setup();
        users.failuresLeft = 1;

        const failed = await storeWorkflow.execute(createValues([userRule("rule-1", MEMBER_ID)]));

        expect(failed.error.code).toBe("Workflows/Workflow/Persistence");
        expect(failed.error.message).toBe("Storage is not available.");
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("returns the persistence error when the lookup throws (R87)", async () => {
        const { storeWorkflow } = await setup(new ThrowingListUsers());

        const thrown = await storeWorkflow.execute(createValues([userRule("rule-1", MEMBER_ID)]));

        expect(thrown.error.code).toBe("Workflows/Workflow/Persistence");
        expect(thrown.error.message).toBe("Users are down.");
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts 2>&1 | tail -50`
Expected: FAIL. "one lookup per step" fails on `users.calls` (`[]`); both "refuses" tests, the update test and both persistence tests fail because the save succeeds. "does not look users up" passes.

- [ ] **Step 3: Check the user targets in `StoreWorkflowUseCase`**

In `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`:

Replace the imports with:

```ts
import { Result } from "@webiny/feature/api";
import { EventPublisher } from "@webiny/api-core/features/eventPublisher/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import type { AdminUser } from "@webiny/api-core/types/users.js";
import { WorkflowRepository } from "~/domain/workflow/abstractions/WorkflowRepository.js";
import { REVIEW_STEP_TYPE, WorkflowValidator } from "~/domain/workflow/WorkflowValidator.js";
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import {
    isWorkflowValidationError,
    WorkflowConflictError,
    WorkflowNotFoundError,
    WorkflowPersistenceError,
    WorkflowValidationError
} from "~/domain/workflow/errors.js";
import {
    WorkflowAfterCreateEvent,
    WorkflowAfterUpdateEvent,
    WorkflowBeforeCreateEvent,
    WorkflowBeforeUpdateEvent
} from "./events.js";
import { StoreWorkflowUseCase as UseCase } from "./abstractions.js";
```

Replace the constructor with:

```ts
    constructor(
        private repository: WorkflowRepository.Interface,
        private eventPublisher: EventPublisher.Interface,
        private identityContext: IdentityContext.Interface,
        private listUsers: ListUsersUseCase.Interface
    ) {}
```

Replace

```ts
        const values = validation.value;

        const existingResult = await this.repository.get(values.id);
```

with

```ts
        const values = validation.value;

        // Spec 6, R122: user targets must be members of the step's teams. One lookup per step with
        // user targets; a membership lookup, not an access decision, so it runs as the system
        // (`ListUsers` needs `adminUsers.user`, D48).
        for (const step of values.steps) {
            const config = step.type === REVIEW_STEP_TYPE ? parseReviewStepConfig(step.config) : null;
            if (!config) {
                continue;
            }
            const userRules = config.assignment.rules.filter(rule => rule.target.type === "user");
            if (userRules.length === 0) {
                continue;
            }
            const userIds = [...new Set(userRules.map(rule => rule.target.id))];
            let listed: Result<AdminUser[], ListUsersUseCase.Error>;
            try {
                listed = await this.identityContext.withoutAuthorization(() => {
                    return this.listUsers.execute({
                        where: { id_in: userIds, teams_in: [...config.teams] }
                    });
                });
            } catch (error) {
                return Result.fail(
                    new WorkflowPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
            if (listed.isFail()) {
                return Result.fail(new WorkflowPersistenceError(listed.error));
            }
            const memberIds = new Set(listed.value.map(user => user.id));
            const invalid = userRules.find(rule => !memberIds.has(rule.target.id));
            if (invalid) {
                return Result.fail(
                    new WorkflowValidationError(
                        `Rule ${invalid.id} targets a user who is not a member of the step's teams.`
                    )
                );
            }
        }

        const existingResult = await this.repository.get(values.id);
```

Replace the registration at the bottom with:

```ts
export const StoreWorkflowUseCase = UseCase.createImplementation({
    implementation: StoreWorkflowUseCaseImpl,
    dependencies: [WorkflowRepository, EventPublisher, IdentityContext, ListUsersUseCase]
});
```

- [ ] **Step 4: Document it**

In `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`, replace the JSDoc of `StoreWorkflowUseCase`:

```ts
/**
 * Create or update a workflow through one validation path, with an optimistic `savedOn` check
 * on updates. Internal (D132): no permission check; each app's store wrapper checks `editor`.
 */
```

with

```ts
/**
 * Create or update a workflow through one validation path, with an optimistic `savedOn` check
 * on updates. Internal (D132): no permission check; each app's store wrapper checks `editor`.
 * Rule user targets must be members of their step's teams (spec 6, R122): checked with one user
 * lookup per step, run as the system; a failed lookup is `WorkflowPersistenceError`.
 */
```

In `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`, replace

```ts
        // Spec 6: team targets must be among the step's teams. User targets need team lookups
        // and are validated in phase 4 (A7).
```

with

```ts
        // Spec 6: team targets must be among the step's teams. User targets need a user lookup,
        // so `StoreWorkflowUseCase` checks them after this validation (R122).
```

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts packages/api-workflows/__tests__/workflow/WorkflowEventActor.test.ts packages/api-workflows/__tests__/workflow/WorkflowPersistenceError.test.ts packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts packages/api-workflows/__tests__/workflow/WorkflowEventActor.test.ts packages/api-workflows/__tests__/workflow/WorkflowPersistenceError.test.ts packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Run the tests that store user-target rules**

Run: `grep -rlE 'type: "user"( as const)?, id' packages/api-workflows/__tests__ packages/api-headless-cms-workflows/__tests__ packages/api-website-builder-workflows/__tests__`
For every listed file other than `domain/WorkflowValidator.test.ts` and the new `StoreWorkflowRuleTargets.test.ts` (the 4.1 routing tests), run it with `yarn test <path> 2>&1 | tail -50`, then with `yarn test:os <path> 2>&1 | tail -50`, one at a time.
Expected: PASS. A failure with `Rule <id> targets a user who is not a member of the step's teams.` means the test stores, through `StoreWorkflowUseCase`, a rule whose user is not a member. If the test means a valid target, list that user in the step's team in its users fake. If it deliberately tests an invalid target at reach (a later team change, spec 6), seed that workflow with `WorkflowRepository.create(values)` (`~/domain/workflow/abstractions/WorkflowRepository.js`), which skips the save-time check, and keep the assertion. Never relax the check.

Run: `yarn check:test:types 2>&1 | grep -iE "api-workflows|headless-cms-workflows|website-builder-workflows" | head`
Expected: no output.

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): validate rule user targets against the step's teams when a workflow is saved

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
