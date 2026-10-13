### Task 18: Docs, comment cleanup, spec, roadmap and decisions updates

Spec 7.1, 7.2, 7.4, 10; D14, D35-D37, D56, D57, D66, D67, D82, D86, D87, D100; R131-R158; user answers Q1-Q7 (`../00-answers.md`). Comments that still describe phase 5 as future work, the automation developer guide, and the spec, roadmap and decisions updated to what phase 5 built. The user's answers bind this task: **"Send webhook" is not a built-in** (it was only an example of a custom automation) and **there are no secret settings** (D67's secret part and D86's "Send webhook" part are superseded, R154, R155). Automations are written by developers in code; each declares a zod settings schema for what the workflow author fills in. No behaviour change in source.

**Files:**
- Modify (each only if an earlier phase 5 task left the wording, see Step 2): `packages/api-workflows/src/features/config/ListWorkflowStepTypes/abstractions.ts`, `packages/api-workflows/src/features/config/ListWorkflowStepTypes/ListWorkflowStepTypesUseCase.ts`, `packages/api-workflows/src/domain/config/types.ts`, `packages/api-workflows/src/features/review/StepAssignmentResolver/RoutingStepAssignmentResolver.ts`, `packages/api-workflows/src/features/review/ReviewStepReacher/abstractions.ts`, `packages/api-workflows/src/domain/review/types.ts`, `packages/api-workflows/src/domain/review/getReviewViewerFlags.ts`, `packages/api-workflows/src/domain/workflow/reviewStepConfigSchema.ts`, `packages/api-workflows/src/domain/workflow/WorkflowValidator.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/hooks/BlockUpdateWhileInReview.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/wrappers/listReviews.test.ts`
- Create: `docs/.bruno/workflows/automations.md` (the automation developer guide)
- Modify: `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`
- Modify: `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`
- Modify: `docs/.bruno/workflows/decisions.md`
- Modify: `docs/.bruno/workflows/README.md` (index line for the guide)
- Modify: `docs/.bruno/plans/2026-10-13-workflows-phase-4/00-shared.md`, `docs/.bruno/plans/2026-10-13-workflows-phase-3/00-shared.md`, `docs/.bruno/plans/2026-10-11-workflows-phase-2/00-shared.md`, `docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md` (only the notes that hand an item to phase 5, see Step 7)

**Interfaces:**
- Consumes: what Tasks 1-17 landed (names in `../00-shared.md`: `StepType`, `StepTypeRegistryService`, `AutomationDefinition` (`id`, `name`, `models`, `settingsSchema`, `maxIterations?`, `run`), `AutomationOutcome`, `AutomationRunParams`, `listAutomationDefinitions`, the private task definition `workflowsStepRun`, `RestartReviewStepUseCase`, `restartCmsEntryReviewStep`, `restartWebsiteBuilderPageReviewStep`, `canRestart`, R131-R158).
- Produces: no code behaviour change; `docs/.bruno/workflows/automations.md`.

- [ ] **Step 1: Find the stale wording (the "failing test")**

Run:

```
grep -rni "phase 5" packages/api-workflows/src packages/api-headless-cms-workflows/src packages/api-website-builder-workflows/src packages/api-workflows/__tests__ packages/api-headless-cms-workflows/__tests__ packages/api-website-builder-workflows/__tests__
grep -rni "send webhook\|secret" docs/.bruno/specs docs/.bruno/workflows docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md
grep -rn "before phase 5\|until phase 5\|R93" packages/api-workflows packages/api-headless-cms-workflows packages/api-website-builder-workflows --include=*.ts -l
```

Expected hits for the first, minus what Tasks 1-17 already rewrote: `ListWorkflowStepTypes/abstractions.ts` ("A static list until phase 5"), `ListWorkflowStepTypesUseCase.ts` ("none exist before phase 5"), `domain/config/types.ts` ("Static list; phase 5 builds it"), `RoutingStepAssignmentResolver.ts` ("phase 5 fails such steps"), `ReviewStepReacher/abstractions.ts` ("Phase 5 dispatches here by step type"), `domain/review/types.ts` and `getReviewViewerFlags.ts` ("until phase 5 adds failed steps"), `reviewStepConfigSchema.ts` ("until phase 5 adds the `StepType`"), `WorkflowValidator.ts` ("phase 5 replaces this check", only if Task 1 kept the line), CMS `BlockUpdateWhileInReview.ts` ("Phase 5 adds the automation and AI bypass context here"), CMS `seeds.ts` and WB `listReviews.test.ts` ("before phase 5, R93"; Task 16 already fixed the `seedFailedStep` comment in `seeds.ts`). Expected hits for the second: spec lines on secret fields (4, 7.2), the "Send webhook" bullet in 7.2, the "secret" UI hint in the admin section, the roadmap phase 5 row, D66, D67 and D86 in `decisions.md`, and research mentions of `WebhookDeliver` (`README.md`, `infrastructure.md`: background research on what exists, leave them). Any other hit is future-tense phase 5 wording: rewrite it the same way (describe what the code does now, cite the ruling).

