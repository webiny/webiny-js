### Task 3: Rule error data, messages and the shared constants

R288, R303 (server half), D171, Q51, Q52, A101; Review Focus 1, 3 (`00-shared.md`). The phase 9b Global Constraints and the 9a, 8b and 8a ones they inherit apply unchanged (read: R87/D132, no helper wrappers around dependency calls, one class or one public function per file, one named import per line, namespace types, comments end with a period, no nested call arguments, targeted tests, the pre-commit chain, SEC ids never in code or commits).

Save and the inspector name the rule that failed. This task changes the message, the field and the error data of checks that already exist; the only new check is the inspector's no-target one. The single rejection site of a team target outside the step's teams is `ReviewStepType.validate` (called by `WorkflowValidator.validate` for every step inside `StoreWorkflowUseCase`); `findReviewStepConfigProblem` already returns the rule id and does not change.

- **`WorkflowValidationErrorData.ruleId: string | null`** (`[AWF]/domain/workflow/errors.ts`), default `null`, set through the optional `where` argument like the other keys. The GraphQL error `data` is untyped `JSON`, so no schema type changes.
- **Constants module** (`[AWF]/domain/workflow/ruleErrorMessages.ts`): `RULE_TARGET_FIELD = "config.assignment.rules.target"`, `RULE_TARGET_USER_NOT_MEMBER_MESSAGE = "The target user is not a member of the step's teams."`, `RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE = "The target team is not one of the step's reviewing teams."` and `getRuleTargetMissingMessage(stepTitle: string | null): string` (`Every routing rule in step "{title}" needs a target.` unchanged for save; `Every routing rule needs a target.` for the inspector, which has no step title).
- **Rule-level failures** set `field` `config.assignment.rules.target`, `ruleId` and (save only) `stepId`: a rule without a target, a user target who is not a member of the step's teams (`StoreWorkflowUseCase`), a team target outside the step's teams (`ReviewStepType`). The whole-list field `config.assignment.rules` is no longer emitted. Schema failures keep `config.assignment.rules.<index>.<path>` with `ruleId` null, also for a rule that is not an object (`config.assignment.rules.<index>`).
- **`findRuleWithoutTarget(config: unknown)`** (`[AWF]/domain/workflow/findRuleWithoutTarget.ts`, new, shared by `ReviewStepType` and `InspectRoutingUseCase`): the first rule of a raw config that is an object without an object `target`, as `{ ruleId: string | null }` (`null` when the rule has no usable id). A rule that is not an object is left to the schema.
- **Inspector** (`InspectRoutingUseCase`): the no-target check runs first, on the raw config, before the schema (the schema would report the same rule by index and without its id); a team target outside the step's teams uses the shared message with `field` and `ruleId`; the no-teams and schema messages are unchanged and keep an all-null `data`. A user target's membership is still not checked up front (it stays a skipped trace entry).

