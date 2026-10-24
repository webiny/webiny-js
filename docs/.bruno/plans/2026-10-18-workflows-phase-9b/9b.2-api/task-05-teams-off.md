### Task 5: Teams off in `listStepTypes` and `listTeams`

R287, R290 (API half), R311, A101, D176, Q58, Q59.5; Review Focus 5 (`00-shared.md`). The phase 9b Global Constraints and the 9a, 8b and 8a ones they inherit apply unchanged (read: R87/D132 never throw out of a dependency, one class or one public function per file, one named import per line, namespace types, comments end with a period, no nested call arguments, targeted tests, the pre-commit chain, SEC ids never in code or commits).

With the teams switch off (`advancedAccessControlLayer.teams`), the editor must not offer the People step and must not ask for team data. This task is the API half of R290: the built-in `review` step type reports itself unavailable with a reason, and `listTeams` answers an empty list without querying. `listUsers` was done in Task 2.

- **`ReviewStepType.describeAvailability`** (`[AWF]/features/stepTypes/ReviewStepType/ReviewStepType.ts`): the type injects the api-core `FeatureFlags` abstraction (a second constructor dependency after `StepAssignmentResolver`) and calls `featureFlags.get().isEnabled(TEAMS_FEATURE_FLAG)` on every call (R287). Off: `{ available: false, unavailableReason: "Teams are not enabled." }` (Q59.5); on: as before. A throw from the flag read propagates; `ListWorkflowStepTypesUseCase` already wraps every `describeAvailability` in its `try`/`catch` and answers its fixed persistence error, so it needs no change (it computes no availability itself). Saving is not touched: `validate` does not read the flag, so a stored People step stays saveable (the editor makes it read-only, Task 16).
- **`ListWorkflowTeamsUseCase`** (`[AWF]/features/config/ListWorkflowTeams/ListWorkflowTeamsUseCase.ts`): injects `FeatureFlags`. The `editor` gate and the 200-id refusal run first and stay as they are; then the flag is read, and with teams off the use case answers `{ teams: [], missingIds: [] }` without calling `ListTeamsUseCase` or `ListUsersUseCase`, for a search, for ids and for no input. A throw from the flag read is a `WorkflowPersistenceError` (R87).
- **Tests use the Task 2 helper** (`setTeamsFlag`). The existing `ListWorkflowTeams` and `ListWorkflowStepTypes` tests and the two `workflowsSchema.test.ts` groups that need teams now run with teams on; teams-off cases are added explicitly (R311). The CMS and WB packages' tests do not call `listStepTypes` or `listTeams` (checked with `grep -rln "listStepTypes\|listTeams" packages/api-headless-cms-workflows/__tests__ packages/api-website-builder-workflows/__tests__`, which finds nothing), so they need no change.

