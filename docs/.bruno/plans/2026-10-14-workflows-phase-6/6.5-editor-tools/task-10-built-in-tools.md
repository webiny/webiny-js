### Task 10: built-in tools `readTarget` and `updateTargetFields`

Spec 9.3, 7.3; D36, D55, D62, D132; R87, R150, R167, R172, R173, R175; A58, A59, A61; Review Focus 1 (the tool re-guard), Review Focus 2 (ids come from the context), Review Focus 4 (the bypass). The two tools every AI step may allowlist, registered by `WorkflowsFeature` as `WorkflowAiTool`s. A step must allowlist them like any tool; a step with no tools can only decide:

- `readTarget` (`features/aiTools/ReadTargetTool/ReadTargetTool.ts`): name `readTarget`, title `Read target`, `inputSchema: zod.object({})` (it takes no input; the schema strips anything a model sends). `execute` reads through `ReviewTargetEditorService` using `context.review.model`, `context.review.targetId` and `context.review.targetRevisionId` (the review snapshot, never the input, Review Focus 2) and answers `{ ok: true, data: ReviewTargetContent }` (`title` and every field with `path`, `label`, `type`, `value` and `writable`, R172). Content whose `JSON.stringify` is longer than `AI_STEP_MAX_INPUT_CHARACTERS` (R175) answers `{ ok: false, error: "The content is too large for the AI review." }` and never a truncated copy (the model must not decide on content it did not see). A failed read answers `{ ok: false, error: <the ReviewTargetEditorError message> }` (safe to show the model, Task 9); a throw is logged with `Logger.error` and answered with the fixed text `The target could not be read.` (R87). It reads no review and writes nothing, so it needs no stale check and no bypass.
- `updateTargetFields` (`features/aiTools/UpdateTargetFieldsTool/UpdateTargetFieldsTool.ts`): name `updateTargetFields`, title `Update target fields`, `inputSchema: zod.object({ fields: zod.record(zod.string(), zod.unknown()) })`: paths from the last `readTarget`, new values. `execute` is the only writer of the content under review (Review Focus 2) and runs these steps in this order, all inside one `try`/`catch`, so it never rejects (R87):
  1. an empty `fields` object answers `{ ok: false, error: "No fields were given." }`; no read, no write.
  2. **Stale re-check (R173, R175, Review Focus 1), right before the write:** `StepRunStaleCheckService.isStale({ reviewId: context.review.id, stepId: context.step.id, task: context.task })` (Task 4: it re-reads the STORED review through `ReviewRepository` and applies `getStaleStepRunReason`; `context.review` is only the snapshot the run started with, so a cancel, a delete or a restart under a new task that happened during the model call is seen). `ok(true)` answers `{ ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE }` and writes nothing. A failed Result (the service is fail-closed: a failed or throwing read comes back as `fail(ReviewPersistenceError)`, and the service already logged it) answers `{ ok: false, error: AI_TOOL_STEP_CHECK_FAILED_MESSAGE }` (`The step could not be checked; nothing was written.`) BEFORE `bypass.run`, writes nothing and is not logged again by the tool. The check runs for every call, so a second write after a cancel, or after the check started failing, writes nothing either. It is called outside the bypass.
  3. **The write, under the bypass, awaited inside it (R173, D36, D62, R150):** `await this.bypass.run(() => this.editors.update({ model, targetId, targetRevisionId, values: input.fields }))`. `WorkflowBypassService` is an `AsyncLocalStorage` scope: `isActive()` is true only inside that callback's async chain, so it is false the moment `update` returns or throws, false for a save that starts outside the tool while the update is in flight, and the update must be awaited INSIDE `run` (a callback that returned before the write finished would leave the write outside the scope). Only the save block reads the bypass; move, folder change, delete and trash blocks stay active. The identity is not touched: the write runs as the requester with authorization off, like the whole task (R161).
  4. Success answers `{ ok: true, data: { applied: string[] } }`. A refusal (`ReviewTargetEditorError`: unknown path, read-only path, a value the target rejects) answers `{ ok: false, error: <its message> }`; it never fails the step. A throw is logged (`Logger.error`, fields `error`, `reviewId`, `stepId`, `taskId`) and answered with `The target could not be updated.`
  Bounds (R172, Review Focus 3) are the adapters' (Tasks 12, 13): the tool passes `fields` unchanged as `values` and adds no key; whatever is not writable is refused there, atomically.
- `features/aiTools/constants.ts` (Task 7) gains `READ_TARGET_TOOL_NAME`, `UPDATE_TARGET_FIELDS_TOOL_NAME`, `BUILT_IN_AI_TOOL_NAMES` and the four fixed tool texts `AI_STEP_CONTENT_TOO_LARGE_MESSAGE`, `AI_TOOL_STEP_NOT_RUNNING_MESSAGE`, `AI_TOOL_STEP_CHECK_FAILED_MESSAGE`, `AI_TOOL_NO_FIELDS_MESSAGE`. The AI runner (Task 19) imports `AI_STEP_CONTENT_TOO_LARGE_MESSAGE` for its own pre-call check, so the text has one source.
- `BuiltInAiToolsFeature` (`features/aiTools/BuiltInAiToolsFeature.ts`) registers both tools; `WorkflowsFeature` calls it after the registry feature. This is the one change of Tasks 7 and 8's expectations: the registry now lists two tools in every `WorkflowsFeature` container. Their existing tests stay as they are except for the assertions below, which count or list every tool (the Task 7 assertion `resolveAll(WorkflowAiTool)` goes from 0 to 2, as Task 7 announced; the rest filter the built-ins out with `withoutBuiltInAiTools`).
- The custom-tool path stays open (A61): a developer registers another `WorkflowAiTool`; this task adds nothing to the abstraction.

