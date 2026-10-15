import { describe, expect, expectTypeOf, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import {
    registerTestAiTool,
    TEST_AI_TOOL_NAME,
    testAiToolInputSchema
} from "~tests/__helpers/TestWorkflowAiTool.js";
import {
    AUTOMATION_STEP_ID,
    createRunningAutomationReview
} from "~tests/__helpers/stepRunReviews.js";
import { requester, toSaveData } from "~tests/__helpers/fixtures.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { withoutBuiltInAiTools } from "~tests/__helpers/withoutBuiltInAiTools.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { AI_STEP_MAX_INPUT_CHARACTERS } from "~/features/aiTools/constants.js";
import type { Actor, ReviewData, ReviewStep } from "~/domain/review/types.js";
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";

const createToolContext = (): WorkflowAiTool.Context => {
    const review = toSaveData(createRunningAutomationReview());
    const step = review.steps.find(candidate => candidate.id === AUTOMATION_STEP_ID);
    if (!step) {
        throw new Error("The test review has no automation step.");
    }
    return { review, step, requester, task: { id: "task-1", createdById: requester.id } };
};

describe("WorkflowAiToolRegistryService (R167)", () => {
    it("is empty when no tool is registered", async () => {
        const { context } = await createContextHandler();
        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(withoutBuiltInAiTools(registry.list())).toEqual([]);
        expect(registry.get(TEST_AI_TOOL_NAME)).toBeNull();
    });

    it("returns registered tools by name, in registration order", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                registerTestAiTool(container);
                registerTestAiTool(container, { name: "otherTool", title: "Other" });
            }
        });
        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(withoutBuiltInAiTools(registry.list()).map(tool => tool.name)).toEqual([
            TEST_AI_TOOL_NAME,
            "otherTool"
        ]);
        expect(registry.get("otherTool")?.title).toBe("Other");
        expect(registry.get("unknown")).toBeNull();
    });

    it("returns the last registration per name and keeps its place in the list (A61)", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                registerTestAiTool(container, { title: "Original" });
                registerTestAiTool(container, { name: "otherTool" });
                registerTestAiTool(container, { title: "Replacement" });
            }
        });
        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(registry.get(TEST_AI_TOOL_NAME)?.title).toBe("Replacement");
        expect(withoutBuiltInAiTools(registry.list()).map(tool => tool.name)).toEqual([
            TEST_AI_TOOL_NAME,
            "otherTool"
        ]);
    });

    it("finds a tool only by its exact name (a name outside the registry never yields a tool, Review Focus 2)", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                registerTestAiTool(container);
            }
        });
        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(registry.get("testtool")).toBeNull();
        expect(registry.get("TESTTOOL")).toBeNull();
        expect(registry.get("test")).toBeNull();
        expect(registry.get("testTool ")).toBeNull();
        expect(registry.get("")).toBeNull();
        expect(registry.get("toString")).toBeNull();
        expect(registry.get("__proto__")).toBeNull();
    });

    it("drops a tool whose name is not a valid provider tool name, logs it once and keeps the others (R87)", async () => {
        loggedErrors.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: "my-tool" });
                registerTestAiTool(container);
                registerTestAiTool(container, { name: "otherTool" });
            }
        });

        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(registry.get("my-tool")).toBeNull();
        expect(withoutBuiltInAiTools(registry.list()).map(tool => tool.name)).toEqual([
            TEST_AI_TOOL_NAME,
            "otherTool"
        ]);
        expect(registry.get(TEST_AI_TOOL_NAME)?.title).toBe("Test tool");
        expect(loggedErrors).toEqual([
            {
                message: "The AI tool was dropped.",
                fields: {
                    toolName: "my-tool",
                    reason: 'The AI tool name "my-tool" is not valid. Use 1 to 64 letters, digits or underscores, starting with a letter.'
                }
            }
        ]);
    });

    it("logs a dropped tool once per container: the registry is a singleton", async () => {
        loggedErrors.length = 0;
        const { context } = await createContextHandler({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: "my-tool" });
            }
        });

        const first = context.container.resolve(WorkflowAiToolRegistryService);
        const second = context.container.resolve(WorkflowAiToolRegistryService);

        expect(second).toBe(first);
        expect(loggedErrors).toHaveLength(1);
    });

    it("accepts a 64 character name and drops a 65 character one", async () => {
        loggedErrors.length = 0;
        const accepted = await createContextHandler({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: `a${"b".repeat(63)}` });
            }
        });
        const acceptedTools = withoutBuiltInAiTools(
            accepted.context.container.resolve(WorkflowAiToolRegistryService).list()
        );

        expect(acceptedTools).toHaveLength(1);
        expect(loggedErrors).toEqual([]);

        const refused = await createContextHandler({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: `a${"b".repeat(64)}` });
            }
        });
        const refusedRegistry = refused.context.container.resolve(WorkflowAiToolRegistryService);

        expect(withoutBuiltInAiTools(refusedRegistry.list())).toEqual([]);
        expect(refusedRegistry.get(`a${"b".repeat(64)}`)).toBeNull();
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("The AI tool was dropped.");
    });
});