- [ ] **Step 2: Code comments**

Each replacement applies only when the file still contains the quoted text; when an earlier task already rewrote it, leave the file as it is. Re-wrap to 100 columns if `yarn format:fix` does not.

`packages/api-workflows/src/features/config/ListWorkflowStepTypes/abstractions.ts`: replace

```
 * `workflows.editor`. A static list until phase 5 adds the `StepType` registry; the workflow
 * validator still accepts only "review".
```

with

```
 * `workflows.editor`. Built from the `StepType` registry (R138): `review` and `automation`, plus the
 * `ai` row while no `ai` type is registered (R132). The workflow validator goes through the same
 * registry.
```

`ListWorkflowStepTypesUseCase.ts`: replace

```
                // Needs an automation definition covering the model; none exist before phase 5.
```

with

```
                // Available once a developer registers an automation definition (R138); whether
                // one covers a workflow's models is checked at save time (R136).
```

(if the `automation` row is now built from the registry, delete the comment with the hard-coded row instead.)

`packages/api-workflows/src/domain/config/types.ts`: replace

```
 * A step type the workflow editor can offer (D130). Static list; phase 5 builds it
 * from the `StepType` registry.
```

with

```
 * A step type the workflow editor can offer (D130), built from the `StepType` registry (R138).
```

`RoutingStepAssignmentResolver.ts`: replace

```
        // leaves an empty pool; phase 5 fails such steps ("fail on invalid settings").
```

with

```
        // leaves an empty pool; the review step type does not fail such a step (R116).
```

`ReviewStepReacher/abstractions.ts`: replace

```
 * pending. Phase 5 dispatches here by step type.
```

with

```
 * pending. Dispatches by step type through `StepTypeRegistryService` (R131); a step whose type is
 * not registered is failed with a reason (R146).
```

`domain/review/types.ts`: replace

```
    /** Always `false` until phase 5 adds failed steps (D34). */
```

with

```
    /** The current step is `failed` and the viewer is the requester or has `reassign` (D34, R153). */
```

`getReviewViewerFlags.ts`: replace

```
 * `canRestart` stays `false` until phase 5 adds failed steps; then it is "current step failed,
 * and requester or `reassign`" (D34).
```

with

```
 * `canRestart` is "current step failed, and requester or `reassign`" (D34, R153): `Review.checkRestart`
 * and `canRestartByPermission`.
```

`reviewStepConfigSchema.ts`: replace

```
 * Config of a "review" step (spec 4.1). Validated in code until phase 5 adds the `StepType`
 * extension point; stored as JSON on the workflow and review models.
```

with

```
 * Config of a "review" step (spec 4.1). `ReviewStepType` validates it through the `StepType`
 * extension point (R131); stored as JSON on the workflow and review models.
```

`WorkflowValidator.ts` (only if the line is still there): replace

```
/** The only step type phase 1a accepts; phase 5 replaces this check with the `StepType` registry. */
```

with

```
/** The built-in review step type; the validator dispatches to the `StepType` registry (R131). */
```

`packages/api-headless-cms-workflows/src/features/hooks/BlockUpdateWhileInReview.ts`: replace

```
 * publishes `EntryBeforeUpdateRevisionDescription`; metadata only, not content). Phase 5 adds the
 * automation and AI bypass context here (D36, D62), as a check before the binding lookup.
```

with

```
 * publishes `EntryBeforeUpdateRevisionDescription`; metadata only, not content). Inside an
 * automation run (`WorkflowBypassService.isActive()`, R150) this block, and only this one, skips,
 * as a check before the binding lookup (D36, D62); move, folder-change, delete and trash blocks
 * stay active for automations.
```

