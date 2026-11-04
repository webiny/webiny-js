### Task 14: `StepType.checkConfig` (save-time I/O check for new or changed steps)

Spec 7.3; D101, D109; R131, R165, R169; Review Focus 6 (the hook Task 17 uses for the model check). `StepType.validate` stays pure and synchronous (R131). The I/O check (a model has a configured connection, R165) is a second, optional, async hook, so a type that needs it does not turn `validate` into I/O:

- `IStepType` gains an optional `checkConfig?(params: StepTypeValidateParams): Promise<Result<void, WorkflowValidationError>>` (type `StepType.CheckConfig`). The `review` and `automation` types do not define it and are untouched.
- `StoreWorkflowUseCase` runs it **after** the pure `validate` of every step (and the user-target membership check), **after** its `existing` read and **after** the `savedOn` conflict, not-found and same-model uniqueness checks (the `sameModel` list), so a `WorkflowConflictError`, `WorkflowNotFoundError` or the `The model "<model>" already has a workflow` refusal is returned even when a `checkConfig` would fail, and no I/O check runs for a save that is refused anyway. It runs right before the `Before*` events.
- It runs only for a step whose type defines `checkConfig` and that is **new or changed** versus the stored workflow: the step is matched by `id` in `existing.steps`; it counts as changed when no stored step has that `id`, when the stored step has another `type`, or when the normalised new `config` (the config `validate` returned, which is what is stored) is not deeply equal to the stored `config` (`isDeepStrictEqual` from `node:util`: key order is irrelevant, array order is not). On create (`existing` is `null`) every step counts as new. A stored workflow whose model or connection was removed later can therefore still be saved (renamed, another step edited) without touching that step; the reach and run keep failing with the model-not-available reason (R169).
- The first failing `checkConfig` (steps in workflow order) is returned as is (a `WorkflowValidationError`); nothing is stored. A throw is a `WorkflowPersistenceError` carrying the cause (R87), the same wrapping as the user lookup above it.
- The step and workflow passed are the normalised ones (`values`), the same shapes `validate` receives.

**Files:**
- Modify: `packages/api-workflows/src/features/stepTypes/StepType/abstractions.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/TestStepType.ts`
- Create: `packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts`

**Interfaces:**
- Consumes:
  - Existing: `StepType` (`createTestStepType(options)` returns `{ validateCalls, implementation }`, `~tests/__helpers/TestStepType.js`), `StepTypeRegistryService.get(type): StepType.Interface | null`, `WorkflowRepository.get(id)` (fails with code `Workflows/Workflow/NotFound` when absent), `WorkflowValidationError`, `WorkflowPersistenceError(error: Error)` (`~/domain/workflow/errors.js`), `createContextHandler`, `FakeListUsers`, `createWorkflowValues`, `createReviewStep`, `editor` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - `IStepType.checkConfig?(params: StepType.ValidateParams): Promise<Result<void, WorkflowValidationError>>`, `StepType.CheckConfig` (consumed by Task 17, `AiStepType.checkConfig`).
  - `StoreWorkflowUseCase` behaviour above; its abstraction and error union are unchanged (`validation | conflict | notFound | persistence` already cover it).
  - `createTestStepType` option `checkConfig?: (params: StepType.ValidateParams) => Promise<Result<void, WorkflowValidationError>>` and the returned `checkConfigCalls: StepType.ValidateParams[]`; the test type defines `checkConfig` only when the option is given.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTestStepType } from "~tests/__helpers/TestStepType.js";
import type { TestStepTypeOptions } from "~tests/__helpers/TestStepType.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { createReviewStep, createWorkflowValues, editor } from "~tests/__helpers/fixtures.js";

const customStep = (id: string, config: unknown, title = `Custom ${id}`): WorkflowStep => {
    return { id, title, color: "", type: "custom", notifications: [], config };
};

interface CheckState {
    /** While true every `checkConfig` fails. */
    fail: boolean;
    /** While true every `checkConfig` throws. */
    throws: boolean;
}

