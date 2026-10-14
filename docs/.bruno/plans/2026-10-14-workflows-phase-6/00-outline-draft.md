# Workflows Phase 6 outline (draft, not the plan)

Inputs read: roadmap phase 6 row, spec 4.1/4.2/5.2/7.1/7.3/7.4/9.3/10/11, decisions D13, D39, D40, D55, D56, D58, D62, D101, D109, D122, D130, D132, D133, phase 5 `00-shared.md` (R131-R163, A51-A55), the phase 5 code, `packages/ai-powerups`, `packages/api-core/src/features/ai`. Phase 6 continues at R164 and A56.

## 1. Scope

| Roadmap item | Spec / decisions | Home |
|---|---|---|
| AI config validation in the save path (instructions and model required) | 4.1 rules, 7.3; D101, D109 | `AiStepType.validate` (ai-powerups), pure |
| Workflow AI tool registry, `readTarget` / `updateTargetFields` per adapter | 7.3, 9.3; D39, D55, D62 | `WorkflowAiTool` in api-workflows; adapter port + CMS and WB impls |
| Shared AI tools operation | 10, 11 (`listAiTools`); D55, D78, D133 | api-workflows shared use case + `workflows` root GraphQL, `editor` only |
| AI step type registered by ai-powerups | 7.1, 7.3; D56, D122, D130 | `packages/ai-powerups` registers `StepType` "ai" |
| "Workflow review" capability | 7.3; D40, D101 | `AiCapability` in ai-powerups |
| Structured output | 7.3 `{ approved, comment, issues[] }`; D39 | AI runner |

Spec puts in phase 6 but the roadmap row omits:
- `issues?: AiIssue[]` on `ReviewStep` (spec 4.2, D39), with `AiIssue { fieldPath?, severity, message, suggestion? }` and the GraphQL step field. Not in code at all today (`grep issues` finds only zod issues). Needed to store the structured output; admin display stays 8b.
- AI run failure texts, abort/stuck/max-iterations coverage for AI steps (7.4 says "AI or automation"). Phase 5 built these automation-only.
- AI actor `{ type: "ai", id: requester.id, displayName: requester.displayName }` (5.2, D58, D107). `ActorType` already has `"ai"` (`domain/review/types.ts:9`); no `getAiActor` exists.
- Model unavailable on reach fails the step (7.3, D101); capability disabled or lapsed licence fails on reach (D40).
- Developer guide for custom AI tools (parallel to `docs/.bruno/workflows/automations.md`); not required by spec, recommended.

Not built yet and needed:
- The phase 5 runner is automation-only (see section 2). It must become step-type-neutral first.
- `ReviewStep.issues`, a target read/write port, the tool registry, `getAiActor`, `AI_STEP_TYPE` constant (`domain/workflow/stepTypes.ts:1` says "`ai` has no constant here").
- `ResolveAiCapabilityUseCase` cannot take a caller-chosen model (see open question 2).
- `ai-powerups` has no dependency on `@webiny/api-workflows` yet.

Out of scope: admin UI (8b, 9c), notifications (7), human confirmation of AI decisions (D13), built-in tools beyond the two (developers register more), cost tracking (spec has none).

## 2. Current code facts

ai-powerups and api-core AI
- Gate: `ai-powerups/src/api/Extension.ts:44` returns early unless `FeatureFlags.isEnabled("aiPowerups")` (licence refreshed before register). Anything outside must use `[ResolveAiCapabilityUseCase, { optional: true }]` (comment at :30-37). A `StepType` registered from inside the extension is therefore only present with the flag on.
- Capability: `Capabilities/abstractions.ts` `AiCapability` (`id`, `label`, `description`, `defaultRole` fast|standard|vision, optional `guidance`); example `CmsCompareEntryRevisions/capability.ts`. `ResolveAiCapabilityUseCase.execute(capabilityId)` returns `{ model, connection: { sdkName, apiKey }, guidance, additionalInstructions, roleId }` or fails with `AiCapabilityDisabledError` / settings errors (`ResolveAiCapabilityUseCase.ts:42-120`). Model comes from the capability override or role, never from the caller. `withAdditionalInstructions(resolved)` builds the system prompt.
- Call pattern: `Ai.generateText({ model, connection, system, prompt })` (`CmsCompareEntryRevisionsUseCase.ts`); `Ai` = `api-core/src/features/ai/abstractions.ts` (`generateText`, `streamText`, `listModels`, `listModelsByConnections`); model id is `"<providerId>/<modelId>"` (`Ai.ts:117-128`). Agent loops use `stopWhen: stepCountIs(20)` (`CmsGenerateEntryContentUseCase.ts:112`).
- Tools today: `AiSdkToolDefinition` (name, description, `inputSchema`, handler class) + `AiSdkToolHandler`, collected by `AiSdkTools.getToolSet()` (`api-core/src/features/ai/AiSdkTools.ts`): global, resolves handlers lazily via `AiSdkToolHandlerResolver`. Spec forbids exposing it to AI steps (D55); the new registry copies its definition/handler split instead of extending it.
- Model list: `AiPowerUpsQuery.listModels` (`BaseGraphQLSchema.ts:97-103`) returns `Ai.listModels()` (all factory models); `Ai.listModelsByConnections()` returns the configured ones.
- Tests are unit tests with fakes (`ai-powerups/__tests__/features/...`); no workflows integration harness there.
- License of the package: "Webiny Enterprise"; no existing dependency on api-workflows.