`packages/api-headless-cms-workflows/__tests__/__helpers/seeds.ts` and `packages/api-website-builder-workflows/__tests__/wrappers/listReviews.test.ts`: where they still say that nothing produces a failed step before phase 5 (R93), replace with `Seeded straight through the repository so the test controls the failed step exactly (the runner produces them for real, R146).`

- [ ] **Step 3: The automation developer guide**

Create `docs/.bruno/workflows/automations.md`. It describes what phase 5 built, for developers who write an automation (not for workflow authors). Content, in this order:

1. **What an automation is.** A class you write in your project (or an extension package) and register with the API. A workflow author adds it as a step, fills in the settings your definition asks for, and the engine runs it as a background task when the step is reached. Nothing ships with Webiny: there are no built-in automations (R155). A "call a webhook" automation, a "create records" automation or a "pull an image" automation are examples of what you can write.
2. **The definition.** The abstraction `AutomationDefinition` from `@webiny/api-workflows/features/automation/AutomationDefinition/index.js` (R134): `id` (stable, stored in workflows), `name` (shown in the editor), `models` (where it may be used: `["*"]`, `["cms.*"]`, `["wb.*"]` or exact namespace ids such as `cms.article`; a workflow can use it only when the scope covers every model of the workflow, R136), `settingsSchema` (a zod schema, below), optional `maxIterations` (default 50, R145) and `run(params)`.
3. **Settings: the zod schema.** `settingsSchema` describes what the workflow author fills in (for a webhook automation of your own: the URL). It is exposed to the editor as JSON schema (`listAutomationDefinitions`, `z.toJSONSchema` with `io: "input"` and `unrepresentable: "any"`, R138), so the editor form describes what the author types (a field with a `.default()` is not required); write schemas JSON schema can express (defaults, enums, strings, numbers, booleans, objects, arrays; avoid custom refinements for fields the editor must render). The settings are stored as the author entered them (not zod's parsed output, so a transform such as `z.string().transform(Number)` saves fine) and parsed with your schema on each use: when the workflow is saved, when the step is reached and restarted, and again before every `run` (R137, R148); `run` receives the parsed value, defaults and transforms applied. Invalid settings fail the step with `The automation settings are not valid: <path>: <message>.` (R146).
4. **Credentials do not go into settings.** There are no secret settings (R154): workflow authors never set or see keys, tokens or signing secrets. Read them in your own code, from the environment or your configuration, inside `run` or the class constructor.
5. **`run` and its outcome.** `run({ settings, review, step, iteration, state })` returns an `AutomationOutcome` (R135): `{ type: "approved", comment? }`, `{ type: "rejected", comment }` (the comment must be 10 or more characters, else the step fails with `The automation rejected without a comment.`), or `{ type: "continue", wait?, state? }` to run again after `wait` seconds with `state` handed back as `params.state` (poll an external system across iterations; there is no inbound callback route in v1). Throwing fails the step with the fixed reason `The automation failed.`; the error message is not stored on the step (it can carry internals), it is logged with the full error, so log what you need yourself before throwing. To explain a business rejection to the workflow author, return `{ type: "rejected", comment }`. `iteration` is the automation's own run count and starts at 1; the engine's short waits for the task id to be saved are not counted (R163). When the run count would exceed the definition's `maxIterations` the step fails with `The automation did not finish in <n> iterations.`, `<n>` being that definition's own `maxIterations` (R145, never the runner's internal ceiling).
6. **Who it runs as and what it may do.** The task and everything the engine does around `run` are attributed to the requester: `IdentityContext` holds the requester identity while `run` executes (so records it creates carry them as `createdBy`, D87, R161). Authorization is turned OFF for the whole run (D36: an automation may change anything), so an automation is NOT limited by the requester's permissions: it can read and write anything, and the developer must scope their own code (for example, only touch the review's own entry and the records the automation exists for); the outcome is applied with an `automation` actor that names the requester (R141). `run` executes inside the workflow bypass context (R150): only the save block (`BlockUpdateWhileInReview`) is lifted, so the automation may update the content under review without invalidating the review. Moving the content to another folder, deleting and trashing it stay blocked.
7. **Failure and restart.** Every failure writes a fixed reason on the step (`failed`, R146) and nothing is left silent: a missing definition, step settings or step configuration that no longer parse (`The automation step configuration is not valid.`), a scope that no longer covers the models, a task that could not start (`The automation could not be started.`), a thrown error (`The automation failed.`; the raw message is logged, never shown), too many iterations, a task that ended without a result, an abort. A failed step shows in the failed list (D112); the requester or a viewer with `reassign` restarts it (`restartCmsEntryReviewStep`, `restartWebsiteBuilderPageReviewStep`, `canRestart`, R153, R158); the earlier attempt is kept under `runs` with its `taskId`, outcome and reason. A rejected step cannot be restarted (D8). Cancelling or deleting a review aborts the running task (R151).
8. **Registering it.** One class and one feature, one abstraction or implementation per file:

```ts
// extensions/automations/CallWebhookAutomation.ts
import { z } from "zod";
import { AutomationDefinition } from "@webiny/api-workflows/features/automation/AutomationDefinition/index.js";

const settingsSchema = z.object({
    url: z.url().describe("Where to send the review"),
    timeoutSeconds: z.number().int().min(1).max(30).default(10)
});

class CallWebhookAutomationImpl implements AutomationDefinition.Interface {
    public readonly id = "acme.callWebhook";
    public readonly name = "Call webhook";
    public readonly models = ["cms.*"];
    public readonly settingsSchema = settingsSchema;
    public readonly maxIterations = 20;

    public async run(params: AutomationDefinition.RunParams<z.infer<typeof settingsSchema>>) {
        // The credential comes from your own configuration, never from the step settings.
        const apiKey = process.env.ACME_WEBHOOK_KEY;
        const response = await fetch(params.settings.url, {
            method: "POST",
            headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
            body: JSON.stringify({ reviewId: params.review.id, title: params.review.title }),
            signal: AbortSignal.timeout(params.settings.timeoutSeconds * 1000)
        });
        if (response.status === 202) {
            return { type: "continue", wait: 30 } as const;
        }
        const body = (await response.json()) as { approved: boolean; comment?: string };
        return body.approved
            ? ({ type: "approved", comment: body.comment } as const)
            : ({ type: "rejected", comment: body.comment ?? "The webhook rejected the content." } as const);
    }
}

export const CallWebhookAutomation = AutomationDefinition.createImplementation({
    implementation: CallWebhookAutomationImpl,
    dependencies: []
});
```

```ts
// extensions/automations/feature.ts
import { createFeature } from "@webiny/feature/api";
import { CallWebhookAutomation } from "./CallWebhookAutomation.js";

export const AutomationsFeature = createFeature({
    name: "Acme/Automations",
    register(container) {
        container.register(CallWebhookAutomation);
    }
});
```

   Register the feature in the API like any other API feature of the project. State plainly that the webhook automation above is the developer's own example, written and owned by whoever needs it, and that Webiny ships none. Before writing the guide, confirm the example against the final `AutomationDefinition` and `AutomationRunParams` exports from Task 2 (names, `createImplementation` shape) and adjust the code to them; check with `yarn tsc` in a scratch file that it compiles, then delete the scratch file.
9. **Testing an automation.** Drive `run` directly with a parsed settings object, a review fixture and `iteration` / `state`; the engine's own tests use a test-only definition (`__tests__/__helpers/TestAutomationDefinition.ts`) and never register one in source (R157).
10. **Related.** Spec 7.2 and 7.4, decisions D14, D35-D37, D57, D86, D87, and the editor side (settings forms generated from the JSON schema) in the admin phases.

Add one index line to `docs/.bruno/workflows/README.md` next to the other file descriptions: ``- `automations.md`: developer guide for writing an automation (definition, zod settings schema, outcomes, credentials, failure and restart, registration).``

- [ ] **Step 4: The spec**

In `docs/.bruno/specs/2026-10-05-workflows-refactor-design.md`:

1. In section 4 delete the line

```
- Secret config fields are kept encrypted in the snapshot and stripped from read responses [D67].
```

2. Replace the whole 7.2 bullet list (from `- Defined in code. v1 ships one built-in, "Send webhook"` to the secret-settings bullet) with:

```
- Defined in code by developers; no automation ships with Webiny, and a "call a webhook" automation, a "create records" automation and so on are examples developers write themselves [D86].
- The automation definition abstraction (`AutomationDefinition`), its outcome types and the step-type extension point are public exports of api-workflows (editor-side counterparts from app-workflows) [D86].
- A definition declares: `id`, `name`, scope `models` (`["*"]`, `["cms.*"]`, or specific namespace ids), a zod `settingsSchema` for the information the workflow author passes in (for a webhook automation: the URL), optional `maxIterations` (default 50), and a handler `run` that returns an outcome: `approved` or `rejected` with a comment, or `continue` with an optional wait in seconds and state for the next iteration [D57].
- The step's config is `{ automationId, settings }`. The workflow author adds the automation as a step and fills `settings`; the editor renders the form from the schema, which `listAutomationDefinitions` exposes as JSON schema. Settings are validated against the definition's zod schema when the workflow is saved, when the step is reached and restarted, and before every run [D14, D37].
- The background task wrapping is framework-owned; implementers write only logic.
- The step editor offers a definition only if its scope covers every model in the workflow; save refuses one that does not [D35].
- An automation may create, update or delete anything, including the target revision. It runs in a workflow bypass context that lifts the save block (`BlockUpdateWhileInReview`) only, so the review stays valid; moving the target, deleting it and trashing it stay blocked while the review is in progress [D36, D62, D84, D134].
- External systems are polled across task iterations (`continue`); no inbound callback route in v1.
- On step reached the definition is looked up and the stored settings (kept as entered) are parsed again; a missing definition, a scope that no longer covers the models or invalid settings fail the step with a fixed reason. The editor flags the same.
- Step config holds no secrets. Credentials an automation needs (keys, tokens, signing secrets) belong to whoever writes the definition, in their own code or configuration, and are never set or seen by workflow editors [D67 superseded].
```

3. In 7.4 add after `- Cancel aborts the running task where possible (...)` bullet:

```
- One private background task definition, `workflowsStepRun`, serves every automation step: input is only `{ reviewId, stepId }`, everything else comes from the review snapshot. The engine triggers the task before the review is saved and stores its id on the step in the same save; the handler waits briefly (up to three short waits) for the id to appear, and a failed save aborts the task. GraphQL `triggerTask` refuses private definitions like unknown ones (SEC-68), and the handler never trusts its input.
- The handler enforces the automation definition's own `maxIterations` from the task's iteration count; the task definition has one high ceiling. Fixed failure reasons cover a missing definition, invalid settings, a scope mismatch, a failed trigger, a thrown error, too many iterations, a task that ended without a result and an abort.
```

4. In section 10, in the root `workflows` bullet replace

```
`listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }`; later transports, automation definitions, AI tools).
```

