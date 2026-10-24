import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/feature/api";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { TestStepRunner, registerTestStepRunner } from "~tests/__helpers/TestStepRunner.js";
import { AUTOMATION_STEP_TYPE } from "~/domain/workflow/stepTypes.js";
import { StepRunner } from "~/features/stepRun/StepRunner/index.js";
import { StepRunnerRegistryService } from "~/features/stepRun/StepRunnerRegistryService/index.js";

const setup = async (register: (container: Container) => void = () => undefined) => {
    const { context } = await createContextHandler({ setup: register });
    return context.container.resolve(StepRunnerRegistryService);
};

describe("StepRunnerRegistryService (R168)", () => {
    it("has the automation runner registered by WorkflowsFeature", async () => {
        const registry = await setup();

        const runner = registry.get(AUTOMATION_STEP_TYPE);

        expect(runner).not.toBeNull();
        expect(runner).toMatchObject({
            type: "automation",
            singleRun: false,
            failureReasons: {
                error: "The automation failed.",
                aborted: "The automation was aborted.",
                stuck: "The automation task ended without a result."
            }
        });
    });

    it("returns null for a type nothing is registered for", async () => {
        const registry = await setup();

        expect(registry.get("ai")).toBeNull();
        expect(registry.get("")).toBeNull();
    });

    it("finds every registered runner by its type", async () => {
        const registry = await setup(container => {
            registerTestStepRunner(container, new TestStepRunner({ type: "fake-a" }));
            registerTestStepRunner(container, new TestStepRunner({ type: "fake-b" }));
        });

        expect(registry.get(AUTOMATION_STEP_TYPE)?.type).toBe("automation");
        expect(registry.get("fake-a")?.type).toBe("fake-a");
        expect(registry.get("fake-b")?.type).toBe("fake-b");
    });

    it("keeps the last registration per type", async () => {
        const first = new TestStepRunner({ type: "fake-a", failureReasons: { error: "First." } });
        const second = new TestStepRunner({ type: "fake-a", failureReasons: { error: "Second." } });
        const registry = await setup(container => {
            registerTestStepRunner(container, first);
            registerTestStepRunner(container, new TestStepRunner({ type: "fake-b" }));
            registerTestStepRunner(container, second);
        });

        expect(registry.get("fake-a")).toBe(second);
        expect(registry.get("fake-b")?.type).toBe("fake-b");
    });

    it("lets a class registration replace the built-in automation runner", async () => {
        class ReplacementRunner extends TestStepRunner implements StepRunner.Interface {
            public constructor() {
                super({ type: AUTOMATION_STEP_TYPE });
            }
        }
        const Replacement = StepRunner.createImplementation({
            implementation: ReplacementRunner,
            dependencies: []
        });
        const registry = await setup(container => container.register(Replacement));

        expect(registry.get(AUTOMATION_STEP_TYPE)).toBeInstanceOf(ReplacementRunner);
    });
});
