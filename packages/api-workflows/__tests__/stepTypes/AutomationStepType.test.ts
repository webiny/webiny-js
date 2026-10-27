import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    createAutomationStep,
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import { createWorkflowValues } from "~tests/__helpers/fixtures.js";
import { automationStepConfigSchema } from "~/domain/automation/automationStepConfigSchema.js";
import type { WorkflowStep, WorkflowValues } from "~/domain/workflow/types.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";

const setup = async (register: (container: Container) => void = () => {}) => {
    const { context } = await createContextHandler({ setup: register });
    const stepType = context.container.resolve(StepTypeRegistryService).get("automation");
    if (!stepType) {
        throw new Error("The automation step type is not registered.");
    }
    return stepType;
};

const workflowWith = (step: WorkflowStep, models = ["cms.article"]): WorkflowValues => {
    return createWorkflowValues({ models, steps: [step] });
};

describe("AutomationStepType (R133, R137, R138)", () => {
    it("is registered next to review and describes itself", async () => {
        const stepType = await setup();

        expect(stepType.type).toBe("automation");
        expect(stepType.title).toBe("Automation");
        expect(stepType.configSchema).toBe(automationStepConfigSchema);
    });

    describe("describeAvailability", () => {
        it("is unavailable while no automation is defined", async () => {
            const stepType = await setup();

            expect(await stepType.describeAvailability()).toEqual({
                available: false,
                unavailableReason: "No automation is defined."
            });
        });

        it("is available once an automation is defined", async () => {
            const stepType = await setup(container => registerTestAutomation(container));

            expect(await stepType.describeAvailability()).toEqual({
                available: true,
                unavailableReason: null
            });
        });
    });

    describe("validate", () => {
        it("returns the step with the settings as the author entered them, after checking they parse", async () => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = createAutomationStep({ id: "notify", title: "Notify", settings: {} });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.isOk()).toBe(true);
            // Stored as entered (R137): the defaults are applied again on every use.
            expect(result.value?.config).toEqual({
                automationId: TEST_AUTOMATION_ID,
                settings: {}
            });
            expect(result.value?.id).toBe("notify");
        });

        it.each([
            { name: "no config", config: undefined },
            { name: "no automation id", config: { settings: {} } },
            { name: "an empty automation id", config: { automationId: "", settings: {} } },
            { name: "settings that are not an object", config: { automationId: "a", settings: 1 } },
            { name: "no settings", config: { automationId: TEST_AUTOMATION_ID } }
        ])("refuses a malformed config: $name", async ({ config }) => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = { ...createAutomationStep({ id: "notify", title: "Notify" }), config };

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toBe('Step "Notify" needs an automation.');
        });

        it("refuses an automation that is not defined", async () => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = createAutomationStep({
                id: "notify",
                title: "Notify",
                automationId: "gone-automation"
            });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.error?.message).toBe(
                'Step "Notify" uses the automation "gone-automation", which is not defined.'
            );
        });

        it("refuses an automation that does not cover the workflow's models", async () => {
            const stepType = await setup(container =>
                registerTestAutomation(container, { models: ["cms.page"] })
            );
            const step = createAutomationStep({ id: "notify", title: "Notify" });

            const result = stepType.validate({
                step,
                workflow: workflowWith(step, ["cms.article"])
            });

            expect(result.error?.message).toBe(
                `Automation "${TEST_AUTOMATION_ID}" is not available for this workflow's models.`
            );
        });

        it("accepts an automation scoped with a namespace wildcard", async () => {
            const stepType = await setup(container =>
                registerTestAutomation(container, { models: ["cms.*"] })
            );
            const step = createAutomationStep({ id: "notify", title: "Notify" });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.isOk()).toBe(true);
        });

        it("refuses settings that fail the definition's schema, naming the first issue", async () => {
            const stepType = await setup(container => registerTestAutomation(container));
            const step = createAutomationStep({
                id: "notify",
                title: "Notify",
                settings: { mode: "explode" }
            });

            const result = stepType.validate({ step, workflow: workflowWith(step) });

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toMatch(
                /^Step "Notify" settings are not valid: mode: .+\.$/
            );
        });
    });
});