with

```
`listUsers(search, ids, limit)` → `{ users: { id, displayName }[], missingIds }`, `listAutomationDefinitions` → `{ id, name, models, settingsSchema }[]` (the settings schema as JSON schema); later transports, AI tools).
```

5. In the `cms` bullet replace `` `reassignCmsEntryReviewStep(reviewId, stepId, userId)`, `cancelCmsEntryReview(reviewId)`, `` with `` `reassignCmsEntryReviewStep(reviewId, stepId, userId)`, `restartCmsEntryReviewStep(reviewId, stepId)`, `cancelCmsEntryReview(reviewId)`, ``.

6. In the `websiteBuilder` bullet replace `` `reassignWebsiteBuilderPageReviewStep(reviewId, stepId, userId)`); there is no WB model list. `` with `` `reassignWebsiteBuilderPageReviewStep(reviewId, stepId, userId)`, `restartWebsiteBuilderPageReviewStep(reviewId, stepId)`); there is no WB model list. ``

7. In the operations bullet that starts `- start (\`StartReviewStep\`)` replace only the fragment `, restart, cancel review` with `, restart (\`RestartReviewStep\`: \`reviewId\`, \`stepId\`; only a failed step; re-reaches it as the requester; returns the updated review, and \`canRestart\` is read through the review get operations, R158), cancel review`.