api-workflows (phase 5 as built)
- `StepType` (`features/stepTypes/StepType/abstractions.ts`): `type`, `title`, `configSchema`, `describeAvailability`, `validate`, `reach`. `StepTypeRegistryService` returns last registration per type. `ReviewStepReacher` dispatches `reach` (`ReviewStepReacher.ts:30`). `StepTypesFeature` registers review and automation only.
- `listStepTypes` placeholder: `ListWorkflowStepTypesUseCase.ts:68-88` adds an `ai` row (`available` = `FeatureFlags.isEnabled("aiPowerups")`, reason "AI powerups are not enabled.", `configSchema: null`) only when no `ai` type is registered; display order review, ai, automation (:91). Save refuses an unregistered `ai` step (R132).
- `AutomationStepType.reach` (`AutomationStepType.ts`): validates, triggers `workflowsStepRun` inside `withIdentity(requester)`, `review.reachRun` with the automation owner, aborts the task if reach fails, fails the step with a fixed reason if nothing could start. About 90 lines of this are step-type-neutral (trigger, reachRun, abort, fail).
- `WorkflowStepRunTaskHandler` is automation-specific end to end: reads `automationStepConfigSchema`, `AutomationDefinitionRegistryService`, `getAutomationActor`, "The automation ..." reasons in `run`, `onError`, `onMaxIterations`, `onAbort`. Reusable skeleton: read, `getStaleStepRunReason`, wait for taskId (R143), `withIdentity(requester)`, bypass, re-guard after run, approve/reject via base use cases with `actorTeamIds: []`, one failure path (R146).
- `getStaleStepRunReason`, `getRequesterIdentity`, `WorkflowBypassService` (AsyncLocalStorage; only `BlockUpdateWhileInReview` reads it), `ReviewTaskAbortService`, cancel/delete abort and `StepRunFailure` are already step-type-neutral.
- `StuckStepService.ts:22` only handles `step.type === AUTOMATION_STEP_TYPE`; `STEP_RUN_*` constants and `StepRunTaskInput` are neutral.
- Review data has `taskId`, `runs`, `ReviewStepRun.outcome` (approved|rejected|failed) but no `issues`.
- Target ports (`ReviewTargetLoader`, `ReviewTargetSync`, `ReviewTargetReadAccess`, folder chain) are registered per namespace by `api-headless-cms-workflows/src/features/target` and the WB equivalent; there is no read-values or write-values port. `CmsEntryTargetReader` loads model + group + revision (no entry access check).
- Registration: WB feature gates on `advancedPublishingWorkflow` (`WebsiteBuilderWorkflowsFeature.ts:14`); same for CMS. AI step needs both flags (D56).

## 3. Proposed sub-phases

Each sub-phase ships and tests alone; later ones build on the earlier interfaces. Every sub-phase ends green on the phase 2-5 tests it touches. TDD, targeted tests by path.

### 6.1 AI actor and shared reach (api-workflows, no behaviour change)
1. **AI constants and actor.** `AI_STEP_TYPE`, `getAiActor` (pure, mirror of `getAutomationActor`). Files: `domain/workflow/stepTypes.ts`, `domain/ai/getAiActor.ts`, test. Produces: constant and actor for 6.2 and 6.8. Spec 5.2; D58, D107.
2. **`StepRunReachService`.** DI service holding the neutral reach: trigger `workflowsStepRun` under `withIdentity(requester)`, `reachRun` with a given owner, abort on failed reach, fail with a given reason. `AutomationStepType.reach` calls it (it keeps its own validation); all phase 5 reach tests unchanged. Files: `features/stepRun/StepRunReachService/{abstractions,StepRunReachService,index}.ts`. Produces: the one reach path AI will call. R149, R143, R159.

