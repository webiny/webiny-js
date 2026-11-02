import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { WorkflowValidationError } from "~/domain/workflow/errors.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTestStepType, type TestStepTypeOptions } from "~tests/__helpers/TestStepType.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import { createReviewStep, createWorkflowValues, editor } from "~tests/__helpers/fixtures.js";

const customStep = (type: string, title = "Custom step"): WorkflowStep => {
    return {
        id: `step-${type}`,
        title,
        color: "",
        type,
        notifications: [],
        config: { anything: true }
    };
};

const setup = async (stepTypes: TestStepTypeOptions[] = []) => {
    const created = stepTypes.map(options => createTestStepType(options));
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, new FakeListUsers([]));
            for (const stepType of created) {
                container.register(stepType.implementation);
            }
        }
    });
    return {
        calls: created.map(stepType => stepType.validateCalls),
        store: (workflow: WorkflowValues) => {
            return context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow, actor: editor });
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase)
    };
};

describe("StoreWorkflowUseCase: step types through the registry (R131, R132)", () => {
    it("refuses an ai step while no ai type is registered", async () => {
        const { store, getWorkflow } = await setup();

        const result = await store(createWorkflowValues({ steps: [customStep("ai", "AI check")] }));

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            'Step "AI check" uses the step type "ai", which is not available.'
        );
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("refuses any other unregistered step type as unknown", async () => {
        const { store } = await setup();

        const result = await store(
            createWorkflowValues({ steps: [customStep("webhook", "Notify")] })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('Step "Notify" uses an unknown step type "webhook".');
    });

    it("validates a step through its registered type, with the workflow", async () => {
        const { store, calls } = await setup([{ type: "custom" }]);
        const workflow = createWorkflowValues({
            steps: [createReviewStep({ id: "legal", title: "Legal review" }), customStep("custom")]
        });

        const result = await store(workflow);

        expect(result.isOk()).toBe(true);
        expect(calls[0]).toHaveLength(1);
        expect(calls[0][0].step.id).toBe("step-custom");
        expect(calls[0][0].workflow.models).toEqual(workflow.models);
        expect(result.value?.steps[1].type).toBe("custom");
    });

    it("returns the registered type's validation error and stores nothing", async () => {
        const { store, getWorkflow } = await setup([
            {
                type: "custom",
                validate: ({ step }) => {
                    return Result.fail(new WorkflowValidationError(`Step "${step.title}" is odd.`));
                }
            }
        ]);

        const result = await store(
            createWorkflowValues({ steps: [customStep("custom", "Odd step")] })
        );

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe('Step "Odd step" is odd.');
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("lets a registered ai type replace the not-available refusal", async () => {
        const { store } = await setup([{ type: "ai" }]);

        const result = await store(createWorkflowValues({ steps: [customStep("ai", "AI check")] }));

        expect(result.isOk()).toBe(true);
    });
});