**Files:**
- Modify: `packages/api-workflows/src/features/aiTools/constants.ts`
- Create: `packages/api-workflows/src/features/aiTools/ReadTargetTool/ReadTargetTool.ts`
- Create: `packages/api-workflows/src/features/aiTools/UpdateTargetFieldsTool/UpdateTargetFieldsTool.ts`
- Create: `packages/api-workflows/src/features/aiTools/BuiltInAiToolsFeature.ts`
- Modify: `packages/api-workflows/src/WorkflowsFeature.ts`
- Create: `packages/api-workflows/__tests__/__helpers/aiToolContext.ts`
- Create: `packages/api-workflows/__tests__/__helpers/withoutBuiltInAiTools.ts`
- Create: `packages/api-workflows/__tests__/__helpers/RecordingStaleCheck.ts`
- Create: `packages/api-workflows/__tests__/aiTools/ReadTargetTool.test.ts`
- Create: `packages/api-workflows/__tests__/aiTools/UpdateTargetFieldsTool.test.ts`
- Create: `packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts`
- Modify: `packages/api-workflows/__tests__/registration.test.ts` (the Task 7 `WorkflowAiTool` assertion 0 -> 2)
- Modify: `packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts` (Task 7: list assertions filter the built-ins)
- Modify: `packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts` (Task 8: same)
- Modify: `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (Task 8: the two `listAiTools` result tests)

**Interfaces:**
- Consumes:
  - Task 4: `StepRunStaleCheckService` (`~/features/stepRun/StepRunStaleCheckService/index.js`), `isStale({ reviewId, stepId, task: { id, createdById } }): Promise<Result<boolean, ReviewPersistenceError>>` (one repository read, never throws; fail-closed: a failed or throwing read is logged once by the service and answers a failed Result); test helper `FailingReviewGet`, `reviewGetFaults` (`~tests/__helpers/FailingReviewGet.js`; `mode: null | "fail" | "throw"`, `reads` counter).
  - Task 7: `WorkflowAiTool` (`~/features/aiTools/WorkflowAiTool/index.js`, `Interface<TInput>`, `Context`, `Result`), `WorkflowAiToolRegistryService` (`~/features/aiTools/WorkflowAiToolRegistryService/index.js`, `get(name)`, `list()`), `AI_STEP_MAX_INPUT_CHARACTERS` (`~/features/aiTools/constants.js`), `registerTestAiTool`, `TEST_AI_TOOL_NAME` (`~tests/__helpers/TestWorkflowAiTool.js`), `isWorkflowAiToolName` (`~/domain/aiTools/isWorkflowAiToolName.js`).
  - Task 9: `ReviewTargetEditorService` (`read`, `update`), `ReviewTargetEditor`, `ReviewTargetEditorError`, test helper `FakeReviewTargetEditor`, `fakeEditor`, `resetFakeEditor`, `holdFakeEditorUpdate`, `createFakeEditorContent` (`~tests/__helpers/FakeReviewTargetEditor.js`).
  - Existing: `WorkflowBypassService` (`~/features/bypass/WorkflowBypassService/index.js`, `run`, `isActive`), `Logger` (`@webiny/api-core/features/logger/index.js`), `ReviewRepository`, `ReviewSaver`, `Review`, `getStaleStepRunReason` (through the service), test helpers `createContextHandler`, `captureLoggedErrors`, `loggedErrors`, `AUTOMATION_STEP_ID`, `createRunningAutomationReview` (`~tests/__helpers/stepRunReviews.js`), `requester`, `expectOk`, `toSaveData`, `NOW` (`~tests/__helpers/fixtures.js`).
- Produces (matches the contract):
  - The `WorkflowAiTool`s `readTarget` and `updateTargetFields`, registered by `WorkflowsFeature`. Consumed by Tasks 19, 20.
  - Constants `READ_TARGET_TOOL_NAME`, `UPDATE_TARGET_FIELDS_TOOL_NAME`, `BUILT_IN_AI_TOOL_NAMES`, `AI_STEP_CONTENT_TOO_LARGE_MESSAGE`, `AI_TOOL_STEP_NOT_RUNNING_MESSAGE`, `AI_TOOL_STEP_CHECK_FAILED_MESSAGE`, `AI_TOOL_NO_FIELDS_MESSAGE` (`~/features/aiTools/constants.js`). Consumed by Task 19 (`AI_STEP_CONTENT_TOO_LARGE_MESSAGE`).
  - Test helpers `createAiToolContext`, `AI_TOOL_TASK` (`~tests/__helpers/aiToolContext.js`), `withoutBuiltInAiTools` (`~tests/__helpers/withoutBuiltInAiTools.js`), `RecordingStaleCheck`, `staleCheckBypassStates` (`~tests/__helpers/RecordingStaleCheck.js`), reused by Tasks 19 and 20.

- [ ] **Step 1: Write the failing tests**

Create `packages/api-workflows/__tests__/__helpers/aiToolContext.ts`:

```ts
import type { StepRunTaskIdentity } from "~/domain/review/getStaleStepRunReason.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import {
    AUTOMATION_STEP_ID,
    createRunningAutomationReview
} from "./stepRunReviews.js";
import { requester, toSaveData } from "./fixtures.js";

/** The task id the running test review carries, created by the requester (R148, R149). */
export const AI_TOOL_TASK: StepRunTaskIdentity = { id: "task-1", createdById: requester.id };

/**
 * What the AI runner hands a tool: the stored running review "review-1" (model "cms.article",
 * target "article-1", revision "article-1#0001"), its current step and the task that runs it.
 * Save `context.review` with `ReviewRepository.save` to make the stored review match.
 */
export const createAiToolContext = (): WorkflowAiTool.Context => {
    const review = toSaveData(createRunningAutomationReview());
    const step = review.steps.find(candidate => candidate.id === AUTOMATION_STEP_ID);
    if (!step) {
        throw new Error("The test review has no step to run.");
    }
    return { review, step, requester, task: AI_TOOL_TASK };
};
```

Create `packages/api-workflows/__tests__/__helpers/withoutBuiltInAiTools.ts`:

```ts
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";

/**
 * The rows of a list without `readTarget` and `updateTargetFields`. `WorkflowsFeature` registers
 * both in every test container (Task 10), so a test that counts or compares the tools it
 * registered itself filters the built-ins out.
 */
export const withoutBuiltInAiTools = <TTool extends { name: string }>(tools: TTool[]): TTool[] => {
    return tools.filter(tool => !BUILT_IN_AI_TOOL_NAMES.includes(tool.name));
};
```

Create `packages/api-workflows/__tests__/__helpers/RecordingStaleCheck.ts` (a `StepRunStaleCheckService` decorator that records whether the bypass was active while the check ran; the check must run outside it, R173):

```ts
import type { Result } from "@webiny/feature/api";
import type { ReviewPersistenceError } from "~/domain/review/errors.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";

