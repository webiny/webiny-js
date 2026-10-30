### Task 7: `WorkflowAiTool` abstraction and `WorkflowAiToolRegistryService`

Spec 9.3; D55; R167, R175 (the input cap constant), R176; A58, A61; Review Focus 2. The developer-facing tool abstraction and its registry, nothing else. No tool ships in this task (the built-ins `readTarget` and `updateTargetFields` arrive in Task 10), and nothing turns a tool into an AI SDK tool (the AI runner does, Task 19; `api-workflows` has no AI dependency, R177):

- `WorkflowAiTool` (`features/aiTools/WorkflowAiTool/`) is a multi-registered abstraction (R167, never the global `AiSdkTools`, D55): `name` (unique, matches `^[A-Za-z][A-Za-z0-9_]{0,63}$`, so at most 64 characters, valid as a provider tool name), `title` (what the workflow author sees in the editor), `description` (what the model sees), `inputSchema: ZodType<TInput>` and `execute(input, context): Promise<WorkflowAiToolResult>`. `WorkflowAiToolResult` is `{ ok: boolean; data?: unknown; error?: string }`: `error` is a text the model may read, so a tool never puts a provider or storage error in it (R87, "Raw errors never reach a step"); `execute` never rejects (R87), a failure is `{ ok: false, error }`.
- `WorkflowAiToolContext` is `{ review: ReviewData; step: ReviewStep; requester: Actor; task: StepRunTaskIdentity }`, supplied by the runner (Task 19). It is the only place a handler learns which target, revision, review, step or task it works for, so a handler never takes any of those ids from the model (Review Focus 2). The contract documents this on the abstraction; the test below pins the shape (exactly these four keys) and that an id a model sends is stripped by the schema and never used.
- `WorkflowAiToolRegistryService` (`features/aiTools/WorkflowAiToolRegistryService/`) mirrors `AutomationDefinitionRegistryService`: `get(name): WorkflowAiTool.Interface | null` (exact, case-sensitive match; no prefix or fuzzy lookup) and `list(): WorkflowAiTool.Interface[]` (registration order; the last registration per `name` wins and keeps the first one's place, A61). A tool whose `name` does not match the R167 pattern is dropped: the registry logs it once with `Logger.error` (fields `toolName` and `reason` = `The AI tool name "<name>" is not valid. Use 1 to 64 letters, digits or underscores, starting with a letter.`, message `The AI tool was dropped.`) and keeps the other tools, so one developer mistake neither takes the whole registry down nor reaches a provider (a provider rejects the whole model call for one bad tool name). The dropped tool is absent from `get` and `list` and cannot be allowlisted (R87: the registry never throws).
- The pattern lives in a pure function `isWorkflowAiToolName(name: string): boolean` (`domain/aiTools/isWorkflowAiToolName.ts`; no dependency, so it is a plain function, not a service). The registry uses it to drop invalid names; Task 17's save-time check looks `tools` entries up through `get`, so an invalid name is simply "not defined".
- `features/aiTools/constants.ts` holds `AI_STEP_MAX_INPUT_CHARACTERS = 200000` (R175): Task 10's `readTarget` and Task 19's runner share it, and `api-workflows` owns it because the tool lives here. It is created here so those tasks only import it.
- `WorkflowsFeature` registers the registry through its own feature file (`WorkflowAiToolRegistryFeature`). The registration test asserts the registry once and zero `WorkflowAiTool` implementations (Task 10 changes that assertion to two when it registers the built-ins; that is an intended change, not a regression).
- Public path `@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js` (R134 style; the package `exports` allow `./*`): a developer imports `WorkflowAiTool` from it and registers an implementation (guide in Task 21). A custom tool's write path is the developer's responsibility (A61).

**Files:**
- Create: `packages/api-workflows/src/domain/aiTools/isWorkflowAiToolName.ts`
- Create: `packages/api-workflows/src/features/aiTools/constants.ts`
- Create: `packages/api-workflows/src/features/aiTools/WorkflowAiTool/abstractions.ts`
- Create: `packages/api-workflows/src/features/aiTools/WorkflowAiTool/index.ts`
- Create: `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/abstractions.ts`
- Create: `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/WorkflowAiToolRegistryService.ts`
- Create: `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/feature.ts`
- Create: `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/index.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/TestWorkflowAiTool.ts`
- Create: `packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts`
- Create: `packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (two added assertions; no existing expectation changes)

**Interfaces:**
- Consumes:
  - Existing: `ReviewData`, `ReviewStep`, `Actor` (`~/domain/review/types.js`), `StepRunTaskIdentity` (`~/domain/review/getStaleStepRunReason.js`), `createAbstraction` (`@webiny/feature/api`), zod 4 `ZodType`, `Logger` (`@webiny/api-core/features/logger/index.js`).
  - Test helpers (reused, never redefined): `createContextHandler` (`~tests/__helpers/handler.js`), `AUTOMATION_STEP_ID`, `createRunningAutomationReview` (`~tests/__helpers/stepRunReviews.js`), `requester`, `toSaveData` (`~tests/__helpers/fixtures.js`), `captureLoggedErrors`, `loggedErrors` (`~tests/__helpers/CapturingLogger.js`).
- Produces (matches the contract):
  - `WorkflowAiTool` (`~/features/aiTools/WorkflowAiTool/index.js`), namespace types `Interface`, `Context`, `Result`; also exported: `IWorkflowAiTool`, `WorkflowAiToolContext`, `WorkflowAiToolResult`. Consumed by Tasks 8, 10, 17, 19.
  - `WorkflowAiToolRegistryService` (`~/features/aiTools/WorkflowAiToolRegistryService/index.js`): `get(name: string): WorkflowAiTool.Interface | null`, `list(): WorkflowAiTool.Interface[]`. Consumed by Tasks 8, 10, 17, 19.
  - `AI_STEP_MAX_INPUT_CHARACTERS = 200000` (`~/features/aiTools/constants.js`). Consumed by Tasks 10, 19.
  - `isWorkflowAiToolName(name: string): boolean` (`~/domain/aiTools/isWorkflowAiToolName.js`).
  - Test helper `TestWorkflowAiTool`, `registerTestAiTool(container, overrides?)`, `TEST_AI_TOOL_NAME` (`~tests/__helpers/TestWorkflowAiTool.js`), reused by Task 8 and later tasks.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/TestWorkflowAiTool.ts`:

```ts
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
    public readonly inputSchema = testAiToolInputSchema;
    public readonly executeCalls: TestAiToolCall[] = [];
    private readonly result: WorkflowAiTool.Result | undefined;

    public constructor(overrides: TestAiToolOverrides = {}) {
        this.name = overrides.name ?? TEST_AI_TOOL_NAME;
        this.title = overrides.title ?? "Test tool";
        this.description = overrides.description ?? "A tool for tests.";
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
```

Create `packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { isWorkflowAiToolName } from "~/domain/aiTools/isWorkflowAiToolName.js";

describe("isWorkflowAiToolName (R167)", () => {
    it.each([
        "a",
        "readTarget",
        "updateTargetFields",
        "my_tool_2",
        "A",
        `a${"b".repeat(63)}`
    ])("accepts %s", name => {
        expect(isWorkflowAiToolName(name)).toBe(true);
    });

    it.each([
        ["empty", ""],
        ["starts with a digit", "1tool"],
        ["starts with an underscore", "_tool"],
        ["contains a hyphen", "my-tool"],
        ["contains a space", "my tool"],
        ["contains a dot", "cms.tool"],
        ["contains a non-ASCII letter", "tÖol"],
        ["has a trailing newline", "tool\n"],
        ["is 65 characters long", `a${"b".repeat(64)}`]
    ])("rejects a name that %s", (_label, name) => {
        expect(isWorkflowAiToolName(name)).toBe(false);
    });
});
```

Create `packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts`:

```ts
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

        expect(registry.list()).toEqual([]);
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

        expect(registry.list().map(tool => tool.name)).toEqual([TEST_AI_TOOL_NAME, "otherTool"]);
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
        expect(registry.list().map(tool => tool.name)).toEqual([TEST_AI_TOOL_NAME, "otherTool"]);
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
        expect(registry.list().map(tool => tool.name)).toEqual([TEST_AI_TOOL_NAME, "otherTool"]);
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

    it("accepts a 64 character name and drops a 65 character one", async () => {
        loggedErrors.length = 0;
        const accepted = await createContextHandler({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: `a${"b".repeat(63)}` });
            }
        });
        const acceptedTools = accepted.context.container
            .resolve(WorkflowAiToolRegistryService)
            .list();

        expect(acceptedTools).toHaveLength(1);
        expect(loggedErrors).toEqual([]);

        const refused = await createContextHandler({
            setup: container => {
                captureLoggedErrors(container);
                registerTestAiTool(container, { name: `a${"b".repeat(64)}` });
            }
        });
        const refusedRegistry = refused.context.container.resolve(WorkflowAiToolRegistryService);

        expect(refusedRegistry.list()).toEqual([]);
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
```

Modify `packages/api-workflows/__tests__/registration.test.ts`. Add the imports next to the other `features/` imports:

```ts
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
```

and, directly after the `expect(container.resolveAll(AutomationDefinition)).toHaveLength(0);` line, add:

```ts
        // The AI tool registry; no tool ships yet (Task 10 registers the built-ins).
        expect(container.resolveAll(WorkflowAiToolRegistryService)).toHaveLength(1);
        expect(container.resolveAll(WorkflowAiTool)).toHaveLength(0);
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL. The imports of `~/domain/aiTools/isWorkflowAiToolName.js`, `~/features/aiTools/WorkflowAiTool/index.js`, `~/features/aiTools/WorkflowAiToolRegistryService/index.js` and `~/features/aiTools/constants.js` cannot be resolved.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: FAIL, same reason.

- [ ] **Step 3: The abstraction, the registry and the name check**

Create `packages/api-workflows/src/domain/aiTools/isWorkflowAiToolName.ts`:

```ts
const AI_TOOL_NAME_PATTERN = /^[A-Za-z][A-Za-z0-9_]{0,63}$/;

/**
 * Whether `name` is a valid `WorkflowAiTool` name (R167): a letter, then up to 63 letters, digits
 * or underscores. Model providers accept tool names of this shape only, and one bad name makes
 * the provider refuse the whole call. Pure: no dependency.
 */
export const isWorkflowAiToolName = (name: string): boolean => {
    return AI_TOOL_NAME_PATTERN.test(name);
};
```

Create `packages/api-workflows/src/features/aiTools/constants.ts`:

```ts
/**
 * The most characters the AI step takes in (R175): the serialised target content, the previous
 * step comments and the step instructions together. Over it the step fails before any model call;
 * nothing is ever truncated, because the AI must not approve content it never saw. `readTarget`
 * (Task 10) and the AI runner (Task 19) share it.
 */
export const AI_STEP_MAX_INPUT_CHARACTERS = 200000;
```

Create `packages/api-workflows/src/features/aiTools/WorkflowAiTool/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { ZodType } from "zod";
import type { Actor, ReviewData, ReviewStep } from "~/domain/review/types.js";
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";

/**
 * What the runner supplies to every tool call (R167). It is the only place a handler learns which
 * review, step, target and task it works for: a handler never takes a target, revision, review or
 * step id from the model, so content under review cannot point a tool at another record (D55).
 */
export interface WorkflowAiToolContext {
    /** The review as stored when the step run started. */
    review: ReviewData;
    /** The AI step being run. */
    step: ReviewStep;
    /** The requester: the identity the task runs as. */
    requester: Actor;
    /** The step run task, for the stale guard. */
    task: StepRunTaskIdentity;
}

/**
 * What a tool answers. `error` is a text the model may read, so it never holds a provider or
 * storage error (the real error is logged). `execute` never rejects: a failure is `ok: false`.
 */
export interface WorkflowAiToolResult {
    ok: boolean;
    /** The answer, serialised for the model as JSON. */
    data?: unknown;
    error?: string;
}

export interface IWorkflowAiTool<TInput = unknown> {
    /** Unique; `^[A-Za-z][A-Za-z0-9_]{0,63}$`. Stored on the step's `tools`; a rename breaks stored workflows. */
    readonly name: string;
    /** Shown to workflow authors in the step editor. */
    readonly title: string;
    /** Shown to the model: what the tool does and when to call it. */
    readonly description: string;
    /** What the model sends. Never include a target, revision, review or step id: the context has them. */
    readonly inputSchema: ZodType<TInput>;
    execute(input: TInput, context: WorkflowAiToolContext): Promise<WorkflowAiToolResult>;
}

/**
 * A tool an AI step may call (spec 9.3, R167, D55): register an implementation and a workflow
 * author can allowlist it on an AI step. Multi-registered; the registry returns the last
 * registration per `name`. Never the global `AiSdkTools`: a step gets only the tools it lists. A
 * tool that writes is responsible for its own write path (A61).
 */
export const WorkflowAiTool = createAbstraction<IWorkflowAiTool>("WorkflowAiTool");

export namespace WorkflowAiTool {
    export type Interface<TInput = unknown> = IWorkflowAiTool<TInput>;
    export type Context = WorkflowAiToolContext;
    export type Result = WorkflowAiToolResult;
}
```

Create `packages/api-workflows/src/features/aiTools/WorkflowAiTool/index.ts`:

```ts
export { WorkflowAiTool } from "./abstractions.js";
export type {
    IWorkflowAiTool,
    WorkflowAiToolContext,
    WorkflowAiToolResult
} from "./abstractions.js";
```

Create `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/api";
import type { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";

export interface IWorkflowAiToolRegistryService {
    /** The tool with exactly this name; `null` when none is registered. */
    get(name: string): WorkflowAiTool.Interface | null;
    /** Registration order; the last registration per `name` wins and keeps the first one's place. */
    list(): WorkflowAiTool.Interface[];
}

/** The registered AI tools (R167). Turning them into an AI SDK tool set is the runner's job. */
export const WorkflowAiToolRegistryService = createAbstraction<IWorkflowAiToolRegistryService>(
    "WorkflowAiToolRegistryService"
);

export namespace WorkflowAiToolRegistryService {
    export type Interface = IWorkflowAiToolRegistryService;
}
```

Create `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/WorkflowAiToolRegistryService.ts`:

```ts
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { isWorkflowAiToolName } from "~/domain/aiTools/isWorkflowAiToolName.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";
import { WorkflowAiToolRegistryService as Abstraction } from "./abstractions.js";

class WorkflowAiToolRegistryServiceImpl implements Abstraction.Interface {
    private readonly tools = new Map<string, WorkflowAiTool.Interface>();

    public constructor(tools: WorkflowAiTool.Interface[], logger: Logger.Interface) {
        for (const tool of tools) {
            if (!isWorkflowAiToolName(tool.name)) {
                logger.error(
                    {
                        toolName: tool.name,
                        reason: `The AI tool name "${tool.name}" is not valid. Use 1 to 64 letters, digits or underscores, starting with a letter.`
                    },
                    "The AI tool was dropped."
                );
                continue;
            }
            this.tools.set(tool.name, tool);
        }
    }

    public get(name: string): WorkflowAiTool.Interface | null {
        return this.tools.get(name) ?? null;
    }

    public list(): WorkflowAiTool.Interface[] {
        return [...this.tools.values()];
    }
}

export const WorkflowAiToolRegistryService = Abstraction.createImplementation({
    implementation: WorkflowAiToolRegistryServiceImpl,
    dependencies: [[WorkflowAiTool, { multiple: true }], Logger]
});
```

Create `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { WorkflowAiToolRegistryService } from "./WorkflowAiToolRegistryService.js";

export const WorkflowAiToolRegistryFeature = createFeature({
    name: "Workflows/WorkflowAiToolRegistry",
    register(container) {
        container.register(WorkflowAiToolRegistryService);
    }
});
```

Create `packages/api-workflows/src/features/aiTools/WorkflowAiToolRegistryService/index.ts`:

```ts
export { WorkflowAiToolRegistryService } from "./abstractions.js";
```

In `packages/api-workflows/src/WorkflowsFeature.ts` add the import next to the `AutomationDefinitionRegistryFeature` import:

```ts
import { WorkflowAiToolRegistryFeature } from "~/features/aiTools/WorkflowAiToolRegistryService/feature.js";
```

and register it directly after `AutomationDefinitionRegistryFeature.register(container);`:

```ts
        // Automation definitions written by developers (R133); none ships (R155)
        AutomationDefinitionRegistryFeature.register(container);
        // AI tools an AI step may allowlist (R167); the built-ins arrive with Task 10
        WorkflowAiToolRegistryFeature.register(container);
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts packages/api-workflows/__tests__/registration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors. The two `expectTypeOf`-only tests (the context and result shapes) are checked only by this run; `yarn test` passes them without comparing anything.

- [ ] **Step 5: Run the existing tests covering the changed code**

`WorkflowsFeature` gained one registration and the registry mirrors the automation registry; nothing else changed:

Run: `yarn test packages/api-workflows/__tests__/automation/AutomationDefinitionRegistryService.test.ts packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/automation/AutomationDefinitionRegistryService.test.ts packages/api-workflows/__tests__/config/ListAutomationDefinitions.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
feat(api-workflows): add the WorkflowAiTool abstraction and registry

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
