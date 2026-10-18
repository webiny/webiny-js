# Writing an AI tool

A developer guide for AI steps: registering a tool the model may call, making a custom target editable, and knowing what an AI run does and does not guard. It is for developers who register a tool or a target editor, not for workflow authors.

## 1. What an AI step and an AI tool are

An AI step is a workflow step the author configures with instructions, a model and an allowlist of tools. The engine runs it as the same private background task as an automation (`workflowsStepRun`), and the model answers with `{ approved, comment, issues[] }`. It acts like a human reviewer: it approves or rejects with a comment, and no human confirms it.

A tool is a function the model may call while it works. Webiny ships two (`readTarget` and `updateTargetFields`, section 4); developers register their own (sections 2 and 3).

The AI step type is added by `@webiny/ai-powerups` and exists only when both `aiPowerups` and `advancedPublishingWorkflow` are on (R177). The tool registry and the target editor port live in api-workflows. The global `AiSdkTools` registry is never exposed to AI steps (D55).

## 2. The tool abstraction

The abstraction is `WorkflowAiTool`, exported from `@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js` together with the types `IWorkflowAiTool`, `WorkflowAiToolContext` and `WorkflowAiToolResult` (R167). A tool has:

- `name`: stable, stored on the steps that allowlist it. A rename breaks stored workflows.
- `title`: shown to the workflow author in the editor (`listAiTools` returns it).
- `description`: what the MODEL sees. Say what the tool does and when to use it.
- `inputSchema`: a zod schema. The model's arguments are parsed with it, so a field the schema does not name is stripped.
- `execute(input, context)`: returns `{ ok, data?, error? }`.

**Naming rule.** `name` matches `^[A-Za-z][A-Za-z0-9_]{0,63}$`: letters, digits and underscores, starting with a letter, at most 64 characters, so it is valid as a provider tool name. A tool with an invalid name is dropped when the registry is built and logged once with `Logger.error`; it is never thrown, so one bad tool cannot break the others (R167).

Names are unique across the registry: the last registration of a name wins, including over the built-ins (A61). Registering a tool under a built-in name (for example `updateTargetFields`) replaces the built-in, and so drops the engine's stale check and bypass guard. Do it only on purpose.

Registering a tool does not make any step use it. A step must allowlist the tool by name (section 5).

**Overriding.** To replace a built-in tool, step type or step runner, register your implementation as a class (`container.register(X)` with `X.createImplementation(...)`), the same way the built-ins are registered. `@webiny/di` resolves `registerInstance` registrations before class registrations, so an instance registration loses to a class registration of the same abstraction.

**One instance per container.** The tool registry is a singleton per container: every tool is built once, when the registry is first resolved. A tool may inject only services that are stable for the container, and must never keep per-call state (requester, task, review) on the instance; everything per call comes from the `execute` context. A tool whose dependency fails to resolve breaks the registry, and with it every tool.

## 3. Writing and registering a tool

The context (`review`, `step`, `requester`, `task`) is the ONLY place a handler learns which review, step, target or revision it works for. A handler never takes a target, revision, review or step id from the model: the example's schema has no such field, and a field that is not in the schema is stripped.

`execute` must not reject. Catch, log with `Logger.error` and answer `{ ok: false, error: "<fixed text>" }` (R87). `error` is read by the model, so never put a provider, storage or thrown message in it.

A read-only example, written and owned by whoever needs it. The glossary reader is the developer's own service; Webiny ships neither it nor this tool.

```ts
// extensions/glossary/LookupGlossaryTermTool.ts
import { z } from "zod";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { WorkflowAiTool } from "@webiny/api-workflows/features/aiTools/WorkflowAiTool/index.js";
import { GlossaryReader } from "./GlossaryReader.js";

const inputSchema = z.object({
    term: z.string().min(1).max(100).describe("The term to look up")
});

type Input = z.infer<typeof inputSchema>;

class LookupGlossaryTermToolImpl implements WorkflowAiTool.Interface<Input> {
    public readonly name = "lookupGlossaryTerm";
    public readonly title = "Look up a glossary term";
    public readonly description =
        "Returns the approved definition of a glossary term. Call it when the content uses a term and you need to check that it is used correctly.";
    public readonly inputSchema = inputSchema;

    public constructor(
        private glossary: GlossaryReader.Interface,
        private logger: Logger.Interface
    ) {}

    public async execute(
        input: Input,
        context: WorkflowAiTool.Context
    ): Promise<WorkflowAiTool.Result> {
        try {
            const definition = await this.glossary.find(input.term);
            if (definition === null) {
                return { ok: false, error: "The term was not found." };
            }
            return { ok: true, data: { definition } };
        } catch (error) {
            this.logger.error(
                { error, reviewId: context.review.id, stepId: context.step.id },
                "Could not look up the glossary term."
            );
            return { ok: false, error: "The glossary could not be read." };
        }
    }
}

export const LookupGlossaryTermTool = WorkflowAiTool.createImplementation({
    implementation: LookupGlossaryTermToolImpl,
    dependencies: [GlossaryReader, Logger]
});
```