**Files:**
- Modify: `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`
- Modify: `packages/api-workflows/src/features/config/ListWorkflowTeams/ListWorkflowTeamsUseCase.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts`
- Modify: `packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts`
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`

**Interfaces:**
- Consumes (verified with codegraph and the source): `FeatureFlags` and `FeatureFlags.createDecorator` (`@webiny/api-core/features/featureFlags/abstractions.js`), `TEAMS_FEATURE_FLAG` (`~/constants.js`, Task 2), `StepType.Availability` (`~/features/stepTypes/StepType/abstractions.js`), `ListWorkflowStepTypesUseCase` (calls `stepType.describeAvailability()` inside a `try`/`catch` that logs and returns `WorkflowPersistenceError` with the fixed message `Could not list the step types.`), `ListTeamsUseCase`, `ListUsersUseCase`, `IdentityContext.withoutAuthorization`, `WorkflowPersistenceError`, `WorkflowValidationError`. Test helpers: `setTeamsFlag` and `TeamsFlagValue` (`~tests/__helpers/teamsFlag.js`, Task 2), `createContextHandler`, `FakeListTeams`, `FakeListUsers` (records `calls`), `registerTestAutomation` (`~tests/__helpers/TestAutomationDefinition.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`), `expectOk`.
- Produces (matches the contract): `ReviewStepType.describeAvailability()` answering `{ available: false, unavailableReason: "Teams are not enabled." }` with teams off; `listTeams` answering `{ teams: [], missingIds: [] }` with teams off. Consumed on the admin side by Tasks 14 and 16 (People read-only) and the step type list of Task 12.

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time).

- [ ] **Step 1: Write the failing tests**

Modify `packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts`.

The imports.

Before:

```ts
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
```

After:

```ts
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { setTeamsFlag, type TeamsFlagValue } from "~tests/__helpers/teamsFlag.js";
```

A throwing flag read, after the other fakes.

Before:

```ts
const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface TeamsContextParams extends CmsTestHandlerParams {
    teams?: FakeTeam[];
    listTeams?: ListTeamsUseCase.Interface;
    listUsers?: ListUsersUseCase.Interface;
}
```

After:

```ts
/** Throws from the flag read. */
class ThrowingFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get(): ReturnType<FeatureFlags.Interface["get"]> {
        throw new Error("Flags are down.");
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface TeamsContextParams extends CmsTestHandlerParams {
    teams?: FakeTeam[];
    listTeams?: ListTeamsUseCase.Interface;
    listUsers?: ListUsersUseCase.Interface;
    /** The teams switch; on unless a test says otherwise. */
    teamsFlag?: TeamsFlagValue;
}
```

The context turns teams on by default.

Before:

```ts
        setup: async container => {
            container.registerInstance(ListTeamsUseCase, params.listTeams ?? teams);
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
            await params.setup?.(container);
        }
```

After:

```ts
        setup: async container => {
            container.registerInstance(ListTeamsUseCase, params.listTeams ?? teams);
            container.registerInstance(ListUsersUseCase, params.listUsers ?? users);
            setTeamsFlag(container, params.teamsFlag ?? true);
            await params.setup?.(container);
        }
```

The teams-off cases, before the main group.

Before:

```ts
describe("ListWorkflowTeamsUseCase (Q42, R268)", () => {
```

After:

```ts
describe("ListWorkflowTeamsUseCase with teams off (Q58, R290)", () => {
    it("answers an empty list without querying teams or users", async () => {
        const { listTeams, teams, users } = await createTeamsContext({
            permissions: EDITOR,
            teamsFlag: false
        });

        const everyone = expectOk(await listTeams.execute());
        const searched = expectOk(await listTeams.execute({ search: "fin", limit: 5 }));
        const byIds = expectOk(await listTeams.execute({ ids: ["team-design", "team-gone"] }));

        expect(everyone).toEqual({ teams: [], missingIds: [] });
        expect(searched).toEqual({ teams: [], missingIds: [] });
        expect(byIds).toEqual({ teams: [], missingIds: [] });
        expect(teams.calls).toEqual([]);
        expect(users.calls).toEqual([]);
    });

    it("still refuses more than 200 ids", async () => {
        const { listTeams, teams } = await createTeamsContext({
            permissions: EDITOR,
            teamsFlag: false
        });
        const ids = Array.from({ length: 201 }, (_, index) => `team-${index}`);

        const result = await listTeams.execute({ ids });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Too many team ids.");
        expect(teams.calls).toEqual([]);
    });

    it("still refuses a user without editor", async () => {
        const { listTeams, teams } = await createTeamsContext({
            permissions: REASSIGNER,
            teamsFlag: false
        });

        const result = await listTeams.execute();

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "list teams" });
        expect(teams.calls).toEqual([]);
    });

    it("reads the switch on every request, not at registration (R287)", async () => {
        let teamsOn = true;
        const { listTeams } = await createTeamsContext({
            permissions: EDITOR,
            teamsFlag: () => teamsOn
        });

        const on = expectOk(await listTeams.execute({ search: "design" }));
        teamsOn = false;
        const off = expectOk(await listTeams.execute({ search: "design" }));
        teamsOn = true;
        const onAgain = expectOk(await listTeams.execute({ search: "design" }));

        expect(on.teams.map(team => team.id)).toEqual(["team-design"]);
        expect(off.teams).toEqual([]);
        expect(onAgain.teams.map(team => team.id)).toEqual(["team-design"]);
    });

    it("returns the persistence error when the flag read throws (R87)", async () => {
        const { listTeams, teams } = await createTeamsContext({
            permissions: EDITOR,
            setup: container => {
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowingFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const result = await listTeams.execute();

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        expect(result.error.message).toBe("Flags are down.");
        expect(teams.calls).toEqual([]);
    });
});

describe("ListWorkflowTeamsUseCase (Q42, R268)", () => {
```

Modify `packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts`.

The imports.

Before:

```ts
import { createContextHandler } from "~tests/__helpers/handler.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
```

After:

```ts
import { createContextHandler } from "~tests/__helpers/handler.js";
import { setTeamsFlag, type TeamsFlagValue } from "~tests/__helpers/teamsFlag.js";
import { expectOk } from "~tests/__helpers/fixtures.js";
```

A flag decorator that throws only for `aiPowerups`, because the review row now reads the teams flag too.

Before:

```ts
const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

const createStepTypesContext = async (params: CmsTestHandlerParams = {}) => {
    const { context } = await createContextHandler(params);
```

After:

```ts
/** Throws when `aiPowerups` is read; every other flag answers as before. */
class ThrowsOnAiPowerupsFeatureFlags implements FeatureFlags.Interface {
    constructor(private decoratee: FeatureFlags.Interface) {}

    get() {
        const flags = this.decoratee.get();
        const isEnabled = flags.isEnabled.bind(flags);
        flags.isEnabled = name => {
            if (name === "aiPowerups") {
                throw new Error("Flags are down.");
            }
            return isEnabled(name);
        };
        return flags;
    }
}

const throwing = async (): Promise<never> => {
    throw new Error("Permissions are down.");
};

interface StepTypesContextParams extends CmsTestHandlerParams {
    /** The teams switch; on unless a test says otherwise. */
    teams?: TeamsFlagValue;
}

const createStepTypesContext = async (params: StepTypesContextParams = {}) => {
    const { context } = await createContextHandler({
        ...params,
        setup: async container => {
            setTeamsFlag(container, params.teams ?? true);
            await params.setup?.(container);
        }
    });
```

The teams-off cases, before the registered-types test.

Before:

```ts
    it("lists other registered types after the built-in order, in registration order", async () => {
```

After:

```ts
    it("marks the review type unavailable with its reason when teams are off (Q58, R290)", async () => {
        const { listStepTypes } = await createStepTypesContext({ teams: false });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes.map(row => row.type)).toEqual(["review", "ai", "automation"]);
        expect(stepTypes[0]).toEqual({
            type: "review",
            title: "Review",
            available: false,
            unavailableReason: "Teams are not enabled.",
            configSchema: zod.toJSONSchema(reviewStepConfigSchema, {
                io: "input",
                unrepresentable: "any"
            })
        });
    });

    it("leaves the AI and automation rows as they are when teams are off", async () => {
        const { listStepTypes } = await createStepTypesContext({
            teams: false,
            setup: container => {
                registerTestAutomation(container);
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: AiPowerupsEnabledFeatureFlags,
                        dependencies: []
                    })
                );
            }
        });

        const stepTypes = expectOk(await listStepTypes.execute());

        expect(stepTypes[1]).toMatchObject({ type: "ai", available: true });
        expect(stepTypes[2]).toMatchObject({ type: "automation", available: true });
    });

    it("reads the teams switch on every request, not at registration (R287)", async () => {
        let teamsOn = true;
        const { listStepTypes } = await createStepTypesContext({ teams: () => teamsOn });

        const on = expectOk(await listStepTypes.execute());
        teamsOn = false;
        const off = expectOk(await listStepTypes.execute());
        teamsOn = true;
        const onAgain = expectOk(await listStepTypes.execute());

        expect(on[0]).toMatchObject({ available: true, unavailableReason: null });
        expect(off[0]).toMatchObject({
            available: false,
            unavailableReason: "Teams are not enabled."
        });
        expect(onAgain[0]).toMatchObject({ available: true, unavailableReason: null });
    });

    it("lists other registered types after the built-in order, in registration order", async () => {
```

The AI placeholder test reads no `aiPowerups` flag when an `ai` type is registered; the review row still reads the teams flag.

Before:

```ts
                // The flag is not read when an `ai` type is registered.
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowingFeatureFlags,
                        dependencies: []
                    })
                );
```

After:

```ts
                // The `aiPowerups` flag is not read when an `ai` type is registered; the review
                // row still reads the teams flag.
                container.registerDecorator(
                    FeatureFlags.createDecorator({
                        decorator: ThrowsOnAiPowerupsFeatureFlags,
                        dependencies: []
                    })
                );
```

Modify `packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts`.

The imports.

Before:

```ts
import { createContextHandler } from "~tests/__helpers/handler.js";
```

After:

```ts
import { createContextHandler } from "~tests/__helpers/handler.js";
import { setTeamsFlag, type TeamsFlagValue } from "~tests/__helpers/teamsFlag.js";
```

The setup takes the teams switch, on by default.

Before:

```ts
const setup = async (resolver: StepAssignmentResolver.Interface | null = null) => {
    const { context } = await createContextHandler({
        setup: container => {
            if (resolver) {
                container.registerInstance(StepAssignmentResolver, resolver);
            }
        }
    });
```

After:

```ts
const setup = async (
    resolver: StepAssignmentResolver.Interface | null = null,
    teams: TeamsFlagValue = true
) => {
    const { context } = await createContextHandler({
        setup: container => {
            setTeamsFlag(container, teams);
            if (resolver) {
                container.registerInstance(StepAssignmentResolver, resolver);
            }
        }
    });
```

The availability cases.

Before:

```ts
        expect(await stepType.describeAvailability()).toEqual({
            available: true,
            unavailableReason: null
        });
    });

    describe("validate", () => {
```

After:

```ts
        expect(await stepType.describeAvailability()).toEqual({
            available: true,
            unavailableReason: null
        });
    });

    it("is unavailable with its reason when teams are off (R290)", async () => {
        const stepType = await setup(null, false);

        expect(await stepType.describeAvailability()).toEqual({
            available: false,
            unavailableReason: "Teams are not enabled."
        });
    });

    it("reads the teams switch on every call, not at registration (R287)", async () => {
        let teamsOn = true;
        const stepType = await setup(null, () => teamsOn);

        const on = await stepType.describeAvailability();
        teamsOn = false;
        const off = await stepType.describeAvailability();

        expect(on.available).toBe(true);
        expect(off).toEqual({ available: false, unavailableReason: "Teams are not enabled." });
    });

    it("still validates and saves a People step config when teams are off", async () => {
        const stepType = await setup(null, false);
        const step = createReviewStep({ id: "legal", title: "Legal review" });

        const result = stepType.validate({
            step,
            workflow: createWorkflowValues({ steps: [step] })
        });

        expect(result.isOk()).toBe(true);
    });

    describe("validate", () => {
```

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts`.

The step type list runs with teams on, and a teams-off case follows.

Before:

```ts
    it("lists the step types with AI unavailable without AI powerups (D130)", async () => {
        const api = await createApi({ permissions: EDITOR });
```

After:

```ts
    it("lists the step types with AI unavailable without AI powerups (D130)", async () => {
        const api = await createApi({ permissions: EDITOR, teams: true });
```

Before:

```ts
    it("lists AI as available with AI powerups (D130)", async () => {
```

After:

```ts
    it("lists the review step type unavailable when teams are off (Q58, R290)", async () => {
        const api = await createApi({ permissions: EDITOR, teams: false });

        const [response] = await api.listStepTypes();
        const { data, error } = response.data.workflows.listStepTypes;

        expect(error).toBeNull();
        expect(data?.[0]).toMatchObject({
            type: "review",
            available: false,
            unavailableReason: "Teams are not enabled."
        });
        expect(data?.[0].configSchema).toMatchObject({ type: "object" });
    });

    it("lists AI as available with AI powerups (D130)", async () => {
```

The team list runs with teams on, and a teams-off case follows.

Before:

```ts
    it("lists teams with their member count for an editor, by search and by ids (Q42, R268)", async () => {
        const api = await createApi({ permissions: EDITOR });
```

After:

```ts
    it("lists teams with their member count for an editor, by search and by ids (Q42, R268)", async () => {
        const api = await createApi({ permissions: EDITOR, teams: true });
```

Before:

```ts
    it("refuses the team list to a user without editor", async () => {
```

After:

```ts
    it("answers an empty team list without querying when teams are off (Q58, R290)", async () => {
        const api = await createApi({ permissions: EDITOR, teams: false });

        const [searched] = await api.listTeams({ search: "EDIT" });
        const [byIds] = await api.listTeams({ ids: ["team-design", "team-gone"] });

        expect(searched.data.workflows.listTeams).toEqual({
            data: { teams: [], missingIds: [] },
            error: null
        });
        expect(byIds.data.workflows.listTeams).toEqual({
            data: { teams: [], missingIds: [] },
            error: null
        });
        expect(api.teams.calls).toEqual([]);
        expect(api.users.calls).toEqual([]);
    });

    it("refuses the team list to a user without editor", async () => {
```

(The existing case `answers more than 200 team ids with the validation error` runs with the flag off, since `createApi` leaves it off unless a test passes `teams`: it proves that the id cap is still refused with teams off.)

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
Expected: FAIL. The teams-off cases fail: `listTeams` still queries and returns teams (`expected [ ... ] to deeply equal []`, and `teams.calls` is not empty), and the review type is still `available: true` with a null reason.

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`.

The imports.

Before:

```ts
import { Result } from "@webiny/feature/api";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
```

After:

```ts
import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { TEAMS_FEATURE_FLAG } from "~/constants.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
```

The reason, after the `fail` helper.

Before:

```ts
const fail = (message: string, stepId: string, field: string, ruleId: string | null = null) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field, ruleId }));
};
```

After:

```ts
const fail = (message: string, stepId: string, field: string, ruleId: string | null = null) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field, ruleId }));
};