interface SetupOptions {
    /** The `validate` of the "custom" type; defaults to accepting the step as it is. */
    validate?: TestStepTypeOptions["validate"];
    /** More step types to register next to "custom", e.g. one whose own `validate` fails. */
    extraTypes?: ReturnType<typeof createTestStepType>[];
}

const setup = async (options: SetupOptions = {}) => {
    const state: CheckState = { fail: false, throws: false };
    const custom = createTestStepType({
        type: "custom",
        validate: options.validate,
        checkConfig: async ({ step }) => {
            if (state.throws) {
                throw new Error("connection lookup exploded");
            }
            if (state.fail) {
                return Result.fail(new WorkflowValidationError(`Step "${step.title}" is not ok.`));
            }
            return Result.ok();
        }
    });
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, new FakeListUsers([]));
            container.register(custom.implementation);
            for (const extra of options.extraTypes ?? []) {
                container.register(extra.implementation);
            }
        }
    });
    return {
        state,
        calls: custom.checkConfigCalls,
        validateCalls: custom.validateCalls,
        store: (workflow: WorkflowValues, savedOn?: string) => {
            return context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow, savedOn, actor: editor });
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase)
    };
};

const checkedStepIds = (calls: { step: WorkflowStep }[]): string[] => {
    return calls.map(call => call.step.id);
};