8. Replace `automation definitions (with scope and settings JSON schemas), AI tools` with `automation definitions (with scope and the settings schema as JSON schema, \`listAutomationDefinitions\`), AI tools`.

9. In the admin section (the bullet `Automation settings forms are generated from JSON schema ...`) replace `with UI hints in zod \`.meta()\` (user, team, secret, textarea)` with `with UI hints in zod \`.meta()\` (user, team, textarea)`.

10. Where section 10 lists the review step fields (search the spec for `taskId`), confirm `taskId` and `runs` are exposed on the GraphQL review step as the shared `WorkflowsStepRun` type; add `(\`WorkflowsStepRun { taskId, startedOn, finishedOn, outcome, reason }\`)` after `runs` only if the GraphQL section does not name them yet.

- [ ] **Step 5: The roadmap**

In `docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md`, phase 5 row: replace

```
shared step types and automation definitions operations; secret settings; "Send webhook" built-in |
```

with

```
shared step types and automation definitions operations (the zod settings schema reaches the editor as JSON schema); code-defined automations by developers (no built-in automation; "Send webhook" was only an example, no secret settings, D67 secret part and D86 webhook part superseded); SEC-68 fix in background-tasks. Done: `docs/.bruno/plans/2026-10-13-workflows-phase-5/` |
```