**Files:**
- Modify: `packages/api-workflows/src/domain/workflow/errors.ts`
- Create: `packages/api-workflows/src/domain/workflow/ruleErrorMessages.ts`
- Create: `packages/api-workflows/src/domain/workflow/findRuleWithoutTarget.ts`
- Modify: `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`
- Modify: `packages/api-workflows/src/features/routing/InspectRouting/InspectRoutingUseCase.ts`
- Modify: `packages/api-workflows/__tests__/workflow/validationErrorData.test.ts`
- Modify: `packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts`
- Modify: `packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts`
- Modify: `packages/api-workflows/__tests__/routing/InspectRouting.test.ts`
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts` (one assertion)
- Modify: `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowValidationData.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts` (one assertion)
- Modify: `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts` (one constant)
- Modify: `packages/api-website-builder-workflows/__tests__/graphql/pageWorkflowValidationData.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts` (one assertion)
- Modify: `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts` (one helper)

**Interfaces:**
- Consumes (verified with codegraph and the source): `WorkflowValidationError` (`~/domain/workflow/errors.js`, constructor `(message, where: Partial<WorkflowValidationErrorData> = {})`), `findReviewStepConfigProblem` (`~/domain/workflow/findReviewStepConfigProblem.js`, returns `{ type: "noTeams" }` or `{ type: "teamTargetOutsideTeams", ruleId }`), `getConfigIssueField` (`~/domain/workflow/getConfigIssueField.js`, `config.<path joined by dots>`), `reviewStepConfigSchema`, `parseReviewStepConfig`, `StoreWorkflowUseCase` (the user membership loop, `~/features/workflow/StoreWorkflow/StoreWorkflowUseCase.js`), `InspectRoutingUseCase`. Test helpers: `createContextHandler`, `createReviewStep`, `createWorkflowValues`, `editor`, `expectOk`, `REVIEW_TEAM_ID`, `OTHER_TEAM_ID` (`~tests/__helpers/fixtures.js`), `FakeListUsers`, `RecordingEventPublisher`, `createRoutingContext`, `resetRoutingFakes`, `readChecks`; in the app packages `createWorkflowValuesWithAssignment` (`~tests/__workflows/workflow.js`, step `step-1`, team `team-1`) and `createWbWorkflowValuesWithAssignment` (`~tests/__helpers/engine.js`, `STEP_ID` `step-1`, team `REVIEW_TEAM` `team-1`).
- Produces (matches the contract): `WorkflowValidationErrorData.ruleId: string | null` (every error `data` now has the key); `RULE_TARGET_FIELD`, `RULE_TARGET_USER_NOT_MEMBER_MESSAGE`, `RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE`, `getRuleTargetMissingMessage`; `findRuleWithoutTarget`. Consumed by Task 4 (the inspector file) and, on the admin side, Task 15 (error mapping by `ruleId`).

**Test runner note:** API package: each test file runs with `yarn test <path>` and then `yarn test:os <path>` (one `test:os` run at a time). The app packages' tests import `@webiny/api-workflows` from its built `dist`, so build it first (Step 4).

- [ ] **Step 1: Write the failing tests**

Modify `packages/api-workflows/__tests__/workflow/validationErrorData.test.ts`.

The helpers: every error carries `ruleId`, and a rule-level helper joins them.

Before:

```ts
const workflowLevel = (field: string): WorkflowValidationErrorData => {
    return { stepId: null, field, workflowId: null };
};

const stepLevel = (stepId: string, field: string): WorkflowValidationErrorData => {
    return { stepId, field, workflowId: null };
};
```

After:

```ts
const workflowLevel = (field: string): WorkflowValidationErrorData => {
    return { stepId: null, field, workflowId: null, ruleId: null };
};

const stepLevel = (stepId: string, field: string): WorkflowValidationErrorData => {
    return { stepId, field, workflowId: null, ruleId: null };
};

/** A failure of one routing rule: the rule field and the rule's id (R288). */
const ruleLevel = (stepId: string, ruleId: string): WorkflowValidationErrorData => {
    return { stepId, field: "config.assignment.rules.target", workflowId: null, ruleId };
};
```

The error data of the class.

Before:

```ts
    it("defaults every key to null", () => {
        const error = new WorkflowValidationError("Nope.");

        expect(error.code).toBe("Workflows/Workflow/Validation");
        expect(error.data).toEqual({ stepId: null, field: null, workflowId: null });
    });

    it("keeps the keys it is given and nulls the rest", () => {
        const error = new WorkflowValidationError("Nope.", { stepId: "legal", field: "title" });

        expect(error.data).toEqual({ stepId: "legal", field: "title", workflowId: null });
    });
```

After:

```ts
    it("defaults every key to null", () => {
        const error = new WorkflowValidationError("Nope.");

        expect(error.code).toBe("Workflows/Workflow/Validation");
        expect(error.data).toEqual({ stepId: null, field: null, workflowId: null, ruleId: null });
    });

    it("keeps the keys it is given and nulls the rest", () => {
        const error = new WorkflowValidationError("Nope.", { stepId: "legal", field: "title" });

        expect(error.data).toEqual({
            stepId: "legal",
            field: "title",
            workflowId: null,
            ruleId: null
        });
    });

    it("keeps the rule id it is given (R288)", () => {
        const error = new WorkflowValidationError("Nope.", {
            stepId: "legal",
            field: "config.assignment.rules.target",
            ruleId: "rule-1"
        });

        expect(error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-1"
        });
    });
```

Before:

```ts
        expect(result.error.message).toBe("Workflow ID is required.");
        expect(result.error.data).toEqual({ stepId: null, field: null, workflowId: null });
```

After:

```ts
        expect(result.error.message).toBe("Workflow ID is required.");
        expect(result.error.data).toEqual({
            stepId: null,
            field: null,
            workflowId: null,
            ruleId: null
        });
```

The duplicate-model error.

Before:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1"
        });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1",
            ruleId: null
        });
```

The review step errors: the three rule-level cases name the rule, and new cases pin the schema paths and the whole-list field.

Before:

```ts
    it("marks a routing rule with no target", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [{ id: "rule-1", conditions: {} }]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });
```

