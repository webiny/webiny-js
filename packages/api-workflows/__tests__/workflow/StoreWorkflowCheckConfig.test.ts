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
                steps: [
                    customStep("one", { model: "a", tools: ["x", "y"], nested: { p: 1, q: 2 } })
                ]
            })
        );
        calls.length = 0;
        state.fail = true;

        const updated = await store(
            createWorkflowValues({
                steps: [
                    customStep("one", { nested: { q: 2, p: 1 }, tools: ["x", "y"], model: "a" })
                ]
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
        expect(result.error.message).toBe(
            'The model "cms.article" already has a workflow: "First".'
        );
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
