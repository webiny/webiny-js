import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createTestStepType } from "~tests/__helpers/TestStepType.js";
import { StepTypeRegistryService } from "~/features/stepTypes/StepTypeRegistryService/index.js";

describe("StepTypeRegistryService (R131)", () => {
    it("has the review and automation built-ins and nothing else registered by the engine yet", async () => {
        const { context } = await createContextHandler();
        const registry = context.container.resolve(StepTypeRegistryService);

        expect(registry.list().map(stepType => stepType.type)).toEqual(["review", "automation"]);
        expect(registry.get("review")?.title).toBe("Review");
        expect(registry.get("ai")).toBeNull();
        expect(registry.get("unknown")).toBeNull();
    });

    it("lists registered types in registration order", async () => {
        const custom = createTestStepType({ type: "custom", title: "Custom" });
        const { context } = await createContextHandler({
            setup: container => {
                container.register(custom.implementation);
            }
        });
        const registry = context.container.resolve(StepTypeRegistryService);

        expect(registry.list().map(stepType => stepType.type)).toEqual([
            "review",
            "automation",
            "custom"
        ]);
        expect(registry.get("custom")?.title).toBe("Custom");
    });

    it("returns the last registration per type and keeps its place in the list", async () => {
        const replacement = createTestStepType({ type: "review", title: "Custom review" });
        const custom = createTestStepType({ type: "custom" });
        const { context } = await createContextHandler({
            setup: container => {
                container.register(custom.implementation);
                container.register(replacement.implementation);
            }
        });
        const registry = context.container.resolve(StepTypeRegistryService);

        expect(registry.get("review")?.title).toBe("Custom review");
        expect(registry.list().map(stepType => stepType.type)).toEqual([
            "review",
            "automation",
            "custom"
        ]);
        expect(registry.list()[0].title).toBe("Custom review");
    });
});