After:

```ts
    it("marks a routing rule with no target with the rule field and the rule id (R288)", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [{ id: "rule-1", conditions: {} }]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe('Every routing rule in step "Legal review" needs a target.');
        expect(result.error.data).toEqual(ruleLevel("legal", "rule-1"));
    });

    it("names the failing rule among several", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [
                { id: "rule-1", conditions: {}, target: { type: "team", id: REVIEW_TEAM_ID } },
                { id: "rule-2", conditions: {} }
            ]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(ruleLevel("legal", "rule-2"));
    });

    it("gives a rule without an id and without a target a null rule id", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [{ conditions: {} }]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: null
        });
    });

    it("marks a schema issue of a rule with its index path and no rule id", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [
                { id: "rule-1", conditions: {}, target: { type: "team", id: REVIEW_TEAM_ID } },
                { id: "rule-2", conditions: {}, target: { type: "team" } }
            ]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules.1.target.id"));
    });

    it("marks a rule that is not an object by its index", async () => {
        const { store } = await setup();
        const step = createReviewStep({ id: "legal", title: "Legal review", rules: ["nope"] });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules.0"));
    });

    it("never reports the whole rule list as the field (R288)", async () => {
        const { store } = await setup();
        const failing: Array<[unknown[], string]> = [
            [[{ id: "rule-1", conditions: {} }], "config.assignment.rules.target"],
            [
                [{ id: "rule-1", conditions: {}, target: { type: "team", id: "team-elsewhere" } }],
                "config.assignment.rules.target"
            ],
            [
                [{ id: "rule-1", conditions: {}, target: { type: "user", id: OUTSIDER_ID } }],
                "config.assignment.rules.target"
            ],
            [
                [{ id: "rule-1", conditions: {}, target: { type: "team" } }],
                "config.assignment.rules.0.target.id"
            ],
            [["nope"], "config.assignment.rules.0"]
        ];

        for (const [rules, field] of failing) {
            const step = createReviewStep({ id: "legal", title: "Legal review", rules });
            const result = await store(createWorkflowValues({ steps: [step] }));

            expect(result.error.data).toMatchObject({ field });
            expect(result.error.data).not.toMatchObject({ field: "config.assignment.rules" });
        }
    });
```

Before:

```ts
    it("marks a team target outside the step's teams", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [
                {
                    id: "rule-1",
                    conditions: {},
                    target: { type: "team", id: "team-elsewhere" }
                }
            ]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
    });
```

After:

```ts
    it("marks a team target outside the step's teams with the rule id (R288)", async () => {
        const { store } = await setup();
        const step = createReviewStep({
            id: "legal",
            title: "Legal review",
            rules: [
                {
                    id: "rule-1",
                    conditions: {},
                    target: { type: "team", id: "team-elsewhere" }
                }
            ]
        });

        const result = await store(createWorkflowValues({ steps: [step] }));

        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual(ruleLevel("legal", "rule-1"));
    });
```

Before:

```ts
        expect(result.error.message).toBe(
            "Rule rule-1 targets a user who is not a member of the step's teams."
        );
        expect(result.error.data).toEqual(stepLevel("legal", "config.assignment.rules"));
```

After:

```ts
        expect(result.error.message).toBe("The target user is not a member of the step's teams.");
        expect(result.error.data).toEqual(ruleLevel("legal", "rule-1"));
```

Modify `packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts`.

Before:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "Rule rule-2 targets a user who is not a member of the step's teams."
        );
        const read = await getWorkflow.execute({ id: "workflow-1" });
```

After:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("The target user is not a member of the step's teams.");
        expect(result.error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-2"
        });
        const read = await getWorkflow.execute({ id: "workflow-1" });
```

Before:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "Rule rule-9 targets a user who is not a member of the step's teams."
        );
    });
```

After:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("The target user is not a member of the step's teams.");
        expect(result.error.data).toEqual({
            stepId: "editorial",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-9"
        });
    });

    it("refuses a team target outside the step's teams on the same save path, naming the rule, and stores nothing (Q52)", async () => {
        const { storeWorkflow, getWorkflow, users } = await setup();

        const result = await storeWorkflow.execute(
            createValues([userRule("rule-1", MEMBER_ID), teamRule("rule-2", OTHER_TEAM_ID)])
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual({
            stepId: "legal",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-2"
        });
        // Refused by the step type, before the member lookup.
        expect(users.calls).toEqual([]);
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
        expect(workflowEventTypes()).toEqual([]);
    });

    it("accepts a team target that is one of the step's teams (Q52)", async () => {
        const { storeWorkflow } = await setup();

        const stored = await storeWorkflow.execute(
            createValues([teamRule("rule-1", REVIEW_TEAM_ID)], [teamRule("rule-2", OTHER_TEAM_ID)])
        );

        expect(stored.isOk()).toBe(true);
    });
```