/** `WorkflowBypassService.isActive()` at every `isStale` call. Clear it per test. */
export const staleCheckBypassStates: boolean[] = [];

class RecordingStaleCheckImpl implements StepRunStaleCheckService.Interface {
    public constructor(
        private bypass: WorkflowBypassService.Interface,
        private decoratee: StepRunStaleCheckService.Interface
    ) {}

    public async isStale(
        params: StepRunStaleCheckService.Params
    ): Promise<Result<boolean, ReviewPersistenceError>> {
        staleCheckBypassStates.push(this.bypass.isActive());
        return this.decoratee.isStale(params);
    }
}

export const RecordingStaleCheck = StepRunStaleCheckService.createDecorator({
    decorator: RecordingStaleCheckImpl,
    dependencies: [WorkflowBypassService]
});
```

Create `packages/api-workflows/__tests__/aiTools/ReadTargetTool.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewGet, reviewGetFaults } from "~tests/__helpers/FailingReviewGet.js";
import {
    FakeReviewTargetEditor,
    fakeEditor,
    resetFakeEditor
} from "~tests/__helpers/FakeReviewTargetEditor.js";
import { createAiToolContext } from "~tests/__helpers/aiToolContext.js";
import { AI_STEP_MAX_INPUT_CHARACTERS, READ_TARGET_TOOL_NAME } from "~/features/aiTools/constants.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";
import type { ReviewTargetEditor } from "~/features/review/ReviewTargetEditor/index.js";

const setup = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.register(FakeReviewTargetEditor);
            container.registerDecorator(FailingReviewGet);
        }
    });
    const tool = context.container.resolve(WorkflowAiToolRegistryService).get(READ_TARGET_TOOL_NAME);
    if (!tool) {
        throw new Error("The readTarget tool is not registered.");
    }
    return { tool, toolContext: createAiToolContext() };
};

/** A content whose `JSON.stringify` is exactly `length` characters long. */
const createContentOfLength = (length: number): ReviewTargetEditor.Content => {
    const empty: ReviewTargetEditor.Content = {
        title: "T",
        fields: [{ path: "body", label: "Body", type: "long-text", value: "", writable: true }]
    };
    const base = JSON.stringify(empty).length;
    return {
        ...empty,
        fields: [{ ...empty.fields[0], value: "x".repeat(length - base) }]
    };
};