describe("WorkflowAiTool context (R167, Review Focus 2)", () => {
    // These two tests contain only `expectTypeOf` checks: they have no runtime effect and fail only
    // under `yarn check:test:types` (Step 4), which is why that run is part of this task.
    it("carries exactly the review, the step, the requester and the task", () => {
        expectTypeOf<keyof WorkflowAiTool.Context>().toEqualTypeOf<
            "review" | "step" | "requester" | "task"
        >();
        expectTypeOf<WorkflowAiTool.Context["review"]>().toEqualTypeOf<ReviewData>();
        expectTypeOf<WorkflowAiTool.Context["step"]>().toEqualTypeOf<ReviewStep>();
        expectTypeOf<WorkflowAiTool.Context["requester"]>().toEqualTypeOf<Actor>();
        expectTypeOf<WorkflowAiTool.Context["task"]>().toEqualTypeOf<StepRunTaskIdentity>();
    });

    it("answers with ok, data and error only", () => {
        expectTypeOf<keyof WorkflowAiTool.Result>().toEqualTypeOf<"ok" | "data" | "error">();
    });

    it("takes the review, step, requester and task from the context, never from the input", async () => {
        const { context: requestContext } = await createContextHandler({
            setup: container => {
                registerTestAiTool(container);
            }
        });
        const registry = requestContext.container.resolve(WorkflowAiToolRegistryService);
        const tool = registry.get(TEST_AI_TOOL_NAME);
        if (!tool) {
            throw new Error("The test tool is not registered.");
        }
        const toolContext = createToolContext();

        // What a model could send: the schema strips every key it does not define. This test shows
        // the test tool only (a handler that ignores the input ids); it does not pin Review Focus 2
        // for the built-ins: Task 19 pins the allowlist, and Task 10 pins that its tools read
        // every id from the context.
        const input = tool.inputSchema.parse({
            note: "hello",
            reviewId: "forged-review",
            stepId: "forged-step",
            targetId: "forged-target",
            targetRevisionId: "forged-revision",
            taskId: "forged-task"
        });
        const result = await tool.execute(input, toolContext);

        expect(input).toEqual({ note: "hello" });
        expect(result).toEqual({
            ok: true,
            data: {
                note: "hello",
                reviewId: "review-1",
                stepId: AUTOMATION_STEP_ID,
                requesterId: requester.id,
                taskId: "task-1"
            }
        });
    });

    it("uses the same input schema the registry exposes (the runner builds the tool set from it)", async () => {
        const { context: requestContext } = await createContextHandler({
            setup: container => {
                registerTestAiTool(container);
            }
        });
        const tool = requestContext.container
            .resolve(WorkflowAiToolRegistryService)
            .get(TEST_AI_TOOL_NAME);

        expect(tool?.inputSchema).toBe(testAiToolInputSchema);
        expect(tool?.inputSchema.safeParse({ note: 1 }).success).toBe(false);
    });

    it("lets a tool refuse with an error text the model may read", async () => {
        const { context: requestContext } = await createContextHandler({
            setup: container => {
                registerTestAiTool(container, {
                    result: { ok: false, error: "That field cannot be written." }
                });
            }
        });
        const tool = requestContext.container
            .resolve(WorkflowAiToolRegistryService)
            .get(TEST_AI_TOOL_NAME);

        const result = await tool?.execute({ note: "x" }, createToolContext());

        expect(result).toEqual({ ok: false, error: "That field cannot be written." });
    });
});

describe("AI step input cap (R175)", () => {
    it("is 200000 characters", () => {
        expect(AI_STEP_MAX_INPUT_CHARACTERS).toBe(200000);
    });
});