/** Why the type cannot be added while teams are off (R290, Q59.5). */
const TEAMS_NOT_ENABLED_REASON = "Teams are not enabled.";
```

The class.

Before:

```ts
 * The built-in review step (spec 4.1, R131): a person reviews, the step is routed to a team
 * (spec 6). Reaching a step resolves its assignment (`StepAssignmentResolver`) and applies it.
 */
```

After:

```ts
 * The built-in review step (spec 4.1, R131): a person reviews, the step is routed to a team
 * (spec 6). Reaching a step resolves its assignment (`StepAssignmentResolver`) and applies it.
 * It needs teams: with the teams switch off it reports itself unavailable (R290).
 */
```

Before:

```ts
    public constructor(private resolver: StepAssignmentResolver.Interface) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        return { available: true, unavailableReason: null };
    }
```

After:

```ts
    public constructor(
        private resolver: StepAssignmentResolver.Interface,
        private featureFlags: FeatureFlags.Interface
    ) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        // R287: read again on every call, never cached at registration. A throw reaches the step
        // type list, which turns it into its fixed persistence error.
        const teamsEnabled = this.featureFlags.get().isEnabled(TEAMS_FEATURE_FLAG);
        if (!teamsEnabled) {
            return { available: false, unavailableReason: TEAMS_NOT_ENABLED_REASON };
        }
        return { available: true, unavailableReason: null };
    }