### 6.2 Step runner dispatch (api-workflows)
3. **`StepRunner` abstraction, registry, `AutomationStepRunner`.** Multi-registered `StepRunner { type, failureLabel, run(params) }` where `run` returns an outcome (`approved | rejected | continue`, plus `issues?`) or throws `StepRunFailure`; `StepRunnerRegistryService`. Move the automation lookup, settings parse, iteration cap and `bypass.run(definition.run)` out of the handler into `AutomationStepRunner`. Handler delegates by `step.type`; unknown type with no runner fails the step with a fixed reason. Phase 5 handler tests stay green unchanged. Produces: where the AI runner plugs in. R142, R145, R148.
4. **Neutral failure hooks, actor and stuck detection.** Handler hooks (`onError`, `onAbort`, `onMaxIterations`) and `StuckStepService` select the runner by step type and build reasons from `runner.failureLabel` ("automation" keeps every existing text byte for byte); the owner/actor for approve/reject comes from the runner (`getAutomationActor` or `getAiActor`). Produces: AI steps get guard, abort, stuck and restart for free. R144, R146, R152, R153.

### 6.3 Review step issues (api-workflows)
5. **`ReviewStepIssue` and `issues` on `ReviewStep`.** Domain type, zod/mapper default `[]` (no migration, like R139), shared `WorkflowsReviewStep.issues` GraphQL type. Produces: storage for structured output. Spec 4.2, 10; D39.
6. **Approve and reject accept `issues`.** Engine `ApproveReviewStepUseCase` / `RejectReviewStepUseCase` take optional `issues`, stored on the step and carried on the existing facts; app wrappers do not expose the input (AI only); handler passes the runner's `issues`. Produces: end of the outcome path. D132.

### 6.4 AI tool registry (api-workflows)
7. **`WorkflowAiTool` abstraction and registry.** `WorkflowAiTool { name, title, description, inputSchema, handler }` (definition/handler split like `AiSdkToolDefinition`), `WorkflowAiToolContext { review, step, requester }` passed to handlers so tools never accept target ids from the model, `WorkflowAiToolRegistryService` (`get`, `list`, `toToolSet(names, context)`; unknown names ignored here, rejected at save). Public export path documented. Produces: what `AiStepType` validates against and what the runner turns into a tool set. R164-R167.
8. **`listAiTools` shared operation.** `ListWorkflowAiToolsUseCase` (`editor` only, refusal action `"list AI tools"`, throws become `WorkflowPersistenceError`, R87), `workflows` root query `listAiTools { name title description }`. Mirrors `ListAutomationDefinitionsUseCase` (R138). Spec 11; D78, D133.

### 6.5 Target access port and built-in tools (api-workflows)
9. **`ReviewTargetEditor` port.** Per-namespace abstraction (`canEdit(model)`, `read({ model, targetRevisionId })` returning `{ title, fields: { path, label, type, value }[] }`, `update({ model, targetRevisionId, values })` returning applied paths), last registered match wins like the loader. Engine tests use a fake. Produces: the seam the tools and the AI input builder use. Spec 9.3.
10. **Built-in tools `readTarget` and `updateTargetFields`.** Registered by `WorkflowsFeature`; `readTarget` takes no arguments, `updateTargetFields({ fields: Record<path, value> })`; both read the review from the context, call the port, and run the write inside `WorkflowBypassService.run` (D62). Produces: the two spec tools. D55.

### 6.6 CMS adapter (api-headless-cms-workflows)
11. **CMS `readTarget` side.** `CmsEntryReviewTargetEditor.read`: model + revision through `CmsEntryTargetReader`, labelled serialisation from the model fields (label, fieldId, type, value), dynamic zones and nested objects flattened to paths. Produces: input for the prompt and `readTarget`. Spec 7.3, 9.3.
12. **CMS `updateTargetFields` side.** `update`: validates paths against the model, merges into the revision values and writes through the CMS update use case (bypass context active, R150), failing with a typed error for unknown paths or invalid values (the tool returns the error text to the model, it does not throw). Produces: AI can edit entries. D62, D39.