```ts
// extensions/glossary/feature.ts
import { createFeature } from "@webiny/feature/api";
import { LookupGlossaryTermTool } from "./LookupGlossaryTermTool.js";

export const GlossaryToolsFeature = createFeature({
    name: "Acme/GlossaryTools",
    register(container) {
        container.register(LookupGlossaryTermTool);
    }
});
```

Register the feature in the API like any other API feature of the project. One class and one feature, one abstraction or implementation per file.

A tool that throws anyway does not break the run: the runner answers the model `The tool "<name>" failed.` and logs the raw error. A tool must still not rely on that (R87).

Tool calls of one AI run execute one at a time: the runner serialises them, so two calls of one model step never run in parallel.

**Testing a tool.** Drive `execute` directly with a context built from a review fixture. The engine's own tests do this with `TestWorkflowAiTool` and `createAiToolContext` in `packages/api-workflows/__tests__/__helpers/`; use them as the pattern, not as an import.

## 4. The built-in tools

`WorkflowsFeature` registers two tools. A step must allowlist them like any other tool; a step with no tools can only decide.

- `readTarget` takes no input. It returns the content under review as `{ title, fields[] }`, each field `{ path, label, type, value, writable }`. `writable` tells the model what it may change. It answers the same text as the input cap (section 8) as a tool error when the content is too large. A throw is answered as `The target could not be read.`
- `updateTargetFields({ fields })` takes `{ "<path>": value }` using paths from the last `readTarget` and returns `{ applied: string[] }`. It is the ONLY way an AI step changes content. An empty object answers `No fields were given.` A throw is answered as `The target could not be updated.`

**What can be written (R172).**

- Headless CMS (`cms.<modelId>`): top-level fields and fields inside nested `object` fields (dotted paths such as `address.street`) of type `text`, `long-text`, `number`, `boolean` and `datetime`, when the field is not `multipleValues` and not inside a `multipleValues` object. References, files, rich text, dynamic zones and every other type are read-only. Values pass the model's own validators through the CMS entry update.
- Website Builder (`wb.page`): `properties.title` and the SEO scalars `properties.seo.title`, `properties.seo.description`, `properties.seo.canonicalUrl`, `properties.seo.noIndex` and `properties.seo.noFollow`. Everything else (path, language, the element tree, bindings, metadata) is read-only. The write is the whole merged `properties` object, so a human edit to another `properties` key in the window between the read and the write is lost (A59). `canonicalUrl` must be a pathname.

A bad path, a read-only path or a value the target rejects writes NOTHING: the whole call is atomic, and the refusal text goes back to the model, which may try again. A refused or failed write never fails the step.

Some behaviours the model sees. CMS `datetime` values reach it as strings (a date as `YYYY-MM-DD`; a date-time without timezone, and an unset value, as ISO text). A pre-existing invalid field makes any AI update of that entry fail with a sanitised message. A validator's own configured message may reach the model; a validator that throws gives a generic text. Website Builder validation errors reach the model as a generic text.

**What `updateTargetFields` guards (R173, D144).**

- Before every write it re-reads the stored review and refuses with `The review step is no longer running.` when the review was cancelled, finished or the step restarted meanwhile, and with `The step could not be checked; nothing was written.` when that check itself failed (fail-closed).
- Only the write is wrapped in the workflow bypass (`WorkflowBypassService`), awaited inside it, so the save block (`BlockUpdateWhileInReview`, which also covers `wb.page`) does not reject the AI's own edit. Moving, deleting and trashing the content stay blocked (D36, D62). The bypass is used by the automation runner and by `updateTargetFields` only.
- The check and the write are not atomic: a cancel that lands inside that window, in one request, can still be written (A59).
- Fields the AI wrote stay when the step later fails (a timeout, an abort, no decision, the step cap). Nothing is rolled back, and a restart reviews the edited content.

## 5. Allowlisting and what a workflow author sees

`listAiTools` (shared `workflows` root, `editor` only) returns `{ name, title, description }` per tool, sorted by title. The editor shows them as the allowlist. Only allowlisted tools are given to the model for that step.