describe("readTarget tool (R172, R173, R175)", () => {
    beforeEach(() => {
        resetFakeEditor();
        reviewGetFaults.mode = null;
        reviewGetFaults.reads = 0;
        loggedErrors.length = 0;
    });

    it("is named readTarget and takes no input", async () => {
        const { tool } = await setup();

        expect(tool.name).toBe("readTarget");
        expect(tool.title).toBe("Read target");
        expect(tool.inputSchema.safeParse({}).success).toBe(true);
        expect(tool.inputSchema.parse({ targetId: "forged", model: "cms.other" })).toEqual({});
    });

    it("reads the whole content with every field's path, label, type, value and writable", async () => {
        const { tool, toolContext } = await setup();

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({ ok: true, data: fakeEditor.content });
        expect(result.data).toEqual({
            title: "Article article-1",
            fields: [
                { path: "title", label: "Title", type: "text", value: "Hello", writable: true },
                {
                    path: "body",
                    label: "Body",
                    type: "long-text",
                    value: "Body text",
                    writable: true
                },
                {
                    path: "author",
                    label: "Author",
                    type: "ref",
                    value: { id: "author-1" },
                    writable: false
                }
            ]
        });
    });

    it("reads the review's own target and takes no id from the input (Review Focus 2)", async () => {
        const { tool, toolContext } = await setup();

        await tool.execute(
            {
                model: "cms.other",
                targetId: "forged-target",
                targetRevisionId: "forged-revision",
                reviewId: "forged-review"
            },
            toolContext
        );

        expect(fakeEditor.readCalls).toEqual([
            { model: "cms.article", targetId: "article-1", targetRevisionId: "article-1#0001" }
        ]);
    });

    it("reads no review and writes nothing", async () => {
        const { tool, toolContext } = await setup();

        await tool.execute({}, toolContext);

        expect(reviewGetFaults.reads).toBe(0);
        expect(fakeEditor.updateCalls).toEqual([]);
    });

    it("answers a content of exactly the input cap in full", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.content = createContentOfLength(AI_STEP_MAX_INPUT_CHARACTERS);

        const result = await tool.execute({}, toolContext);

        expect(JSON.stringify(fakeEditor.content)).toHaveLength(AI_STEP_MAX_INPUT_CHARACTERS);
        expect(result).toEqual({ ok: true, data: fakeEditor.content });
    });

    it("answers a content one character over the cap with the too-large text and no data (R175)", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.content = createContentOfLength(AI_STEP_MAX_INPUT_CHARACTERS + 1);

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({
            ok: false,
            error: "The content is too large for the AI review."
        });
        expect(result.data).toBeUndefined();
    });

    it("answers the editor's refusal text when the read fails", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.readFault = "fail";
        fakeEditor.faultMessage = "This content was not found.";

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({ ok: false, error: "This content was not found." });
        expect(loggedErrors).toEqual([]);
    });

    it("answers a fixed text and logs the real error when the editor throws (R87)", async () => {
        const { tool, toolContext } = await setup();
        fakeEditor.readFault = "throw";

        const result = await tool.execute({}, toolContext);

        expect(result).toEqual({ ok: false, error: "The target could not be read." });
        expect(JSON.stringify(result)).not.toContain("Storage threw");
        expect(loggedErrors).toHaveLength(1);
        expect(loggedErrors[0].message).toBe("The AI tool could not read the target.");
        expect(loggedErrors[0].fields).toEqual({
            error: expect.objectContaining({ message: "Storage threw." }),
            reviewId: "review-1",
            stepId: toolContext.step.id,
            taskId: "task-1"
        });
    });

    it("answers the cannot-be-edited text for a namespace with no editor", async () => {
        const { tool, toolContext } = await setup();

        const result = await tool.execute(
            {},
            { ...toolContext, review: { ...toolContext.review, model: "wb.page" } }
        );

        expect(result).toEqual({ ok: false, error: "This target cannot be edited." });
        expect(fakeEditor.readCalls).toEqual([]);
    });
});
```

Create `packages/api-workflows/__tests__/aiTools/UpdateTargetFieldsTool.test.ts`:

```ts
import { beforeEach, describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { captureLoggedErrors, loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { FailingReviewGet, reviewGetFaults } from "~tests/__helpers/FailingReviewGet.js";
import {
    RecordingStaleCheck,
    staleCheckBypassStates
} from "~tests/__helpers/RecordingStaleCheck.js";
import {
    FakeReviewTargetEditor,
    fakeEditor,
    holdFakeEditorUpdate,
    resetFakeEditor
} from "~tests/__helpers/FakeReviewTargetEditor.js";
import { createAiToolContext } from "~tests/__helpers/aiToolContext.js";
import { expectOk, requester } from "~tests/__helpers/fixtures.js";
import { Review } from "~/domain/review/Review.js";
import { ReviewRepository } from "~/domain/review/abstractions/ReviewRepository.js";
import { ReviewSaver } from "~/features/review/ReviewSaver/abstractions.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { UPDATE_TARGET_FIELDS_TOOL_NAME } from "~/features/aiTools/constants.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";

const LATER = "2026-10-09T11:00:00.000Z";

const setup = async () => {
    const { context } = await createContextHandler({
        setup: container => {
            captureLoggedErrors(container);
            container.register(FakeReviewTargetEditor);
            container.registerDecorator(FailingReviewGet);
            container.registerDecorator(RecordingStaleCheck);
        }
    });
    const tool = context.container
        .resolve(WorkflowAiToolRegistryService)
        .get(UPDATE_TARGET_FIELDS_TOOL_NAME);
    if (!tool) {
        throw new Error("The updateTargetFields tool is not registered.");
    }
    const repository = context.container.resolve(ReviewRepository);
    const saver = context.container.resolve(ReviewSaver);
    const toolContext = createAiToolContext();

    return {
        tool,
        toolContext,
        bypass: context.container.resolve(WorkflowBypassService),
        /** Stores the running review the context describes. */
        seed: async (): Promise<void> => {
            expectOk(await repository.save(toolContext.review));
            reviewGetFaults.reads = 0;
        },
        /** Cancels the stored review, as the requester would while the model runs. */
        cancel: async (): Promise<void> => {
            const review = Review.fromData(expectOk(await repository.get("review-1")));
            expectOk(review.cancel({ actor: requester, now: LATER }));
            expectOk(await saver.save(review));
            reviewGetFaults.reads = 0;
        },
        /** Restarts the step under another task, as the restart use case would. */
        moveToAnotherTask: async (): Promise<void> => {
            const data = expectOk(await repository.get("review-1"));
            data.steps[0].taskId = "task-new";
            expectOk(await repository.save(data));
            reviewGetFaults.reads = 0;
        }
    };
};

describe("updateTargetFields tool (R172, R173)", () => {
    beforeEach(() => {
        resetFakeEditor();
        reviewGetFaults.mode = null;
        reviewGetFaults.reads = 0;
        loggedErrors.length = 0;
        staleCheckBypassStates.length = 0;
    });

    describe("input", () => {
        it("is named updateTargetFields and takes only fields", async () => {
            const { tool } = await setup();

            expect(tool.name).toBe("updateTargetFields");
            expect(tool.title).toBe("Update target fields");
            expect(tool.inputSchema.safeParse({ fields: { title: "New" } }).success).toBe(true);
            expect(tool.inputSchema.safeParse({}).success).toBe(false);
            expect(tool.inputSchema.safeParse({ fields: "title" }).success).toBe(false);
            expect(
                tool.inputSchema.parse({
                    fields: { title: "New" },
                    targetId: "forged",
                    reviewId: "forged"
                })
            ).toEqual({ fields: { title: "New" } });
        });

        it("writes the review's own target and takes no id from the input (Review Focus 2)", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                {
                    fields: { title: "New title" },
                    model: "cms.other",
                    targetId: "forged-target",
                    targetRevisionId: "forged-revision",
                    reviewId: "forged-review"
                },
                toolContext
            );

            expect(result.ok).toBe(true);
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.updateCalls[0]).toMatchObject({
                model: "cms.article",
                targetId: "article-1",
                targetRevisionId: "article-1#0001",
                values: { title: "New title" }
            });
            expect(Object.keys(fakeEditor.updateCalls[0].values)).toEqual(["title"]);
        });

        it("writes nothing and says so when no fields are given", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute({ fields: {} }, toolContext);

            expect(result).toEqual({ ok: false, error: "No fields were given." });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(reviewGetFaults.reads).toBe(0);
        });
    });

    describe("result", () => {
        it("answers the applied paths and changes the content", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New title", body: "New body" } },
                toolContext
            );

            expect(result).toEqual({ ok: true, data: { applied: ["title", "body"] } });
            expect(fakeEditor.content.fields.map(field => field.value)).toEqual([
                "New title",
                "New body",
                { id: "author-1" }
            ]);
        });

        it("answers the editor's refusal text, writes nothing and does not fail the step", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New title", author: "x" } },
                toolContext
            );

            expect(result).toEqual({ ok: false, error: 'The field "author" cannot be written.' });
            expect(fakeEditor.content.fields[0].value).toBe("Hello");
            expect(loggedErrors).toEqual([]);
        });

        it("answers the editor's failure text when the target rejects a value", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            fakeEditor.updateFault = "fail";
            fakeEditor.faultMessage = 'The value of "title" is not valid.';

            const result = await tool.execute({ fields: { title: "" } }, toolContext);

            expect(result).toEqual({ ok: false, error: 'The value of "title" is not valid.' });
            expect(loggedErrors).toEqual([]);
        });

        it("answers a fixed text and logs the real error when the editor throws (R87)", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            fakeEditor.updateFault = "throw";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The target could not be updated." });
            expect(JSON.stringify(result)).not.toContain("Storage threw");
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe("The AI tool could not update the target.");
            expect(loggedErrors[0].fields).toEqual({
                error: expect.objectContaining({ message: "Storage threw." }),
                reviewId: "review-1",
                stepId: toolContext.step.id,
                taskId: "task-1"
            });
        });

        it("answers the cannot-be-edited text for a namespace with no editor", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New" } },
                { ...toolContext, review: { ...toolContext.review, model: "wb.page" } }
            );

            expect(result).toEqual({ ok: false, error: "This target cannot be edited." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });
    });

    describe("stale re-check (R173, R175, Review Focus 1)", () => {
        it("re-reads the stored review right before the write, outside the bypass", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result.ok).toBe(true);
            expect(reviewGetFaults.reads).toBe(1);
            expect(staleCheckBypassStates).toEqual([false]);
            expect(fakeEditor.updateCalls).toHaveLength(1);
        });

        it("writes nothing when the stored review was cancelled during the call", async () => {
            const { tool, toolContext, seed, cancel } = await setup();
            await seed();
            // `toolContext.review` is the snapshot the run started with: it still looks running.
            await cancel();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(fakeEditor.content.fields[0].value).toBe("Hello");
        });

        it("writes nothing when the step was restarted under a new task", async () => {
            const { tool, toolContext, seed, moveToAnotherTask } = await setup();
            await seed();
            await moveToAnotherTask();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });

        it("writes nothing when the review was deleted", async () => {
            const { tool, toolContext } = await setup();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(loggedErrors).toEqual([]);
        });

        it("writes nothing for a task that does not own the step", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New" } },
                { ...toolContext, task: { id: "task-old", createdById: requester.id } }
            );

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });

        it("writes nothing for a task somebody else created", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const result = await tool.execute(
                { fields: { title: "New" } },
                { ...toolContext, task: { id: "task-1", createdById: "user-intruder" } }
            );

            expect(result).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toEqual([]);
        });

        it("checks again for every write: a write after a cancel writes nothing", async () => {
            const { tool, toolContext, seed, cancel } = await setup();
            await seed();

            const first = await tool.execute({ fields: { title: "First" } }, toolContext);
            await cancel();
            const second = await tool.execute({ fields: { body: "Second" } }, toolContext);

            expect(first).toEqual({ ok: true, data: { applied: ["title"] } });
            expect(second).toEqual({ ok: false, error: "The review step is no longer running." });
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.content.fields.map(field => field.value)).toEqual([
                "First",
                "Body text",
                { id: "author-1" }
            ]);
        });

        it("refuses and writes nothing when the stored review cannot be read, and does not log again", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            reviewGetFaults.mode = "fail";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({
                ok: false,
                error: "The step could not be checked; nothing was written."
            });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(fakeEditor.content.fields[0].value).toBe("Hello");
            // The service logged the failed read once; the tool adds no second log.
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(
                "Could not read the review to check the step is current."
            );
        });

        it("refuses and writes nothing when the read of the stored review throws", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            reviewGetFaults.mode = "throw";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({
                ok: false,
                error: "The step could not be checked; nothing was written."
            });
            expect(fakeEditor.updateCalls).toEqual([]);
            expect(loggedErrors).toHaveLength(1);
            expect(loggedErrors[0].message).toBe(
                "Could not read the review to check the step is current."
            );
        });

        it("refuses a second write once the check starts failing after a first write landed", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();

            const first = await tool.execute({ fields: { title: "First" } }, toolContext);
            reviewGetFaults.mode = "fail";
            const second = await tool.execute({ fields: { body: "Second" } }, toolContext);

            expect(first).toEqual({ ok: true, data: { applied: ["title"] } });
            expect(second).toEqual({
                ok: false,
                error: "The step could not be checked; nothing was written."
            });
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.content.fields.map(field => field.value)).toEqual([
                "First",
                "Body text",
                { id: "author-1" }
            ]);
        });
    });

    describe("bypass (R173, D36, D62, R150, Review Focus 4)", () => {
        it("is active inside the awaited write and inactive right after update returns", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result.ok).toBe(true);
            expect(fakeEditor.updateCalls).toHaveLength(1);
            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(fakeEditor.updateCalls[0].bypassActiveAfterAwait).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("is inactive right after update returns a refusal", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();

            const result = await tool.execute({ fields: { author: "x" } }, toolContext);

            expect(result.ok).toBe(false);
            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("is inactive right after update throws", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();
            fakeEditor.updateFault = "throw";

            const result = await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(result).toEqual({ ok: false, error: "The target could not be updated." });
            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(fakeEditor.updateCalls[0].bypassActiveAfterAwait).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("is never active when nothing is written (stale)", async () => {
            const { tool, toolContext, bypass } = await setup();

            await tool.execute({ fields: { title: "New" } }, toolContext);

            expect(fakeEditor.updateCalls).toEqual([]);
            expect(staleCheckBypassStates).toEqual([false]);
            expect(bypass.isActive()).toBe(false);
        });

        it("is not active for a save started outside the tool while the update is in flight", async () => {
            const { tool, toolContext, seed, bypass } = await setup();
            await seed();
            const held = holdFakeEditorUpdate();

            const pending = tool.execute({ fields: { title: "New" } }, toolContext);
            await held.started;
            // Work started outside the tool, e.g. a save by a user, while the update is in flight.
            const outside = await Promise.resolve().then(() => bypass.isActive());
            const outsideDeferred = await new Promise<boolean>(resolve => {
                setTimeout(() => resolve(bypass.isActive()), 0);
            });

            expect(fakeEditor.updateCalls[0].bypassActiveAtStart).toBe(true);
            expect(outside).toBe(false);
            expect(outsideDeferred).toBe(false);
            expect(bypass.isActive()).toBe(false);

            held.release();
            const result = await pending;

            expect(result.ok).toBe(true);
            expect(bypass.isActive()).toBe(false);
        });

        it("awaits the update inside bypass.run: the tool does not answer before the write finished", async () => {
            const { tool, toolContext, seed } = await setup();
            await seed();
            const held = holdFakeEditorUpdate();
            let answered = false;

            const pending = tool.execute({ fields: { title: "New" } }, toolContext).then(result => {
                answered = true;
                return result;
            });
            await held.started;
            await new Promise<void>(resolve => {
                setTimeout(resolve, 0);
            });

            expect(answered).toBe(false);
            expect(fakeEditor.updateCalls[0].finished).toBe(false);

            held.release();
            const result = await pending;

            expect(answered).toBe(true);
            expect(fakeEditor.updateCalls[0].finished).toBe(true);
            expect(fakeEditor.updateCalls[0].bypassActiveAfterAwait).toBe(true);
            expect(result).toEqual({ ok: true, data: { applied: ["title"] } });
        });
    });
});
```

Create `packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import zod from "zod";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { isWorkflowAiToolName } from "~/domain/aiTools/isWorkflowAiToolName.js";
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "~/features/aiTools/WorkflowAiToolRegistryService/index.js";