Modify `packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts`.

The type import and the helper.

Before:

```ts
import type { WorkflowStep } from "~/domain/workflow/types.js";
```

After:

```ts
import type { WorkflowStep } from "~/domain/workflow/types.js";
import type { WorkflowValidationError } from "~/domain/workflow/errors.js";
```

Before:

```ts
const validationMessage = async (step: WorkflowStep): Promise<string> => {
    const stepType = await setup();
    const result = stepType.validate({ step, workflow: createWorkflowValues({ steps: [step] }) });
    if (result.isOk()) {
        throw new Error("Expected the step to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error.message;
};
```

After:

```ts
const validationError = async (step: WorkflowStep): Promise<WorkflowValidationError> => {
    const stepType = await setup();
    const result = stepType.validate({ step, workflow: createWorkflowValues({ steps: [step] }) });
    if (result.isOk()) {
        throw new Error("Expected the step to be invalid.");
    }
    expect(result.error.code).toBe("Workflows/Workflow/Validation");
    return result.error;
};

const validationMessage = async (step: WorkflowStep): Promise<string> => {
    const error = await validationError(step);
    return error.message;
};
```

The rule-level cases.

Before:

```ts
        it("requires a target on every routing rule", async () => {
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                rules: [{ id: "rule-1", conditions: {} }]
            });

            expect(await validationMessage(step)).toBe(
                'Every routing rule in step "Legal review" needs a target.'
            );
        });
```

After:

```ts
        it("requires a target on every routing rule, naming the rule (R288)", async () => {
            const step = createReviewStep({
                id: "legal",
                title: "Legal review",
                rules: [{ id: "rule-1", conditions: {} }]
            });

            const error = await validationError(step);

            expect(error.message).toBe('Every routing rule in step "Legal review" needs a target.');
            expect(error.data).toEqual({
                stepId: "legal",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "rule-1"
            });
        });

        it("leaves a rule that is not an object to the schema, which names it by index", async () => {
            const step = createReviewStep({ id: "legal", title: "Legal review", rules: ["nope"] });

            const error = await validationError(step);

            expect(error.data).toEqual({
                stepId: "legal",
                field: "config.assignment.rules.0",
                workflowId: null,
                ruleId: null
            });
        });
```

Before:

```ts
            expect(await validationMessage(step)).toBe(
                'Routing rule "rule-1" in step "Legal review" targets a team that is not one of the step\'s teams.'
            );
```

After:

```ts
            const error = await validationError(step);

            expect(error.message).toBe("The target team is not one of the step's reviewing teams.");
            expect(error.data).toEqual({
                stepId: "legal",
                field: "config.assignment.rules.target",
                workflowId: null,
                ruleId: "rule-1"
            });
```

Modify `packages/api-workflows/__tests__/routing/InspectRouting.test.ts`.

Before:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'Routing rule "rule-legal" targets a team that is not one of the step\'s teams.'
        );
        expect(users.calls).toEqual([]);
    });
```

After:

```ts
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual({
            stepId: null,
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-legal"
        });
        expect(users.calls).toEqual([]);
    });

    it("refuses a rule without a target with the shared message, the rule field and the rule id, before any lookup", async () => {
        const { inspect, users } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig([
                userRule("rule-anna", "user-anna"),
                { id: "rule-open", conditions: {} }
            ]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe("Every routing rule needs a target.");
        expect(result.error.data).toEqual({
            stepId: null,
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-open"
        });
        expect(users.calls).toEqual([]);
        expect(readChecks).toEqual([]);
    });

    it("keeps the schema message and an all-null error data for a schema failure", async () => {
        const { inspect } = await setup();

        const result = await inspect.execute({
            stepConfig: stepConfig(["nope"]),
            model: ARTICLE_MODEL,
            requesterId: requester.id,
            folder: null,
            now: new Date(NOW)
        });

        expect(result.error.message).toMatch(/^The step configuration is invalid: /);
        expect(result.error.data).toEqual({
            stepId: null,
            field: null,
            workflowId: null,
            ruleId: null
        });
    });
```

Modify `packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts`: the validation error data of the id cap.

Before:

```ts
        expect(result.error.data).toEqual({ stepId: null, field: null, workflowId: null });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: null,
            workflowId: null,
            ruleId: null
        });