```

Before:

```ts
export const ReviewStepType = StepType.createImplementation({
    implementation: ReviewStepTypeImpl,
    dependencies: [StepAssignmentResolver]
});
```

After:

```ts
export const ReviewStepType = StepType.createImplementation({
    implementation: ReviewStepTypeImpl,
    dependencies: [StepAssignmentResolver, FeatureFlags]
});
```

Modify `packages/api-workflows/src/features/config/ListWorkflowTeams/ListWorkflowTeamsUseCase.ts`.

The imports.

Before:

```ts
import { Result } from "@webiny/feature/api";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
```

After:

```ts
import { Result } from "@webiny/feature/api";
import { FeatureFlags } from "@webiny/api-core/features/featureFlags/abstractions.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { ListTeamsUseCase } from "@webiny/api-core/features/security/teams/ListTeams/index.js";
```

Before:

```ts
import { DEFAULT_TEAM_LIST_LIMIT, MAX_TEAM_LIST_LIMIT } from "~/constants.js";
```

After:

```ts
import { DEFAULT_TEAM_LIST_LIMIT, MAX_TEAM_LIST_LIMIT } from "~/constants.js";
import { TEAMS_FEATURE_FLAG } from "~/constants.js";
```

The constructor.

Before:

```ts
        private permissions: WorkflowsPermissions.Interface,
        private identityContext: IdentityContext.Interface,
        private listTeams: ListTeamsUseCase.Interface,
