import zod from "zod";
import type { Container } from "@webiny/feature/api";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";

export const TEST_AI_TOOL_NAME = "testTool";

export const testAiToolInputSchema = zod.object({ note: zod.string() });

export type TestAiToolInput = zod.infer<typeof testAiToolInputSchema>;

export interface TestAiToolOverrides {
    name?: string;
    title?: string;
    description?: string;
    /** Declared on the tool as given; absent by default, which means false. */
    changesContent?: boolean;
    /** What `execute` answers; by default the context ids it was given, so a test can see where an id came from. */
    result?: WorkflowAiTool.Result;
}

export interface TestAiToolCall {
    input: TestAiToolInput;
    context: WorkflowAiTool.Context;
}

/**
 * The only tool the registry and list tests use. Every `execute` call is recorded in
 * `executeCalls`. The default answer echoes the ids from the context, never from the input.
 */
export class TestWorkflowAiTool implements WorkflowAiTool.Interface<TestAiToolInput> {
    public readonly name: string;
    public readonly title: string;
    public readonly description: string;
    public readonly changesContent?: boolean;
    public readonly inputSchema = testAiToolInputSchema;
    public readonly executeCalls: TestAiToolCall[] = [];
    private readonly result: WorkflowAiTool.Result | undefined;

    public constructor(overrides: TestAiToolOverrides = {}) {
        this.name = overrides.name ?? TEST_AI_TOOL_NAME;
        this.title = overrides.title ?? "Test tool";
        this.description = overrides.description ?? "A tool for tests.";
        this.changesContent = overrides.changesContent;
        this.result = overrides.result;
    }

    public async execute(
        input: TestAiToolInput,
        context: WorkflowAiTool.Context
    ): Promise<WorkflowAiTool.Result> {
        this.executeCalls.push({ input, context });
        return (
            this.result ?? {
                ok: true,
                data: {
                    note: input.note,
                    reviewId: context.review.id,
                    stepId: context.step.id,
                    requesterId: context.requester.id,
                    taskId: context.task.id
                }
            }
        );
    }
}

/**
 * Registers one test tool on `container` (call it from a `setup` callback of
 * `createContextHandler`) and returns the instance, so the test can read `executeCalls`.
 */
export const registerTestAiTool = (
    container: Container,
    overrides: TestAiToolOverrides = {}
): TestWorkflowAiTool => {
    const tool = new TestWorkflowAiTool(overrides);
    container.registerInstance(WorkflowAiTool, tool as WorkflowAiTool.Interface);
    return tool;
};
