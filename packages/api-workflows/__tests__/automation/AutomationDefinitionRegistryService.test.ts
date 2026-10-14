import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    registerTestAutomation,
    TEST_AUTOMATION_ID
} from "~tests/__helpers/TestAutomationDefinition.js";
import { AutomationDefinitionRegistryService } from "~/features/automation/AutomationDefinitionRegistryService/index.js";

describe("AutomationDefinitionRegistryService (R133)", () => {
    it("is empty when no automation is registered (R155: none ships)", async () => {
        const { context } = await createContextHandler();
        const registry = context.container.resolve(AutomationDefinitionRegistryService);

        expect(registry.list()).toEqual([]);
        expect(registry.get(TEST_AUTOMATION_ID)).toBeNull();
    });

    it("returns registered definitions by id, in registration order", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                registerTestAutomation(container);
                registerTestAutomation(container, { id: "other-automation", name: "Other" });
            }
        });
        const registry = context.container.resolve(AutomationDefinitionRegistryService);

        expect(registry.list().map(definition => definition.id)).toEqual([
            TEST_AUTOMATION_ID,
            "other-automation"
        ]);
        expect(registry.get("other-automation")?.name).toBe("Other");
        expect(registry.get("unknown")).toBeNull();
    });

    it("returns the last registration per id and keeps its place in the list", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                registerTestAutomation(container, { name: "Original" });
                registerTestAutomation(container, { id: "other-automation" });
                registerTestAutomation(container, { name: "Replacement" });
            }
        });
        const registry = context.container.resolve(AutomationDefinitionRegistryService);

        expect(registry.get(TEST_AUTOMATION_ID)?.name).toBe("Replacement");
        expect(registry.list().map(definition => definition.id)).toEqual([
            TEST_AUTOMATION_ID,
            "other-automation"
        ]);
    });
});