and replace `automation definitions (public abstractions, D86)` with `automation definitions (public abstractions, D86; a zod settings schema per definition)`. Update the Spec line's decision range only if a decision was added (none is, so leave it).

- [ ] **Step 6: Decisions**

In `docs/.bruno/workflows/decisions.md`:

1. D66, first bullet: replace `UI hints (user, team, secret, textarea)` with `UI hints (user, team, textarea)`.
2. D67: keep the heading and text (the history stays), and add after its last sentence a new paragraph:

```
_Superseded in phase 5 (user answer, R154): there are no secret settings. Step config has no secret fields, no encryption, no write-only marker, no stripping. Credentials belong to whoever writes the automation definition, in their own code or configuration, never in workflow step config. Resolved A4 stands as history only._
```

3. D86: keep the heading, replace the body with:

```
The automation definition abstraction, its outcome types and the step-type extension point are exported publicly from api-workflows (and the editor-side counterparts from app-workflows) so developers can register any number of automations. Each definition declares a zod settings schema for what the workflow author fills in (D14, D66).

_Superseded in phase 5 (user answers, R155): v1 ships no built-in automation. "Send webhook" (POST to a URL with a secret signing key, read back `{ approved, comment }`) was only an example of what a developer can write; no webhook step ships, nothing signs requests, and the webhook response contract is dropped. Other examples (pull image, create records) are likewise written by developers when needed._
```

4. At the end of D87 add: `_Built in phase 5 (R149): the inline trigger in the automation reach, also on restart (always the requester)._`

- [ ] **Step 7: Earlier plan notes**

Run `grep -rn "phase 5" docs/.bruno/plans/2026-10-13-workflows-phase-4/00-shared.md docs/.bruno/plans/2026-10-13-workflows-phase-3/00-shared.md docs/.bruno/plans/2026-10-11-workflows-phase-2/00-shared.md docs/.bruno/plans/2026-10-09-workflows-phase-1a/00-shared.md docs/.bruno/plans/2026-10-10-workflows-phase-1b/00-1b-permission-building-blocks.md`. For each line that hands an item to phase 5 (failed steps and restart, step types, automation definitions, task runner, `canRestart`, the seeded failed reviews of R93), append ` Done in phase 5 (R131-R158).` to that line, or, for the "Not in this phase" bullets, to the end of the bullet. Do not rewrite history in the notes and do not touch lines that only mention phase 5 as context.

- [ ] **Step 8: Verify**

Run the first grep from Step 1 again. Expected: no hits.
Run: `grep -rni "send webhook\|secret" docs/.bruno/specs docs/.bruno/plans/2026-10-05-workflows-refactor-roadmap.md` Expected: only the spec 7.2 sentence that says no secrets and "Send webhook" was an example (none if you phrased it without the words), and the roadmap "no secret settings" sentence.
Run: `grep -n "D67\|D86" docs/.bruno/workflows/decisions.md` Expected: both headings still present, each followed by its `Superseded in phase 5` note.
Run: `grep -n "restartCmsEntryReviewStep\|restartWebsiteBuilderPageReviewStep\|listAutomationDefinitions" docs/.bruno/specs/2026-10-05-workflows-refactor-design.md` Expected: hits in section 10.
Check the guide's example compiles against the final exports, then run the comment-only targeted tests:

```
yarn test packages/api-workflows/__tests__/domain/WorkflowValidator.test.ts 2>&1 | tail -20
yarn test packages/api-headless-cms-workflows/__tests__/wrappers/listReviews.test.ts 2>&1 | tail -20
yarn test packages/api-website-builder-workflows/__tests__/wrappers/listReviews.test.ts 2>&1 | tail -20
```

Expected: PASS (comments only). Re-run each with `yarn test:os` once.

- [ ] **Step 9: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows` and `@webiny/api-website-builder-workflows` with `--no-cache`), then commit:

```
docs: add the automation developer guide and align comments, spec, roadmap and decisions with phase 5

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