### 6.7 WB adapter (api-website-builder-workflows)
13. **WB `read` and `update`.** `wb.page` editor port: serialised page content and title; the writable surface depends on open question 3. Needs the page update use case under the bypass; the WB save block shares the CMS one (R150). Produces: AI steps work on pages. Spec 9.3.

### 6.8 AI step type in ai-powerups
14. **Dependency and "Workflow review" capability.** `@webiny/api-workflows` dependency in `ai-powerups/package.json` (adio, sync), `WorkflowsReviewCapability` (id `workflows.review`, label "Workflow review", defaultRole `standard`, `guidance` = the output contract), registered in `Extension.ts` after the flag check; `ResolveAiCapabilityUseCase` extension per open question 2 if chosen. Produces: capability visible in AI settings, resolver ready. D40, D101.
15. **`AiStepType` and `aiStepConfigSchema`.** `type` "ai", `title` "AI", config `{ instructions, model, tools }`, `validate` (instructions non-empty after trim, model non-empty, tools unique and registered, R164-R166), `describeAvailability` available, `reach` through `StepRunReachService` with `getAiActor`. Registered in the extension; the `listStepTypes` placeholder row is no longer used when it is on, update `ListWorkflowStepTypes.test.ts`. Produces: AI steps can be saved and reached (the task will fail them until 6.9: gate by landing 6.9 in the same SDD run or by marking the type `describeAvailability` false until then). Spec 7.1; D56, D101, D109, D122, D130.

### 6.9 AI runner
16. **Prompt input builder.** Pure `buildAiStepPrompt({ systemGuidance, additionalInstructions, instructions, target, previousComments, modelId })`: system (guidance + additional) and user message (labelled target content, previous step comments, then the step instructions in a delimited block). Output schema `aiReviewOutputSchema` `{ approved, comment, issues[] }`. Produces: prompt and schema for the runner. Spec 7.3; D39.
17. **`AiStepRunner`.** Resolve capability (failures map to fixed reasons), read target through the port, build tool set from the registry filtered by the step allowlist with the review context, `Ai.generateText` with the step's model, `stopWhen: stepCountIs(AI_STEP_MAX_TOOL_STEPS)`, structured output; map result to `approved` / `rejected` (rejected needs a 10+ char comment, D100) with issues; failure reasons R168-R170. Registered as `StepRunner` type "ai". Produces: working AI step run. Spec 7.3, 7.4.
18. **End-to-end test.** CMS review with an AI step using a mock language model: approve, reject with issues, tool edit under bypass then approve, model gone, capability disabled, stale task, restart. Location per open question 5 of risks. Produces: acceptance for the phase.

### 6.10 Docs
19. **Docs.** Spec 7.3/7.4 and 4.2 updates, roadmap row Done, decisions entries (D122 note, any new D), `docs/.bruno/workflows/ai-tools.md` developer guide for custom tools, stale "phase 6" comments (`ListWorkflowStepTypesUseCase.ts:68`, `StepType` doc, `stepTypes.ts`).

Order: 6.1 to 6.3 are independent of 6.4 to 6.7; ai-powerups (6.8, 6.9) needs 6.1-6.5 and one adapter (6.6). 6.7 can land last or in parallel with 6.8. Total: 10 sub-phases, 19 tasks.

## 4. Proposed rulings

