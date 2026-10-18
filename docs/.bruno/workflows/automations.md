# Writing an automation

A developer guide for writing an automation step. It is for developers, not for workflow authors.

## 1. What an automation is

An automation is a class you write in your project (or an extension package) and register with the API. A workflow author adds it to a workflow as a step, fills in the settings your definition asks for, and the engine runs it as a background task when the step is reached.

Nothing ships with Webiny: there are no built-in automations (R155). A "call a webhook" automation, a "create records" automation or a "pull an image" automation are examples of what you can write.

## 2. The definition

The abstraction is `AutomationDefinition`, exported from `@webiny/api-workflows/features/automation/AutomationDefinition/index.js` together with the types `AutomationOutcome`, `AutomationRunParams` and `IAutomationDefinition` (R134). A definition has:

- `id`: stable, stored in workflows. A rename breaks stored workflows.
- `name`: shown in the editor.
- `models`: where it may be used. `["*"]`, `["cms.*"]`, `["wb.*"]` or exact namespace ids such as `cms.article`. A workflow can use the automation only when this scope covers every model of the workflow (R136).
- `settingsSchema`: a zod schema, see below.
- `maxIterations` (optional): how many times `run` may be called for one step. Default 50 (R145).
- `run(params)`: the logic.

## 3. Settings: the zod schema

`settingsSchema` describes what the workflow author fills in (for a webhook automation of your own: the URL). Use an object schema.

It reaches the editor as JSON schema: `listAutomationDefinitions` converts it with `z.toJSONSchema` using `io: "input"` and `unrepresentable: "any"` (R138). The editor form therefore describes what the author types, and a field with a `.default()` is not required. Write schemas JSON schema can express: defaults, enums, strings, numbers, booleans, objects and arrays. Avoid custom refinements on fields the editor has to render. The admin builds the form with `buildFieldsFromJsonSchema` (D168): a string is a text input (an `enum` a select; the `ui` hint `textarea` a textarea, `team` a team picker), a number or integer a number input with its bounds, a boolean a switch, an object a group, a list of strings a tag list, a list of objects a repeatable group, and any other shape (a union, a record) a JSON text field the author edits as JSON. A field is required when the object's `required` lists it and it has no default (booleans and nested objects are not marked). The adapter's own messages (no design source, Q45) are "Enter a number of at least {min}.", "Enter a number of at most {max}.", "Enter a number from {min} to {max}.", "Enter a whole number." and "Enter valid JSON.". A `user` hint has no picker until 9b and renders as plain text. A schema the browser cannot rebuild with `z.fromJSONSchema` still renders; it is just never reported as invalid on the client, and the server validates on save as before.

The settings are stored as the author entered them, not as zod's parsed output, so a transform such as `z.string().transform(Number)` saves fine. They are parsed with your schema on every use: when the workflow is saved, when the step is reached (and restarted), and again before every `run` (R137, R148). `run` receives the parsed value, with defaults and transforms applied.

Invalid settings fail the step with `The automation settings are not valid: <path>: <message>.` (R146).

## 4. Credentials do not go into settings

There are no secret settings (R154). Workflow authors never set or see keys, tokens or signing secrets, and the step config has no encryption, write-only marker or stripping. Read credentials in your own code, from the environment or your configuration, inside `run` or the class constructor.

## 5. `run` and its outcome

`run({ settings, review, step, iteration, state })` returns an `AutomationOutcome` (R135):

- `{ type: "approved", comment? }`
- `{ type: "rejected", comment }`: the comment must be 10 or more characters, else the step fails with `The automation rejected without a comment.`
- `{ type: "continue", wait?, state? }`: run again after `wait` seconds, with `state` handed back as `params.state` (`null` on the first call). Use it to poll an external system across iterations; there is no inbound callback route in v1.

Throwing fails the step with the fixed reason `The automation failed.` The error message is not stored on the step (it can carry internals); the full error is logged. Log what you need yourself before throwing. To explain a business rejection to the workflow author, return `{ type: "rejected", comment }`.

`iteration` is the automation's own run count and starts at 1. The engine's short waits for the task id to be saved are not counted (R163). When the run count would exceed the definition's `maxIterations` the step fails with `The automation did not finish in <n> iterations.`, `<n>` being that definition's own `maxIterations` (R145), never the runner's internal ceiling.

Delivery is at-least-once: a task can be retried after a crash or a timeout, so `run` can be called again for the same step. Write automations to be idempotent (for example, send a request id derived from `review.id` and `step.id`, and check for existing records before creating them).

## 6. Who it runs as and what it may do

The task, and everything the engine does around `run`, is attributed to the requester: `IdentityContext` holds the requester identity while `run` executes, so records the automation creates carry them as `createdBy` (D87, R161).

Authorization is turned OFF for the whole run (D36: an automation may change anything). An automation is therefore not limited by the requester's permissions: it can read and write anything. The developer must scope their own code, for example by touching only the review's own entry and the records the automation exists for. The outcome itself is applied with an `automation` actor that names the requester (R141).