```

After:

```ts
        private permissions: WorkflowsPermissions.Interface,
        private featureFlags: FeatureFlags.Interface,
        private identityContext: IdentityContext.Interface,
        private listTeams: ListTeamsUseCase.Interface,
```

The teams-off answer, after the id cap and before any lookup.

Before:

```ts
        // Counted after de-duplication, the number of ids the lookup asks for.
        if (ids && ids.length > MAX_TEAM_LIST_LIMIT) {
            return Result.fail(new WorkflowValidationError("Too many team ids."));
        }

        // A name lookup, not an access decision: `ListTeams` needs `security.team`.
```

After:

```ts
        // Counted after de-duplication, the number of ids the lookup asks for.
        if (ids && ids.length > MAX_TEAM_LIST_LIMIT) {
            return Result.fail(new WorkflowValidationError("Too many team ids."));
        }

        // R287, R290: read again on every request. With teams off nothing is queried and the
        // editor gets an empty list.
        let teamsEnabled: boolean;
        try {
            teamsEnabled = this.featureFlags.get().isEnabled(TEAMS_FEATURE_FLAG);
        } catch (error) {
            const cause = error instanceof Error ? error : new Error(String(error));
            return Result.fail(new WorkflowPersistenceError(cause));
        }
        if (!teamsEnabled) {
            return Result.ok({ teams: [], missingIds: [] });
        }

        // A name lookup, not an access decision: `ListTeams` needs `security.team`.