const customInputSchema = zod.object({});

describe("built-in AI tools (R173)", () => {
    it("registers exactly readTarget and updateTargetFields", async () => {
        const { context } = await createContextHandler();

        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(BUILT_IN_AI_TOOL_NAMES).toEqual(["readTarget", "updateTargetFields"]);
        expect(registry.list().map(tool => tool.name)).toEqual(["readTarget", "updateTargetFields"]);
        expect(context.container.resolveAll(WorkflowAiTool)).toHaveLength(2);
    });

    it("gives both a valid provider tool name, a title and a description for the model", async () => {
        const { context } = await createContextHandler();

        const tools = context.container.resolve(WorkflowAiToolRegistryService).list();

        for (const tool of tools) {
            expect(isWorkflowAiToolName(tool.name)).toBe(true);
            expect(tool.title.length).toBeGreaterThan(0);
            expect(tool.description.length).toBeGreaterThan(0);
        }
        expect(tools.map(tool => tool.title)).toEqual(["Read target", "Update target fields"]);
    });

    it("keeps a custom tool next to them and lets it replace one by name (A61)", async () => {
        const { context } = await createContextHandler({
            setup: container => {
                container.registerInstance(WorkflowAiTool, {
                    name: "readTarget",
                    title: "Custom read",
                    description: "A replacement.",
                    inputSchema: customInputSchema,
                    execute: async () => ({ ok: true })
                });
            }
        });

        const registry = context.container.resolve(WorkflowAiToolRegistryService);

        expect(registry.get("readTarget")?.title).toBe("Custom read");
        expect(registry.get("updateTargetFields")?.title).toBe("Update target fields");
        expect(registry.list().map(tool => tool.name)).toEqual(["readTarget", "updateTargetFields"]);
    });
});
```

Modify `packages/api-workflows/__tests__/registration.test.ts`. Task 7 added the lines (the comment and the `WorkflowAiTool` count); replace them with:

```ts
        // The AI tool registry and the two built-in tools (Task 10)
        expect(container.resolveAll(WorkflowAiToolRegistryService)).toHaveLength(1);
        expect(container.resolveAll(WorkflowAiTool)).toHaveLength(2);