`run` executes inside the workflow bypass context (`WorkflowBypassService`, R150). Only the save block (`BlockUpdateWhileInReview`) is lifted, so the automation may update the content under review without invalidating the review. Moving the content to another folder, deleting it and trashing it stay blocked.

## 7. How a run starts, and how it is guarded

When the step is reached the engine triggers the one private task definition `workflowsStepRun` before the review is saved, and stores the task id on the step in the same save (R143). If that save fails, the task is aborted. The task input is only `{ reviewId, stepId }`; everything else comes from the review snapshot, and the handler never trusts its input.

The handler may start before the save lands, so it waits for the task id to appear: up to three waits of two seconds. If the id never shows up, the run is treated as stale and writes nothing.

A stale guard protects the review. The task's `createdBy` must be the requester and the step's `taskId` must be the task's id; both are checked before `run` and checked again after it, because a restarted step has a new task and the old task's late result must not be applied.

GraphQL `triggerTask` refuses private task definitions like unknown ones (R147), so `workflowsStepRun` cannot be started from outside the engine.

## 8. Failure and restart

Every failure writes a fixed reason on the step (`failed`, R146); nothing is left silent. The reasons:

| Reason | When |
| --- | --- |
| `The automation step configuration is not valid.` | The stored step config no longer parses. |
| `The automation "<id>" is not available.` | No definition is registered under that id. |
| `The automation "<id>" is not available for this workflow's models.` | The scope no longer covers the workflow's models. |
| `The automation settings are not valid: <path>: <message>.` | The settings no longer parse with the schema. |
| `The automation could not be started.` | The task could not be triggered. |
| `The automation failed.` | `run` threw, applying the outcome failed, or the task errored. The raw message is logged, never shown. |
| `The automation failed: It returned an unknown outcome.` | `run` returned an outcome type other than `approved`, `rejected` or `continue`. |
| `The automation rejected without a comment.` | A `rejected` outcome with a comment shorter than 10 characters. |
| `The automation did not finish in <n> iterations.` | The run count passed the definition's `maxIterations`. |
| `The automation was aborted.` | The task was aborted. |
| `The automation task ended without a result.` | Stuck detection: the task ended and nothing was written. |

Stuck detection runs when a review is read. A task that finished as `failed` or `aborted` gets a five-minute grace first, so the runner's own error hooks can write the proper reason; a task that is gone is given the same grace measured from when the step started. A pending or running task is never treated as stuck.

A failed step shows in the failed list (D112). The requester, or a viewer with `reassign`, restarts it (`restartCmsEntryReviewStep`, `restartWebsiteBuilderPageReviewStep`, `canRestart`, R153, R158). The restart re-reaches the step as the requester, and `runs` on the step holds the earlier attempts only, each with its `taskId`, outcome and reason. A rejected step cannot be restarted (D8). Cancelling or deleting a review aborts the running task (R151).

## 9. Registering it

One class and one feature, one abstraction or implementation per file. The automation below is the developer's own example, written and owned by whoever needs it; Webiny ships none.

```ts
// extensions/automations/CallWebhookAutomation.ts
import { z } from "zod";
import { AutomationDefinition } from "@webiny/api-workflows/features/automation/AutomationDefinition/index.js";

const settingsSchema = z.object({
    url: z.url().describe("Where to send the review"),
    timeoutSeconds: z.number().int().min(1).max(30).default(10)
});

type Settings = z.infer<typeof settingsSchema>;

class CallWebhookAutomationImpl implements AutomationDefinition.Interface<Settings> {
    public readonly id = "acme.callWebhook";
    public readonly name = "Call webhook";
    public readonly models = ["cms.*"];
    public readonly settingsSchema = settingsSchema;
    public readonly maxIterations = 20;

    public async run(
        params: AutomationDefinition.RunParams<Settings>
    ): Promise<AutomationDefinition.Outcome> {
        // The credential comes from your own configuration, never from the step settings.
        const apiKey = process.env.ACME_WEBHOOK_KEY;
        const response = await fetch(params.settings.url, {
            method: "POST",
            headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
            body: JSON.stringify({ reviewId: params.review.id, stepId: params.step.id }),
            signal: AbortSignal.timeout(params.settings.timeoutSeconds * 1000)
        });
        if (response.status === 202) {
            return { type: "continue", wait: 30 };
        }
        const body = (await response.json()) as { approved: boolean; comment?: string };
        if (body.approved) {
            return { type: "approved", comment: body.comment };
        }
        return {
            type: "rejected",
            comment: body.comment ?? "The webhook rejected the content."
        };
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

Register the feature in the API like any other API feature of the project.

## 10. Testing an automation

Drive `run` directly with a parsed settings object, a review fixture, and `iteration` / `state`. The engine's own tests use a test-only definition (`__tests__/__helpers/TestAutomationDefinition.ts` in api-workflows) and never register one in source (R157).

## 11. Related

Spec 7.2 and 7.4, decisions D14, D35-D37, D57, D86, D87, and the editor side (settings forms generated from the JSON schema) in the admin phases.
