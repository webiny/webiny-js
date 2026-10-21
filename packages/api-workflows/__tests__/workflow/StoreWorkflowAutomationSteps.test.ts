import { describe, expect, it } from "vitest";
import zod from "zod";
import type { Container } from "@webiny/feature/api";
import { ListUsersUseCase } from "@webiny/api-core/features/users/ListUsers/index.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { GetWorkflowUseCase } from "~/features/workflow/GetWorkflow/index.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import { parseAutomationSettings } from "~/domain/automation/parseAutomationSettings.js";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { FakeListUsers } from "~tests/__helpers/FakeListUsers.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import { createReviewStep, createWorkflowValues, editor } from "~tests/__helpers/fixtures.js";

/** Settings are `{ count: "5" }` as entered; the schema turns the string into a number. */
class TransformAutomation implements AutomationDefinition.Interface {
    public readonly id = "transform-automation";
    public readonly name = "Transform automation";
    public readonly models = ["*"];
    public readonly settingsSchema = zod.object({ count: zod.string().transform(Number) });

    public async run(): Promise<AutomationDefinition.Outcome> {
        return { type: "approved" };
    }
}

const setup = async (register: (container: Container) => void = () => {}) => {
    const { context } = await createContextHandler({
        setup: container => {
            container.registerInstance(ListUsersUseCase, new FakeListUsers([]));
            register(container);
        }
    });
    return {
        store: (steps: WorkflowStep[], savedOn?: string) => {
            return context.container
                .resolve(StoreWorkflowUseCase)
                .execute({ workflow: createWorkflowValues({ steps }), savedOn, actor: editor });
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase)
    };
};

describe("StoreWorkflowUseCase: automation steps (D35, D37, R137)", () => {
    it("stores a workflow with an automation step and keeps the settings as entered", async () => {
        const { store, getWorkflow } = await setup(container => registerTestAutomation(container));

        const stored = await store([
            createReviewStep({ id: "legal", title: "Legal review" }),
            createAutomationStep({ id: "notify", title: "Notify", settings: {} })
        ]);

        expect(stored.isOk()).toBe(true);
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.value?.steps[1].type).toBe("automation");
        expect(read.value?.steps[1].config).toEqual({
            automationId: TEST_AUTOMATION_ID,
            settings: {}
        });
    });

    it("stores the submitted settings, not the parsed output, so a transform schema saves and re-parses", async () => {
        const { store, getWorkflow } = await setup(container => {
            container.registerInstance(
                AutomationDefinition,
                new TransformAutomation() as AutomationDefinition.Interface
            );
        });

        const stored = await store([
            createAutomationStep({
                id: "notify",
                title: "Notify",
                automationId: "transform-automation",
                settings: { count: "5" }
            })
        ]);

        expect(stored.isOk()).toBe(true);
        const read = await getWorkflow.execute({ id: "workflow-1" });
        const config = read.value?.steps[0].config as { settings: Record<string, unknown> };
        // The string the author submitted, not the number the transform produces (R137).
        expect(config.settings).toEqual({ count: "5" });
        // A second save of the stored workflow validates the same value again, and every use
        // (reach, run) parses it again.
        const definition = new TransformAutomation();
        const parsed = parseAutomationSettings(definition, config.settings);
        expect(parsed.value).toEqual({ count: 5 });
        const again = await store(
            [
                createAutomationStep({
                    id: "notify",
                    title: "Notify",
                    automationId: "transform-automation",
                    settings: config.settings
                })
            ],
            read.value?.savedOn
        );
        expect(again.isOk()).toBe(true);
    });

    it("refuses an automation step when no automation is defined and stores nothing", async () => {
        const { store, getWorkflow } = await setup();

        const result = await store([createAutomationStep({ id: "notify", title: "Notify" })]);

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toBe(
            `Step "Notify" uses the automation "${TEST_AUTOMATION_ID}", which is not defined.`
        );
        const read = await getWorkflow.execute({ id: "workflow-1" });
        expect(read.error.code).toBe("Workflows/Workflow/NotFound");
    });

    it("refuses an automation that does not cover the workflow's model", async () => {
        const { store } = await setup(container =>
            registerTestAutomation(container, { models: ["wb.page"] })
        );

        const result = await store([createAutomationStep({ id: "notify", title: "Notify" })]);

        expect(result.error.message).toBe(
            `Automation "${TEST_AUTOMATION_ID}" is not available for this workflow's models.`
        );
    });

    it("refuses invalid settings", async () => {
        const { store } = await setup(container => registerTestAutomation(container));

        const result = await store([
            createAutomationStep({ id: "notify", title: "Notify", settings: { mode: "explode" } })
        ]);

        expect(result.error.code).toBe("Workflows/Workflow/Validation");
        expect(result.error.message).toMatch(/^Step "Notify" settings are not valid: mode: /);
    });

    it("checks the automation again on update", async () => {
        const { store } = await setup(container => registerTestAutomation(container));
        const created = await store([createAutomationStep({ id: "notify", title: "Notify" })]);

        const updated = await store(
            [createAutomationStep({ id: "notify", title: "Notify", automationId: "gone" })],
            created.value?.savedOn
        );

        expect(created.isOk()).toBe(true);
        expect(updated.error.message).toBe(
            'Step "Notify" uses the automation "gone", which is not defined.'
        );
    });
});