```

Modify `packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts` (Task 7). The built-ins are in every container now, so the assertions that compared the whole list filter them. Add the import:

```ts
import { withoutBuiltInAiTools } from "~tests/__helpers/withoutBuiltInAiTools.js";
```

and make these replacements:

- In "is empty when no tool is registered", replace `expect(registry.list()).toEqual([]);` with `expect(withoutBuiltInAiTools(registry.list())).toEqual([]);`.
- In the tests "returns registered tools by name, in registration order", "returns the last registration per name and keeps its place in the list (A61)" and "drops a tool whose name is not a valid provider tool name, logs it once and keeps the others (R87)", replace every `expect(registry.list().map(tool => tool.name)).toEqual([TEST_AI_TOOL_NAME, "otherTool"]);` with `expect(withoutBuiltInAiTools(registry.list()).map(tool => tool.name)).toEqual([TEST_AI_TOOL_NAME, "otherTool"]);`.
- In "accepts a 64 character name and drops a 65 character one", replace
  ```ts
          const acceptedTools = accepted.context.container
              .resolve(WorkflowAiToolRegistryService)
              .list();
  ```
  with
  ```ts
          const acceptedTools = withoutBuiltInAiTools(
              accepted.context.container.resolve(WorkflowAiToolRegistryService).list()
          );
  ```
  and `expect(refusedRegistry.list()).toEqual([]);` with `expect(withoutBuiltInAiTools(refusedRegistry.list())).toEqual([]);`.

Modify `packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts` (Task 8). Add the imports:

```ts
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
import { withoutBuiltInAiTools } from "~tests/__helpers/withoutBuiltInAiTools.js";
```

and make these replacements:

- Replace the test "lists nothing when no tool is registered" with:
  ```ts
      it("lists only the built-in tools when no other tool is registered (Task 10)", async () => {
          const { listAiTools } = await createListContext({
              permissions: [{ name: "workflows", editor: true }]
          });

          const rows = expectOk(await listAiTools.execute());

          expect(rows.map(row => row.name)).toEqual(BUILT_IN_AI_TOOL_NAMES);
          expect(rows.map(row => row.title)).toEqual(["Read target", "Update target fields"]);
          expect(withoutBuiltInAiTools(rows)).toEqual([]);
      });
  ```
- In the tests "lists name, title and description only, with no schema", "sorts the rows by title, then by name", "lists a replaced tool once, with the last registration's texts (A61)" and "skips a tool with an invalid name without an error (R167, R87)", replace every `const rows = expectOk(await listAiTools.execute());` with `const rows = withoutBuiltInAiTools(expectOk(await listAiTools.execute()));`.

Modify `packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts` (Task 8). Add the imports:

```ts
import { BUILT_IN_AI_TOOL_NAMES } from "~/features/aiTools/constants.js";
import { withoutBuiltInAiTools } from "~tests/__helpers/withoutBuiltInAiTools.js";
```

and replace the two result tests:

- In "lists the AI tools by title, with no schema (R167, R176)", replace the final assertion
  ```ts
          expect(response.data.workflows.listAiTools).toEqual({
              data: [
                  { name: TEST_AI_TOOL_NAME, title: "Alpha", description: "A tool for tests." },
                  { name: "zuluTool", title: "Zulu", description: "A tool for tests." }
              ],
              error: null
          });
  ```
  with
  ```ts
          const envelope = response.data.workflows.listAiTools;

          expect(envelope.error).toBeNull();
          expect(withoutBuiltInAiTools(envelope.data ?? [])).toEqual([
              { name: TEST_AI_TOOL_NAME, title: "Alpha", description: "A tool for tests." },
              { name: "zuluTool", title: "Zulu", description: "A tool for tests." }
          ]);
  ```
- Replace the test "lists no AI tools when none is registered" with:
  ```ts
      it("lists only the built-in AI tools when no other is registered", async () => {
          const api = await createApi({ permissions: EDITOR });

          const [response] = await api.listAiTools();

          const envelope = response.data.workflows.listAiTools;
          expect(envelope.error).toBeNull();
          expect((envelope.data ?? []).map(row => row.name)).toEqual(BUILT_IN_AI_TOOL_NAMES);
      });
  ```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/api-workflows/__tests__/aiTools/ReadTargetTool.test.ts packages/api-workflows/__tests__/aiTools/UpdateTargetFieldsTool.test.ts packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts 2>&1 | tail -50`