Save refuses a `tools` entry the registry does not know: `Step "<title>" uses the AI tool "<name>", which is not defined.` The save-time check also answers `Step "<title>" has an invalid AI configuration.` (the config no longer parses) and `Step "<title>" could not be checked: the configured AI models could not be loaded.` (the model list could not be read). These are save-time texts, distinct from the run-time reason `The AI step configuration is not valid.` (`AI_STEP_INVALID_CONFIGURATION_REASON`).

A tool that was allowlisted and is later unregistered fails the step on reach and on run with `The AI tool "<name>" is not available.` (restartable).

The step's model must be among the models that have a configured connection (`listAiModels`, `ConfiguredAiModelsService`, R169). The check on save runs only for a step that is new or whose config changed, so an unrelated edit of a workflow whose connection was removed still saves. A model removed later fails the step with `The model "<model>" is not available.`

## 6. Who the tool runs as

The AI run is attributed to the REQUESTER with authorization turned OFF for the whole run (R161, R173): `IdentityContext` holds the requester, and nothing the tool calls checks permissions. Write permission is checked when the review is requested, not at run time, and `readTarget` and `updateTargetFields` add no entry-level read check beyond what the CMS and Website Builder readers do. A custom tool is therefore NOT limited by the requester's permissions. The tool author is responsible for its own reads and writes: touch only what the tool exists for, take no id from the model, and read the target through the context.

The decision itself is applied with an `ai` actor that names the requester: `{ type: "ai", id: <requester id>, displayName: <requester displayName> }` (R164).

Delivery is at-least-once (a restarted or re-entered step can call a tool again), so a writing tool should be idempotent.

A tool's write path is the developer's responsibility (A61): the engine guards only its own `updateTargetFields`. A custom tool that writes the content under review should do what `updateTargetFields` does:

- Refuse when `StepRunStaleCheckService.isStale({ reviewId, stepId, task })` answers `Result.ok(true)` (stale) or a failed Result (the read failed; fail-closed). `task` is `context.task`, a `StepRunTaskIdentity`.
- Run only the write inside `WorkflowBypassService.run`, awaited inside it.
- Return the target's refusal text instead of throwing.

Both services resolve from public paths: `@webiny/api-workflows/features/stepRun/StepRunStaleCheckService/index.js` and `@webiny/api-workflows/features/bypass/WorkflowBypassService/index.js`.

**Prompt injection.** The content under review and the previous step comments are given to the model as JSON with every `<` escaped, inside marked blocks, and the step instructions come last. The guidance tells the model the content is data. This is mitigation by scope, not by detection (A58): hostile content can still steer the decision, write into writable fields, or make the AI echo guidance, instructions or earlier comments into its comment or issues, which review participants can see. Tool results are data too: a custom tool returns data and never text meant to instruct the model.

## 7. Making a custom target editable: the `ReviewTargetEditor` port

For a target that is not Headless CMS or Website Builder, register an implementation of `ReviewTargetEditor` (`@webiny/api-workflows/features/review/ReviewTargetEditor/index.js`) next to your `ReviewTargetLoader`. A target must already be loadable by the workflow engine. The two existing adapters are the examples: `packages/api-headless-cms-workflows/src/features/target/CmsEntryReviewTargetEditor.ts` and `packages/api-website-builder-workflows/src/features/target/WbPageReviewTargetEditor.ts`.

The port:

- `canEdit(model)`: does it handle this namespace id. The LAST registered editor that says yes wins.
- `read({ model, targetId, targetRevisionId })`: returns `Result<ReviewTargetContent, ReviewTargetEditorError>`, `{ title, fields[] }` with one `writable` verdict per field.
- `update({ model, targetId, targetRevisionId, values })`: returns `Result<{ applied: string[] }, ReviewTargetEditorError>`.

A failure is `Result.fail(new ReviewTargetEditorError(message))` (`@webiny/api-workflows/domain/review/errors.js`).

Rules for an adapter (R172, R87):

- Decide `writable` conservatively and enforce it again in `update`.
- An unknown or read-only path, or a value the target rejects, fails the WHOLE call and writes nothing.
- Failures are `ReviewTargetEditorError`s whose message is safe to show the model (a validation text or a generic one). Log the real error with `Logger.error`; never put a provider or storage error in the message.
- An adapter must catch and return a failed Result, never reject, as the CMS and Website Builder adapters do.
- Write the full merged object when the target replaces rather than merges: a partial blob would wipe keys.
- Do not apply the bypass or the stale check yourself. The tool does that around `update`.

`ReviewTargetEditorService` takes the same params (`model`, `targetId`, `targetRevisionId`, plus `values` for `update`), picks the editor and does NOT catch; with no editor it fails with `This target cannot be edited.`

Register the editor under the same flag as the rest of the target adapter. Test it with `FakeReviewTargetEditor` (api-workflows `__tests__/__helpers/`) as the pattern.