describe("StoreWorkflowUseCase: checkConfig for new or changed steps (R165)", () => {
    it("checks every step that defines it on create, in workflow order", async () => {
        const { store, calls } = await setup();

        const result = await store(
            createWorkflowValues({
                steps: [
                    customStep("one", { model: "a" }),
                    createReviewStep({ id: "legal", title: "Legal review" }),
                    customStep("two", { model: "b" })
                ]
            })
        );

        expect(result.isOk()).toBe(true);
        expect(checkedStepIds(calls)).toEqual(["one", "two"]);
        expect(calls[0].workflow.id).toBe("workflow-1");
    });

    it("refuses a create when a step fails its check and stores nothing", async () => {
        const { store, state, getWorkflow } = await setup();
        state.fail = true;

        const result = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "gone" }, "AI check")] })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('Step "AI check" is not ok.');
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("saves an unchanged step although its check would now fail", async () => {
        const { store, state, calls } = await setup();
        const steps = [customStep("one", { model: "a" })];
        const created = await store(createWorkflowValues({ steps }));
        calls.length = 0;
        state.fail = true;

        const updated = await store(
            createWorkflowValues({ name: "Renamed", steps }),
            created.value?.savedOn
        );

        expect(created.isOk()).toBe(true);
        expect(updated.isOk()).toBe(true);
        expect(updated.value?.name).toBe("Renamed");
        expect(calls).toHaveLength(0);
    });

    it("treats a config with the same content in another key order as unchanged", async () => {
        const { store, state, calls } = await setup();
        const created = await store(
            createWorkflowValues({
                steps: [customStep("one", { model: "a", tools: ["x", "y"], nested: { p: 1, q: 2 } })]
            })
        );
        calls.length = 0;
        state.fail = true;

        const updated = await store(
            createWorkflowValues({
                steps: [customStep("one", { nested: { q: 2, p: 1 }, tools: ["x", "y"], model: "a" })]
            }),
            created.value?.savedOn
        );

        expect(updated.isOk()).toBe(true);
        expect(calls).toHaveLength(0);
    });

    it("treats a config whose array order changed as changed", async () => {
        const { store, calls } = await setup();
        const created = await store(
            createWorkflowValues({ steps: [customStep("one", { tools: ["x", "y"] })] })
        );
        calls.length = 0;

        const updated = await store(
            createWorkflowValues({ steps: [customStep("one", { tools: ["y", "x"] })] }),
            created.value?.savedOn
        );

        expect(updated.isOk()).toBe(true);
        expect(checkedStepIds(calls)).toEqual(["one"]);
    });

    it("refuses a step whose config changed and keeps the stored workflow", async () => {
        const { store, state, getWorkflow } = await setup();
        const created = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "a" }, "AI check")] })
        );
        state.fail = true;

        const updated = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "b" }, "AI check")] }),
            created.value?.savedOn
        );

        expect(updated.error.code).toBe("Workflows/Workflow/Validation");
        expect(updated.error.message).toBe('Step "AI check" is not ok.');
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.value?.steps[0].config).toEqual({ model: "a" });
    });

    it("checks only the changed step when another one is unchanged", async () => {
        const { store, calls } = await setup();
        const created = await store(
            createWorkflowValues({
                steps: [customStep("one", { model: "a" }), customStep("two", { model: "b" })]
            })
        );
        calls.length = 0;

        const updated = await store(
            createWorkflowValues({
                steps: [customStep("one", { model: "a" }), customStep("two", { model: "c" })]
            }),
            created.value?.savedOn
        );

        expect(updated.isOk()).toBe(true);
        expect(checkedStepIds(calls)).toEqual(["two"]);
    });

    it("checks a step that was added to a stored workflow", async () => {
        const { store, state, calls } = await setup();
        const created = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "a" })] })
        );
        calls.length = 0;
        state.fail = true;

        const updated = await store(
            createWorkflowValues({
                steps: [customStep("one", { model: "a" }), customStep("two", { model: "a" }, "New")]
            }),
            created.value?.savedOn
        );

        expect(checkedStepIds(calls)).toEqual(["two"]);
        expect(updated.error.message).toBe('Step "New" is not ok.');
    });

    it("checks a step whose id is kept but whose type changed", async () => {
        const { store, calls } = await setup();
        const created = await store(
            createWorkflowValues({
                steps: [createReviewStep({ id: "one", title: "Review" }), customStep("two", {})]
            })
        );
        calls.length = 0;
        const config = createReviewStep({ id: "one", title: "Review" }).config;

        const updated = await store(
            createWorkflowValues({
                steps: [customStep("one", config), customStep("two", {})]
            }),
            created.value?.savedOn
        );

        expect(updated.isOk()).toBe(true);
        expect(checkedStepIds(calls)).toEqual(["one"]);
    });

    it("runs the pure validation of every step before any check", async () => {
        const strict = createTestStepType({
            type: "strict",
            validate: ({ step }) => {
                return Result.fail(new WorkflowValidationError(`Step "${step.title}" is invalid.`));
            }
        });
        const { store, calls } = await setup({ extraTypes: [strict] });

        const result = await store(
            createWorkflowValues({
                steps: [
                    customStep("one", { model: "a" }),
                    { ...customStep("two", {}, "Strict"), type: "strict" }
                ]
            })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('Step "Strict" is invalid.');
        expect(calls).toHaveLength(0);
    });

    it("hands the check the step as its own validate normalised it", async () => {
        const { store, calls } = await setup({
            validate: ({ step }) => {
                const config = step.config as { model: string };
                return Result.ok({ ...step, config: { model: config.model.trim() } });
            }
        });

        const created = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "  a  " })] })
        );

        expect(created.isOk()).toBe(true);
        expect(calls).toHaveLength(1);
        expect(calls[0].step.config).toEqual({ model: "a" });
    });

    it("counts a re-save of the normalised config as unchanged", async () => {
        const { store, state, calls } = await setup({
            validate: ({ step }) => {
                const config = step.config as { model: string };
                return Result.ok({ ...step, config: { model: config.model.trim() } });
            }
        });
        const created = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "  a  " })] })
        );
        calls.length = 0;
        state.fail = true;

        const updated = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "a " })] }),
            created.value?.savedOn
        );

        expect(updated.isOk()).toBe(true);
        expect(calls).toHaveLength(0);
    });

    it("returns a save conflict even when the check would fail", async () => {
        const { store, state, calls } = await setup();
        const created = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "a" })] })
        );
        calls.length = 0;
        state.fail = true;

        const result = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "changed" })] }),
            "2000-01-01T00:00:00.000Z"
        );

        expect(created.isOk()).toBe(true);
        expect(result.error.code).toBe("Workflows/Workflow/Conflict");
        expect(calls).toHaveLength(0);
    });

    it("returns not found even when the check would fail", async () => {
        const { store, state, calls } = await setup();
        state.fail = true;

        const result = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "a" })] }),
            "2026-10-09T10:00:00.000Z"
        );

        expect(result.error.code).toBe("Workflows/Workflow/NotFound");
        expect(calls).toHaveLength(0);
    });

    it("returns the same-model refusal even when the check would fail", async () => {
        const { store, state, calls } = await setup();
        const first = await store(
            createWorkflowValues({
                id: "workflow-1",
                name: "First",
                steps: [customStep("one", { model: "a" })]
            })
        );
        calls.length = 0;
        state.fail = true;

        const result = await store(
            createWorkflowValues({
                id: "workflow-2",
                name: "Second",
                steps: [customStep("one", { model: "b" })]
            })
        );

        expect(first.isOk()).toBe(true);
        expect(result.error.message).toBe('The model "cms.article" already has a workflow: "First".');
        expect(calls).toHaveLength(0);
    });

    it("turns a throwing check into a persistence error and stores nothing", async () => {
        const { store, state, getWorkflow } = await setup();
        state.throws = true;

        const result = await store(
            createWorkflowValues({ steps: [customStep("one", { model: "a" })] })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Persistence");
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("never calls a step type that does not define checkConfig", async () => {
        const { validateCalls } = await setup();
        const plain = createTestStepType({ type: "plain" });
        const { context } = await createContextHandler({
            setup: container => {
                container.registerInstance(ListUsersUseCase, new FakeListUsers([]));
                container.register(plain.implementation);
            }
        });

        const result = await context.container.resolve(StoreWorkflowUseCase).execute({
            workflow: createWorkflowValues({
                steps: [
                    {
                        id: "p",
                        title: "Plain",
                        color: "",
                        type: "plain",
                        notifications: [],
                        config: {}
                    }
                ]
            }),
            actor: editor
        });

        expect(result.isOk()).toBe(true);
        expect(plain.validateCalls).toHaveLength(1);
        // The "custom" type of `setup` is not used by this workflow.
        expect(validateCalls).toHaveLength(0);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts 2>&1 | tail -50`
Expected: FAIL. `createTestStepType` ignores `checkConfig` and returns no `checkConfigCalls`, `StoreWorkflowUseCase` never runs a check: every case that expects a call or a refused save fails (`calls` is `undefined`, "refuses a create when a step fails its check" saves). Record the RED output.

Run: `yarn test:os packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts 2>&1 | tail -50`
Expected: the same failures.

- [ ] **Step 3: Implement**

In `packages/api-workflows/src/features/stepTypes/StepType/abstractions.ts`, extend the `IStepType` interface with the optional hook (insert it right after `validate`, `describeAvailability` and `reach` stay as they are):

```ts
    /**
     * Save-time validation of one step. Pure of I/O: a type that needs a registry gets it
     * injected. Returns the step with its normalised `config`.
     */
    validate(params: StepTypeValidateParams): Result<WorkflowStep, WorkflowValidationError>;
    /**
     * Optional save-time check that needs I/O (R165), e.g. "the chosen model has a configured
     * connection". Runs after `validate` of every step and after the save's conflict,
     * not-found and same-model checks, and only for a step that is new or whose normalised `config` differs from
     * the stored workflow's, so a workflow whose external resource was removed later can still be
     * saved without touching that step. `params.step` is the step `validate` returned. A throw
     * is a `WorkflowPersistenceError`.
     */
    checkConfig?(params: StepTypeValidateParams): Promise<Result<void, WorkflowValidationError>>;
```

and add the namespace alias:

```ts
export namespace StepType {
    export type Interface = IStepType;
    export type Availability = StepTypeAvailability;
    export type ValidateParams = StepTypeValidateParams;
    export type CheckConfig = NonNullable<IStepType["checkConfig"]>;
    export type ReachParams = StepTypeReachParams;
}
```

In `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts` add the import at the top (with the other imports):

```ts
import { isDeepStrictEqual } from "node:util";
```

and insert this block right after the `if (other) { ... }` block (the same-model uniqueness refusal, after the `sameModel` list) and before `const actor = input.actor;` (so before every `Before*` event); nothing else in the file changes:

```ts
        // R165: the I/O check of a step type runs only for a step that is new or changed versus
        // the stored workflow, so a workflow whose model or connection was removed later can still
        // be saved without touching that step. It runs after the conflict, not-found and
        // same-model checks above, so those win over a check failure. A stored config that went through storage
        // with an `undefined` key dropped compares as changed, which only means one more check.
        const storedSteps = new Map((existing?.steps ?? []).map(step => [step.id, step]));
        for (const step of values.steps) {
            const stepType = this.stepTypes.get(step.type);
            if (!stepType?.checkConfig) {
                continue;
            }
            const stored = storedSteps.get(step.id);
            if (
                stored &&
                stored.type === step.type &&
                isDeepStrictEqual(stored.config, step.config)
            ) {
                continue;
            }
            let checked: Result<void, WorkflowValidationError>;
            try {
                checked = await stepType.checkConfig({ step, workflow: values });
            } catch (error) {
                return Result.fail(
                    new WorkflowPersistenceError(
                        error instanceof Error ? error : new Error(String(error))
                    )
                );
            }
            if (checked.isFail()) {
                return Result.fail(checked.error);
            }
        }
```

In `packages/api-workflows/__tests__/__helpers/TestStepType.ts` add the option, the recorder and the conditional hook. The new `TestStepTypeOptions` member:

```ts
    /** Defines `checkConfig` on the type; leave it out for a type without one. */
    checkConfig?: (params: StepType.ValidateParams) => Promise<Result<void, WorkflowValidationError>>;
```

In the doc comment add: `checkConfigCalls` records every `checkConfig` call, in order. In `createTestStepType` add, next to `validateCalls`:

```ts
    const checkConfigCalls: StepType.ValidateParams[] = [];
    const check = options.checkConfig;
```

in the class, after `validate`:

```ts
        public readonly checkConfig: StepType.CheckConfig | undefined = check
            ? async (params: StepType.ValidateParams) => {
                  checkConfigCalls.push(params);
                  return check(params);
              }
            : undefined;
```

and return it:

```ts
    return {
        validateCalls,
        checkConfigCalls,
        implementation: StepType.createImplementation({
            implementation: TestStepTypeImpl,
            dependencies: []
        })
    };
```

(`check` is captured as a `const` outside the class, so the arrow needs no non-null assertion; the field is `undefined` unless the option is set.)

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts 2>&1 | tail -50`
Expected: PASS (all cases).

Run: `yarn test:os packages/api-workflows/__tests__/workflow/StoreWorkflowCheckConfig.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code**

`StoreWorkflowUseCase` and the `TestStepType` helper changed (additively):

Run: `yarn test packages/api-workflows/__tests__/workflow/StoreWorkflowStepTypes.test.ts packages/api-workflows/__tests__/workflow/StoreWorkflowAutomationSteps.test.ts packages/api-workflows/__tests__/workflow/StoreWorkflowRuleTargets.test.ts packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts packages/api-workflows/__tests__/workflow/WorkflowPersistenceError.test.ts packages/api-workflows/__tests__/workflow/WorkflowEventActor.test.ts packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts 2>&1 | tail -50`
Expected: PASS, no test file edited.

Run the same files with `yarn test:os` (one run at a time).
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the optional async StepType.checkConfig hook for new or changed steps

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