```

Modify `packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts`.

Before:

```ts
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: null,
            ruleId: null
        });
```

Modify `packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts`.

Before:

```ts
const MODELS_ERROR_DATA = { stepId: null, field: "models", workflowId: null };
```

After:

```ts
const MODELS_ERROR_DATA = { stepId: null, field: "models", workflowId: null, ruleId: null };
```

Modify `packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowValidationData.test.ts`.

Before:

```ts
import { createWorkflowValues } from "~tests/__workflows/workflow.js";
```

After:

```ts
import {
    createWorkflowValues,
    createWorkflowValuesWithAssignment
} from "~tests/__workflows/workflow.js";
```

Before:

```ts
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: null,
            ruleId: null
        });
```

Before:

```ts
        expect(result.error.data).toEqual({ stepId: "step-1", field: "title", workflowId: null });
    });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: "step-1",
            field: "title",
            workflowId: null,
            ruleId: null
        });
    });

    it("names the rule of a team target outside the step's teams (R288)", async () => {
        const editor = await createEditorClient();
        const data = createWorkflowValuesWithAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [
                { id: "rule-1", conditions: {}, target: { type: "team", id: "team-elsewhere" } }
            ]
        });

        const body = await editor(STORE_WORKFLOW, { data });

        expect(body.errors).toBeUndefined();
        const result = body.data.cms.storeCmsEntryWorkflow;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual({
            stepId: "step-1",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-1"
        });
    });
```

Before:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1"
        });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "workflow-1",
            ruleId: null
        });
```

Modify `packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts`.

Before:

```ts
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: null,
            ruleId: null
        });
```

Modify `packages/api-website-builder-workflows/__tests__/graphql/pageWorkflowValidationData.test.ts`.

Before:

```ts
import { createWbWorkflowValues } from "~tests/__helpers/engine.js";
```

After:

```ts
import {
    createWbWorkflowValues,
    createWbWorkflowValuesWithAssignment
} from "~tests/__helpers/engine.js";
```

Before:

```ts
        expect(result.error.data).toEqual({ stepId: null, field: "models", workflowId: null });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: null,
            ruleId: null
        });
```

Before:

```ts
        expect(result.error.data).toEqual({ stepId: "step-1", field: "title", workflowId: null });
    });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: "step-1",
            field: "title",
            workflowId: null,
            ruleId: null
        });
    });

    it("names the rule of a team target outside the step's teams (R288)", async () => {
        const admin = asGraphQLUser();
        const data = createWbWorkflowValuesWithAssignment({
            strategy: "none",
            allowManualPick: false,
            rules: [
                { id: "rule-1", conditions: {}, target: { type: "team", id: "team-elsewhere" } }
            ]
        });

        const body = await admin.run(STORE_WORKFLOW, { data });

        const result = body.data.websiteBuilder.storeWebsiteBuilderPageWorkflow;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            "The target team is not one of the step's reviewing teams."
        );
        expect(result.error.data).toEqual({
            stepId: "step-1",
            field: "config.assignment.rules.target",
            workflowId: null,
            ruleId: "rule-1"
        });
    });
```

Before:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "wb-workflow"
        });
```

After:

```ts
        expect(result.error.data).toEqual({
            stepId: null,
            field: "models",
            workflowId: "wb-workflow",
            ruleId: null
        });
```

Modify `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts`: the AI step type's validation errors carry the same data, now with `ruleId`.

Before:

```ts
            return { stepId: AI_STEP_ID, field, workflowId: null };
```

After:

```ts
            return { stepId: AI_STEP_ID, field, workflowId: null, ruleId: null };
```

- [ ] **Step 2: Run the tests to see them fail**

Run each file on its own:
`yarn test packages/api-workflows/__tests__/workflow/validationErrorData.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/InspectRouting.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts 2>&1 | tail -50`
Expected: FAIL. The error `data` has no `ruleId` key (`expected { stepId: null, field: null, workflowId: null } to deeply equal { ..., ruleId: null }`), the messages are the old wording, and the rule-level cases report `config.assignment.rules` as the field.

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/domain/workflow/errors.ts`.

Before:

```ts
/**
 * Where a validation problem is (R267). `stepId` is null for a problem of the whole workflow;
 * `field` is null when no field can be named; `workflowId` is the other workflow of the
 * duplicate-model error.
 */
export interface WorkflowValidationErrorData {
    stepId: string | null;
    field: string | null;
    workflowId: string | null;
}
```

