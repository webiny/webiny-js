import zod from "zod";
import type { Container } from "@webiny/feature/api";
import { AutomationDefinition } from "~/features/automation/AutomationDefinition/index.js";
import type { WorkflowStep } from "~/domain/workflow/types.js";

export const TEST_AUTOMATION_ID = "test-automation";

export const testAutomationSettingsSchema = zod.object({
    mode: zod.enum(["approve", "reject", "wait", "throw"]).default("approve"),
    comment: zod.string().optional()
});

export type TestAutomationSettings = zod.infer<typeof testAutomationSettingsSchema>;

export interface TestAutomationOverrides {
    id?: string;
    name?: string;
    models?: string[];
    maxIterations?: number;
}

/**
 * The only automation tests use (R157): no definition ships in a source package. `mode` in the
 * step settings picks the outcome; every `run` call is recorded in `runCalls`.
 */
export class TestAutomationDefinition implements AutomationDefinition.Interface<TestAutomationSettings> {
    public readonly id: string;
    public readonly name: string;
    public readonly models: string[];
    public readonly maxIterations?: number;
    public readonly settingsSchema = testAutomationSettingsSchema;
    public readonly runCalls: AutomationDefinition.RunParams<TestAutomationSettings>[] = [];

    public constructor(overrides: TestAutomationOverrides = {}) {
        this.id = overrides.id ?? TEST_AUTOMATION_ID;
        this.name = overrides.name ?? "Test automation";
        this.models = overrides.models ?? ["*"];
        this.maxIterations = overrides.maxIterations;
    }

    public async run(
        params: AutomationDefinition.RunParams<TestAutomationSettings>
    ): Promise<AutomationDefinition.Outcome> {
        this.runCalls.push(params);
        const { mode, comment } = params.settings;
        if (mode === "throw") {
            throw new Error("The test automation threw.");
        }
        if (mode === "wait") {
            return { type: "continue", wait: 1, state: { iterations: params.iteration } };
        }
        return { type: mode === "reject" ? "rejected" : "approved", comment };
    }
}

/**
 * Registers one test definition on `container` (call it from a `setup` callback of
 * `createContextHandler`) and returns the instance, so the test can read `runCalls` (P1: the one
 * signature, `registerTestAutomation(container, overrides?)`, in every task and package).
 */
export const registerTestAutomation = (
    container: Container,
    overrides: TestAutomationOverrides = {}
): TestAutomationDefinition => {
    const definition = new TestAutomationDefinition(overrides);
    container.registerInstance(AutomationDefinition, definition as AutomationDefinition.Interface);
    return definition;
};

export interface AutomationStepFixtureParams {
    id: string;
    title: string;
    automationId?: string;
    settings?: Record<string, unknown>;
}

/** A workflow step of type "automation" whose config selects a definition and its settings. */
export const createAutomationStep = (params: AutomationStepFixtureParams): WorkflowStep => {
    return {
        id: params.id,
        title: params.title,
        color: "#3b82f6",
        type: "automation",
        notifications: [],
        config: {
            automationId: params.automationId ?? TEST_AUTOMATION_ID,
            settings: params.settings ?? {}
        }
    };
};
