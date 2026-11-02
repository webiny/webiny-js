### Task 19: `AiStepRunner` and the `ai` step type registration

Spec 7.3, 7.4; D7, D27, D36, D39, D40, D55, D100, D101, D109, D132; R87, R161, R168, R170, R171, R174, R175, R177, R178; A56, A58, A59; Review Focus 1 (a stale AI result lands after cancel or restart: the throttle, the sticky answer, "writes nothing"), Review Focus 2 (the allowlist is the tool set; an unparsable decision fails, a reject needs a comment) and Review Focus 6 (no `ai` step type without both flags). `AiStepRunner` is the `StepRunner` (Task 3) for `ai` steps. The handler (Tasks 3 and 4) owns everything shared (read, guard, id wait, identity, the pre-run `{ idWaits, state }` write for `singleRun`, the timeout signal, the post-run re-guard, applying the outcome through the base approve and reject use cases with `actor: runner.getActor(requester)`, the one failure path); this runner owns the model call.

`run(params)` (`StepRunner.Params`: `review`, `step`, `requester`, `task`, `iteration`, `state`, `signal`) in this order. Every failure is a thrown `StepRunFailure` with a fixed R170 text; raw errors are logged and never stored or sent to the model:

1. **`iteration` above 1** fails with `failureReasons.error` before anything else, no model call (defence in depth: the handler already refuses a re-entered `singleRun` task, R170). One info log.
2. **An already aborted `signal`** (the handler fires it at once when the task's remaining runtime is nearly gone, R175) fails with `The AI review timed out.` before any model call.
3. **Config** (`aiStepConfigSchema`, Task 17) no longer parses: `The AI step configuration is not valid.`
4. **Tool allowlist:** every name in `config.tools` must be known to `WorkflowAiToolRegistryService.get(name)`, else `The AI tool "<name>" is not available.` The tool set of the call is exactly these registered tools: a registered tool the step does not allowlist is not in it (Review Focus 2).
5. **Capability:** `ResolveAiCapabilityUseCase.execute(WORKFLOWS_REVIEW_CAPABILITY_ID, config.model)` (Task 15). A failed Result maps to a fixed text: `AiModelNotAvailableError` to `The model "<model>" is not available.` (not logged: a typed, expected state); `AiCapabilityDisabledError` to `The AI review capability is not available.` (not logged: a decision someone made, D40); every other failed Result (settings unresolved, unknown capability, a failed `ConfiguredAiModelsService` read) to `The AI review capability is not available.` plus one `Logger.error({ error, taskId, reviewId, stepId }, "Could not resolve the AI review capability.")` with the raw error (the same split as Task 17's `reach`). This is the accepted double log: when the failure is a failed settings read inside `ConfiguredAiModelsService` (`findConnection`), that service logs it too, so the run produces exactly 2 error logs (service plus runner; Task 17 pins the same count for `reach`). A resolver that throws is caught by step 14 (one log, `The AI review failed.`). The raw message never reaches the step.
6. **Target:** `ReviewTargetEditorService.read` with `review.model`, `review.targetId` and `review.targetRevisionId` from the snapshot (never from config or the model). A failed Result is `failureReasons.error` plus one info log with the adapter's text (adapters log real errors themselves, Task 9).
7. **Prompt:** the previous comments are the comments of the steps before this one in `review.steps` that are `approved` or `rejected` and carry a non-blank comment (a failed step's `comment` is its failure reason and is left out); `buildAiStepPrompt` (Task 18) with the capability's `guidance` and `additionalInstructions`. **Input cap (R175):** `exceedsAiInputLimit(prompt)` fails with `AI_STEP_CONTENT_TOO_LARGE_MESSAGE` (`The content is too large for the AI review.`, Task 10's constant, the same text `readTarget` answers; bindings and every other field are kept in full, nothing is truncated) before any model call. This is the one over-cap path: an oversized target (CMS, or a Website Builder page with large bindings) fails the step here.
8. **The call:** `Ai.generateText({ model, connection, system, prompt, tools, stopWhen, abortSignal: signal, output })` with `output: Output.object({ schema: aiReviewOutputSchema, name: "decision" })` (AI SDK structured output), `model` and `connection` from the resolved capability, `tools` an AI SDK `ToolSet` built inline in `run` from the allowlisted registry tools (plain `{ description, inputSchema, execute }` entries, the pattern `AiSdkTools` uses; never the global `AiSdkTools`, D55), and `stopWhen: [stepCountIs(AI_STEP_MAX_TOOL_STEPS), <stale stop>]`. Without allowlisted tools neither `tools` nor `stopWhen` is passed. Each tool's `execute` runs the throttled stale check (below); when stale it returns `{ ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE }` and does not call the tool (writes nothing, in addition to `updateTargetFields`' own re-guard, R173); otherwise it calls `workflowTool.execute(input, { review, step, requester, task })` (the tool context of Task 7: nothing from the model's input is a target, revision, review or step id) and returns the `WorkflowAiToolResult` as it is. A tool that throws (a custom tool; the built-ins never do, R87) is logged and answered with `{ ok: false, error: 'The tool "<name>" failed.' }`: the SDK would otherwise hand the raw message to the model.
9. **Stale check (R175, A56, Review Focus 1).** `StepRunStaleCheckService.isStale({ reviewId, stepId, task })` (Task 4: one repository read, `Result<boolean, ReviewPersistenceError>`, fail-closed, logs its own failures) is called inline in `stopWhen` and before every tool execution, throttled by one local closure per run (`checkStale`, inline in `run`, holding `lastStaleCheckAt`, the sticky `stale` flag and the in-flight read promise; it compares the interval and calls the injected `StepRunStaleCheckService` inline, no helper around it) to one read per `STEP_RUN_STALE_CHECK_INTERVAL_MS` (5000, `Date.now()`; the first call reads at once) and sticky: the `stale` flag, once true, stays true and no further read is made. Parallel tool calls share the read: a caller that arrives while a read is in flight awaits it and gets its answer, so two parallel calls never both run on a stale review. Both the tools' `execute` and the stop condition use this one closure. A failed Result counts as not stale and the call keeps going; an unexpected throw from the read is caught inside the closure, logged once (`Could not check whether the AI step is still running.`) and also counts as not stale, so it never reaches the AI SDK (R87) (the post-run guard still protects the handler's own write); the failed read still uses its slot of the interval. The check only sets the flag: `stopWhen` returns it, a tool that sees it writes nothing. There is no `onStepFinish` (the SDK swallows its throws).
10. **After the call, before reading any output:** if `stale` is set, throw `StepRunFailure(failureReasons.aborted)` (`The AI review was aborted.`), whether `generateText` returned or threw. A stopped call has no output and reading it throws `NoOutputGeneratedError`. The handler's post-run guard then writes nothing for the stale step.
11. **Call failures** (no result): `signal.aborted` is `The AI review timed out.` (not logged as an error); an AI SDK `NoObjectGeneratedError` or `NoOutputGeneratedError` is `The AI review returned no decision.`; anything else (provider error, bad key, tool setup error) is logged once with the raw error and is `failureReasons.error` (`The AI review failed.`).
12. **Output:** reading `result.output` throwing `NoOutputGeneratedError` is `The AI review did not finish in <AI_STEP_MAX_TOOL_STEPS> steps.` when the last step still had tool calls and the step count reached the cap, else `The AI review returned no decision.`; an output that does not pass `aiReviewOutputSchema.safeParse` is `The AI review returned no decision.`
13. **Outcome (R171):** `approved: true` returns `{ type: "approved", comment, issues }` (`comment` trimmed, left out when blank); `approved: false` needs the trimmed comment at least `REJECT_COMMENT_MIN_LENGTH` (10) characters or the step fails with `The AI review rejected without a comment.` (D100), else `{ type: "rejected", comment, issues }`. `issues` is `normalizeAiIssues(decision.issues)` (Task 18, at most 50, clamped); when the model sent more than `AI_STEP_MAX_ISSUES`, one info log. The runner never returns `continue` (`singleRun` is `true`, A56) and never writes: the handler applies the outcome after its own re-guard.
14. An unexpected throw anywhere above is logged with the raw error and fails with `failureReasons.error` (R87: nothing rejects into the handler but a `StepRunFailure`).

**Failure texts (R170, one source).** The four texts the runner shares with Task 17's `reach` (invalid configuration, tool not available, model not available, capability not available) and the two `reach` also uses (`The AI review failed.`, `The AI review could not be started.`) live in Task 17's `~/api/features/WorkflowReview/aiFailureReasons.ts` (`AI_STEP_INVALID_CONFIGURATION_REASON`, `aiToolNotAvailableReason(name)`, `aiModelNotAvailableReason(model)`, `AI_CAPABILITY_NOT_AVAILABLE_REASON`, `AI_REVIEW_FAILED_REASON`, `AI_REVIEW_NOT_STARTED_REASON`); the runner imports them and keeps no copy. This task's `aiRunFailureReasons.ts` holds only the runner-only texts: timed out, no decision, rejected without a comment, step limit.

`type` is `AI_STEP_TYPE`, `singleRun` is `true`, `failureReasons` are `{ error: AI_REVIEW_FAILED_REASON ("The AI review failed."), aborted: "The AI review was aborted.", stuck: "The AI review task ended without a result." }`, `maxIterationsReason()` is `The AI review failed.` (the task is one iteration, A56), `getActor` is `getAiActor` (Task 1).

**Registration (R177, R178, Review Focus 6).** `Extension.ts` registers `AiStepType` (Task 17) and `AiStepRunnerFeature` together, last, inside the combined gate Task 16 built (`aiPowerups` and `advancedPublishingWorkflow` both on), so no workflow can save an AI step that the runner cannot run, and with workflows off no `ai` step type or runner exists. With the type registered the `listStepTypes` ai row comes from the registry (R166); the api-workflows test "lets a registered ai type replace the placeholder row without reading the flag" (`ListWorkflowStepTypes.test.ts`) already pins that, so no api-workflows test changes. Task 16's `WorkflowReviewRegistration.test.ts` pinned "does not register the ai step type yet": this task changes that one assertion (an intended change) and adds the flag matrix.

Pinned by tests: the fixed members; every failure before the call (iteration, signal, config, tool, capability and model mapping: no log for a model that is not available or a disabled capability, one error log for any other failed Result and for a throwing resolver; target read, cap) with no model call; the call arguments (model, connection, system, prompt, signal, the allowlisted tool set only, no tools and no stop conditions without tools, the tool context, tool results back to the model, a throwing tool, duplicate allowlist names collapse to one tool, an owner-less previous step reads "(no name)"); the outcome mapping (approve, reject, short or blank reject comment, issues clamped, dropped and logged); every decision failure (no output, invalid output, step cap, provider error with no secret in the reason, timeout); and, with fake `Date`, the throttle (one read per interval), the sticky answer, two parallel tool calls on a stale answer (one read, neither tool runs), a failed read keeps going, a cancel and a restart during the call (the stored review is flipped by the scripted model, the next tool call writes nothing and the run fails with the aborted reason), the throw path, and no reads without tools.

**Files:**
- Create: `packages/ai-powerups/src/api/features/WorkflowReview/AiStepRunner/aiRunFailureReasons.ts` (runner-only texts; the shared ones come from Task 17's `aiFailureReasons.ts`)
- Create: `packages/ai-powerups/src/api/features/WorkflowReview/AiStepRunner/AiStepRunner.ts`
- Create: `packages/ai-powerups/src/api/features/WorkflowReview/AiStepRunner/feature.ts`
- Modify: `packages/ai-powerups/src/api/Extension.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/ScriptedAi.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/aiRunReviews.ts` (only the run-state additions on top of Task 17's `aiStepFixtures.ts`)
- Create: `packages/ai-powerups/__tests__/__helpers/RecordingAiTool.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/AiStepRunnerHarness.ts`
- Create: `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunner.test.ts`
- Create: `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunnerStale.test.ts`
- Modify: `packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowReviewRegistration.test.ts` (Task 16: imports, stubs in `createContainer`, the last test replaced, two tests added)

**Interfaces:**
- Consumes:
  - Task 1: `getAiActor(requester: Actor): Actor` (`@webiny/api-workflows/domain/ai/getAiActor.js`), `AI_STEP_TYPE` (`@webiny/api-workflows/domain/workflow/stepTypes.js`).
  - Task 3: `StepRunner` (`@webiny/api-workflows/features/stepRun/StepRunner/index.js`; namespace `Interface`, `Outcome`, `Params`, `FailureReasons`), `StepRunFailure` (`@webiny/api-workflows/features/stepRun/StepRunFailure.js`, `reason`).
  - Task 4: `StepRunStaleCheckService` (`@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js`; `isStale(params: { reviewId; stepId; task: StepRunTaskIdentity }): Promise<Result<boolean, ReviewPersistenceError>>`, namespace `Interface`, `Params`), `STEP_RUN_STALE_CHECK_INTERVAL_MS = 5000` (`@webiny/api-workflows/features/stepRun/constants.js`).
  - Task 5: `AiIssue` (`@webiny/api-workflows/domain/review/types.js`), `ReviewStep.issues`.
  - Task 7: `WorkflowAiTool` (`@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js`; `Interface`, `Context`, `Result`), `WorkflowAiToolRegistryService` (`@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js`; `get(name): WorkflowAiTool.Interface | null`, `list()`), `AI_STEP_MAX_INPUT_CHARACTERS` (`.../features/aiTools/constants.js`).
  - Task 9: `ReviewTargetEditorService` (`@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js`; `read(params): Promise<Result<ReviewTargetContent, ReviewTargetEditorError>>`), `ReviewTargetContent` (`.../features/review/ReviewTargetEditor/index.js`), `ReviewTargetEditorError` (`@webiny/api-workflows/domain/review/errors.js`, constructor takes the message).
  - Task 10: `AI_STEP_CONTENT_TOO_LARGE_MESSAGE`, `AI_TOOL_STEP_NOT_RUNNING_MESSAGE` (`@webiny/api-workflows/features/aiTools/constants.js`).
  - Task 15: `ResolveAiCapabilityUseCase.execute(capabilityId, model?)` and `AiModelNotAvailableError` (`~/api/features/Capabilities/index.js`), `ConfiguredAiModelsService` (registered by `Extension.ts`; this runner does not inject it).
  - Task 16 (names as 00-shared "Interfaces by task" states them): `WORKFLOWS_REVIEW_CAPABILITY_ID`, `AI_STEP_MAX_TOOL_STEPS`, `AI_STEP_MAX_ISSUES` (`~/api/features/WorkflowReview/constants.js`), `WorkflowsReviewCapability` (`~/api/features/WorkflowReview/WorkflowsReviewCapability.js`, registered in the combined gate), the combined gate in `Extension.ts`, `registerFakeWorkflowsAccess` (`~tests/__helpers/FakeWorkflowsAccess.js`) and the registration test file.
  - Task 17: `aiFailureReasons.ts` (`~/api/features/WorkflowReview/aiFailureReasons.js`: `AI_STEP_INVALID_CONFIGURATION_REASON`, `aiToolNotAvailableReason(name)`, `aiModelNotAvailableReason(model)`, `AI_CAPABILITY_NOT_AVAILABLE_REASON`, `AI_REVIEW_FAILED_REASON`, `AI_REVIEW_NOT_STARTED_REASON`), the test helpers `aiStepFixtures.ts` (`~tests/__helpers/aiStepFixtures.js`: `createAiReview`, `createAiStepConfig`, `AI_STEP_ID`, `AI_MODEL`, `ARTICLE_MODEL`, `NOW`, `requester`) and `FakeResolveAiCapability.ts` (`createResolvedCapability`, `registerFakeResolveAiCapability`; `FakeWorkflowAiToolRegistry.ts` is not reused: it builds no-op tools from names, and the runner tests need `RecordingAiTool` instances, so the harness keeps a six-line local registry fake), `aiStepConfigSchema` (`~/api/features/WorkflowReview/aiStepConfigSchema.js`; `{ instructions: string; model: string; tools: string[] }`, `tools` defaults to `[]`) and `AiStepType` (`~/api/features/WorkflowReview/AiStepType/AiStepType.js`, the `StepType` implementation, registered with `container.register(AiStepType)` like the phase 5 `AutomationStepType`).
  - Task 18: `buildAiStepPrompt`, `exceedsAiInputLimit`, `AiStepPreviousComment` (`~/api/features/WorkflowReview/buildAiStepPrompt.js`), `aiReviewOutputSchema`, `normalizeAiIssues` (`~/api/features/WorkflowReview/aiReviewOutputSchema.js`).
  - Existing: `Ai` (`@webiny/api-core/features/ai/index.js`; `generateText(params: Ai.GenerateTextParams): ReturnType<typeof generateText>` where `generateText`'s `Ai` wrapper passes `abortSignal`, `tools`, `stopWhen` and `output` through to the AI SDK (`ai` 7.0.73: `stepCountIs`, `Output.object`, `NoObjectGeneratedError`, `NoOutputGeneratedError`; a result's `output` getter throws `NoOutputGeneratedError` when there is none), `Logger` (`@webiny/api-core/features/logger/index.js`), `REJECT_COMMENT_MIN_LENGTH = 10` (`@webiny/api-workflows/domain/review/Review.js`), `getStaleStepRunReason` (`@webiny/api-workflows/domain/review/getStaleStepRunReason.js`, tests only), `ReviewPersistenceError` (`@webiny/api-workflows/domain/review/errors.js`, tests only), `AiCapabilityDisabledError`, `IResolvedAiCapability`, `Extension`.
- Produces (matches the contract):
  - `AiStepRunner` (`~/api/features/WorkflowReview/AiStepRunner/AiStepRunner.js`, a `StepRunner` implementation), `AiStepRunnerFeature` (`.../AiStepRunner/feature.js`), and the `ai` `StepType` plus the `ai` `StepRunner` registered in `Extension.ts` inside the combined gate. Consumed by Task 20.
  - The runner-only R170 texts as constants and one pure message function `getAiStepLimitReason` (`~/api/features/WorkflowReview/AiStepRunner/aiRunFailureReasons.js`); the shared texts are Task 17's.
  - Test helpers `ScriptedAi` (a scripted `Ai` that runs the tools and the stop conditions like the AI SDK loop does, `~tests/__helpers/ScriptedAi.js`), `createRunningAiReview` (Task 17's `createAiReview` moved to `inReview` under `task-1`), `cancelStoredReview`, `restartStoredStep`, `AI_REVIEW_ID`, `AI_TASK_ID`, `AI_TASK` (`~tests/__helpers/aiRunReviews.js`), `RecordingAiTool` (`~tests/__helpers/RecordingAiTool.js`), `createAiStepRunnerHarness` (`~tests/__helpers/AiStepRunnerHarness.js`). `ScriptedAi` is reused by Task 20 (with Task 17's `aiStepFixtures.ts` for `AI_STEP_ID`, `AI_MODEL`).

- [ ] **Step 1: Write the failing tests**

Create `packages/ai-powerups/__tests__/__helpers/aiRunReviews.ts`. It adds only what a run needs on top of Task 17's `aiStepFixtures.ts` (`createAiReview` builds the requested review with the pending `ai` step; no second review builder here): the review moved to "in review" under `task-1`, an optional earlier review step, and the stored-review flips the stale tests use, which are plain data changes that the real guard (`getStaleStepRunReason`) judges:

```ts
import { getAiActor } from "@webiny/api-workflows/domain/ai/getAiActor.js";
import type {
    Actor,
    ReviewData,
    ReviewStep,
    StepState
} from "@webiny/api-workflows/domain/review/types.js";
import type { StepRunTaskIdentity } from "@webiny/api-workflows/domain/review/getStaleStepRunReason.js";
import {
    AI_MODEL,
    AI_STEP_ID,
    NOW,
    createAiReview,
    createAiStepConfig,
    requester
} from "./aiStepFixtures.js";

export const AI_REVIEW_ID = createAiReview().toData().id;
export const AI_TASK_ID = "task-1";

/** The identity of the running task: created by the requester, carrying the step's task id. */
export const AI_TASK: StepRunTaskIdentity = { id: AI_TASK_ID, createdById: requester.id };

export interface PreviousStepOptions {
    state: StepState;
    comment: string | null;
    /** Defaults to "Lena Legal"; `null` is a step without an owner. */
    owner?: Actor | null;
}

export interface RunningAiReviewOptions {
    tools?: string[];
    instructions?: string;
    model?: string;
    /** Replaces the whole step config, for a config that does not parse. */
    config?: unknown;
    /** The review step before the AI step; `null` leaves it out. Defaults to an approved step. */
    previousStep?: PreviousStepOptions | null;
}

const LEGAL: Actor = { type: "user", id: "user-legal", displayName: "Lena Legal" };

const createPreviousStep = (ai: ReviewStep, options: PreviousStepOptions): ReviewStep => {
    return {
        ...ai,
        id: "legal-step",
        title: "Legal",
        type: "review",
        state: options.state,
        comment: options.comment,
        owner: options.owner === undefined ? LEGAL : options.owner,
        config: {},
        taskId: null
    };
};

/**
 * Task 17's requested review with the `ai` step moved to `inReview` under task `task-1`, created
 * by `requester`. The earlier step "Legal" is approved with the comment "Cleared by legal." by
 * default.
 */
export const createRunningAiReview = (options: RunningAiReviewOptions = {}): ReviewData => {
    const config =
        options.config ??
        createAiStepConfig({
            instructions: options.instructions ?? "Check the tone.",
            model: options.model ?? AI_MODEL,
            tools: options.tools ?? []
        });
    const base = createAiReview({ config }).toData();
    const ai: ReviewStep = {
        ...base.steps[0],
        state: "inReview",
        owner: getAiActor(requester),
        taskId: AI_TASK_ID,
        reachedOn: NOW,
        startedOn: NOW
    };
    const previous =
        options.previousStep === undefined
            ? { state: "approved" as StepState, comment: "Cleared by legal." }
            : options.previousStep;
    return {
        ...base,
        isActive: true,
        state: "inProgress",
        currentStepId: AI_STEP_ID,
        currentStepState: "inReview",
        currentStepType: "ai",
        currentOwnerId: null,
        currentCandidateTeamIds: [],
        steps: previous ? [createPreviousStep(ai, previous), ai] : [ai]
    };
};

/** The stored review after the requester cancelled it (the guard sees an inactive review). */
export const cancelStoredReview = (review: ReviewData): ReviewData => {
    return { ...review, isActive: false, state: "cancelled" };
};

/** The stored review after the step was restarted under another task. */
export const restartStoredStep = (review: ReviewData, taskId: string): ReviewData => {
    return {
        ...review,
        steps: review.steps.map(step => {
            return step.id === AI_STEP_ID ? { ...step, taskId } : step;
        })
    };
};
```

Create `packages/ai-powerups/__tests__/__helpers/RecordingAiTool.ts`:

```ts
import { z } from "zod";
import { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";

export interface RecordedToolCall {
    input: unknown;
    context: WorkflowAiTool.Context;
}

/**
 * A `WorkflowAiTool` that records every call with the context it got and answers `result`, or
 * throws `failure` when set. It writes nothing; a test that counts `calls` counts the writes a
 * stale call must not make.
 */
export class RecordingAiTool implements WorkflowAiTool.Interface {
    public readonly title: string;
    public readonly description = "Echoes its value.";
    public readonly inputSchema = z.object({ value: z.string() });
    public readonly calls: RecordedToolCall[] = [];
    public result: WorkflowAiTool.Result = { ok: true, data: { echoed: true } };
    public failure: Error | null = null;

    public constructor(public readonly name: string) {
        this.title = name;
    }

    public async execute(input: unknown, context: WorkflowAiTool.Context) {
        this.calls.push({ input, context });
        if (this.failure) {
            throw this.failure;
        }
        return this.result;
    }
}
```

Create `packages/ai-powerups/__tests__/__helpers/ScriptedAi.ts`. It implements `Ai` without calling a model. `generateText` follows the AI SDK loop closely enough to pin what the runner relies on: for each scripted step it runs the tool calls (in parallel, like the SDK) through the `execute` of the `tools` it was given, then asks the `stopWhen` conditions (only after a step that had tool calls, like the SDK), and a stopped call returns a result whose `output` getter throws `NoOutputGeneratedError`:

```ts
import { NoOutputGeneratedError } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";

export interface ScriptedToolCall {
    name: string;
    input: unknown;
}

export interface ScriptedStep {
    /** Runs before the step's tool calls: flip the stored review, move the clock, abort. */
    before?: () => Promise<void> | void;
    toolCalls: ScriptedToolCall[];
    /** Thrown after the step's tool calls and before the stop conditions: a provider failure. */
    fail?: Error;
}

export interface ScriptedResponse {
    steps: ScriptedStep[];
    /** What `result.output` answers; `null` makes the getter throw `NoOutputGeneratedError`. */
    decision: unknown;
    /** Thrown after all steps ran, instead of answering. */
    error?: Error;
}

export interface RecordedToolResult {
    name: string;
    input: unknown;
    result: unknown;
}

interface ExecutedStep {
    toolCalls: ScriptedToolCall[];
}

type ToolExecute = (input: unknown, options: unknown) => Promise<unknown>;

export const APPROVE_DECISION = { approved: true, comment: "", issues: [] };

/** An error shaped like the one the AI SDK throws when the abort signal fires. */
const createAbortError = (): Error => {
    return Object.assign(new Error("This operation was aborted."), { name: "AbortError" });
};

/**
 * An `Ai` that never calls a model. `calls` records every `generateText` parameter set,
 * `toolResults` every tool result the "model" got back. `listModels` answers `models`; nothing
 * else of `Ai` is used by the code under test, so the rest throws.
 */
export class ScriptedAi implements Ai.Interface {
    public readonly calls: Ai.GenerateTextParams[] = [];
    public readonly toolResults: RecordedToolResult[] = [];
    public models: AiModel[] = [];
    public response: ScriptedResponse = { steps: [], decision: APPROVE_DECISION };

    public async generateText(
        params: Ai.GenerateTextParams
    ): ReturnType<Ai.Interface["generateText"]> {
        this.calls.push(params);
        const executed: ExecutedStep[] = [];

        for (const step of this.response.steps) {
            if (params.abortSignal?.aborted) {
                throw createAbortError();
            }
            await step.before?.();
            if (params.abortSignal?.aborted) {
                throw createAbortError();
            }
            // Like the SDK: the tool calls of one step run in parallel; results keep call order.
            const outcomes = await Promise.all(
                step.toolCalls.map(async (call, index) => {
                    const execute = params.tools?.[call.name]?.execute as unknown as
                        | ToolExecute
                        | undefined;
                    const result = execute
                        ? await execute(call.input, { toolCallId: `call-${index}`, messages: [] })
                        : { ok: false, error: `No such tool: ${call.name}` };
                    return { name: call.name, input: call.input, result };
                })
            );
            this.toolResults.push(...outcomes);
            executed.push({ toolCalls: step.toolCalls });
            if (step.fail) {
                throw step.fail;
            }
            // Like the SDK: only a step with tool calls asks the stop conditions whether to go on.
            if (step.toolCalls.length > 0) {
                const conditions = Array.isArray(params.stopWhen)
                    ? params.stopWhen
                    : params.stopWhen
                      ? [params.stopWhen]
                      : [];
                let stop = false;
                for (const condition of conditions) {
                    if (await condition({ steps: executed as never })) {
                        stop = true;
                    }
                }
                if (stop) {
                    return this.createResult(executed, null);
                }
            }
        }

        if (this.response.error) {
            throw this.response.error;
        }
        // The decision is the last model step: it has no tool calls.
        executed.push({ toolCalls: [] });
        return this.createResult(executed, this.response.decision);
    }

    private createResult(
        steps: ExecutedStep[],
        decision: unknown
    ): Awaited<ReturnType<Ai.Interface["generateText"]>> {
        const result = {
            steps,
            text: "",
            get output() {
                if (decision === null) {
                    throw new NoOutputGeneratedError();
                }
                return decision;
            }
        };
        return result as unknown as Awaited<ReturnType<Ai.Interface["generateText"]>>;
    }

    public async streamText(): Promise<never> {
        throw new Error("The scripted Ai does not stream text.");
    }

    public async listModels(): Promise<AiModel[]> {
        return this.models;
    }

    public async listModelsByConnections(): Promise<AiModel[]> {
        throw new Error("listModelsByConnections must not be used (R169).");
    }

    public async listModelsByConnection(): Promise<AiModel[]> {
        throw new Error("listModelsByConnection must not be used (R169).");
    }
}
```

Create `packages/ai-powerups/__tests__/__helpers/AiStepRunnerHarness.ts`. It builds a bare container with `AiStepRunner` and a fake for each dependency. The stale check fake keeps a stored review and applies the real guard (`getStaleStepRunReason`), so a test flips the stored review (`store.review = cancelStoredReview(...)`) and the runner sees what the real service would see. The editor fake refuses `update`: the runner must never write:

```ts
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getStaleStepRunReason } from "@webiny/api-workflows/domain/review/getStaleStepRunReason.js";
import { ReviewPersistenceError, ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import type { ReviewData, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import type { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
import type {
    ReviewTargetContent,
    ReviewTargetEditorReadParams
} from "@webiny/api-workflows/features/review/ReviewTargetEditor/index.js";
import type { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";
import { AiStepRunner } from "~/api/features/WorkflowReview/AiStepRunner/AiStepRunner.js";
import { ScriptedAi } from "./ScriptedAi.js";
import { AI_MODEL, AI_STEP_ID, requester } from "./aiStepFixtures.js";
import {
    createResolvedCapability,
    registerFakeResolveAiCapability
} from "./FakeResolveAiCapability.js";
import { AI_TASK, createRunningAiReview } from "./aiRunReviews.js";

/** The guidance of the capability the fake resolver answers (Task 17's fixture). */
export const GUIDANCE = createResolvedCapability(AI_MODEL).guidance;

export const createTargetContent = (): ReviewTargetContent => {
    return {
        title: "Ann",
        fields: [
            { path: "name", label: "Name", type: "text", value: "Ann", writable: true },
            { path: "bio", label: "Bio", type: "long-text", value: "Writes about cats.", writable: true }
        ]
    };
};

export interface RecordedLog {
    level: "info" | "error";
    message: string;
    fields: Record<string, unknown>;
}

/** Records `info` and `error`; the other levels are dropped. */
class RecordingLogger implements Logger.Interface {
    public readonly logs: RecordedLog[] = [];

    public get errors(): RecordedLog[] {
        return this.logs.filter(log => log.level === "error");
    }

    public get infos(): RecordedLog[] {
        return this.logs.filter(log => log.level === "info");
    }

    public trace(): void {}
    public debug(): void {}
    public warn(): void {}
    public fatal(): void {}
    public log(): void {}

    public info(objOrMsg: object | string, ...args: any[]): void {
        this.logs.push({
            level: "info",
            message: typeof objOrMsg === "string" ? objOrMsg : String(args[0]),
            fields: typeof objOrMsg === "string" ? {} : { ...objOrMsg }
        });
    }

    public error(objOrMsg: object | string, ...args: any[]): void {
        this.logs.push({
            level: "error",
            message: typeof objOrMsg === "string" ? objOrMsg : String(args[0]),
            fields: typeof objOrMsg === "string" ? {} : { ...objOrMsg }
        });
    }
}

/**
 * What the shared fake resolver (Task 17's `registerFakeResolveAiCapability`) answers: `result`
 * by default, a throw when `failure` is set. `calls` is the fake's own record.
 */
interface ScriptedCapabilityResolver {
    calls: ReturnType<typeof registerFakeResolveAiCapability>["calls"];
    result: Result<ResolveAiCapabilityUseCase.Resolution, Error>;
    failure: Error | null;
}

class ScriptedEditorService implements ReviewTargetEditorService.Interface {
    public readonly readCalls: ReviewTargetEditorReadParams[] = [];
    public content: Result<ReviewTargetContent, ReviewTargetEditorError> = Result.ok(
        createTargetContent()
    );

    public async read(params: ReviewTargetEditorReadParams) {
        this.readCalls.push(params);
        return this.content;
    }

    public async update(): Promise<never> {
        throw new Error("The AI runner never writes: only a tool may.");
    }
}

class FakeToolRegistry implements WorkflowAiToolRegistryService.Interface {
    public constructor(private tools: WorkflowAiTool.Interface[]) {}

    public get(name: string): WorkflowAiTool.Interface | null {
        return this.tools.find(tool => tool.name === name) ?? null;
    }

    public list(): WorkflowAiTool.Interface[] {
        return this.tools;
    }
}

/** The stored review, replaced by the test to cancel or restart it during the model call. */
export interface StoredReview {
    review: ReviewData;
}

/**
 * `StepRunStaleCheckService` over the stored review with the real guard. `calls` records every
 * read; set `failure` to answer a failed Result (the real service is fail-closed and logs its own
 * failures, so the fake logs nothing).
 */
class StoredReviewStaleCheck implements StepRunStaleCheckService.Interface {
    public readonly calls: StepRunStaleCheckService.Params[] = [];
    public failure: ReviewPersistenceError | null = null;
    public throws: Error | null = null;

    public constructor(private store: StoredReview) {}

    public async isStale(
        params: StepRunStaleCheckService.Params
    ): Promise<Result<boolean, ReviewPersistenceError>> {
        this.calls.push(params);
        if (this.throws) {
            throw this.throws;
        }
        if (this.failure) {
            return Result.fail(this.failure);
        }
        const reason = getStaleStepRunReason(this.store.review, params.stepId, params.task);
        return Result.ok(reason !== null);
    }
}

export interface AiStepRunnerHarnessOptions {
    review?: ReviewData;
    tools?: WorkflowAiTool.Interface[];
}

export interface AiStepRunOverrides {
    iteration?: number;
    signal?: AbortSignal;
}

export const createAiStepRunnerHarness = (options: AiStepRunnerHarnessOptions = {}) => {
    const store: StoredReview = { review: options.review ?? createRunningAiReview() };
    const ai = new ScriptedAi();
    const editor = new ScriptedEditorService();
    const registry = new FakeToolRegistry(options.tools ?? []);
    const staleCheck = new StoredReviewStaleCheck(store);
    const logger = new RecordingLogger();

    const container = new Container();
    container.registerInstance(Ai, ai);
    const resolver: ScriptedCapabilityResolver = {
        calls: [],
        result: Result.ok(createResolvedCapability(AI_MODEL)),
        failure: null
    };
    const fakeResolve = registerFakeResolveAiCapability(container, async () => {
        if (resolver.failure) {
            throw resolver.failure;
        }
        return resolver.result;
    });
    resolver.calls = fakeResolve.calls;
    container.registerInstance(ReviewTargetEditorService, editor);
    container.registerInstance(WorkflowAiToolRegistryService, registry);
    container.registerInstance(StepRunStaleCheckService, staleCheck);
    container.registerInstance(Logger, logger);
    container.register(AiStepRunner);
    const runner = container.resolveAll(StepRunner)[0];

    const run = (overrides: AiStepRunOverrides = {}) => {
        // The run gets the snapshot the handler read at its start; flips go to `store.review`.
        const review = structuredClone(store.review);
        const step = review.steps.find(item => item.id === AI_STEP_ID) as ReviewStep;
        return runner.run({
            review,
            step,
            requester,
            task: AI_TASK,
            iteration: overrides.iteration ?? 1,
            state: null,
            signal: overrides.signal ?? new AbortController().signal
        });
    };

    return { runner, run, store, ai, resolver, editor, registry, staleCheck, logger };
};
```

Create `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunner.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Result } from "@webiny/feature/api";
import { StepRunFailure } from "@webiny/api-workflows/features/stepRun/StepRunFailure.js";
import { ReviewTargetEditorError } from "@webiny/api-workflows/domain/review/errors.js";
import { REJECT_COMMENT_MIN_LENGTH } from "@webiny/api-workflows/domain/review/Review.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_STEP_MAX_INPUT_CHARACTERS
} from "@webiny/api-workflows/features/aiTools/constants.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import {
    AiCapabilityDisabledError,
    AiModelNotAvailableError
} from "~/api/features/Capabilities/index.js";
import {
    AI_STEP_MAX_ISSUES,
    AI_STEP_MAX_TOOL_STEPS,
    WORKFLOWS_REVIEW_CAPABILITY_ID
} from "~/api/features/WorkflowReview/constants.js";
import { buildAiStepPrompt } from "~/api/features/WorkflowReview/buildAiStepPrompt.js";
import { NoObjectGeneratedError, NoOutputGeneratedError } from "ai";
import { AI_MODEL, AI_STEP_ID, ARTICLE_MODEL, requester } from "~tests/__helpers/aiStepFixtures.js";
import {
    AI_REVIEW_ID,
    AI_TASK,
    createRunningAiReview
} from "~tests/__helpers/aiRunReviews.js";
import { createResolvedCapability } from "~tests/__helpers/FakeResolveAiCapability.js";
import { RecordingAiTool } from "~tests/__helpers/RecordingAiTool.js";
import { APPROVE_DECISION } from "~tests/__helpers/ScriptedAi.js";
import {
    createAiStepRunnerHarness,
    createTargetContent,
    GUIDANCE
} from "~tests/__helpers/AiStepRunnerHarness.js";

/** The reason of the `StepRunFailure` a promise rejects with; anything else rethrows. */
const failureOf = async (promise: Promise<unknown>): Promise<string> => {
    try {
        await promise;
    } catch (error) {
        if (error instanceof StepRunFailure) {
            return error.reason;
        }
        throw error;
    }
    throw new Error("The run did not fail.");
};

const createGenerateError = (): NoObjectGeneratedError => {
    return new NoObjectGeneratedError({
        message: "No object generated.",
        response: {} as never,
        usage: {} as never,
        finishReason: "stop"
    });
};

describe("AiStepRunner members (R168, R170)", () => {
    it("is the ai runner: single run, fixed reasons, the AI actor", () => {
        const { runner } = createAiStepRunnerHarness();

        expect(runner.type).toBe(AI_STEP_TYPE);
        expect(runner.singleRun).toBe(true);
        expect(runner.failureReasons).toEqual({
            error: "The AI review failed.",
            aborted: "The AI review was aborted.",
            stuck: "The AI review task ended without a result."
        });
        expect(runner.getActor(requester)).toEqual({
            type: "ai",
            id: requester.id,
            displayName: requester.displayName
        });
        expect(runner.maxIterationsReason(createRunningAiReview().steps[1])).toBe(
            "The AI review failed."
        );
    });
});

describe("AiStepRunner failures before the call (R170, R175)", () => {
    it("fails an iteration above 1 with the error reason and makes no model call", async () => {
        const { run, ai, resolver, logger } = createAiStepRunnerHarness();

        const reason = await failureOf(run({ iteration: 2 }));

        expect(reason).toBe("The AI review failed.");
        expect(ai.calls).toHaveLength(0);
        expect(resolver.calls).toHaveLength(0);
        expect(logger.infos).toHaveLength(1);
    });

    it("runs iteration 1", async () => {
        const { run, ai } = createAiStepRunnerHarness();

        await run({ iteration: 1 });

        expect(ai.calls).toHaveLength(1);
    });

    it("fails with the timeout reason when the signal is already aborted, no model call (R175)", async () => {
        const { run, ai, resolver } = createAiStepRunnerHarness();
        const controller = new AbortController();
        controller.abort();

        const reason = await failureOf(run({ signal: controller.signal }));

        expect(reason).toBe("The AI review timed out.");
        expect(ai.calls).toHaveLength(0);
        expect(resolver.calls).toHaveLength(0);
    });

    it("fails when the step config no longer parses", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ config: { instructions: 1, model: AI_MODEL } })
        });

        const reason = await failureOf(run());

        expect(reason).toBe("The AI step configuration is not valid.");
        expect(ai.calls).toHaveLength(0);
    });

    it("fails when an allowlisted tool is no longer registered", async () => {
        const { run, ai, resolver } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo", "ghost"] }),
            tools: [new RecordingAiTool("echo")]
        });

        const reason = await failureOf(run());

        expect(reason).toBe('The AI tool "ghost" is not available.');
        expect(ai.calls).toHaveLength(0);
        expect(resolver.calls).toHaveLength(0);
    });

    it("resolves the capability with the capability id and the model of the step", async () => {
        const { run, resolver } = createAiStepRunnerHarness({
            review: createRunningAiReview({ model: "openai/gpt-5" })
        });

        await run();

        expect(resolver.calls).toEqual([
            { capabilityId: WORKFLOWS_REVIEW_CAPABILITY_ID, model: "openai/gpt-5" }
        ]);
    });

    it.each([
        {
            name: "a disabled capability",
            error: new AiCapabilityDisabledError(
                WORKFLOWS_REVIEW_CAPABILITY_ID,
                "Workflow review",
                "Settings → AI Power-Ups"
            ),
            reason: "The AI review capability is not available.",
            logged: 0
        },
        {
            name: "a model without a connection",
            error: new AiModelNotAvailableError(AI_MODEL),
            reason: `The model "${AI_MODEL}" is not available.`,
            logged: 0
        },
        {
            name: "settings that could not be loaded",
            error: new Error("Failed to load AI Power-Ups settings."),
            reason: "The AI review capability is not available.",
            logged: 1
        },
        {
            name: "a failed model list read",
            error: new Error("Failed to list the configured AI models."),
            reason: "The AI review capability is not available.",
            logged: 1
        }
    ])("maps $name to its fixed reason and makes no call; $logged error log(s)", async ({ error, reason, logged }) => {
        const { run, resolver, ai, logger } = createAiStepRunnerHarness();
        resolver.result = Result.fail(error);

        const failed = await failureOf(run());

        expect(failed).toBe(reason);
        expect(ai.calls).toHaveLength(0);
        // A typed, expected state (model) and a decision (disabled) are not logged; anything else
        // is, once, with the raw error (the same split as Task 17's `reach`).
        expect(logger.errors).toHaveLength(logged);
        expect(logger.infos).toHaveLength(0);
        if (logged > 0) {
            expect(logger.errors[0].message).toBe("Could not resolve the AI review capability.");
            expect(logger.errors[0].fields).toMatchObject({
                error,
                reviewId: AI_REVIEW_ID,
                stepId: AI_STEP_ID,
                taskId: AI_TASK.id
            });
        }
        // The raw text never reaches the step.
        expect(failed).not.toContain("Failed to");
    });

    it("fails with the error reason and logs once when the resolver throws", async () => {
        const { run, resolver, ai, logger } = createAiStepRunnerHarness();
        resolver.failure = new Error("The key could not be decrypted: kms-secret-7");

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(reason).not.toContain("kms-secret");
        expect(ai.calls).toHaveLength(0);
        expect(logger.errors).toHaveLength(1);
    });

    it("reads the target with the ids of the review snapshot, never anything from the config", async () => {
        const { run, editor } = createAiStepRunnerHarness();

        await run();

        expect(editor.readCalls).toEqual([
            {
                model: ARTICLE_MODEL,
                targetId: "article-1",
                targetRevisionId: "article-1#0001"
            }
        ]);
    });

    it("fails with the error reason, and no model call, when the target cannot be read", async () => {
        const { run, editor, ai, logger } = createAiStepRunnerHarness();
        editor.content = Result.fail(new ReviewTargetEditorError("The target was not found."));

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(ai.calls).toHaveLength(0);
        expect(logger.infos).toHaveLength(1);
        expect(logger.errors).toHaveLength(0);
    });

    it("fails an oversized target with the too-large reason and nothing is sent to the model (R175)", async () => {
        const { run, editor, ai } = createAiStepRunnerHarness();
        const content = createTargetContent();
        content.fields[1].value = "x".repeat(AI_STEP_MAX_INPUT_CHARACTERS + 1);
        editor.content = Result.ok(content);

        const reason = await failureOf(run());

        expect(reason).toBe(AI_STEP_CONTENT_TOO_LARGE_MESSAGE);
        expect(reason).toBe("The content is too large for the AI review.");
        expect(ai.calls).toHaveLength(0);
    });
});

describe("AiStepRunner model call (R171, R174, R175)", () => {
    it("calls the model with the resolved model and connection, the built prompt and the signal", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        const controller = new AbortController();

        await run({ signal: controller.signal });

        expect(ai.calls).toHaveLength(1);
        const call = ai.calls[0];
        const expected = buildAiStepPrompt({
            systemGuidance: GUIDANCE,
            additionalInstructions: "",
            instructions: "Check the tone.",
            content: createTargetContent(),
            previousComments: [
                { stepTitle: "Legal", actor: "Lena Legal", comment: "Cleared by legal." }
            ]
        });
        expect(call.model).toBe(AI_MODEL);
        expect(call.connection).toEqual(createResolvedCapability(AI_MODEL).connection);
        expect(call.system).toBe(expected.system);
        expect(call.prompt).toBe(expected.user);
        expect(call.abortSignal).toBe(controller.signal);
        expect(call.output).toBeDefined();
    });

    it("appends the project instructions to the system prompt", async () => {
        const { run, ai, resolver } = createAiStepRunnerHarness();
        resolver.result = Result.ok({
            ...createResolvedCapability(AI_MODEL),
            additionalInstructions: "Always answer in French."
        });

        await run();

        expect(String(ai.calls[0].system)).toContain("Always answer in French.");
    });

    it("sends only earlier approved or rejected comments, not a failed step's reason", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({
                previousStep: { state: "failed", comment: "The automation failed." }
            })
        });

        await run();

        expect(String(ai.calls[0].prompt)).not.toContain("previous-step-comments");
        expect(String(ai.calls[0].prompt)).not.toContain("The automation failed.");
    });

    it("labels the author of a comment from a step without an owner as (no name), not Unknown", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({
                previousStep: { state: "approved", comment: "Cleared.", owner: null }
            })
        });

        await run();

        expect(String(ai.calls[0].prompt)).toContain('"by":"(no name)"');
        expect(String(ai.calls[0].prompt)).not.toContain("Unknown");
    });

    it("leaves out the comments block when the AI step is the first step", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ previousStep: null })
        });

        await run();

        expect(String(ai.calls[0].prompt)).not.toContain("previous-step-comments");
    });

    it("passes no tools and no stop conditions when the step allowlists none", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            tools: [new RecordingAiTool("echo")]
        });

        await run();

        expect(ai.calls[0].tools).toBeUndefined();
        expect(ai.calls[0].stopWhen).toBeUndefined();
    });

    it("offers exactly the allowlisted tools; a registered tool the step does not allowlist is absent (Review Focus 2)", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [new RecordingAiTool("echo"), new RecordingAiTool("other")]
        });

        await run();

        expect(Object.keys(ai.calls[0].tools ?? {})).toEqual(["echo"]);
    });

    it("collapses a duplicated allowlist name to one tool", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo", "echo"] }),
            tools: [new RecordingAiTool("echo")]
        });

        await run();

        expect(Object.keys(ai.calls[0].tools ?? {})).toEqual(["echo"]);
    });

    it("passes the step cap and the stale stop as stop conditions when there are tools", async () => {
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [new RecordingAiTool("echo")]
        });

        await run();

        expect(Array.isArray(ai.calls[0].stopWhen)).toBe(true);
        expect(ai.calls[0].stopWhen).toHaveLength(2);
    });

    it("runs a tool with the context of the run and exactly the input the model sent", async () => {
        const echo = new RecordingAiTool("echo");
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: [{ toolCalls: [{ name: "echo", input: { value: "hello" } }] }],
            decision: APPROVE_DECISION
        };

        await run();

        expect(echo.calls).toHaveLength(1);
        expect(echo.calls[0].input).toEqual({ value: "hello" });
        const review = createRunningAiReview({ tools: ["echo"] });
        expect(echo.calls[0].context).toEqual({
            review,
            step: review.steps.find(step => step.id === AI_STEP_ID),
            requester,
            task: AI_TASK
        });
        expect(echo.calls[0].context.review.id).toBe(AI_REVIEW_ID);
    });

    it("gives the tool result back to the model unchanged", async () => {
        const echo = new RecordingAiTool("echo");
        echo.result = { ok: false, error: "The field is read-only." };
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: [{ toolCalls: [{ name: "echo", input: { value: "a" } }] }],
            decision: APPROVE_DECISION
        };

        await run();

        expect(ai.toolResults).toEqual([
            {
                name: "echo",
                input: { value: "a" },
                result: { ok: false, error: "The field is read-only." }
            }
        ]);
    });

    it("answers a throwing tool with a fixed text, logs the raw error and keeps going", async () => {
        const echo = new RecordingAiTool("echo");
        echo.failure = new Error("EACCES: /secret/path key=sk-123");
        const { run, ai, logger } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: [{ toolCalls: [{ name: "echo", input: { value: "a" } }] }],
            decision: APPROVE_DECISION
        };

        const outcome = await run();

        expect(ai.toolResults[0].result).toEqual({
            ok: false,
            error: 'The tool "echo" failed.'
        });
        expect(JSON.stringify(ai.toolResults)).not.toContain("sk-123");
        expect(logger.errors).toHaveLength(1);
        expect(logger.errors[0].fields).toMatchObject({ reviewId: AI_REVIEW_ID, tool: "echo" });
        expect(outcome.type).toBe("approved");
    });
});

describe("AiStepRunner outcome mapping (R171, D100)", () => {
    it("approves without a comment: the comment is left out", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: { approved: true, comment: "   ", issues: [] }
        };

        const outcome = await run();

        expect(outcome).toEqual({ type: "approved", issues: [] });
        expect("comment" in outcome).toBe(false);
    });

    it("approves with the trimmed comment and the issues", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: true,
                comment: "  Looks good.  ",
                issues: [
                    {
                        fieldPath: "bio",
                        severity: "info",
                        message: "Could be longer.",
                        suggestion: null
                    }
                ]
            }
        };

        const outcome = await run();

        expect(outcome).toEqual({
            type: "approved",
            comment: "Looks good.",
            issues: [
                { fieldPath: "bio", severity: "info", message: "Could be longer.", suggestion: null }
            ]
        });
    });

    it("rejects with the trimmed comment and the issues", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: false,
                comment: "  The title is misleading.  ",
                issues: [
                    {
                        fieldPath: "name",
                        severity: "error",
                        message: "Misleading.",
                        suggestion: "Rename it."
                    }
                ]
            }
        };

        const outcome = await run();

        expect(outcome).toEqual({
            type: "rejected",
            comment: "The title is misleading.",
            issues: [
                {
                    fieldPath: "name",
                    severity: "error",
                    message: "Misleading.",
                    suggestion: "Rename it."
                }
            ]
        });
    });

    it("accepts a reject comment of exactly the minimum length", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: false,
                comment: "c".repeat(REJECT_COMMENT_MIN_LENGTH),
                issues: []
            }
        };

        const outcome = await run();

        expect(outcome.type).toBe("rejected");
    });

    it.each([
        { name: "an empty comment", comment: "" },
        { name: "a blank comment", comment: "          " },
        { name: "a comment one character short", comment: "c".repeat(REJECT_COMMENT_MIN_LENGTH - 1) },
        {
            name: "a comment that is short once trimmed",
            comment: `   ${"c".repeat(REJECT_COMMENT_MIN_LENGTH - 1)}   `
        }
    ])("fails a rejection with $name", async ({ comment }) => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision: { approved: false, comment, issues: [] } };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review rejected without a comment.");
    });

    it("clamps the issues and strips the keys the model added", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: true,
                comment: "",
                issues: [
                    {
                        fieldPath: "p".repeat(600),
                        severity: "warning",
                        message: "m".repeat(2500),
                        suggestion: "s".repeat(2500)
                    }
                ]
            }
        };

        const outcome = await run();

        expect(outcome).toMatchObject({
            issues: [
                {
                    fieldPath: "p".repeat(500),
                    message: "m".repeat(2000),
                    suggestion: "s".repeat(2000)
                }
            ]
        });
    });

    it("keeps at most the issue cap and logs once that extras were dropped", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: {
                approved: true,
                comment: "",
                issues: Array.from({ length: AI_STEP_MAX_ISSUES + 5 }, (_, index) => {
                    return {
                        fieldPath: null,
                        severity: "info",
                        message: `issue ${index}`,
                        suggestion: null
                    };
                })
            }
        };

        const outcome = await run();

        expect(outcome).toMatchObject({ type: "approved" });
        expect((outcome as { issues: unknown[] }).issues).toHaveLength(AI_STEP_MAX_ISSUES);
        expect(logger.infos).toHaveLength(1);
        expect(logger.infos[0].fields).toMatchObject({ count: AI_STEP_MAX_ISSUES + 5 });
    });

    it("never returns continue and never writes (the editor refuses update)", async () => {
        const { run, ai, editor } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision: APPROVE_DECISION };

        const outcome = await run();

        expect(outcome.type).not.toBe("continue");
        expect(editor.readCalls).toHaveLength(1);
    });
});

describe("AiStepRunner decision and call failures (R170, R175)", () => {
    it.each([
        { name: "no output", decision: null },
        { name: "an empty object", decision: {} },
        { name: "a non-boolean approved", decision: { approved: "yes", comment: "", issues: [] } },
        { name: "no issues list", decision: { approved: true, comment: "" } },
        { name: "an unknown severity", decision: { approved: true, comment: "", issues: [{ fieldPath: null, severity: "fatal", message: "m", suggestion: null }] } },
        { name: "a string", decision: "approved" }
    ])("fails with no decision for $name", async ({ decision }) => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review returned no decision.");
    });

    it("fails with the step-cap reason when the tool loop hit its cap without a decision", async () => {
        const echo = new RecordingAiTool("echo");
        const { run, ai } = createAiStepRunnerHarness({
            review: createRunningAiReview({ tools: ["echo"] }),
            tools: [echo]
        });
        ai.response = {
            steps: Array.from({ length: AI_STEP_MAX_TOOL_STEPS }, () => {
                return { toolCalls: [{ name: "echo", input: { value: "again" } }] };
            }),
            decision: APPROVE_DECISION
        };

        const reason = await failureOf(run());

        expect(reason).toBe(`The AI review did not finish in ${AI_STEP_MAX_TOOL_STEPS} steps.`);
        expect(reason).toBe("The AI review did not finish in 20 steps.");
        expect(echo.calls).toHaveLength(AI_STEP_MAX_TOOL_STEPS);
    });

    it("fails with no decision when the SDK reports no object", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        ai.response = { steps: [], decision: APPROVE_DECISION, error: createGenerateError() };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review returned no decision.");
        expect(logger.errors).toHaveLength(0);
    });

    it("fails with no decision when the SDK reports no output", async () => {
        const { run, ai } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: APPROVE_DECISION,
            error: new NoOutputGeneratedError()
        };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review returned no decision.");
    });

    it("fails with the fixed error reason for a provider failure and logs the raw error once", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        ai.response = {
            steps: [],
            decision: APPROVE_DECISION,
            error: new Error("401 invalid x-api-key sk-secret-123")
        };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(reason).not.toContain("sk-secret");
        expect(logger.errors).toHaveLength(1);
        expect(String((logger.errors[0].fields.error as Error).message)).toContain("sk-secret-123");
        expect(logger.errors[0].fields).toMatchObject({ reviewId: AI_REVIEW_ID, taskId: AI_TASK.id });
    });

    it("fails with the timeout reason when the signal fires during the call, without an error log", async () => {
        const { run, ai, logger } = createAiStepRunnerHarness();
        const controller = new AbortController();
        ai.response = {
            steps: [{ toolCalls: [], before: () => controller.abort() }],
            decision: APPROVE_DECISION
        };

        const reason = await failureOf(run({ signal: controller.signal }));

        expect(reason).toBe("The AI review timed out.");
        expect(logger.errors).toHaveLength(0);
    });

    it("fails with the fixed error reason when something unexpected throws in the runner", async () => {
        const { run, editor, logger } = createAiStepRunnerHarness();
        editor.read = async () => {
            throw new Error("Connection reset: password=hunter2");
        };

        const reason = await failureOf(run());

        expect(reason).toBe("The AI review failed.");
        expect(reason).not.toContain("hunter2");
        expect(logger.errors).toHaveLength(1);
    });
});
```

Create `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunnerStale.test.ts`. The clock is the only thing faked (`Date`); the scripted model flips the stored review and advances it from inside the call:

```ts
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { StepRunFailure } from "@webiny/api-workflows/features/stepRun/StepRunFailure.js";
import { STEP_RUN_STALE_CHECK_INTERVAL_MS } from "@webiny/api-workflows/features/stepRun/constants.js";
import { AI_TOOL_STEP_NOT_RUNNING_MESSAGE } from "@webiny/api-workflows/features/aiTools/constants.js";
import { AI_STEP_ID } from "~tests/__helpers/aiStepFixtures.js";
import {
    AI_REVIEW_ID,
    AI_TASK,
    cancelStoredReview,
    createRunningAiReview,
    restartStoredStep
} from "~tests/__helpers/aiRunReviews.js";
import { RecordingAiTool } from "~tests/__helpers/RecordingAiTool.js";
import { APPROVE_DECISION } from "~tests/__helpers/ScriptedAi.js";
import { createAiStepRunnerHarness } from "~tests/__helpers/AiStepRunnerHarness.js";
import type { ScriptedStep } from "~tests/__helpers/ScriptedAi.js";

const failureOf = async (promise: Promise<unknown>): Promise<string> => {
    try {
        await promise;
    } catch (error) {
        if (error instanceof StepRunFailure) {
            return error.reason;
        }
        throw error;
    }
    throw new Error("The run did not fail.");
};

const echoStep = (before?: ScriptedStep["before"]): ScriptedStep => {
    return { before, toolCalls: [{ name: "echo", input: { value: "x" } }] };
};

const advance = (milliseconds: number) => () => {
    vi.advanceTimersByTime(milliseconds);
};

const createStaleHarness = () => {
    const echo = new RecordingAiTool("echo");
    const harness = createAiStepRunnerHarness({
        review: createRunningAiReview({ tools: ["echo"] }),
        tools: [echo]
    });
    return { ...harness, echo };
};

describe("AiStepRunner stale check (R175, A56, Review Focus 1)", () => {
    beforeEach(() => {
        // Only `Date` is faked: the runner reads `Date.now()` for its throttle.
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date("2026-10-14T10:00:00.000Z"));
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    describe("throttle: one read per interval", () => {
        it("reads once for every check inside one interval, with the task identity", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            // Three tool steps: six checks (a tool execute and a stop condition each) at one instant.
            ai.response = { steps: [echoStep(), echoStep(), echoStep()], decision: APPROVE_DECISION };

            await run();

            expect(staleCheck.calls).toEqual([
                { reviewId: AI_REVIEW_ID, stepId: AI_STEP_ID, task: AI_TASK }
            ]);
        });

        it("does not read again one millisecond before the interval ends", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            ai.response = {
                steps: [echoStep(), echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS - 1))],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toHaveLength(1);
        });

        it("reads again once the interval has passed", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            ai.response = {
                steps: [echoStep(), echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS))],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toHaveLength(2);
        });

        it("reads again after every further interval", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS)),
                    echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS)),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            await run();

            expect(staleCheck.calls).toHaveLength(3);
        });

        it("makes no read when the step has no tools (nothing can ask)", async () => {
            const { run, ai, staleCheck } = createAiStepRunnerHarness({
                tools: [new RecordingAiTool("echo")]
            });
            ai.response = { steps: [], decision: APPROVE_DECISION };

            await run();

            expect(staleCheck.calls).toHaveLength(0);
        });
    });

    describe("sticky: once stale, always stale", () => {
        it("keeps answering stale without reading again, even if the stored review is current again", async () => {
            const { run, ai, staleCheck, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        store.review = cancelStoredReview(current);
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                    }),
                    // Not reached: the stale stop ended the call. Listed to prove it.
                    echoStep(() => {
                        store.review = current;
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS * 2);
                    })
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            expect(staleCheck.calls).toHaveLength(2);
            expect(echo.calls).toHaveLength(1);
        });

        it("answers stale to every later tool call of the same step without another read", async () => {
            const { run, ai, staleCheck, store, echo } = createStaleHarness();
            const current = store.review;
            // Two parallel tool calls in the second step: the first sees stale, the second must too.
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [
                            { name: "echo", input: { value: "a" } },
                            { name: "echo", input: { value: "b" } }
                        ]
                    }
                ],
                decision: APPROVE_DECISION
            };

            await failureOf(run());

            expect(staleCheck.calls).toHaveLength(2);
            expect(echo.calls).toHaveLength(1);
            const refused = ai.toolResults.slice(1);
            expect(refused).toHaveLength(2);
            for (const entry of refused) {
                expect(entry.result).toEqual({
                    ok: false,
                    error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
                });
            }
        });
    });

    describe("parallel tool calls share one read", () => {
        it("answers stale to two parallel tool calls with one read: neither tool runs", async () => {
            const { run, ai, staleCheck, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                        },
                        toolCalls: [
                            { name: "echo", input: { value: "a" } },
                            { name: "echo", input: { value: "b" } }
                        ]
                    }
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            expect(staleCheck.calls).toHaveLength(1);
            expect(echo.calls).toHaveLength(0);
            expect(ai.toolResults.map(entry => entry.result)).toEqual([
                { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE },
                { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE }
            ]);
        });

        it("runs both parallel tool calls on a not stale answer with one read", async () => {
            const { run, ai, staleCheck, echo } = createStaleHarness();
            ai.response = {
                steps: [
                    {
                        toolCalls: [
                            { name: "echo", input: { value: "a" } },
                            { name: "echo", input: { value: "b" } }
                        ]
                    }
                ],
                decision: APPROVE_DECISION
            };

            const outcome = await run();

            expect(outcome.type).toBe("approved");
            expect(staleCheck.calls).toHaveLength(1);
            expect(echo.calls).toHaveLength(2);
        });
    });

    describe("a cancel or restart during the call stops it and writes nothing", () => {
        it("stops the call and writes nothing when the stored review is cancelled during the call", async () => {
            const { run, ai, store, echo, staleCheck } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        store.review = cancelStoredReview(current);
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                    }),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            // The first call ran its tool; the second was refused before the tool ran; no third.
            expect(echo.calls).toHaveLength(1);
            expect(ai.toolResults).toHaveLength(2);
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
            expect(ai.calls).toHaveLength(1);
            expect(staleCheck.calls).toHaveLength(2);
        });

        it("stops the call and writes nothing when the step is restarted under another task during the call", async () => {
            const { run, ai, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        store.review = restartStoredStep(current, "task-2");
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                    }),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            expect(echo.calls).toHaveLength(1);
            expect(ai.toolResults[1].result).toEqual({
                ok: false,
                error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE
            });
        });

        it("does not see a flip made inside the same interval (the throttle, A56: up to one interval late)", async () => {
            const { run, ai, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        store.review = cancelStoredReview(current);
                    })
                ],
                decision: APPROVE_DECISION
            };

            const outcome = await run();

            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(2);
        });

        it("does not stop a call that already reached its decision step: the handler's post-run guard refuses it", async () => {
            const { run, ai, store, echo } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        // A step with no tool calls asks no stop condition; the call ends with a decision.
                        toolCalls: []
                    }
                ],
                decision: APPROVE_DECISION
            };

            const outcome = await run();

            // No tool call and no stop condition ran after the flip (a step without tool calls asks
            // none): the decision stands here, and the handler's post-run guard refuses to apply
            // it to the cancelled review (Task 4).
            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(1);
        });

        it("checks the stale flag before reading the output when the call throws", async () => {
            const { run, ai, store, logger } = createStaleHarness();
            const current = store.review;
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        ...echoStep(() => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        }),
                        fail: new Error("The provider dropped the connection.")
                    }
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            // A stale stop is not a failure to report: no error log.
            expect(logger.errors).toHaveLength(0);
        });

        it("keeps the stale reason ahead of the timeout reason when the call throws after both", async () => {
            const { run, ai, store } = createStaleHarness();
            const current = store.review;
            const controller = new AbortController();
            ai.response = {
                steps: [
                    echoStep(),
                    {
                        before: () => {
                            store.review = cancelStoredReview(current);
                            vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                        },
                        toolCalls: [{ name: "echo", input: { value: "x" } }],
                        // Read after the step's tool calls: the signal fires and the call throws.
                        get fail() {
                            controller.abort();
                            return new Error("This operation was aborted.");
                        }
                    }
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run({ signal: controller.signal }));

            expect(controller.signal.aborted).toBe(true);
            expect(reason).toBe("The AI review was aborted.");
        });
    });

    describe("a failed read counts as not stale", () => {
        it("keeps the call going, runs the tools and approves; the runner logs nothing (the service did)", async () => {
            const { run, ai, staleCheck, echo, logger } = createStaleHarness();
            staleCheck.failure = new ReviewPersistenceError(new Error("Storage is down."));
            ai.response = {
                steps: [echoStep(), echoStep(advance(STEP_RUN_STALE_CHECK_INTERVAL_MS))],
                decision: APPROVE_DECISION
            };

            const outcome = await run();

            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(2);
            expect(logger.logs).toEqual([]);
        });

        it("treats a throwing read as not stale: the tools run, one error log, nothing reaches the model", async () => {
            const { run, ai, staleCheck, echo, logger } = createStaleHarness();
            staleCheck.throws = new Error("Unexpected stale check failure.");
            ai.response = { steps: [echoStep()], decision: APPROVE_DECISION };

            const outcome = await run();

            expect(outcome.type).toBe("approved");
            expect(echo.calls).toHaveLength(1);
            expect(logger.logs).toHaveLength(1);
            expect(logger.logs[0]).toMatchObject({
                level: "error",
                message: "Could not check whether the AI step is still running."
            });
        });

        it("still throttles: a failed read uses its slot of the interval", async () => {
            const { run, ai, staleCheck } = createStaleHarness();
            staleCheck.failure = new ReviewPersistenceError(new Error("Storage is down."));
            ai.response = { steps: [echoStep(), echoStep(), echoStep()], decision: APPROVE_DECISION };

            await run();

            expect(staleCheck.calls).toHaveLength(1);
        });

        it("stops on a later read that succeeds and says stale", async () => {
            const { run, ai, staleCheck, store, echo } = createStaleHarness();
            const current = store.review;
            staleCheck.failure = new ReviewPersistenceError(new Error("Storage is down."));
            ai.response = {
                steps: [
                    echoStep(),
                    echoStep(() => {
                        staleCheck.failure = null;
                        store.review = cancelStoredReview(current);
                        vi.advanceTimersByTime(STEP_RUN_STALE_CHECK_INTERVAL_MS);
                    }),
                    echoStep()
                ],
                decision: APPROVE_DECISION
            };

            const reason = await failureOf(run());

            expect(reason).toBe("The AI review was aborted.");
            expect(echo.calls).toHaveLength(1);
        });
    });
});
```

Modify `packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowReviewRegistration.test.ts` (Task 16). Add these imports next to the existing ones:

```ts
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";
import { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
```

In `createContainer`, right after `registerFakeWorkflowsAccess(container);`, register stubs for what the `ai` step type and runner resolve lazily (Task 17 and this task; the stubs are never called, the tests below only count registrations and read plain properties):

```ts
    // The workflows services the ai step type and runner inject. Never called here.
    container.registerInstance(
        StepRunReachService,
        {} as unknown as StepRunReachService.Interface
    );
    container.registerInstance(
        StepRunStaleCheckService,
        {} as unknown as StepRunStaleCheckService.Interface
    );
    container.registerInstance(
        WorkflowAiToolRegistryService,
        {} as unknown as WorkflowAiToolRegistryService.Interface
    );
    container.registerInstance(
        ReviewTargetEditorService,
        {} as unknown as ReviewTargetEditorService.Interface
    );
```

Replace the last test, `does not register the ai step type yet, with both flags on (R178; Task 19 registers it)`, with these (the flag matrix: Review Focus 6, R177, R178):

```ts
    it("registers the ai step type and the ai runner together with both flags on (R178)", () => {
        const container = createContainer(["aiPowerups", "advancedPublishingWorkflow"]);

        expect(container.resolveAll(StepType).map(stepType => stepType.type)).toEqual(["ai"]);
        const runners = container.resolveAll(StepRunner);
        expect(runners.map(runner => runner.type)).toEqual(["ai"]);
        expect(runners[0].singleRun).toBe(true);
    });

    it.each([
        { name: "aiPowerups on and workflows off", flags: ["aiPowerups"] },
        { name: "workflows on and aiPowerups off", flags: ["advancedPublishingWorkflow"] },
        { name: "both off", flags: [] as string[] }
    ])("registers no ai step type and no ai runner with $name", ({ flags }) => {
        const container = createContainer(flags);

        expect(container.resolveAll(StepType)).toHaveLength(0);
        expect(container.resolveAll(StepRunner)).toHaveLength(0);
    });
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunner.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunnerStale.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowReviewRegistration.test.ts 2>&1 | tail -50`
Expected: FAIL. The runner tests do not load (`Failed to resolve import "~/api/features/WorkflowReview/AiStepRunner/AiStepRunner.js"`, from the harness). `WorkflowReviewRegistration.test.ts` fails the first new test (`resolveAll(StepType)` is empty, the `ai` type and runner are not registered). `yarn test:os` does not exist for this package yet (Task 20 adds `ci.config.json`).

- [ ] **Step 3: Implement**

Create `packages/ai-powerups/src/api/features/WorkflowReview/AiStepRunner/aiRunFailureReasons.ts`. The fixed texts of R170 only the runner raises; pure. The texts shared with Task 17's `reach` (invalid configuration, tool or model not available, capability not available, review failed) are in `~/api/features/WorkflowReview/aiFailureReasons.ts`, imported below:

```ts
export const AI_REVIEW_TIMED_OUT_REASON = "The AI review timed out.";
export const AI_REVIEW_NO_DECISION_REASON = "The AI review returned no decision.";
export const AI_REVIEW_REJECTED_WITHOUT_COMMENT_REASON =
    "The AI review rejected without a comment.";

export const getAiStepLimitReason = (steps: number): string => {
    return `The AI review did not finish in ${steps} steps.`;
};
```

Create `packages/ai-powerups/src/api/features/WorkflowReview/AiStepRunner/AiStepRunner.ts`:

```ts
import { NoObjectGeneratedError, NoOutputGeneratedError, Output, stepCountIs } from "ai";
import type { ToolSet } from "ai";
import { Ai } from "@webiny/api-core/features/ai/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { getAiActor } from "@webiny/api-workflows/domain/ai/getAiActor.js";
import { REJECT_COMMENT_MIN_LENGTH } from "@webiny/api-workflows/domain/review/Review.js";
import type { Actor, ReviewStep } from "@webiny/api-workflows/domain/review/types.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import {
    AI_STEP_CONTENT_TOO_LARGE_MESSAGE,
    AI_TOOL_STEP_NOT_RUNNING_MESSAGE
} from "@webiny/api-workflows/features/aiTools/constants.js";
import type { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { ReviewTargetEditorService } from "@webiny/api-workflows/features/review/ReviewTargetEditorService/index.js";
import { StepRunFailure } from "@webiny/api-workflows/features/stepRun/StepRunFailure.js";
import { STEP_RUN_STALE_CHECK_INTERVAL_MS } from "@webiny/api-workflows/features/stepRun/constants.js";
import { StepRunner } from "@webiny/api-workflows/features/stepRun/StepRunner/index.js";
import { StepRunStaleCheckService } from "@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js";
import {
    AiCapabilityDisabledError,
    AiModelNotAvailableError,
    ResolveAiCapabilityUseCase
} from "~/api/features/Capabilities/index.js";
import {
    AI_STEP_MAX_ISSUES,
    AI_STEP_MAX_TOOL_STEPS,
    WORKFLOWS_REVIEW_CAPABILITY_ID
} from "../constants.js";
import { aiStepConfigSchema } from "../aiStepConfigSchema.js";
import { buildAiStepPrompt, exceedsAiInputLimit } from "../buildAiStepPrompt.js";
import type { AiStepPreviousComment } from "../buildAiStepPrompt.js";
import { aiReviewOutputSchema, normalizeAiIssues } from "../aiReviewOutputSchema.js";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "../aiFailureReasons.js";
import {
    AI_REVIEW_NO_DECISION_REASON,
    AI_REVIEW_REJECTED_WITHOUT_COMMENT_REASON,
    AI_REVIEW_TIMED_OUT_REASON,
    getAiStepLimitReason
} from "./aiRunFailureReasons.js";

/**
 * Runs one `ai` step (R170, R171, R175; spec 7.3): one `generateText` call with the structured
 * decision output and the step's allowlisted tools, then the outcome the handler applies after
 * its own re-guard. It never writes: the only writer is the `updateTargetFields` tool, which
 * re-guards itself (R173). Every failure is a `StepRunFailure` with a fixed text; raw errors are
 * logged here and never stored or shown to the model (R87).
 *
 * The call can run for minutes. A cancel or a restart under another task is noticed through
 * `StepRunStaleCheckService`, called through one per-run closure before every tool execution and
 * in a stop condition, at most once per `STEP_RUN_STALE_CHECK_INTERVAL_MS`, sticky once it said
 * stale, and shared by parallel callers, with local state only (the SDK swallows throws from
 * `onStepFinish`, so the flag is read after the call, before any output). A failed read counts as
 * not stale: the post-run guard protects the write.
 */
class AiStepRunnerImpl implements StepRunner.Interface {
    public readonly type = AI_STEP_TYPE;
    public readonly singleRun = true;
    public readonly failureReasons: StepRunner.FailureReasons = {
        error: AI_REVIEW_FAILED_REASON,
        aborted: "The AI review was aborted.",
        stuck: "The AI review task ended without a result."
    };

    public constructor(
        private resolveCapability: ResolveAiCapabilityUseCase.Interface,
        private ai: Ai.Interface,
        private editors: ReviewTargetEditorService.Interface,
        private tools: WorkflowAiToolRegistryService.Interface,
        private staleCheck: StepRunStaleCheckService.Interface,
        private logger: Logger.Interface
    ) {}

    public maxIterationsReason(): string {
        // The AI task is one iteration (A56): the ceiling is never reached.
        return this.failureReasons.error;
    }

    public getActor(requester: Actor): Actor {
        return getAiActor(requester);
    }

    public async run(params: StepRunner.Params): Promise<StepRunner.Outcome> {
        const { review, step, requester, task, iteration, signal } = params;
        const logFields = { taskId: task.id, reviewId: review.id, stepId: step.id };

        try {
            // 1. One iteration only; the handler refuses a re-entered task too (R170).
            if (iteration > 1) {
                this.logger.info(
                    { ...logFields, iteration },
                    "Refused to run an AI review task again."
                );
                throw new StepRunFailure(this.failureReasons.error);
            }

            // 2. The handler fires the signal at once when the remaining runtime is nearly gone.
            if (signal.aborted) {
                throw new StepRunFailure(AI_REVIEW_TIMED_OUT_REASON);
            }

            // 3. Everything comes from the review snapshot, never from the task input (R148).
            const config = aiStepConfigSchema.safeParse(step.config);
            if (!config.success) {
                throw new StepRunFailure(AI_STEP_INVALID_CONFIGURATION_REASON);
            }

            // 4. The tool set is the allowlist and nothing else (D55, Review Focus 2).
            // `Interface` defaults `TInput` to `unknown` (Task 7), which is what `execute` below passes.
            const allowlisted: WorkflowAiTool.Interface[] = [];
            for (const name of config.data.tools) {
                const registered = this.tools.get(name);
                if (!registered) {
                    throw new StepRunFailure(aiToolNotAvailableReason(name));
                }
                if (!allowlisted.includes(registered)) {
                    allowlisted.push(registered);
                }
            }

            // 5. The capability and the model the author picked (R169). The split of logs is
            // Task 17's `reach`: a model that is not available is an expected typed state and a
            // disabled capability is a decision (D40), neither is logged; anything else is logged
            // once here with the raw error (`ConfiguredAiModelsService` may have logged its own
            // failed read too: the accepted double log, 2 error logs for a failed settings read).
            const resolved = await this.resolveCapability.execute(
                WORKFLOWS_REVIEW_CAPABILITY_ID,
                config.data.model
            );
            if (resolved.isFail()) {
                if (resolved.error instanceof AiModelNotAvailableError) {
                    throw new StepRunFailure(aiModelNotAvailableReason(config.data.model));
                }
                if (!(resolved.error instanceof AiCapabilityDisabledError)) {
                    this.logger.error(
                        { error: resolved.error, ...logFields },
                        "Could not resolve the AI review capability."
                    );
                }
                // A disabled capability, unresolved settings, an unknown capability or a failed
                // model list read: one fixed text (D40). The raw message never reaches the step.
                throw new StepRunFailure(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            }
            const capability = resolved.value;

            // 6. The target, from the snapshot (adapters log their real errors, Task 9).
            const content = await this.editors.read({
                model: review.model,
                targetId: review.targetId,
                targetRevisionId: review.targetRevisionId
            });
            if (content.isFail()) {
                this.logger.info(
                    { ...logFields, reason: content.error.message },
                    "The AI review could not read the target."
                );
                throw new StepRunFailure(this.failureReasons.error);
            }

            // 7. The prompt and the input cap: never truncate (R175).
            const previousComments: AiStepPreviousComment[] = [];
            for (const earlier of review.steps) {
                if (earlier.id === step.id) {
                    break;
                }
                const comment = earlier.comment?.trim() ?? "";
                if ((earlier.state === "approved" || earlier.state === "rejected") && comment !== "") {
                    previousComments.push({
                        stepTitle: earlier.title,
                        actor: earlier.owner?.displayName ?? "(no name)",
                        comment
                    });
                }
            }
            const prompt = buildAiStepPrompt({
                systemGuidance: capability.guidance,
                additionalInstructions: capability.additionalInstructions,
                instructions: config.data.instructions,
                content: content.value,
                previousComments
            });
            if (exceedsAiInputLimit(prompt)) {
                throw new StepRunFailure(AI_STEP_CONTENT_TOO_LARGE_MESSAGE);
            }

            // 8. The stale state of this call (R175, Review Focus 1): one closure per run holding
            // the throttle, the sticky flag and the read in flight. Parallel callers (two tool
            // calls of one step, or a tool and the stop condition) await the same read.
            let stale = false;
            let lastStaleCheckAt: number | null = null;
            let readInFlight: Promise<void> | null = null;
            const checkStale = async (): Promise<boolean> => {
                if (stale) {
                    return true;
                }
                if (readInFlight) {
                    await readInFlight;
                    return stale;
                }
                if (
                    lastStaleCheckAt !== null &&
                    Date.now() - lastStaleCheckAt < STEP_RUN_STALE_CHECK_INTERVAL_MS
                ) {
                    return false;
                }
                lastStaleCheckAt = Date.now();
                readInFlight = (async () => {
                    try {
                        const checked = await this.staleCheck.isStale({
                            reviewId: review.id,
                            stepId: step.id,
                            task
                        });
                        // A failed read is not stale: keep going (the service logged it).
                        if (checked.isOk() && checked.value) {
                            stale = true;
                        }
                    } catch (error) {
                        // The service returns Results; a throw is unexpected. Not stale, logged
                        // once here, never handed to the AI SDK (R87).
                        this.logger.error(
                            { error, ...logFields },
                            "Could not check whether the AI step is still running."
                        );
                    }
                })();
                try {
                    await readInFlight;
                } finally {
                    readInFlight = null;
                }
                return stale;
            };

            // The AI SDK tool set, one entry per allowlisted tool (the shape `AiSdkTools` builds).
            // The context comes from the run, never from the model's input (Review Focus 2).
            const toolSet: ToolSet = {};
            for (const workflowTool of allowlisted) {
                toolSet[workflowTool.name] = {
                    description: workflowTool.description,
                    inputSchema: workflowTool.inputSchema,
                    execute: async (input: unknown) => {
                        if (await checkStale()) {
                            return { ok: false, error: AI_TOOL_STEP_NOT_RUNNING_MESSAGE };
                        }
                        try {
                            return await workflowTool.execute(input, {
                                review,
                                step,
                                requester,
                                task
                            });
                        } catch (error) {
                            // A custom tool threw (R87): the SDK would show its raw message to
                            // the model.
                            this.logger.error(
                                { error, ...logFields, tool: workflowTool.name },
                                "An AI tool threw."
                            );
                            return {
                                ok: false,
                                error: `The tool "${workflowTool.name}" failed.`
                            };
                        }
                    }
                };
            }

            // 9. The call.
            let result: Awaited<ReturnType<Ai.Interface["generateText"]>> | undefined;
            let callError: unknown = null;
            try {
                result = await this.ai.generateText({
                    model: capability.model,
                    connection: capability.connection,
                    system: prompt.system,
                    prompt: prompt.user,
                    abortSignal: signal,
                    output: Output.object({ schema: aiReviewOutputSchema, name: "decision" }),
                    ...(allowlisted.length > 0
                        ? {
                              tools: toolSet,
                              stopWhen: [
                                  stepCountIs(AI_STEP_MAX_TOOL_STEPS),
                                  checkStale
                              ]
                          }
                        : {})
                });
            } catch (error) {
                callError = error;
            }

            // 10. A cancel or restart seen during the call wins over everything the call
            // produced, and is checked before any output is read: a stopped call has none (R175).
            if (stale) {
                throw new StepRunFailure(this.failureReasons.aborted);
            }

            // 11. A call that threw.
            if (!result) {
                if (signal.aborted) {
                    throw new StepRunFailure(AI_REVIEW_TIMED_OUT_REASON);
                }
                if (
                    NoObjectGeneratedError.isInstance(callError) ||
                    NoOutputGeneratedError.isInstance(callError)
                ) {
                    throw new StepRunFailure(AI_REVIEW_NO_DECISION_REASON);
                }
                this.logger.error(
                    { error: callError, ...logFields },
                    "The AI review call failed."
                );
                throw new StepRunFailure(this.failureReasons.error);
            }

            // 12. The structured output.
            let output: unknown;
            try {
                output = result.output;
            } catch (error) {
                if (
                    NoOutputGeneratedError.isInstance(error) ||
                    NoObjectGeneratedError.isInstance(error)
                ) {
                    const last = result.steps[result.steps.length - 1];
                    const hitStepCap =
                        result.steps.length >= AI_STEP_MAX_TOOL_STEPS &&
                        (last?.toolCalls.length ?? 0) > 0;
                    throw new StepRunFailure(
                        hitStepCap
                            ? getAiStepLimitReason(AI_STEP_MAX_TOOL_STEPS)
                            : AI_REVIEW_NO_DECISION_REASON
                    );
                }
                throw error;
            }
            const decision = aiReviewOutputSchema.safeParse(output);
            if (!decision.success) {
                throw new StepRunFailure(AI_REVIEW_NO_DECISION_REASON);
            }

            // 13. The outcome (R171, D100). The handler applies it after its own re-guard.
            if (decision.data.issues.length > AI_STEP_MAX_ISSUES) {
                this.logger.info(
                    { ...logFields, count: decision.data.issues.length },
                    "Dropped the AI issues over the cap."
                );
            }
            const issues = normalizeAiIssues(decision.data.issues);
            const comment = decision.data.comment.trim();
            if (decision.data.approved) {
                return comment === ""
                    ? { type: "approved", issues }
                    : { type: "approved", comment, issues };
            }
            if (comment.length < REJECT_COMMENT_MIN_LENGTH) {
                throw new StepRunFailure(AI_REVIEW_REJECTED_WITHOUT_COMMENT_REASON);
            }
            return { type: "rejected", comment, issues };
        } catch (error) {
            if (error instanceof StepRunFailure) {
                throw error;
            }
            // 14. Nothing but a `StepRunFailure` leaves this runner (R87).
            this.logger.error({ error, ...logFields }, "The AI review threw.");
            throw new StepRunFailure(this.failureReasons.error);
        }
    }
}

export const AiStepRunner = StepRunner.createImplementation({
    implementation: AiStepRunnerImpl,
    dependencies: [
        ResolveAiCapabilityUseCase,
        Ai,
        ReviewTargetEditorService,
        WorkflowAiToolRegistryService,
        StepRunStaleCheckService,
        Logger
    ]
});
```

Create `packages/ai-powerups/src/api/features/WorkflowReview/AiStepRunner/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { AiStepRunner } from "./AiStepRunner.js";

/** The `StepRunner` for `ai` steps. Registered by `Extension.ts` inside the combined gate (R177, R178). */
export const AiStepRunnerFeature = createFeature({
    name: "AiPowerUps/AiStepRunner",
    register(container) {
        container.register(AiStepRunner);
    }
});
```

In `packages/ai-powerups/src/api/Extension.ts` add the imports next to the other workflow review imports Task 16 added (`WorkflowsReviewCapability`, `ListWorkflowAiModelsFeature`, `ListWorkflowAiModelsSchema`):

```ts
import { AiStepType } from "./features/WorkflowReview/AiStepType/AiStepType.js";
import { AiStepRunnerFeature } from "./features/WorkflowReview/AiStepRunner/feature.js";
```

and extend the end of the second gate (everything before it stays as Task 16 left it). The type and the runner register together, last (R178):

```ts
        container.register(WorkflowsReviewCapability);
        ListWorkflowAiModelsFeature.register(container);
        container.register(ListWorkflowAiModelsSchema);

        /*
         * The `ai` step type and its runner register together, last (R178): nothing above can
         * save an AI step that no runner can run. With the type registered `listStepTypes` reads
         * the `ai` row from the registry (R166), and `Extension.register` has returned above
         * unless both `aiPowerups` and `advancedPublishingWorkflow` are on (R177).
         */
        container.register(AiStepType);
        AiStepRunnerFeature.register(container);
    }
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunner.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/AiStepRunnerStale.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowReviewRegistration.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p ai-powerups --report cli 2>&1 | tail -40`
Expected: no errors. `WorkflowAiTool.Interface` defaults `TInput` to `unknown` (Task 7), so `allowlisted` needs no `any`; if the compiler still objects to a registry return type, type it `WorkflowAiTool.Interface<any>[]` (the only place an `any` is allowed here). Two places may need the cast fallback the earlier tasks use if the compiler objects to a variance the runtime does not have: the plain `{ description, inputSchema, execute }` entries assigned into `ToolSet` (`AiSdkTools` in api-core does the same and compiles), and the `output` property of the `generateText` parameters (build the params object first and pass it `as Ai.GenerateTextParams`). `ScriptedAi.createResult` already casts its fake result through `unknown`, like a test helper may.

- [ ] **Step 5: Run the existing tests covering the changed code**

`Extension.ts` changed (two registrations inside the combined gate) and Task 16's registration test changed:

Run: `yarn test packages/ai-powerups/__tests__/features/WorkflowReview/buildAiStepPrompt.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/aiReviewOutputSchema.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowsReviewCapability.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/ListWorkflowAiModelsUseCase.test.ts packages/ai-powerups/__tests__/graphql/ListWorkflowAiModelsSchema.test.ts packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsRegistration.test.ts packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityModel.test.ts 2>&1 | tail -50`
Expected: PASS. Plus Task 17's test files `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts`, `aiFailureReasons.test.ts` and `aiStepConfigSchema.test.ts` in the same folder (`AiStepType` registers on its own container and does not go through `Extension.ts`).

The `ListWorkflowStepTypes` placeholder test already has its registered case (`lets a registered ai type replace the placeholder row without reading the flag`); run it and the phase 5 step run tests to prove the api-workflows side is untouched:

Run: `yarn test packages/api-workflows/__tests__/config/ListWorkflowStepTypes.test.ts packages/api-workflows/__tests__/stepRun/WorkflowStepRunTaskRun.test.ts 2>&1 | tail -50`
Expected: PASS (no api-workflows file changed in this task).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (`yarn adio` clean: `ai`, `zod` and `@webiny/api-workflows` are existing dependencies, nothing new; build `@webiny/ai-powerups` with `--no-cache`; restore `.gitleaks.toml`), then commit:

```
feat(ai-powerups): add the AI step runner and register the ai step type

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