After:

```ts
/**
 * Where a validation problem is (R267, R288). `stepId` is null for a problem of the whole
 * workflow; `field` is null when no field can be named; `workflowId` is the other workflow of the
 * duplicate-model error; `ruleId` is the routing rule of a rule-level failure, null otherwise.
 */
export interface WorkflowValidationErrorData {
    stepId: string | null;
    field: string | null;
    workflowId: string | null;
    ruleId: string | null;
}
```

Before:

```ts
                workflowId: where.workflowId ?? null
            }
```

After:

```ts
                workflowId: where.workflowId ?? null,
                ruleId: where.ruleId ?? null
            }
```

Create `packages/api-workflows/src/domain/workflow/ruleErrorMessages.ts`:

```ts
/**
 * The field of every rule-level failure (R288): the rule is named by `ruleId` in the error data,
 * not by an index, so the editor finds it again after a reorder.
 */
export const RULE_TARGET_FIELD = "config.assignment.rules.target";

/** A user target who is not a member of the step's teams; checked on save (R122, Q51). */
export const RULE_TARGET_USER_NOT_MEMBER_MESSAGE =
    "The target user is not a member of the step's teams.";

/** A team target outside the step's teams; checked on save and by the inspector (Q52). */
export const RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE =
    "The target team is not one of the step's reviewing teams.";

/**
 * A rule without a target. Save names the step; the inspector has only the config and no step
 * title, so it passes `null`.
 */
export const getRuleTargetMissingMessage = (stepTitle: string | null): string => {
    if (stepTitle === null) {
        return "Every routing rule needs a target.";
    }
    return `Every routing rule in step "${stepTitle}" needs a target.`;
};
```

Create `packages/api-workflows/src/domain/workflow/findRuleWithoutTarget.ts`:

```ts
export interface RuleWithoutTarget {
    /** The rule's id; null when the rule has none. */
    ruleId: string | null;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * The first routing rule of a raw review step config that is an object without an object
 * `target` (R288). Runs on the config as received, before the schema, because the schema reports
 * the same rule by index and without its id. A rule that is not an object is left to the schema.
 */
export const findRuleWithoutTarget = (config: unknown): RuleWithoutTarget | null => {
    if (!isRecord(config) || !isRecord(config.assignment)) {
        return null;
    }
    const rules = Array.isArray(config.assignment.rules) ? config.assignment.rules : [];
    for (const rule of rules) {
        if (isRecord(rule) && !isRecord(rule.target)) {
            const ruleId = typeof rule.id === "string" && rule.id !== "" ? rule.id : null;
            return { ruleId };
        }
    }
    return null;
};
```

Modify `packages/api-workflows/src/features/stepTypes/ReviewStepType/ReviewStepType.ts`.

The imports.

Before:

```ts
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { getConfigIssueField } from "~/domain/workflow/getConfigIssueField.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
```

After:

```ts
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { findRuleWithoutTarget } from "~/domain/workflow/findRuleWithoutTarget.js";
import { getConfigIssueField } from "~/domain/workflow/getConfigIssueField.js";
import { getRuleTargetMissingMessage } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_FIELD } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE } from "~/domain/workflow/ruleErrorMessages.js";
import { reviewStepConfigSchema } from "~/domain/workflow/reviewStepConfigSchema.js";
```

The helpers (`isRecord` and `UnknownRecord` move into `findRuleWithoutTarget.ts`; nothing else in this file uses them).

Before:

```ts
type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

const fail = (message: string, stepId: string, field: string) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field }));
};
```

After:

```ts
const fail = (message: string, stepId: string, field: string, ruleId: string | null = null) => {
    return Result.fail(new WorkflowValidationError(message, { stepId, field, ruleId }));
};
```

The no-target check.

Before:

```ts
    public validate({ step }: StepType.ValidateParams) {
        const config: UnknownRecord = isRecord(step.config) ? step.config : {};
        const assignment: UnknownRecord = isRecord(config.assignment) ? config.assignment : {};
        const rules = Array.isArray(assignment.rules) ? assignment.rules : [];
        for (const rule of rules) {
            if (!isRecord(rule) || !isRecord(rule.target)) {
                return fail(
                    `Every routing rule in step "${step.title}" needs a target.`,
                    step.id,
                    "config.assignment.rules"
                );
            }
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
```

After:

```ts
    public validate({ step }: StepType.ValidateParams) {
        // A rule without a target is named by its id, before the schema reports it by index.
        const withoutTarget = findRuleWithoutTarget(step.config);
        if (withoutTarget) {
            return fail(
                getRuleTargetMissingMessage(step.title),
                step.id,
                RULE_TARGET_FIELD,
                withoutTarget.ruleId
            );
        }

        const parsed = reviewStepConfigSchema.safeParse(step.config);
```

The team target check.

Before:

```ts
        if (problem?.type === "teamTargetOutsideTeams") {
            return fail(
                `Routing rule "${problem.ruleId}" in step "${step.title}" targets a team that is not one of the step's teams.`,
                step.id,
                "config.assignment.rules"
            );
        }
```

After:

```ts
        if (problem?.type === "teamTargetOutsideTeams") {
            return fail(
                RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE,
                step.id,
                RULE_TARGET_FIELD,
                problem.ruleId
            );
        }
```

Modify `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`.

Before:

```ts
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
```

After:

```ts
import { parseReviewStepConfig } from "~/domain/workflow/reviewStepConfigSchema.js";
import { RULE_TARGET_FIELD } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_USER_NOT_MEMBER_MESSAGE } from "~/domain/workflow/ruleErrorMessages.js";
```

Before:

```ts
            if (invalid) {
                return Result.fail(
                    new WorkflowValidationError(
                        `Rule ${invalid.id} targets a user who is not a member of the step's teams.`,
                        { stepId: step.id, field: "config.assignment.rules" }
                    )
                );
            }
```

After:

```ts
            if (invalid) {
                return Result.fail(
                    new WorkflowValidationError(RULE_TARGET_USER_NOT_MEMBER_MESSAGE, {
                        stepId: step.id,
                        field: RULE_TARGET_FIELD,
                        ruleId: invalid.id
                    })
                );
            }