- R164. **Names and constants.** `AI_STEP_TYPE = "ai"`; `AiStepConfig { instructions: string; model: string; tools: string[] }` (`tools` default `[]`); capability id `workflows.review`, label `Workflow review`, default role `standard`; step actor `{ type: "ai", id: requester.id, displayName: requester.displayName }` (R141 mirror, `identityType` omitted).
- R165. **Save-time AI validation** (`WorkflowValidationError`, pure of I/O): malformed shell `Step "<title>" needs AI instructions and a model.` is replaced by two exact texts: `Step "<title>" needs instructions.` (D109, trimmed non-empty, no minimum) and `Step "<title>" needs a model.` (D101); unknown allowlist entry `Step "<title>" uses the AI tool "<name>", which is not defined.`; duplicate entry deduplicated, not an error. The model is not checked against `listModels` at save (that is I/O; a gone model fails on reach, D101). Config stored as entered.
- R166. **`listStepTypes` ai row.** With the type registered the row comes from the registry (`available: true`, `unavailableReason: null`, `configSchema` = `z.toJSONSchema(aiStepConfigSchema, { io: "input", unrepresentable: "any" })`, UI hints `.meta({ ui: "textarea" })` for instructions); without it the R132 placeholder row stays unchanged. The save-time message for an unregistered `ai` step stays R132's.
- R167. **Tool registry** (`WorkflowAiTool`, D55). Never the global `AiSdkTools`. `listAiTools` rows `{ name, title, description }` only (no schema). Built-ins `readTarget` (no input) and `updateTargetFields` (`{ fields: Record<string, unknown> }`) are registered by `WorkflowsFeature`; handlers receive `WorkflowAiToolContext` (`review`, `step`, `requester`), so the model can never name a target, revision or review. A tool name outside the step's allowlist is not in the tool set. `listAiTools` is guarded by `editor` only (D133), refusal action `"list AI tools"`.
- R168. **Runner reuse** (pending open question 1). One `workflowsStepRun` task, handler dispatches by step type through `StepRunnerRegistryService`; task input stays `{ reviewId, stepId }` (R142, R148); everything else from the review snapshot. `failureLabel`: `"automation"` for automation (all phase 5 texts unchanged), `"AI review"` for AI.
- R169. **AI fail reasons** (fixed, stored in `comment` and `runs[].reason`; raw errors only logged): `The AI step configuration is not valid.`; `The AI review capability is not available.` (capability disabled, licence lapsed, no connection or unresolved settings); `The model "<model>" is not available.`; `The AI tool "<name>" is not available.` (allowlisted tool missing at run); `The AI review failed.` (provider error, thrown error); `The AI review returned no decision.` (no valid structured output); `The AI review rejected without a comment.` (D100); `The AI review did not finish in <n> steps.`; `The AI review was aborted.`; `The AI review task ended without a result.`; `The AI review could not be started.`. These mirror R146.
- R170. **Outcome mapping.** `approved: true` approves with `comment` (empty allowed) and stores `issues`; `approved: false` rejects with `comment` (10+ chars after trim) and `issues`. Approve and reject go through the base use cases with the AI actor and `actorTeamIds: []`; the task is one iteration (no `continue`); `AI_STEP_MAX_TOOL_STEPS = 20` (existing `stepCountIs(20)` precedent). `AiIssue.severity` enum `"error" | "warning" | "info"`; `fieldPath` and `suggestion` optional; at most 50 issues kept (extras dropped, logged).
- R171. **Writes only through tools, under bypass.** The LLM call itself runs as the requester with authorization off like any task (R161) and has no write access. `updateTargetFields` wraps only the port's `update` in `WorkflowBypassService.run` (R150); the move, trash and delete blocks stay active. A failed write returns an error text to the model and does not fail the step.
- R172. **Prompt composition.** System: capability `guidance` (output contract, fixed) plus `additionalInstructions` via `withAdditionalInstructions`; user message: labelled target content, previous step comments, then the step `instructions` in a delimited block. Content under review is data, not instructions: the guidance says so. No default prompt (D109).
- R173. **Capability gating.** The resolver failure is mapped, not leaked: disabled or unresolved capability gives the R169 capability reason (D40, restartable). Resolution happens on reach-time validation in `AiStepType.reach` (fail fast, no task) and again in the runner before the call.
- R174. **Dependency direction** (D56). `ai-powerups` depends on `api-workflows`, never the reverse; api-workflows gains no AI dependency (`ai` package stays in ai-powerups). The `ai` step type and runner are registered inside `Extension.ts` after the `aiPowerups` check; the workflows features are resolved lazily, so registration order does not matter.
- R175. **Wrappers.** No new per-app GraphQL for steps (AI has no human action beyond restart, which phase 5 covers; `restart*` wrappers need no change). Shared `listAiTools` only. `issues` and `taskId` reach the admin through the shared `WorkflowsReviewStep` type.
- Assumptions to add: A56 the AI call is one `generateText` per task iteration; a step that exceeds the runtime limit fails restartably. A57 an AI edit leaves earlier approvals valid, as for automations (D36, D62). A58 prompt injection from content under review is mitigated by scope (tool context, allowlist) not by detection.

## 5. Open questions

