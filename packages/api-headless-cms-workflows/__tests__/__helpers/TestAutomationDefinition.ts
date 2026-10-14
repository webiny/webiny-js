import { z } from "zod";
import type { Container } from "@webiny/di";
import { AutomationDefinition } from "@webiny/api-workflows/features/automation/AutomationDefinition/index.js";

/** The only automation the tests register; its id is what the seeded failed step points at. */
export const TEST_AUTOMATION_ID = "test-automation";

export const testAutomationSettingsSchema = z.object({
    mode: z.enum(["approve", "reject", "wait", "throw"]).default("approve"),
    comment: z.string().optional()
});

export type TestAutomationSettings = z.infer<typeof testAutomationSettingsSchema>;

export interface TestAutomationOverrides {
    id?: string;
    name?: string;
    models?: string[];
    maxIterations?: number;
}

/**
 * Package-local copy of the api-workflows test helper (R157, P1: same names and signatures; the
 * api-workflows helpers are not importable here). Restart tests never run the task (no runner
 * here; the handler is Task 12's), so `run` only records the call and approves.
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
        return { type: "approved" };
    }
}

/**
 * Registers the test automation and returns the instance. The one signature of every task and
 * package: `registerTestAutomation(container, overrides?)`. Also usable as a `legacyPlugins`
 * entry (the test handler calls function plugins with the container only).
 */
export const registerTestAutomation = (
    container: Container,
    overrides: TestAutomationOverrides = {}
): TestAutomationDefinition => {
    const definition = new TestAutomationDefinition(overrides);
    container.registerInstance(AutomationDefinition, definition as AutomationDefinition.Interface);
    return definition;
};