```

Modify `packages/api-workflows/src/features/routing/InspectRouting/InspectRoutingUseCase.ts`.

Before:

```ts
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
```

After:

```ts
import { findReviewStepConfigProblem } from "~/domain/workflow/findReviewStepConfigProblem.js";
import { findRuleWithoutTarget } from "~/domain/workflow/findRuleWithoutTarget.js";
import { getRuleTargetMissingMessage } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_FIELD } from "~/domain/workflow/ruleErrorMessages.js";
import { RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE } from "~/domain/workflow/ruleErrorMessages.js";
```

Before:

```ts
    async execute(input: UseCase.Input): UseCase.Return {
        const parsed = reviewStepConfigSchema.safeParse(input.stepConfig);
```

After:

```ts
    async execute(input: UseCase.Input): UseCase.Return {
        // A rule without a target is named by its id, before the schema reports it by index. The
        // editor tests incomplete rules too, so this is a message for Test routing (R288).
        const withoutTarget = findRuleWithoutTarget(input.stepConfig);
        if (withoutTarget) {
            return Result.fail(
                new WorkflowValidationError(getRuleTargetMissingMessage(null), {
                    field: RULE_TARGET_FIELD,
                    ruleId: withoutTarget.ruleId
                })
            );
        }

        const parsed = reviewStepConfigSchema.safeParse(input.stepConfig);
```

Before:

```ts
        if (problem?.type === "teamTargetOutsideTeams") {
            return Result.fail(
                new WorkflowValidationError(
                    `Routing rule "${problem.ruleId}" targets a team that is not one of the step's teams.`
                )
            );
        }
```

After:

```ts
        if (problem?.type === "teamTargetOutsideTeams") {
            return Result.fail(
                new WorkflowValidationError(RULE_TARGET_TEAM_OUTSIDE_TEAMS_MESSAGE, {
                    field: RULE_TARGET_FIELD,
                    ruleId: problem.ruleId
                })
            );
        }
```

- [ ] **Step 4: Run the tests to see them pass**

Run each api-workflows file on its own:
`yarn test packages/api-workflows/__tests__/workflow/validationErrorData.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/stepTypes/ReviewStepType.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/routing/InspectRouting.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/config/ListWorkflowUsers.test.ts 2>&1 | tail -50`
and the same five with `yarn test:os` (one at a time).
Expected: PASS.

The app packages read `@webiny/api-workflows` from its build, so build it, then run their files:
`yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`
`yarn test packages/api-headless-cms-workflows/__tests__/graphql/cmsWorkflowValidationData.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
`yarn test packages/api-headless-cms-workflows/__tests__/workflows/disallowUnpublishableModels.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/graphql/pageWorkflowValidationData.test.ts 2>&1 | tail -50`
`yarn test packages/api-website-builder-workflows/__tests__/wrappers/workflowWrappers.test.ts 2>&1 | tail -50`
`yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts 2>&1 | tail -50`
and the five CMS and WB files again with `yarn test:os` (one at a time; `ai-powerups` is not an OpenSearch package and runs only with `yarn test`).
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

The error class, the review step type and the store use case are shared:
`yarn test packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowAutomationSteps.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts 2>&1 | tail -50`
`yarn test packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts 2>&1 | tail -50`
and the same six with `yarn test:os` (one at a time).
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
`yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40`
`yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40`
`yarn check:test:types -p ai-powerups --report cli 2>&1 | tail -40`
Expected: no errors. (`createReviewStep({ rules: ["nope"] })` takes `rules?: unknown[]`, so the string rule type-checks; `result.error.data.field` in the whole-list test is typed through `WorkflowValidationError`.)

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain of phase 8a (`docs/.bruno/plans/2026-10-16-workflows-phase-8a/00-shared.md`) in full: `git add .`, `yarn > /dev/null 2>&1`, `node scripts/generateTsConfigsInPackages.js`, `yarn adio`, `yarn check-ts-configs`, `yarn format:fix > /dev/null 2>&1`, `yarn lint:fix`, `yarn webiny sync-dependencies`, `yarn build -p @webiny/api-workflows --no-cache 2>&1 | tail -30`, `git add .`. Restore `.gitleaks.toml` (`git checkout -- .gitleaks.toml`); never commit it, `docs/.reports` or `.superpowers`. If any step fails and you fix something, rerun the chain from the start. Then commit:

```
git commit -m "feat(api-workflows): name the rule in routing rule validation errors" -m "WorkflowValidationErrorData gains ruleId. A rule without a target, a user target outside the step's teams and a team target outside them fail with the field config.assignment.rules.target, the rule id and rule-neutral messages from one constants module. The inspector uses the same messages and data. Schema failures keep their index path." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

## Contract notes

- The contract's file list for Task 3 has no `findRuleWithoutTarget.ts`. Both `ReviewStepType` and the inspector now check the raw config for a rule without a target, and under "one public function per file" the shared check gets its own file (`domain/workflow/findRuleWithoutTarget.ts`), not exported from any barrel.
- `findReviewStepConfigProblem.ts` is in the contract's file list but needs no change: it already returns `{ type: "teamTargetOutsideTeams", ruleId }`, which is all the new data needs.
- R288 says the constants module holds "the three strings". The no-target message depends on the step title on save (message unchanged), so the module exports the two fixed strings as constants plus `getRuleTargetMissingMessage(stepTitle: string | null)`, and `RULE_TARGET_FIELD`. The inspector has no step title and uses `Every routing rule needs a target.`, a new server string (Copy gaps 3 and 9 allow the existing-wording fallback; the inspector had no existing wording for this check).
- Q52 and the contract goal speak of a "team-target save check" and of `StoreWorkflowUseCase` rejecting a team target outside the step's teams. That check already exists at one site, `ReviewStepType.validate` (reached from `StoreWorkflowUseCase` through `WorkflowValidator.validate`). The plan changes its message, field and data only and adds a store-level test that proves the rejection and the absence of a member lookup.
- The contract says `WorkflowValidationErrorData` gains `ruleId`, so every existing assertion on error `data` gains `ruleId: null`. The plan lists them all (found with `grep -rn "workflowId: null" packages/*/__tests__` and the multi-line `workflowId: "..."` shapes): api-workflows (3 files), api-headless-cms-workflows (3), api-website-builder-workflows (2) and one helper in `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts`. The `ai-powerups` edit is a test-only change in a package that consumes the workflows error class; it is not a base package and no source file of it changes.
- The inspector's no-teams and schema failures keep their all-null `data` (the contract names only rule failures); only the no-target and team-target failures carry `field` and `ruleId`.

## Review fixes (sub-phase review)

- No change needed. Checked: the list of files that assert validation error data is complete (grep of `stepId`/`field`/`workflowId` shapes in `api-workflows`, `api-headless-cms-workflows`, `api-website-builder-workflows` and `ai-powerups` tests finds exactly these); every `Before` hunk applies; the CMS and WB helpers `createWorkflowValuesWithAssignment` and `createWbWorkflowValuesWithAssignment` exist with the teams the new cases assume; the later full replacement of `InspectRoutingUseCase.ts` in Task 4 keeps these edits.