Expected: FAIL. `READ_TARGET_TOOL_NAME`, `UPDATE_TARGET_FIELDS_TOOL_NAME` and `BUILT_IN_AI_TOOL_NAMES` are not exported by `~/features/aiTools/constants.js`, and no tool is registered (`The readTarget tool is not registered.`).

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/aiTools/ReadTargetTool.test.ts packages/api-workflows/__tests__/aiTools/UpdateTargetFieldsTool.test.ts packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts 2>&1 | tail -50`
Expected: the same failure.

- [ ] **Step 3: Implement**

Modify `packages/api-workflows/src/features/aiTools/constants.ts` (Task 7 created it with `AI_STEP_MAX_INPUT_CHARACTERS`). Append:

```ts
/** The built-in tools (R173); a step allowlists them like any other tool. */
export const READ_TARGET_TOOL_NAME = "readTarget";
export const UPDATE_TARGET_FIELDS_TOOL_NAME = "updateTargetFields";
export const BUILT_IN_AI_TOOL_NAMES = [READ_TARGET_TOOL_NAME, UPDATE_TARGET_FIELDS_TOOL_NAME];

/**
 * Fixed texts the tools answer to the model (R87: never a provider or storage error). The AI
 * runner (Task 19) also fails a step over the input cap with the first one.
 */
export const AI_STEP_CONTENT_TOO_LARGE_MESSAGE = "The content is too large for the AI review.";
export const AI_TOOL_STEP_NOT_RUNNING_MESSAGE = "The review step is no longer running.";
export const AI_TOOL_STEP_CHECK_FAILED_MESSAGE =
    "The step could not be checked; nothing was written.";
export const AI_TOOL_NO_FIELDS_MESSAGE = "No fields were given.";
```

Create `packages/api-workflows/src/features/aiTools/ReadTargetTool/ReadTargetTool.ts`:

```ts
import zod from "zod";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_STEP_MAX_INPUT_CHARACTERS,
    READ_TARGET_TOOL_NAME
} from "~/features/aiTools/constants.js";

const readTargetInputSchema = zod.object({});

type ReadTargetInput = zod.infer<typeof readTargetInputSchema>;

/**
 * Built-in tool (R173): the content under review, every field with `writable` (R172). It takes no
 * input: the target comes from the review snapshot in the context, never from the model (Review
 * Focus 2). Reads only; no stale check and no bypass.
 */
class ReadTargetToolImpl implements WorkflowAiTool.Interface<ReadTargetInput> {
    public readonly name = READ_TARGET_TOOL_NAME;
    public readonly title = "Read target";
    public readonly description =
        "Reads the content under review: its title and every field with its path, label, type, current value and whether it can be written. Takes no input. Call it before updateTargetFields, and use the paths it returns.";
    public readonly inputSchema = readTargetInputSchema;

    public constructor(
        private editors: ReviewTargetEditorService.Interface,
        private logger: Logger.Interface
    ) {}

    public async execute(
        _input: ReadTargetInput,
        context: WorkflowAiTool.Context
    ): Promise<WorkflowAiTool.Result> {
        try {
            const result = await this.editors.read({
                model: context.review.model,
                targetId: context.review.targetId,
                targetRevisionId: context.review.targetRevisionId
            });
            if (result.isFail()) {
                return { ok: false, error: result.error.message };
            }
            // Never truncate: the model must not decide on content it did not see (R175).
            if (JSON.stringify(result.value).length > AI_STEP_MAX_INPUT_CHARACTERS) {
                return { ok: false, error: AI_STEP_CONTENT_TOO_LARGE_MESSAGE };
            }
            return { ok: true, data: result.value };
        } catch (error) {
            this.logger.error(
                {
                    error,
                    reviewId: context.review.id,
                    stepId: context.step.id,
                    taskId: context.task.id
                },
                "The AI tool could not read the target."
            );
            return { ok: false, error: "The target could not be read." };
        }
    }
}

export const ReadTargetTool = WorkflowAiTool.createImplementation({
    implementation: ReadTargetToolImpl,
    dependencies: [ReviewTargetEditorService, Logger]
});
```

Create `packages/api-workflows/src/features/aiTools/UpdateTargetFieldsTool/UpdateTargetFieldsTool.ts`:

```ts
import zod from "zod";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowBypassService } from "~/features/bypass/WorkflowBypassService/index.js";
import { ReviewTargetEditorService } from "~/features/review/ReviewTargetEditorService/index.js";
import { StepRunStaleCheckService } from "~/features/stepRun/StepRunStaleCheckService/index.js";
import { WorkflowAiTool } from "~/features/aiTools/WorkflowAiTool/abstractions.js";
import {
    AI_TOOL_NO_FIELDS_MESSAGE,
    AI_TOOL_STEP_CHECK_FAILED_MESSAGE,
    AI_TOOL_STEP_NOT_RUNNING_MESSAGE,
    UPDATE_TARGET_FIELDS_TOOL_NAME
} from "~/features/aiTools/constants.js";

const updateTargetFieldsInputSchema = zod.object({
    fields: zod.record(zod.string(), zod.unknown())
});

type UpdateTargetFieldsInput = zod.infer<typeof updateTargetFieldsInputSchema>;