1. **Reuse `workflowsStepRun` for AI or add a second private task?** Spec 7.4 title says AI or automation but the text says it "serves every automation step". (a) Reuse with per-type `StepRunner` dispatch (6.2). (b) A separate `workflowsAiStepRun` definition and handler, no phase 5 change. (c) Reuse the task but fork the handler per type. Recommend (a): one guard, hooks, stuck detection and restart path; cost is the 6.2 refactor, protected by unchanged phase 5 tests.
2. **How does the step's chosen model get a connection?** D101 says the step's model is used; the resolver only returns the role's model and its connection. (a) Add an optional `model` argument to `ResolveAiCapabilityUseCase.execute`: keep the capability enabled check, pick the first configured connection whose `sdkName` matches the model's provider, fail with the model-not-available reason otherwise. (b) Use the resolved connection only when the provider matches, else fail. (c) Skip the resolver for the connection and let `Ai` pick by provider id. Recommend (a): keeps the single place that knows precedence and the licence/enabled gate; one small resolver change plus tests.
3. **What may `updateTargetFields` write, and does WB ship in phase 6?** Spec only says `fieldPath -> value` per adapter. (a) CMS: top-level and nested object fields by dotted path, validated against the model, no dynamic zones or references; WB: read in full, write only page title/properties/SEO fields, not the element tree. (b) Both full including dynamic zones and the WB element tree. (c) CMS write only; WB read-only in phase 6. Recommend (a): bounded and testable; (b) is a large feature on its own and the element tree has no `fieldPath` meaning.
4. **Limits on input size and run time.** Spec has none besides max iterations. Large entries can blow the context window and an LLM call cannot be resumed after a Lambda timeout. (a) A fixed input cap constant (for example 200k characters) that fails the step with a fixed reason, plus an abort signal tied to the task's remaining runtime, failing with `The AI review timed out.`. (b) No caps: provider error becomes `The AI review failed.`. (c) Truncate the content with a marker. Recommend (a): predictable, restartable, no silent partial review (c would let the AI approve content it never saw).
5. **Where does the end-to-end test live?** (a) `api-headless-cms-workflows/__tests__` with `ai-powerups` as a dev dependency and a mock `Ai`. (b) `ai-powerups/__tests__` with `@webiny/api-headless-cms-testing`, a first integration harness there. (c) Unit tests only in each package, no combined run. Recommend (a)-like placement only if the dev dependency does not create a build cycle (ai-powerups depends on api-workflows, so cms-workflows depending on ai-powerups may cycle at project level); else (b). Needs a one-line check of the package graph by the user.

## 6. Risks / Review Focus candidates

1. **Phase 5 behaviour changes during the runner refactor** (6.1, 6.2): every automation fail reason, guard, wait and hook must stay identical. Pin by running the unchanged phase 5 stepRun and stepTypes tests after tasks 2, 3, 4.
2. **Prompt injection and tool scope**: content under review can tell the model to approve or call tools. Review the context-bound tool handlers (no ids from the model), allowlist filtering (a tool not on the step is absent), `updateTargetFields` as the only writer, and that rejection needs a comment.
3. **AI writes without the right bypass or identity**: write under bypass only inside the tool, attributed to the requester, authorization off by the task runner (R161), blocks other than the save block still active. Test "move/delete blocked, update allowed".
4. **Stale or forged task writes** (D7, SEC-68): AI runner shares the guard; a late AI result after cancel or restart must write nothing (the LLM call can take minutes). Re-guard after the model returns, before approve/reject and before issues are saved.
5. **Capability and licence failure paths**: `ResolveAiCapabilityUseCase` is optional-injected outside ai-powerups; the AI type must not be registered or must fail with the fixed reason when absent; never leak settings paths, keys or provider messages into step comments (log only).
6. **Model/connection pairing** (open question 2): a model from one provider with a credential from another gives a provider auth error; resolver check must catch it.
7. **Structured output reliability**: malformed or missing output must fail the step (not approve by default); an empty `comment` on reject; `issues` size cap; unknown severity.
8. **Cost and loops**: tool-loop cap `AI_STEP_MAX_TOOL_STEPS`, one LLM run per task, restart creates a new run (cost per restart); no retry inside a task.
9. **Cross-package wiring**: new `ai-powerups` -> `api-workflows` dependency (adio, sync-dependencies, tsconfigs), registration both flags, placeholder row switching to the registry row, WB and CMS adapters registering the editor port under their flags only.
10. **R87 in the adapters**: dependency throws in the port implementations become failed Results/tool error text, never rejected promises into the runner.