```

Before:

```ts
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        IdentityContext,
        ListTeamsUseCase,
        ListUsersUseCase
    ]
```

After:

```ts
    dependencies: [
        CurrentReviewViewer,
        WorkflowsPermissions,
        FeatureFlags,
        IdentityContext,
        ListTeamsUseCase,
        ListUsersUseCase
    ]
```

- [ ] **Step 4: Run the tests to see them pass**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/config/ListWorkflowTeams.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
and the same four with `yarn test:os` (one at a time).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

`ReviewStepType` is registered by `WorkflowsFeature` and used by every save and reach test; `ListWorkflowTeamsUseCase` is registered by its feature:
`yarn test packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/validationErrorData.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/review/ReviewStepReacher.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts 2>&1 | tail -50`
and the same six with `yarn test:os` (one at a time).
Expected: PASS (none of them changes in this task).

The CMS and WB packages build their containers with `WorkflowsFeature` too, so the new `FeatureFlags` dependency of `ReviewStepType` must resolve there: build `@webiny/api-workflows` and run one flow of each package that saves and reaches a People step.
`yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowsSchema.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageWorkflows.test.ts 2>&1 | tail -50`
and the same two with `yarn test:os` (one at a time).
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): report People unavailable and no teams when teams are off" -m "With the teams switch off, listStepTypes reports the review step type unavailable with the reason \"Teams are not enabled.\" and listTeams answers an empty list without querying teams or users. The switch is read on every request through the api-core FeatureFlags." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

## Contract notes

- The contract says the step type listing use case is changed "if it computes availability elsewhere". It does not: `ListWorkflowStepTypesUseCase` only calls `describeAvailability()` of each registered type, so the one change is in `ReviewStepType`, and the use case already turns a throw into its fixed persistence error.
- The contract's Review Focus 5 lists `listTeams` returning empty "without a query". With ids given and teams off the answer is `{ teams: [], missingIds: [] }` (missing ids are not echoed), exactly as R290 words it.
- With teams off the whole `ListWorkflowTeams` suite and the step type suite run with the flag on by default (`teamsFlag` and `teams` parameters of their context helpers), and `createApi` of `workflowsSchema.test.ts` stays flag-off unless a test passes `teams`; both follow R311.
- The existing step type test "lets a registered ai type replace the placeholder row without reading the flag" registered a decorator that throws on any flag read. The review row now reads the teams flag, so that test uses a decorator that throws only on `aiPowerups`, which still proves the AI flag is not read. The test "returns the workflow persistence error when the flag read throws" keeps its decorator: the throw now surfaces from the review row first, with the same fixed message and one logged error.

## Review fixes (sub-phase review)

- No change needed. Checked: nothing outside `ListWorkflowStepTypesUseCase` reads `describeAvailability`, so saving is unaffected; the CMS, WB and `ai-powerups` tests that list step types or teams were searched and need no change; the `ReviewStepType` registration in `stepTypes/feature.ts` gets `FeatureFlags` from the container; the step type tests named in Step 5 and the two app schema tests exist.