/**
 * Built-in tool (R173): the only writer of the content under review. The target comes from the
 * review snapshot in the context, never from the model (Review Focus 2). Order: re-check that the
 * step still belongs to this task by re-reading the STORED review (a cancel, a delete or a restart
 * during the model call, Review Focus 1); fail-closed: when the check itself fails (the stored
 * review could not be read; the service already logged it) nothing is written; then write through the target editor inside the bypass
 * with the write awaited inside `run` (`AsyncLocalStorage`: inactive the moment `update` returns or
 * throws, never active for a save outside the tool, Review Focus 4). Which paths may be written is
 * the adapter's rule (R172); a refusal or a throw is a tool answer and never fails the step.
 */
class UpdateTargetFieldsToolImpl implements WorkflowAiTool.Interface<UpdateTargetFieldsInput> {
    public readonly name = UPDATE_TARGET_FIELDS_TOOL_NAME;
    public readonly title = "Update target fields";
    public readonly description =
        "Changes fields of the content under review. Send fields as an object: each key is a field path returned by readTarget (only fields marked writable) and each value is the new value. Fields you do not list stay unchanged. The change is saved immediately; if any path is refused nothing is written and you get the reason.";
    public readonly inputSchema = updateTargetFieldsInputSchema;

    public constructor(
        private editors: ReviewTargetEditorService.Interface,
        private staleCheck: StepRunStaleCheckService.Interface,
        private bypass: WorkflowBypassService.Interface,
        private logger: Logger.Interface
    ) {}

    public async execute(
        input: UpdateTargetFieldsInput,
        context: WorkflowAiTool.Context
    ): Promise<WorkflowAiTool.Result> {
        if (Object.keys(input.fields).length === 0) {
            return { ok: false, error: AI_TOOL_NO_FIELDS_MESSAGE };
        }
        try {
            // Right before the write, outside the bypass. The snapshot in `context.review` is the
            // review as the run started with it, so the stored one is read (R175).
            const stale = await this.staleCheck.isStale({
                reviewId: context.review.id,
                stepId: context.step.id,
                task: context.task
            });
            if (stale.isFail()) {
                // The service logged it; refuse instead of writing on an unverified step.
                return { ok: false, error: AI_TOOL_STEP_CHECK_FAILED_MESSAGE };
            }
            if (stale.value) {
                return { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE };
            }

            // The write is awaited INSIDE `run`: the scope ends with the callback's promise.
            const result = await this.bypass.run(() =>
                this.editors.update({
                    model: context.review.model,
                    targetId: context.review.targetId,
                    targetRevisionId: context.review.targetRevisionId,
                    values: input.fields
                })
            );
            if (result.isFail()) {
                return { ok: false, error: result.error.message };
            }
            return { ok: true, data: { applied: result.value.applied } };
        } catch (error) {
            this.logger.error(
                {
                    error,
                    reviewId: context.review.id,
                    stepId: context.step.id,
                    taskId: context.task.id
                },
                "The AI tool could not update the target."
            );
            return { ok: false, error: "The target could not be updated." };
        }
    }
}

export const UpdateTargetFieldsTool = WorkflowAiTool.createImplementation({
    implementation: UpdateTargetFieldsToolImpl,
    dependencies: [ReviewTargetEditorService, StepRunStaleCheckService, WorkflowBypassService, Logger]
});
```

Create `packages/api-workflows/src/features/aiTools/BuiltInAiToolsFeature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { ReadTargetTool } from "./ReadTargetTool/ReadTargetTool.js";
import { UpdateTargetFieldsTool } from "./UpdateTargetFieldsTool/UpdateTargetFieldsTool.js";

/** The two built-in AI tools (R173); a step must allowlist them like any other tool. */
export const BuiltInAiToolsFeature = createFeature({
    name: "Workflows/BuiltInAiTools",
    register(container) {
        container.register(ReadTargetTool);
        container.register(UpdateTargetFieldsTool);
    }
});
```

In `packages/api-workflows/src/WorkflowsFeature.ts` add the import next to the `WorkflowAiToolRegistryFeature` import:

```ts
import { BuiltInAiToolsFeature } from "~/features/aiTools/BuiltInAiToolsFeature.js";
```

and register it directly after the registry feature:

```ts
        // AI tools an AI step may allowlist (R167)
        WorkflowAiToolRegistryFeature.register(container);
        // The built-in tools readTarget and updateTargetFields (R173)
        BuiltInAiToolsFeature.register(container);
```

(Task 7 left the comment `// AI tools an AI step may allowlist (R167); the built-ins arrive with Task 10` above the registry line; replace it with the first comment above.)

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-workflows/__tests__/aiTools/ReadTargetTool.test.ts packages/api-workflows/__tests__/aiTools/UpdateTargetFieldsTool.test.ts packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/aiTools/ReadTargetTool.test.ts packages/api-workflows/__tests__/aiTools/UpdateTargetFieldsTool.test.ts packages/api-workflows/__tests__/aiTools/BuiltInAiTools.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p api-workflows --report cli 2>&1 | tail -40`
Expected: no errors.

If `check:test:types` complains about `createImplementation` variance for the tool classes, use the same cast pattern as Task 7's `TestWorkflowAiTool` helper (`tool as WorkflowAiTool.Interface`, see `registerTestAiTool`).

- [ ] **Step 5: Run the existing tests covering the changed code**

Every `WorkflowsFeature` container now holds two tools, so the Task 7 and Task 8 files and the registration test (all modified above) and the files that read the registry must stay green:

Run: `yarn test packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts 2>&1 | tail -50`
Expected: PASS.

Run the same files with `yarn test:os` (one run at a time):
`yarn test:os packages/api-workflows/__tests__/aiTools/WorkflowAiToolRegistryService.test.ts packages/api-workflows/__tests__/aiTools/isWorkflowAiToolName.test.ts packages/api-workflows/__tests__/config/ListWorkflowAiTools.test.ts packages/api-workflows/__tests__/graphql/workflowsSchema.test.ts packages/api-workflows/__tests__/registration.test.ts packages/api-workflows/__tests__/review/ReviewTargetEditorService.test.ts packages/api-workflows/__tests__/stepRun/StepRunStaleCheckService.test.ts packages/api-workflows/__tests__/bypass/WorkflowBypassService.test.ts 2>&1 | tail -50`
Expected: PASS.

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows` with `--no-cache`, restore `.gitleaks.toml`), then commit:

```
git commit -m "feat(api-workflows): add the readTarget and updateTargetFields AI tools" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn"
```
