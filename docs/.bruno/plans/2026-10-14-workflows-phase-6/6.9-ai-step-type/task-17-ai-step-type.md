### Task 17: `AiStepType` and `aiStepConfigSchema`

Spec 4.1, 5.2, 7.1, 7.3; D40, D101, D109; R87, R131, R164, R165, R166, R169, R170, R178; Review Focus 2 (allowlist validation: a step can only name registered tools), Review Focus 6 (the model check reads the one model source). The `ai` step type: its config schema, the pure save-time validation (R165), the async model check `checkConfig` (Task 14 hook) and the reach (R170), built and tested on its own container. It is NOT registered (R178): no workflow can save an `ai` step that the runner cannot run until Task 19 registers the type and the runner together.

- `WorkflowReview/aiStepConfigSchema.ts`: `aiStepConfigSchema = z.object({ instructions: z.string().meta({ ui: "textarea" }), model: z.string(), tools: z.array(z.string()).default([]) })` and `type AiStepConfig` (R164, R166). It is the type's `configSchema`; `listStepTypes` turns it into `z.toJSONSchema(aiStepConfigSchema, { io: "input", unrepresentable: "any" })` (`instructions` carries `ui: "textarea"`, `tools` is not required because of its default). It parses the stored config at reach and at check time; the save-time texts below come from `validate`, not from this schema.
- `AiStepType/AiStepType.ts`: `StepType` with `type = AI_STEP_TYPE` (`"ai"`, Task 1), `title = "AI"`, `configSchema = aiStepConfigSchema`, dependencies `[WorkflowAiToolRegistryService, ConfiguredAiModelsService, ResolveAiCapabilityUseCase, StepRunReachService, Logger]`.
  - `describeAvailability()`: always `{ available: true, unavailableReason: null }` (R166: with the type registered, the row is available; Task 19 registers it only inside the combined gate, so an unavailable placeholder row stays for every other case).
  - `validate({ step })` is pure of I/O and synchronous (R131). Checked in this order, each a `WorkflowValidationError` with the exact text: `Step "<title>" needs instructions.` (`config` is not an object, or `instructions` is not a string, or it is empty after trim; no minimum length, no default prompt, D109); `Step "<title>" needs a model.` (`model` is not a string or is empty after trim); `Step "<title>" has an invalid AI configuration.` (`tools` is present, not `null` and not an array of strings: R165 names no text for this case, so this is one added text, see "Contract deviations" in the reply); `Step "<title>" uses the AI tool "<name>", which is not defined.` (the first `tools` entry, in first-seen order, for which `WorkflowAiToolRegistryService.get(name)` returns `null`; a tool name with an invalid name was dropped and logged by the registry (Task 7), so it is "not defined" here, nothing throws). A duplicate `tools` entry is deduplicated, not an error. `tools` missing or `null` is `[]`. The step is stored as entered: `config` becomes exactly `{ instructions, model, tools }` with `instructions` untouched (the author's whitespace and line breaks), `model` trimmed and `tools` deduplicated in first-seen order; other keys of the incoming config are dropped. Review Focus 2: the allowlist can name only tools the registry knows, pinned by the unknown-tool and the invalid-name cases.
  - `checkConfig({ step })` (Task 14 hook; runs only for a new or changed step, after `validate`): parses the (already normalised) config (an unparsable one is `Step "<title>" has an invalid AI configuration.`, unreachable after `validate`, kept fail-closed), reads `ConfiguredAiModelsService.list()` (R169) and fails with `Step "<title>" uses the model "<model>", which is not available.` when no listed `id` equals `config.model` (exact, case-sensitive). **The service logs, this type does not.** `list()` logs its own failure once with the raw error and returns a failed `Result` carrying a fixed-text `Error`; `checkConfig` answers a failed `Result` with the fixed text `Step "<title>" could not be checked: the configured AI models could not be loaded.` (a `WorkflowValidationError`, so the editor shows it and the author can retry) and does NOT log it again; the raw provider or settings error never reaches the save response. The service does not throw, so there is no `try`/`catch` here; a throw anyway is left to `StoreWorkflowUseCase`, which turns it into a `WorkflowPersistenceError` (Task 14, R87).
  - `reach({ review, step, actor, now })` (R170): every text below comes from the one shared file `WorkflowReview/aiFailureReasons.ts` (below); reach and its tests import them, nothing here repeats a literal. `failure` is the first of these that applies, in this order: the config no longer parses -> `AI_STEP_INVALID_CONFIGURATION_REASON` (`The AI step configuration is not valid.`); an allowlisted tool is no longer registered (`get(name) === null`, first in config order) -> `aiToolNotAvailableReason(name)` (`The AI tool "<name>" is not available.`); then `ResolveAiCapabilityUseCase.execute(WORKFLOWS_REVIEW_CAPABILITY_ID, config.model)` (Task 15): a failed `Result` with `AiModelNotAvailableError` -> `aiModelNotAvailableReason(model)` (`The model "<model>" is not available.`; not logged: a typed, expected state); with `AiCapabilityDisabledError` -> `AI_CAPABILITY_NOT_AVAILABLE_REASON` (`The AI review capability is not available.`; not logged: a decision someone made, D40); any other failed `Result` (unknown capability, settings unresolved, no key) -> `AI_CAPABILITY_NOT_AVAILABLE_REASON` and one `Logger.error({ error, reviewId, stepId }, "Could not resolve the AI review capability.")` with the raw error; a throw (e.g. the key could not be decrypted) -> `AI_REVIEW_FAILED_REASON` (`The AI review failed.`) and the same log. Reach resolves the capability (which decrypts the key) only to validate that the step is usable; the resolution is not passed on, the runner resolves again (Task 19). Then it always calls `StepRunReachService.reach({ review, step, actor, owner: getAiActor(review.toData().createdBy), now, failure, startFailure: AI_REVIEW_NOT_STARTED_REASON })` (Task 2: with `failure` set no task is triggered and the step fails restartable; with `null` the task is triggered as the requester) and returns its `Result` unchanged (R159). The owner is the AI actor built from the requester (R164, D58), never from `actor`. The raw resolver message never reaches the step (R146 mirror).
- `WorkflowReview/aiFailureReasons.ts` (R170, one source of the fixed step-failure texts): `AI_STEP_INVALID_CONFIGURATION_REASON` ("The AI step configuration is not valid."), `aiToolNotAvailableReason(name)` (`The AI tool "<name>" is not available.`), `aiModelNotAvailableReason(model)` (`The model "<model>" is not available.`), `AI_CAPABILITY_NOT_AVAILABLE_REASON` ("The AI review capability is not available."), `AI_REVIEW_FAILED_REASON` ("The AI review failed."), `AI_REVIEW_NOT_STARTED_REASON` ("The AI review could not be started."). This task's reach uses all six; Task 19's runner imports the ones it needs from here and keeps only its runner-only texts (timed out, no decision, rejected without a comment, step limit) in `AiStepRunner/aiRunFailureReasons.ts`.
- Not registered here (R178). Tests register `AiStepType` on their own bare container; `Extension.ts` is untouched (Task 16's registration test already pins that no `StepType` is registered with both flags on, and Task 19 changes that assertion when it registers the type).

**Files:**
- Create: `packages/ai-powerups/src/api/features/WorkflowReview/aiStepConfigSchema.ts`
- Create: `packages/ai-powerups/src/api/features/WorkflowReview/aiFailureReasons.ts`
- Create: `packages/ai-powerups/src/api/features/WorkflowReview/AiStepType/AiStepType.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/aiStepFixtures.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeWorkflowAiToolRegistry.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeResolveAiCapability.ts`
- Create: `packages/ai-powerups/__tests__/__helpers/FakeStepRunReachService.ts`
- Create: `packages/ai-powerups/__tests__/features/WorkflowReview/aiStepConfigSchema.test.ts`
- Create: `packages/ai-powerups/__tests__/features/WorkflowReview/aiFailureReasons.test.ts`
- Create: `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts`

**Interfaces:**
- Consumes:
  - Task 1: `AI_STEP_TYPE` (`@webiny/api-workflows/domain/workflow/stepTypes.js`), `getAiActor(requester: Actor): Actor` (`@webiny/api-workflows/domain/ai/getAiActor.js`).
  - Task 2: `StepRunReachService` (`@webiny/api-workflows/features/stepRun/StepRunReachService/index.js`; `reach(params): Promise<Result<void, ReviewInvalidStateError | ReviewStepNotCurrentError>>`, namespace types `Interface`, `Params`, `Error`).
  - Task 7: `WorkflowAiToolRegistryService` (`@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js`; `get(name): WorkflowAiTool.Interface | null`, `list()`), `WorkflowAiTool` (`@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js`).
  - Task 14: `StepType.checkConfig?(params: StepType.ValidateParams): Promise<Result<void, WorkflowValidationError>>`.
  - Task 15: `ConfiguredAiModelsService` (`~/api/features/ConfiguredAiModels/index.js`), `ConfiguredAiModelsFeature` (`~/api/features/ConfiguredAiModels/feature.js`), `ResolveAiCapabilityUseCase.execute(capabilityId, model?)`, `AiModelNotAvailableError`, `AiCapabilityDisabledError` (both from `~/api/features/Capabilities/index.js`); test helpers `registerFakeAiPowerUpsSettings`, `createAiPowerUpsSettings`, `createConnectionPreset` (`~tests/__helpers/FakeAiPowerUpsSettings.js`), `registerFakeAi`, `createAiModel`, `registerFakeLogger` (`~tests/__helpers/FakeAi.js`).
  - Task 16: `WORKFLOWS_REVIEW_CAPABILITY_ID` (`~/api/features/WorkflowReview/constants.js`).
  - Existing (api-workflows, public paths): `StepType` (`@webiny/api-workflows/features/stepTypes/StepType/index.js`; `IStepType`, namespace `Interface`, `ValidateParams`, `ReachParams`), `WorkflowValidationError` (`domain/workflow/errors.js`), `Review` (`domain/review/Review.js`; `Review.request(params)`, `toData()`), `ReviewStepNotCurrentError` (`domain/review/errors.js`), types `Actor`, `TargetContext` (`domain/review/types.js`), `Workflow`, `WorkflowStep`, `WorkflowValues` (`domain/workflow/types.js`), `Logger` (`@webiny/api-core/features/logger/index.js`).
- Produces (matches the contract):
  - `aiStepConfigSchema`, `type AiStepConfig` (`~/api/features/WorkflowReview/aiStepConfigSchema.js`). Consumed by Task 19 (`AiStepRunner` parses the stored config with it).
  - `aiFailureReasons.ts` (`~/api/features/WorkflowReview/aiFailureReasons.js`): `AI_STEP_INVALID_CONFIGURATION_REASON` ("The AI step configuration is not valid."), `aiToolNotAvailableReason(name)` (`The AI tool "<name>" is not available.`), `aiModelNotAvailableReason(model)` (`The model "<model>" is not available.`), `AI_CAPABILITY_NOT_AVAILABLE_REASON` ("The AI review capability is not available."), `AI_REVIEW_FAILED_REASON` ("The AI review failed."), `AI_REVIEW_NOT_STARTED_REASON` ("The AI review could not be started."). The one source of these texts: consumed by this task's reach and tests and by Task 19 (`AiStepRunner` imports the ones it needs; its own `aiRunFailureReasons.ts` keeps only runner-only texts).
  - `AiStepType` (`~/api/features/WorkflowReview/AiStepType/AiStepType.js`): the `StepType` implementation above, not registered. Consumed by Task 19 (registers it), Task 20.
  - Test helpers `aiStepFixtures.ts` (`NOW`, `ARTICLE_MODEL`, `AI_STEP_ID`, `AI_MODEL`, `requester`, `targetContext`, `createAiStepConfig`, `createAiStep`, `createAiWorkflowValues`, `createAiReview`, `paramsFor`), `FakeWorkflowAiToolRegistry.ts` (`createFakeAiTool`, `registerFakeWorkflowAiToolRegistry`), `FakeResolveAiCapability.ts` (`createResolvedCapability`, `registerFakeResolveAiCapability`), `FakeStepRunReachService.ts` (`registerFakeStepRunReachService`), all under `~tests/__helpers/`, reused by Tasks 19 and 20.

- [ ] **Step 1: Write the failing tests**

Create `packages/ai-powerups/__tests__/__helpers/aiStepFixtures.ts`:

```ts
import { Review } from "@webiny/api-workflows/domain/review/Review.js";
import type { Actor, TargetContext } from "@webiny/api-workflows/domain/review/types.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import type {
    Workflow,
    WorkflowStep,
    WorkflowValues
} from "@webiny/api-workflows/domain/workflow/types.js";
import type { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";

export const NOW = "2026-10-09T10:00:00.000Z";
export const ARTICLE_MODEL = "cms.article";
export const AI_STEP_ID = "ai-check";
export const AI_MODEL = "anthropic/claude-a";

export const requester: Actor = {
    type: "user",
    id: "user-requester",
    displayName: "Rita Requester",
    identityType: "admin"
};

export const targetContext: TargetContext = {
    folder: { id: "folder-1", type: "cms:article" },
    modelId: "article",
    title: "Article 1",
    author: { id: "user-requester", displayName: "Rita Requester" }
};

export const createAiStepConfig = (overrides: Record<string, unknown> = {}): Record<string, unknown> => {
    return {
        instructions: "Check that the tone is friendly.",
        model: AI_MODEL,
        tools: [],
        ...overrides
    };
};

export interface AiStepFixtureParams {
    id?: string;
    title?: string;
    config?: unknown;
}

/** A workflow step of type "ai"; `config` defaults to a valid one when the key is not given. */
export const createAiStep = (params: AiStepFixtureParams = {}): WorkflowStep => {
    return {
        id: params.id ?? AI_STEP_ID,
        title: params.title ?? "AI check",
        color: "#3b82f6",
        type: AI_STEP_TYPE,
        notifications: [],
        config: "config" in params ? params.config : createAiStepConfig()
    };
};

export const createAiWorkflowValues = (step: WorkflowStep): WorkflowValues => {
    return { id: "workflow-1", name: "Article review", models: [ARTICLE_MODEL], steps: [step] };
};

/** What `validate` and `checkConfig` receive for one step of a one-step workflow. */
export const paramsFor = (step: WorkflowStep): StepType.ValidateParams => {
    return { step, workflow: createAiWorkflowValues(step) };
};

export interface AiReviewFixtureParams {
    /** The stored config of the AI step; passing the key with `undefined` is a config that is missing. */
    config?: unknown;
    requester?: Actor;
}

/** Requested, nothing reached: the AI step is the pending first step of a one-step workflow. */
export const createAiReview = (params: AiReviewFixtureParams = {}): Review => {
    const step = createAiStep("config" in params ? { config: params.config } : {});
    const workflow: Workflow = {
        ...createAiWorkflowValues(step),
        createdOn: NOW,
        savedOn: NOW,
        createdBy: { id: "admin", displayName: "Admin", type: "admin" },
        savedBy: { id: "admin", displayName: "Admin", type: "admin" }
    };
    const requested = Review.request({
        id: "review-1",
        workflow,
        model: ARTICLE_MODEL,
        targetId: "article-1",
        targetRevisionId: "article-1#0001",
        title: "Article 1",
        targetContext,
        picks: [],
        requester: params.requester ?? requester,
        now: NOW
    });
    if (requested.isFail()) {
        throw requested.error;
    }
    return requested.value;
};
```

Create `packages/ai-powerups/__tests__/__helpers/FakeWorkflowAiToolRegistry.ts`:

```ts
import { z } from "zod";
import type { Container } from "@webiny/di";
import { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";

/** A tool that does nothing: only its name matters to the step type. */
export const createFakeAiTool = (name: string): WorkflowAiTool.Interface => {
    return {
        name,
        title: `${name} title`,
        description: `${name} description`,
        inputSchema: z.object({}),
        execute: async () => {
            return { ok: true };
        }
    };
};

/**
 * Registers a `WorkflowAiToolRegistryService` that knows exactly `names`; any other name is
 * `null`, like the real registry for a name that is not registered (or was dropped as invalid).
 * Returns the names `get` was asked for, in order.
 */
export const registerFakeWorkflowAiToolRegistry = (container: Container, names: string[]) => {
    const tools = names.map(createFakeAiTool);
    const asked: string[] = [];
    container.registerInstance(WorkflowAiToolRegistryService, {
        get: (name: string) => {
            asked.push(name);
            return tools.find(tool => tool.name === name) ?? null;
        },
        list: () => tools
    });
    return { asked };
};
```

Create `packages/ai-powerups/__tests__/__helpers/FakeResolveAiCapability.ts`:

```ts
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { ResolveAiCapabilityUseCase } from "~/api/features/Capabilities/index.js";

export const createResolvedCapability = (model: string): ResolveAiCapabilityUseCase.Resolution => {
    return {
        capabilityId: "workflows.review",
        model,
        connection: { sdkName: "anthropic", apiKey: "decrypted:key" },
        roleId: null,
        fellBackToStandard: false,
        guidance: "Guidance.",
        additionalInstructions: ""
    };
};

export interface ResolveCall {
    capabilityId: string;
    model: string | undefined;
}

/** What the fake answers for a call; by default the capability resolved on the model given. */
export type ResolveOutcome = (
    model: string | undefined
) => Promise<Result<ResolveAiCapabilityUseCase.Resolution, Error>>;

/** Registers a `ResolveAiCapabilityUseCase` that records its calls. Nothing is decrypted or read. */
export const registerFakeResolveAiCapability = (
    container: Container,
    outcome?: ResolveOutcome
) => {
    const calls: ResolveCall[] = [];
    container.registerInstance(ResolveAiCapabilityUseCase, {
        execute: async (capabilityId: string, model?: string) => {
            calls.push({ capabilityId, model });
            if (outcome) {
                return outcome(model);
            }
            return Result.ok(createResolvedCapability(model ?? "anthropic/claude-a"));
        }
    });
    return { calls };
};
```

Create `packages/ai-powerups/__tests__/__helpers/FakeStepRunReachService.ts`:

```ts
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";

type ReachResult = Awaited<ReturnType<StepRunReachService.Interface["reach"]>>;

/**
 * Registers a `StepRunReachService` that records what it was asked to reach and answers `result`
 * (ok by default). The real service is Task 2's and is tested there; these tests only pin what the
 * AI step type hands to it.
 */
export const registerFakeStepRunReachService = (
    container: Container,
    result: ReachResult = Result.ok()
) => {
    const calls: StepRunReachService.Params[] = [];
    container.registerInstance(StepRunReachService, {
        reach: async (params: StepRunReachService.Params) => {
            calls.push(params);
            return result;
        }
    });
    return { calls };
};
```

Create `packages/ai-powerups/__tests__/features/WorkflowReview/aiStepConfigSchema.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { z } from "zod";
import { aiStepConfigSchema } from "~/api/features/WorkflowReview/aiStepConfigSchema.js";

describe("aiStepConfigSchema (R164, R166)", () => {
    it("defaults tools to an empty list", () => {
        const parsed = aiStepConfigSchema.safeParse({
            instructions: "Check the tone.",
            model: "anthropic/claude-a"
        });

        expect(parsed.success).toBe(true);
        expect(parsed.data).toEqual({
            instructions: "Check the tone.",
            model: "anthropic/claude-a",
            tools: []
        });
    });

    it("keeps the tools it is given and drops unknown keys", () => {
        const parsed = aiStepConfigSchema.safeParse({
            instructions: "Check the tone.",
            model: "anthropic/claude-a",
            tools: ["readTarget"],
            extra: true
        });

        expect(parsed.data).toEqual({
            instructions: "Check the tone.",
            model: "anthropic/claude-a",
            tools: ["readTarget"]
        });
    });

    it.each([
        ["no config", undefined],
        ["a string", "text"],
        ["no instructions", { model: "m" }],
        ["no model", { instructions: "i" }],
        ["instructions that are not a string", { instructions: 1, model: "m" }],
        ["tools that are not a list", { instructions: "i", model: "m", tools: "readTarget" }],
        ["a tool that is not a string", { instructions: "i", model: "m", tools: [1] }]
    ])("refuses %s", (_label, config) => {
        expect(aiStepConfigSchema.safeParse(config).success).toBe(false);
    });

    it("describes itself as the editor's input: two required keys and a textarea (R166)", () => {
        const json = z.toJSONSchema(aiStepConfigSchema, {
            io: "input",
            unrepresentable: "any"
        }) as unknown as {
            properties: Record<string, Record<string, unknown>>;
            required: string[];
        };

        expect(json.required).toEqual(["instructions", "model"]);
        expect(json.properties.instructions).toEqual({ type: "string", ui: "textarea" });
        expect(json.properties.model).toEqual({ type: "string" });
        expect(json.properties.tools).toMatchObject({ type: "array", items: { type: "string" } });
    });
});
```

Create `packages/ai-powerups/__tests__/features/WorkflowReview/aiFailureReasons.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_REVIEW_NOT_STARTED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "~/api/features/WorkflowReview/aiFailureReasons.js";

describe("aiFailureReasons (R170)", () => {
    it("pins the exact texts the step and the runner show", () => {
        expect(AI_STEP_INVALID_CONFIGURATION_REASON).toBe("The AI step configuration is not valid.");
        expect(aiToolNotAvailableReason("readTarget")).toBe('The AI tool "readTarget" is not available.');
        expect(aiModelNotAvailableReason("anthropic/claude-a")).toBe(
            'The model "anthropic/claude-a" is not available.'
        );
        expect(AI_CAPABILITY_NOT_AVAILABLE_REASON).toBe("The AI review capability is not available.");
        expect(AI_REVIEW_FAILED_REASON).toBe("The AI review failed.");
        expect(AI_REVIEW_NOT_STARTED_REASON).toBe("The AI review could not be started.");
    });
});
```

Create `packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { AiModel } from "@webiny/api-core/features/ai/index.js";
import { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";
import type { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";
import { ReviewStepNotCurrentError } from "@webiny/api-workflows/domain/review/errors.js";
import type { Actor } from "@webiny/api-workflows/domain/review/types.js";
import { AiCapabilityDisabledError, AiModelNotAvailableError } from "~/api/features/Capabilities/index.js";
import { ConfiguredAiModelsFeature } from "~/api/features/ConfiguredAiModels/feature.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { AiStepType } from "~/api/features/WorkflowReview/AiStepType/AiStepType.js";
import { aiStepConfigSchema } from "~/api/features/WorkflowReview/aiStepConfigSchema.js";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_REVIEW_NOT_STARTED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "~/api/features/WorkflowReview/aiFailureReasons.js";
import {
    createAiPowerUpsSettings,
    createConnectionPreset,
    registerFakeAiPowerUpsSettings,
    type AiPowerUpsSettingsOptions
} from "~tests/__helpers/FakeAiPowerUpsSettings.js";
import { createAiModel, registerFakeAi, registerFakeLogger } from "~tests/__helpers/FakeAi.js";
import { registerFakeWorkflowAiToolRegistry } from "~tests/__helpers/FakeWorkflowAiToolRegistry.js";
import {
    createResolvedCapability,
    registerFakeResolveAiCapability,
    type ResolveOutcome
} from "~tests/__helpers/FakeResolveAiCapability.js";
import { registerFakeStepRunReachService } from "~tests/__helpers/FakeStepRunReachService.js";
import {
    AI_MODEL,
    AI_STEP_ID,
    createAiReview,
    createAiStep,
    createAiStepConfig,
    NOW,
    paramsFor,
    requester
} from "~tests/__helpers/aiStepFixtures.js";

const MODELS: AiModel[] = [
    createAiModel("anthropic", "claude-a"),
    createAiModel("anthropic", "claude-b"),
    createAiModel("openai", "gpt-x"),
    createAiModel("google", "gem-1")
];

const SETTINGS: AiPowerUpsSettingsOptions = {
    connections: [
        createConnectionPreset({ id: "conn-anthropic", sdkName: "anthropic" }),
        // A connection without a stored key does not make its provider's models available.
        createConnectionPreset({ id: "conn-openai", sdkName: "openai", apiKeyEncrypted: "" })
    ]
};

/** The tools the registry knows; everything else is "not defined" or "not available". */
const KNOWN_TOOLS = ["readTarget", "updateTargetFields", "customTool"];

const REACH_ACTOR: Actor = {
    type: "user",
    id: "user-other",
    displayName: "Olga Other",
    identityType: "admin"
};

interface SetupOptions {
    models?: AiModel[] | Error;
    settings?: AiPowerUpsSettingsOptions | Error;
    tools?: string[];
    resolve?: ResolveOutcome;
    /**
     * The resolver asks the real `ConfiguredAiModelsService.findConnection` (as the real resolver
     * does) and fails with its failed Result, so the service's own log is part of the count.
     */
    resolveViaService?: boolean;
    reachResult?: Awaited<ReturnType<StepRunReachService.Interface["reach"]>>;
    /** Replaces the real `ConfiguredAiModelsService`, registered after it so it wins. */
    service?: ConfiguredAiModelsService.Interface;
}

const setup = (options: SetupOptions = {}) => {
    const container = new Container();
    container.register(AiStepType);
    const { error } = registerFakeLogger(container);
    registerFakeAi(container, options.models ?? MODELS);
    const settings = options.settings ?? SETTINGS;
    registerFakeAiPowerUpsSettings(
        container,
        settings instanceof Error ? settings : createAiPowerUpsSettings(settings)
    );
    ConfiguredAiModelsFeature.register(container);
    if (options.service) {
        container.registerInstance(ConfiguredAiModelsService, options.service);
    }
    registerFakeWorkflowAiToolRegistry(container, options.tools ?? KNOWN_TOOLS);
    const resolveViaService: ResolveOutcome = async model => {
        const found = await container.resolve(ConfiguredAiModelsService).findConnection(model ?? "");
        if (found.isFail()) {
            return Result.fail(found.error);
        }
        return Result.ok(createResolvedCapability(model ?? ""));
    };
    const { calls: resolveCalls } = registerFakeResolveAiCapability(
        container,
        options.resolveViaService ? resolveViaService : options.resolve
    );
    const { calls: reachCalls } = registerFakeStepRunReachService(container, options.reachResult);
    return {
        stepType: container.resolve(StepType),
        logged: error,
        resolveCalls,
        reachCalls
    };
};

/** A `ConfiguredAiModelsService` that counts its calls and lists `ids`. */
const createCountingService = (ids: string[] = [AI_MODEL]) => {
    const state = { listCalls: 0 };
    const service: ConfiguredAiModelsService.Interface = {
        list: async () => {
            state.listCalls += 1;
            return Result.ok(
                ids.map(id => {
                    return { id, name: id, providerId: id.split("/")[0], providerName: id };
                })
            );
        },
        findConnection: async () => Result.ok(null)
    };
    return { state, service };
};

describe("AiStepType (R164, R165, R166)", () => {
    it("describes itself and is available", async () => {
        const { stepType } = setup();

        expect(stepType.type).toBe("ai");
        expect(stepType.title).toBe("AI");
        expect(stepType.configSchema).toBe(aiStepConfigSchema);
        expect(await stepType.describeAvailability()).toEqual({
            available: true,
            unavailableReason: null
        });
    });

    describe("validate (pure, R165)", () => {
        it("stores the step as entered: instructions untouched, model trimmed, tools deduplicated in first-seen order", () => {
            const { stepType } = setup();
            const step = createAiStep({
                config: {
                    instructions: "  Check the tone.\n\nBe kind.  ",
                    model: "  anthropic/claude-a  ",
                    tools: ["updateTargetFields", "readTarget", "updateTargetFields", "readTarget"]
                }
            });

            const result = stepType.validate(paramsFor(step));

            expect(result.isOk()).toBe(true);
            expect(result.value?.id).toBe(AI_STEP_ID);
            expect(result.value?.config).toEqual({
                instructions: "  Check the tone.\n\nBe kind.  ",
                model: "anthropic/claude-a",
                tools: ["updateTargetFields", "readTarget"]
            });
        });

        it("treats a missing or null tools list as empty", () => {
            const { stepType } = setup();

            for (const tools of [undefined, null]) {
                const step = createAiStep({
                    config: { instructions: "Check.", model: AI_MODEL, tools }
                });

                const result = stepType.validate(paramsFor(step));

                expect(result.value?.config).toEqual({
                    instructions: "Check.",
                    model: AI_MODEL,
                    tools: []
                });
            }
        });

        it("drops keys the config does not define", () => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ extra: "x" }) });

            const result = stepType.validate(paramsFor(step));

            expect(Object.keys(result.value?.config as object).sort()).toEqual([
                "instructions",
                "model",
                "tools"
            ]);
        });

        it.each([
            { name: "no config", config: undefined },
            { name: "a config that is not an object", config: "text" },
            { name: "a null config", config: null },
            { name: "no instructions", config: { model: AI_MODEL } },
            { name: "empty instructions", config: { instructions: "", model: AI_MODEL } },
            { name: "blank instructions", config: { instructions: " \n\t ", model: AI_MODEL } },
            { name: "instructions that are not a string", config: { instructions: 5, model: AI_MODEL } }
        ])("refuses $name with the instructions text", ({ config }) => {
            const { stepType } = setup();
            const step = { ...createAiStep({ title: "AI check" }), config };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toBe('Step "AI check" needs instructions.');
        });

        it.each([
            { name: "no model", config: { instructions: "Check." } },
            { name: "an empty model", config: { instructions: "Check.", model: "" } },
            { name: "a blank model", config: { instructions: "Check.", model: "   " } },
            { name: "a model that is not a string", config: { instructions: "Check.", model: 5 } }
        ])("refuses $name with the model text", ({ config }) => {
            const { stepType } = setup();
            const step = { ...createAiStep({ title: "AI check" }), config };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.message).toBe('Step "AI check" needs a model.');
        });

        it("checks the instructions before the model", () => {
            const { stepType } = setup();
            const step = { ...createAiStep({ title: "AI check" }), config: { instructions: " ", model: " " } };

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.message).toBe('Step "AI check" needs instructions.');
        });

        it.each([
            { name: "a string", tools: "readTarget" },
            { name: "an object", tools: { name: "readTarget" } },
            { name: "a list with a non-string entry", tools: ["readTarget", 5] }
        ])("refuses tools that are $name", ({ tools }) => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ tools }) });

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.message).toBe('Step "AI check" has an invalid AI configuration.');
        });

        it("refuses a tool the registry does not know, naming the first one in order (Review Focus 2)", () => {
            const { stepType } = setup();
            const step = createAiStep({
                config: createAiStepConfig({ tools: ["readTarget", "ghostTool", "otherGhost"] })
            });

            const result = stepType.validate(paramsFor(step));

            expect(result.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result.error?.message).toBe(
                'Step "AI check" uses the AI tool "ghostTool", which is not defined.'
            );
        });

        it("refuses a tool name that differs only in case, and a tool that was dropped as invalid", () => {
            const { stepType } = setup();

            for (const name of ["ReadTarget", "my-tool", ""]) {
                const step = createAiStep({ config: createAiStepConfig({ tools: [name] }) });

                const result = stepType.validate(paramsFor(step));

                expect(result.error?.message).toBe(
                    `Step "AI check" uses the AI tool "${name}", which is not defined.`
                );
            }
        });

        it("accepts every registered tool", () => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ tools: KNOWN_TOOLS }) });

            const result = stepType.validate(paramsFor(step));

            expect(result.isOk()).toBe(true);
        });

        it("does no I/O: it reads no model list and resolves no capability", () => {
            const counting = createCountingService();
            const { stepType, resolveCalls } = setup({ service: counting.service });

            stepType.validate(paramsFor(createAiStep()));
            stepType.validate(paramsFor(createAiStep({ config: {} })));

            expect(counting.state.listCalls).toBe(0);
            expect(resolveCalls).toEqual([]);
        });
    });

    describe("checkConfig (R165, R169, Review Focus 6)", () => {
        it("accepts a model that has a configured connection", async () => {
            const { stepType, logged } = setup();

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.isOk()).toBe(true);
            expect(logged).not.toHaveBeenCalled();
        });

        it("reads the one model source, once per check", async () => {
            const counting = createCountingService();
            const { stepType } = setup({ service: counting.service });

            await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(counting.state.listCalls).toBe(1);
        });

        it.each([
            { name: "a provider with no connection", model: "google/gem-1" },
            { name: "a provider whose connection has no key", model: "openai/gpt-x" },
            { name: "a model the provider does not list", model: "anthropic/claude-gone" },
            { name: "a model id with another case", model: "Anthropic/claude-a" }
        ])("refuses $name", async ({ model }) => {
            const { stepType } = setup();
            const step = createAiStep({ config: createAiStepConfig({ model }) });

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result?.error?.message).toBe(
                `Step "AI check" uses the model "${model}", which is not available.`
            );
        });

        it("shows a fixed text for a failed settings read and logs once in total, the service's", async () => {
            const { stepType, logged } = setup({ settings: new Error("settings table is down") });

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.error?.code).toBe("Workflows/Workflow/Validation");
            expect(result?.error?.message).toBe(
                'Step "AI check" could not be checked: the configured AI models could not be loaded.'
            );
            expect(result?.error?.message).not.toContain("settings table is down");
            // The service logged the raw failure once; the step type must not log it again.
            expect(logged).toHaveBeenCalledTimes(1);
        });

        it("shows the same fixed text when the provider list throws, with no raw message and one log in total", async () => {
            const { stepType, logged } = setup({ models: new Error("provider is down: key sk-123") });

            const result = await stepType.checkConfig?.(paramsFor(createAiStep()));

            expect(result?.error?.message).toBe(
                'Step "AI check" could not be checked: the configured AI models could not be loaded.'
            );
            expect(result?.error?.message).not.toContain("sk-123");
            expect(logged).toHaveBeenCalledTimes(1);
        });

        it("refuses a config that no longer parses without reading any model", async () => {
            const counting = createCountingService();
            const { stepType } = setup({ service: counting.service });
            const step = { ...createAiStep(), config: { instructions: "Check." } };

            const result = await stepType.checkConfig?.(paramsFor(step));

            expect(result?.error?.message).toBe('Step "AI check" has an invalid AI configuration.');
            expect(counting.state.listCalls).toBe(0);
        });
    });

    describe("reach (R170)", () => {
        const reachStep = (review: ReturnType<typeof createAiReview>) => review.toData().steps[0];

        it("hands the step to the shared reach service with no failure and the AI actor as owner", async () => {
            const { stepType, reachCalls, resolveCalls, logged } = setup();
            const review = createAiReview({
                config: createAiStepConfig({ tools: ["readTarget"] })
            });
            const step = reachStep(review);

            const result = await stepType.reach({ review, step, actor: REACH_ACTOR, now: NOW });

            expect(result.isOk()).toBe(true);
            expect(resolveCalls).toEqual([{ capabilityId: "workflows.review", model: AI_MODEL }]);
            expect(reachCalls).toHaveLength(1);
            expect(reachCalls[0].review).toBe(review);
            expect(reachCalls[0].step).toBe(step);
            expect(reachCalls[0]).toMatchObject({
                actor: REACH_ACTOR,
                owner: { type: "ai", id: requester.id, displayName: requester.displayName },
                now: NOW,
                failure: null,
                startFailure: AI_REVIEW_NOT_STARTED_REASON
            });
            expect(logged).not.toHaveBeenCalled();
        });

        it("builds the owner from the requester, never from the actor who caused the reach", async () => {
            const { stepType, reachCalls } = setup();
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: REACH_ACTOR, now: NOW });

            expect(reachCalls[0].owner.id).toBe(requester.id);
            expect(reachCalls[0].owner.id).not.toBe(REACH_ACTOR.id);
            expect(reachCalls[0].owner).not.toHaveProperty("identityType");
        });

        it("returns the reach service's result unchanged (R159)", async () => {
            const refusal = new ReviewStepNotCurrentError({
                reviewId: "review-1",
                stepId: AI_STEP_ID,
                currentStepId: null
            });
            const { stepType } = setup({ reachResult: Result.fail(refusal) });
            const review = createAiReview();

            const result = await stepType.reach({
                review,
                step: reachStep(review),
                actor: requester,
                now: NOW
            });

            expect(result.isFail()).toBe(true);
            expect(result.error).toBe(refusal);
        });

        it("fails the step when the config no longer parses, before looking at tools or the capability", async () => {
            const { stepType, reachCalls, resolveCalls } = setup();
            const review = createAiReview({ config: { model: AI_MODEL } });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_STEP_INVALID_CONFIGURATION_REASON);
            expect(resolveCalls).toEqual([]);
        });

        it("fails the step with the first allowlisted tool that is no longer registered, before the capability", async () => {
            const { stepType, reachCalls, resolveCalls } = setup({ tools: ["readTarget"] });
            const review = createAiReview({
                config: createAiStepConfig({ tools: ["readTarget", "removedTool", "otherGone"] })
            });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(aiToolNotAvailableReason("removedTool"));
            expect(resolveCalls).toEqual([]);
        });

        it("fails the step with the model reason when the model has no connection any more, without logging", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async model => Result.fail(new AiModelNotAvailableError(model ?? ""))
            });
            const review = createAiReview({
                config: createAiStepConfig({ model: "anthropic/gone" })
            });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(aiModelNotAvailableReason("anthropic/gone"));
            expect(logged).not.toHaveBeenCalled();
        });

        it("fails the step with the capability reason when the capability is switched off, without logging", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async () => {
                    return Result.fail(
                        new AiCapabilityDisabledError(
                            "workflows.review",
                            "Workflow review",
                            "Settings → AI Power-Ups"
                        )
                    );
                }
            });
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            expect(logged).not.toHaveBeenCalled();
        });

        it("fails the step with the capability reason for any other resolver failure and logs the raw error once", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async () => Result.fail(new Error("No model is configured for the role."))
            });
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            expect(reachCalls[0].failure).not.toContain("No model is configured");
            expect(logged).toHaveBeenCalledTimes(1);
            expect(logged.mock.calls[0][0]).toMatchObject({
                reviewId: "review-1",
                stepId: AI_STEP_ID
            });
        });

        it("logs twice in total when the real model service cannot read the settings: the service's own log and this step's (the accepted double log)", async () => {
            const { stepType, reachCalls, logged } = setup({
                settings: new Error("settings table is down"),
                resolveViaService: true
            });
            const review = createAiReview();

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls[0].failure).toBe(AI_CAPABILITY_NOT_AVAILABLE_REASON);
            expect(logged).toHaveBeenCalledTimes(2);
            // First the service's log with the raw settings error, then the reach's own.
            expect(logged.mock.calls[1][1]).toBe("Could not resolve the AI review capability.");
            expect(JSON.stringify(reachCalls[0].failure)).not.toContain("settings table is down");
        });

        it("fails the step with the generic reason when the resolver throws, logs once and never stores the raw message", async () => {
            const { stepType, reachCalls, logged } = setup({
                resolve: async () => {
                    throw new Error("could not decrypt key sk-secret");
                }
            });
            const review = createAiReview();

            const result = await stepType.reach({
                review,
                step: reachStep(review),
                actor: requester,
                now: NOW
            });

            expect(result.isOk()).toBe(true);
            expect(reachCalls[0].failure).toBe(AI_REVIEW_FAILED_REASON);
            expect(JSON.stringify(reachCalls[0].failure)).not.toContain("sk-secret");
            expect(logged).toHaveBeenCalledTimes(1);
        });

        it("always calls the reach service, also when it fails the step, so no task exists and the step is restartable", async () => {
            const { stepType, reachCalls } = setup({ tools: [] });
            const review = createAiReview({
                config: createAiStepConfig({ tools: ["removedTool"] })
            });

            await stepType.reach({ review, step: reachStep(review), actor: requester, now: NOW });

            expect(reachCalls).toHaveLength(1);
            expect(reachCalls[0].failure).not.toBeNull();
        });
    });
});
```

- [ ] **Step 2: Run them to verify they fail**

Run: `yarn test packages/ai-powerups/__tests__/features/WorkflowReview/aiStepConfigSchema.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/aiFailureReasons.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts 2>&1 | tail -50`
Expected: FAIL. All three files fail to load: `~/api/features/WorkflowReview/aiStepConfigSchema.js`, `~/api/features/WorkflowReview/aiFailureReasons.js` and `~/api/features/WorkflowReview/AiStepType/AiStepType.js` do not exist. Record the RED output.

(`packages/ai-powerups` has no `ci.config.json` before Task 20, so there is no `yarn test:os` run for it yet.)

- [ ] **Step 3: The config schema and the step type**

Create `packages/ai-powerups/src/api/features/WorkflowReview/aiStepConfigSchema.ts`:

```ts
import { z } from "zod";

/**
 * The stored config of an `ai` step (R164): what the author writes, the model they pick (the full
 * id, `"<providerId>/<modelId>"`, as `Ai` expects) and the tools the step allowlists (R167). It is
 * the step type's `configSchema`, so `listStepTypes` describes it to the editor; `instructions`
 * carries `ui: "textarea"` (R166). `tools` defaults to `[]`: a step with no tools can only decide.
 */
export const aiStepConfigSchema = z.object({
    instructions: z.string().meta({ ui: "textarea" }),
    model: z.string(),
    tools: z.array(z.string()).default([])
});

export type AiStepConfig = z.infer<typeof aiStepConfigSchema>;
```

Create `packages/ai-powerups/src/api/features/WorkflowReview/aiFailureReasons.ts`:

```ts
/**
 * The fixed texts a step shows when it cannot run (R170). One source for the step type's reach
 * (Task 17) and the runner (Task 19): the raw provider, settings or decrypt error is never part
 * of any of them.
 */
export const AI_STEP_INVALID_CONFIGURATION_REASON = "The AI step configuration is not valid.";

export const aiToolNotAvailableReason = (name: string): string => {
    return `The AI tool "${name}" is not available.`;
};

export const aiModelNotAvailableReason = (model: string): string => {
    return `The model "${model}" is not available.`;
};

export const AI_CAPABILITY_NOT_AVAILABLE_REASON = "The AI review capability is not available.";

export const AI_REVIEW_FAILED_REASON = "The AI review failed.";

export const AI_REVIEW_NOT_STARTED_REASON = "The AI review could not be started.";
```

Create `packages/ai-powerups/src/api/features/WorkflowReview/AiStepType/AiStepType.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { StepType } from "@webiny/api-workflows/features/stepTypes/StepType/index.js";
import { StepRunReachService } from "@webiny/api-workflows/features/stepRun/StepRunReachService/index.js";
import { WorkflowAiToolRegistryService } from "@webiny/api-workflows/features/aiTools/WorkflowAiToolRegistryService/index.js";
import { WorkflowValidationError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { AI_STEP_TYPE } from "@webiny/api-workflows/domain/workflow/stepTypes.js";
import { getAiActor } from "@webiny/api-workflows/domain/ai/getAiActor.js";
import {
    AiCapabilityDisabledError,
    AiModelNotAvailableError,
    ResolveAiCapabilityUseCase
} from "~/api/features/Capabilities/index.js";
import { ConfiguredAiModelsService } from "~/api/features/ConfiguredAiModels/index.js";
import { WORKFLOWS_REVIEW_CAPABILITY_ID } from "../constants.js";
import { aiStepConfigSchema } from "../aiStepConfigSchema.js";
import {
    AI_CAPABILITY_NOT_AVAILABLE_REASON,
    AI_REVIEW_FAILED_REASON,
    AI_REVIEW_NOT_STARTED_REASON,
    AI_STEP_INVALID_CONFIGURATION_REASON,
    aiModelNotAvailableReason,
    aiToolNotAvailableReason
} from "../aiFailureReasons.js";

const fail = (message: string) => {
    return Result.fail(new WorkflowValidationError(message));
};

/**
 * The `ai` step (spec 7.3, R164): the author writes the instructions, picks a model that has a
 * configured connection (D101) and allowlists registered tools. Save-time validation is pure
 * (R165); the model check is the async `checkConfig` hook, which the store runs only for a new or
 * changed step. `reach` mirrors the automation step: every reason that stops the step from running
 * is a fixed text (R170) and the shared `StepRunReachService` does the triggering.
 *
 * Not registered by `Extension.ts` until Task 19 registers the type and the runner together (R178).
 */
class AiStepTypeImpl implements StepType.Interface {
    public readonly type = AI_STEP_TYPE;
    public readonly title = "AI";
    public readonly configSchema = aiStepConfigSchema;

    public constructor(
        private tools: WorkflowAiToolRegistryService.Interface,
        private models: ConfiguredAiModelsService.Interface,
        private capabilities: ResolveAiCapabilityUseCase.Interface,
        private reachService: StepRunReachService.Interface,
        private logger: Logger.Interface
    ) {}

    public async describeAvailability(): Promise<StepType.Availability> {
        return { available: true, unavailableReason: null };
    }

    public validate({ step }: StepType.ValidateParams) {
        const raw =
            typeof step.config === "object" && step.config !== null
                ? (step.config as Record<string, unknown>)
                : {};

        const instructions = raw.instructions;
        if (typeof instructions !== "string" || instructions.trim() === "") {
            return fail(`Step "${step.title}" needs instructions.`);
        }

        const model = typeof raw.model === "string" ? raw.model.trim() : "";
        if (model === "") {
            return fail(`Step "${step.title}" needs a model.`);
        }

        const given = raw.tools ?? [];
        if (!Array.isArray(given) || given.some(name => typeof name !== "string")) {
            return fail(`Step "${step.title}" has an invalid AI configuration.`);
        }
        // A duplicate is not an error: first-seen order, one entry each.
        const tools: string[] = [...new Set<string>(given)];
        for (const name of tools) {
            if (this.tools.get(name) === null) {
                return fail(
                    `Step "${step.title}" uses the AI tool "${name}", which is not defined.`
                );
            }
        }

        // Stored as entered (R165): instructions untouched, model trimmed, tools deduplicated.
        return Result.ok({ ...step, config: { instructions, model, tools } });
    }

    public async checkConfig({
        step
    }: StepType.ValidateParams): Promise<Result<void, WorkflowValidationError>> {
        const config = aiStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            return fail(`Step "${step.title}" has an invalid AI configuration.`);
        }

        // `list()` logs its own failure once, with the raw error, and returns a failed Result with
        // a fixed text. This check shows its own fixed text and does not log it again.
        const listed = await this.models.list();
        if (listed.isFail()) {
            return fail(
                `Step "${step.title}" could not be checked: the configured AI models could not be loaded.`
            );
        }
        if (!listed.value.some(model => model.id === config.data.model)) {
            return fail(
                `Step "${step.title}" uses the model "${config.data.model}", which is not available.`
            );
        }
        return Result.ok();
    }

    public async reach({ review, step, actor, now }: StepType.ReachParams) {
        const data = review.toData();
        const requester = data.createdBy;

        // Everything that can stop the step from running is checked here, in this order, and ends
        // in a fixed reason (R170). The same checks run again before every run.
        let failure: string | null = null;
        const config = aiStepConfigSchema.safeParse(step.config);
        if (!config.success) {
            failure = AI_STEP_INVALID_CONFIGURATION_REASON;
        } else {
            const missing = config.data.tools.find(name => this.tools.get(name) === null);
            if (missing !== undefined) {
                failure = aiToolNotAvailableReason(missing);
            } else {
                try {
                    // Reach resolves the capability (this decrypts the key) only to validate that
                    // the step is usable; the resolution is not passed on, the runner resolves
                    // again when it starts.
                    const resolved = await this.capabilities.execute(
                        WORKFLOWS_REVIEW_CAPABILITY_ID,
                        config.data.model
                    );
                    if (resolved.isFail()) {
                        if (resolved.error instanceof AiModelNotAvailableError) {
                            failure = aiModelNotAvailableReason(config.data.model);
                        } else {
                            failure = AI_CAPABILITY_NOT_AVAILABLE_REASON;
                            // A switched-off capability is a decision, not a problem (D40): not
                            // logged. Any other failure is logged; the raw text is never stored.
                            if (!(resolved.error instanceof AiCapabilityDisabledError)) {
                                this.logger.error(
                                    { error: resolved.error, reviewId: data.id, stepId: step.id },
                                    "Could not resolve the AI review capability."
                                );
                            }
                        }
                    }
                } catch (error) {
                    this.logger.error(
                        { error, reviewId: data.id, stepId: step.id },
                        "Could not resolve the AI review capability."
                    );
                    failure = AI_REVIEW_FAILED_REASON;
                }
            }
        }

        // The shared service triggers the task as the requester (or fails the step with `failure`
        // when it is set), stores the task id in the one save and aborts the task when that save
        // cannot happen (Task 2). Whatever it returns is returned, never ignored (R159).
        return this.reachService.reach({
            review,
            step,
            actor,
            owner: getAiActor(requester),
            now,
            failure,
            startFailure: AI_REVIEW_NOT_STARTED_REASON
        });
    }
}

export const AiStepType = StepType.createImplementation({
    implementation: AiStepTypeImpl,
    dependencies: [
        WorkflowAiToolRegistryService,
        ConfiguredAiModelsService,
        ResolveAiCapabilityUseCase,
        StepRunReachService,
        Logger
    ]
});
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `yarn test packages/ai-powerups/__tests__/features/WorkflowReview/aiStepConfigSchema.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/aiFailureReasons.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/AiStepType.test.ts 2>&1 | tail -50`
Expected: PASS.

Run: `yarn check:test:types -p ai-powerups --report cli 2>&1 | tail -40`
Expected: no errors. (If a `registerInstance` fake in the helpers is rejected for a missing member or a `Promise<never>`, cast the object through `unknown` to the abstraction's `Interface`, the same cast fallback Tasks 7, 15 and 16 use. If `stepType.validate(...)` is flagged because `validate` returns a union of `Result` types, annotate the return type of `validate` with `Result<WorkflowStep, WorkflowValidationError>` and import `WorkflowStep` from `@webiny/api-workflows/domain/workflow/types.js`.)

- [ ] **Step 5: Run the existing tests covering the changed code**

Nothing existing changed. The new test files share the helpers and the container shape with Task 15 and Task 16, so run them again together with the resolver tests to prove the package-local helpers stay compatible:

Run: `yarn test packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsService.test.ts packages/ai-powerups/__tests__/features/ConfiguredAiModels/ConfiguredAiModelsRegistration.test.ts packages/ai-powerups/__tests__/features/Capabilities/ResolveAiCapabilityModel.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowsReviewCapability.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/ListWorkflowAiModelsUseCase.test.ts packages/ai-powerups/__tests__/features/WorkflowReview/WorkflowReviewRegistration.test.ts packages/ai-powerups/__tests__/graphql/ListWorkflowAiModelsSchema.test.ts 2>&1 | tail -50`
Expected: PASS. `WorkflowReviewRegistration.test.ts` still asserts that no `StepType` is registered with both flags on: this task does not register the type (R178).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (`yarn adio` and `yarn webiny sync-dependencies` clean, `yarn build -p @webiny/ai-powerups --no-cache 2>&1 | tail -30`, restore `.gitleaks.toml`), then commit:

```
feat(ai-powerups): add the AI step type with save-time validation and reach

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