## 8. Limits and what happens when content is too large

- The serialised target plus the previous comments plus the step instructions may not exceed `AI_STEP_MAX_INPUT_CHARACTERS` (200000). Over the cap the step fails BEFORE any model call with `The content is too large for the AI review.`, and `readTarget` answers the same text as a tool error. Nothing is ever truncated: the AI must not approve content it never saw.
- Content and comments are serialised with `<` escaped as `\u003c` (6 characters), so markup-heavy content reaches the cap earlier than `readTarget`'s own check does. A Website Builder page keeps its bindings in full and summarises only the element tree, so a page with very large bindings fails the same way, and not even its title can be edited.
- The tool loop stops after `AI_STEP_MAX_TOOL_STEPS` (20) steps: `The AI review did not finish in 20 steps.`
- The model call is aborted shortly before the task's remaining runtime ends (`The AI review timed out.`, margin `STEP_RUN_TIMEOUT_MARGIN_MS`, 30 seconds).
- A cancel or restart seen during the call stops it between tool steps, at most `STEP_RUN_STALE_CHECK_INTERVAL_MS` (5 seconds) late, and nothing is written afterwards (A56, A59). A call whose result is discarded as stale is accepted.
- At most `AI_STEP_MAX_ISSUES` (50) issues are kept (extras are dropped and logged); `fieldPath` is clamped to 500 characters, `message` and `suggestion` to 2000. The comment is capped at `AI_STEP_MAX_COMMENT_LENGTH` (5000).
- A custom tool's `data` goes to the model unchanged and uncapped, so a tool must bound its own output: a large result can exhaust the model's context.

## 9. Failure and restart

Every failure writes a fixed reason on the step (`failed`, R146, R170), and nothing is left silent. Raw provider, storage and thrown messages are logged, never shown; a logged provider or resolver error is `{ name, message, statusCode }` only, never the request body. Copy the texts from the two files below, not from this guide.

Reach-time reasons are in `packages/ai-powerups/src/api/features/WorkflowReview/aiFailureReasons.ts`:

- `AI_STEP_INVALID_CONFIGURATION_REASON`: `The AI step configuration is not valid.`
- `aiToolNotAvailableReason(name)`: `The AI tool "<name>" is not available.`
- `aiModelNotAvailableReason(model)`: `The model "<model>" is not available.`
- `AI_CAPABILITY_NOT_AVAILABLE_REASON`: `The AI review capability is not available.` (capability disabled, licence lapsed or settings unresolved)
- `AI_REVIEW_FAILED_REASON`: `The AI review failed.`
- `AI_REVIEW_NOT_STARTED_REASON`: `The AI review could not be started.`

The reach service logs a failed capability resolve once, except model-not-available and disabled.

Runner-time reasons are in `packages/ai-powerups/src/api/features/WorkflowReview/AiStepRunner/aiRunFailureReasons.ts`, and the runner also uses the shared ones above where they apply: the timeout (`The AI review timed out.`), no valid decision (`The AI review returned no decision.`), a rejection without a comment (`The AI review rejected without a comment.`), the step cap (`The AI review did not finish in 20 steps.`), the over-the-cap text from section 8, an abort (`The AI review was aborted.`) and a task that ended without a result (`The AI review task ended without a result.`). The runner also logs a failed capability resolve once, except model-not-available and disabled.

`ConfiguredAiModelsService` logs its own failures once. A failed settings read inside `findConnection` is logged twice, once by the service and once by the step check or the runner; this is accepted.

`listAiModels` logs a throwing permission read or a throwing `list()` once and answers the fixed text `Could not list the AI models.`

A failed AI step shows in the failed list (D112). The requester, or a viewer with `reassign`, restarts it through the phase 5 restart; each restart is a new task and a new model cost.

The AI task is one iteration: a re-entered task fails without a second model call.

**Cleanup and stuck steps.** The step run task is kept after it finishes and is deleted with its review (R256, D161), so an operator can read its status in the admin; every outcome is also on the step. Stuck detection treats a missing task, or a task read that returned nothing, as stuck after a five-minute grace from the step start. Known limitation (user decision 2026-10-15): a task left in `running` after its runtime was killed hard is never failed, so such a step stays in review until it is restarted or cancelled.

**Issues.** The decision carries `issues[]`, `{ fieldPath, severity, message, suggestion }`, stored on the step (`ReviewStep.issues`, default `[]`, reset by a restart). Showing them is the admin phases' work.

**Private tasks.** R180.

## 10. Related

Spec 7.1, 7.3, 7.4 and 9.3; decisions D13, D39, D40, D55, D56, D101, D109 and D138-D148; `automations.md` for the shared task runner.
