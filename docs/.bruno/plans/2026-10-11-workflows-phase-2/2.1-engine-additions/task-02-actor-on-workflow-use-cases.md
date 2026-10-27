### Task 2: `actor` on workflow store and delete input and events

R58 (1a R26, 1b R39). The per-app store and delete wrappers (Tasks 12, 17) build the actor; the engine takes it as required input and puts it on all six workflow events, so a later audit app knows who created, changed or deleted a workflow (D65). `workflow.savedBy` on delete is the last editor, not the deleter.

**Files:**
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/events.ts`
- Modify: `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/events.ts`
- Modify: `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/fixtures.ts`
- Modify: `packages/api-workflows/__tests__/__helpers/reviewContext.ts`
- Modify: `packages/api-workflows/__tests__/review/RequestReview.test.ts`
- Modify: `packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts`
- Modify: `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts`
- Create: `packages/api-workflows/__tests__/workflow/WorkflowEventActor.test.ts`
- Modify: `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts`

**Interfaces:**
- Consumes: `Actor` (`~/domain/review/types.js`).
- Produces:
  - `StoreWorkflowInput { workflow: WorkflowValues; savedOn?: string | null; actor: Actor }`.
  - `DeleteWorkflowInput { id: string; actor: Actor }`.
  - Payloads: `WorkflowBeforeCreatePayload { workflow; actor }`, `WorkflowAfterCreatePayload { workflow; actor }`, `WorkflowBeforeUpdatePayload { original; workflow; actor }`, `WorkflowAfterUpdatePayload { original; workflow; actor }`, `WorkflowBeforeDeletePayload { workflow; actor }`, `WorkflowAfterDeletePayload { workflow; actor }`.
  - Test fixture `editor: Actor` in `__tests__/__helpers/fixtures.ts`; `ADMIN_ACTOR` in the CMS package's `__tests__/__workflows/workflow.ts`.

- [ ] **Step 1: Write the failing test**

Add to `packages/api-workflows/__tests__/__helpers/fixtures.ts`, after the `otherReviewer` fixture:

```ts
/** The workflow editor who stores and deletes workflows (R58). */
export const editor: Actor = {
    type: "user",
    id: "user-editor",
    displayName: "Eddie Editor",
    identityType: "admin"
};
```

Create `packages/api-workflows/__tests__/workflow/WorkflowEventActor.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import { createContextHandler } from "~tests/__helpers/handler.js";
import { createWorkflowValues, editor, expectOk, otherReviewer } from "~tests/__helpers/fixtures.js";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import { StoreWorkflowUseCase } from "~/features/workflow/StoreWorkflow/index.js";
import { DeleteWorkflowUseCase } from "~/features/workflow/DeleteWorkflow/index.js";

const createUseCases = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    return {
        storeWorkflow: context.container.resolve(StoreWorkflowUseCase),
        deleteWorkflow: context.container.resolve(DeleteWorkflowUseCase)
    };
};

const actorOf = (eventType: string) => {
    const event = recordedEvents.find(item => item.eventType === eventType);
    return event?.payload.actor;
};

describe("Workflow events carry the actor (R58)", () => {
    it("puts the creating, updating and deleting actor on every workflow event", async () => {
        const { storeWorkflow, deleteWorkflow } = await createUseCases();

        const created = expectOk(
            await storeWorkflow.execute({ workflow: createWorkflowValues(), actor: editor })
        );
        expectOk(
            await storeWorkflow.execute({
                workflow: createWorkflowValues({ name: "Article review v2" }),
                savedOn: created.savedOn,
                actor: otherReviewer
            })
        );
        expectOk(await deleteWorkflow.execute({ id: created.id, actor: editor }));

        expect(actorOf("Workflows/Workflow/BeforeCreate")).toEqual(editor);
        expect(actorOf("Workflows/Workflow/AfterCreate")).toEqual(editor);
        expect(actorOf("Workflows/Workflow/BeforeUpdate")).toEqual(otherReviewer);
        expect(actorOf("Workflows/Workflow/AfterUpdate")).toEqual(otherReviewer);
        expect(actorOf("Workflows/Workflow/BeforeDelete")).toEqual(editor);
        expect(actorOf("Workflows/Workflow/AfterDelete")).toEqual(editor);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-workflows/__tests__/workflow/WorkflowEventActor.test.ts 2>&1 | tail -50`
Expected: FAIL, `actorOf("Workflows/Workflow/BeforeCreate")` is `undefined`.

- [ ] **Step 3: Add `actor` to the store input and events**

In `packages/api-workflows/src/features/workflow/StoreWorkflow/abstractions.ts`, add `import type { Actor } from "~/domain/review/types.js";` and replace `StoreWorkflowInput` with:

```ts
export interface StoreWorkflowInput {
    workflow: WorkflowValues;
    /** The `savedOn` the caller loaded. Omit when creating a new workflow (D131). */
    savedOn?: string | null;
    /** Who saves; built by the app wrapper (D132, R58). Carried on the workflow events. */
    actor: Actor;
}
```

In `packages/api-workflows/src/features/workflow/StoreWorkflow/events.ts`, add `import type { Actor } from "~/domain/review/types.js";` and replace the payload block (from the `/** Event payloads...` comment through `WorkflowAfterUpdatePayload`) with:

```ts
/** Event payloads. `actor` is who saved, built by the app wrapper (R58). */
export interface WorkflowBeforeCreatePayload {
    workflow: WorkflowValues;
    actor: Actor;
}

export interface WorkflowAfterCreatePayload {
    workflow: Workflow;
    actor: Actor;
}

export interface WorkflowBeforeUpdatePayload {
    original: Workflow;
    workflow: WorkflowValues;
    actor: Actor;
}

export interface WorkflowAfterUpdatePayload {
    original: Workflow;
    workflow: Workflow;
    actor: Actor;
}
```

In `packages/api-workflows/src/features/workflow/StoreWorkflow/StoreWorkflowUseCase.ts`:

1. Add `import type { Actor } from "~/domain/review/types.js";`.
2. In `execute`, replace the last four lines (`if (existing) { return this.update(existing, values); } return this.create(values);`) with:

```ts
        if (existing) {
            return this.update(existing, values, input.actor);
        }
        return this.create(values, input.actor);
```

3. Replace the `create` and `update` methods with:

```ts
    private async create(values: WorkflowValues, actor: Actor): UseCase.Return {
        const before = await this.publishBefore(
            new WorkflowBeforeCreateEvent({ workflow: values, actor })
        );
        if (before.isFail()) {
            return Result.fail(before.error);
        }

        const result = await this.repository.create(values);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new WorkflowAfterCreateEvent({ workflow: result.value, actor })
        );
        return Result.ok(result.value);
    }

    private async update(original: Workflow, values: WorkflowValues, actor: Actor): UseCase.Return {
        const before = await this.publishBefore(
            new WorkflowBeforeUpdateEvent({ original, workflow: values, actor })
        );
        if (before.isFail()) {
            return Result.fail(before.error);
        }

        const result = await this.repository.update(values);
        if (result.isFail()) {
            return Result.fail(result.error);
        }

        await this.eventPublisher.publish(
            new WorkflowAfterUpdateEvent({ original, workflow: result.value, actor })
        );
        return Result.ok(result.value);
    }
```

- [ ] **Step 4: Add `actor` to the delete input and events**

In `packages/api-workflows/src/features/workflow/DeleteWorkflow/abstractions.ts`, add `import type { Actor } from "~/domain/review/types.js";` and replace `DeleteWorkflowInput` with:

```ts
export interface DeleteWorkflowInput {
    id: string;
    /** Who deletes; built by the app wrapper (D132, R58). Carried on the workflow events. */
    actor: Actor;
}
```

In `packages/api-workflows/src/features/workflow/DeleteWorkflow/events.ts`, add `import type { Actor } from "~/domain/review/types.js";` and replace the payload block with:

```ts
/**
 * Event payloads. `actor` is who deletes (R58); `workflow.savedBy` is the last editor.
 */
export interface WorkflowBeforeDeletePayload {
    workflow: Workflow;
    actor: Actor;
}

export interface WorkflowAfterDeletePayload {
    workflow: Workflow;
    actor: Actor;
}
```

In `packages/api-workflows/src/features/workflow/DeleteWorkflow/DeleteWorkflowUseCase.ts`, replace the two `publish` calls with:

```ts
        await this.eventPublisher.publish(
            new WorkflowBeforeDeleteEvent({ workflow, actor: input.actor })
        );
```

and

```ts
        await this.eventPublisher.publish(
            new WorkflowAfterDeleteEvent({ workflow, actor: input.actor })
        );
```

- [ ] **Step 5: Pass the actor in every existing caller**

1. `packages/api-workflows/__tests__/__helpers/reviewContext.ts`: import `editor` from `./fixtures.js` and change the store call to `.execute({ workflow: createWorkflowValues(), actor: editor })`.
2. `packages/api-workflows/__tests__/review/RequestReview.test.ts`: import `editor` from `~tests/__helpers/fixtures.js`; in "fails with TargetNotFound when the target is missing or no loader handles the model" change the store call to `.execute({ workflow: createWorkflowValues({ id: "workflow-pages", models: ["wb.page"] }), actor: editor })`.
3. `packages/api-workflows/__tests__/workflow/DeleteWorkflowWithReviews.test.ts`: import `editor`; change the store call to `.execute({ workflow: createWorkflowValues(), actor: editor })` and both `deleteWorkflow.execute({ id: workflow.id })` calls to `deleteWorkflow.execute({ id: workflow.id, actor: editor })`.
4. `packages/api-workflows/__tests__/workflow/WorkflowUseCases.test.ts`: import `editor` from `~tests/__helpers/fixtures.js` and `type { StoreWorkflowInput }` from `~/features/workflow/StoreWorkflow/index.js`. In "returns an empty list for an empty models_in without querying the CMS" change the store call to `await storeWorkflow.execute({ workflow: createWorkflowValues(), actor: editor });`. Replace `createUseCases` with the version below, so the remaining tests keep calling `storeWorkflow.execute({ workflow, savedOn })` and `deleteWorkflow.execute({ id })` unchanged:

```ts
type StoreWithoutActor = Omit<StoreWorkflowInput, "actor">;

interface DeleteWithoutActor {
    id: string;
}

const createUseCases = async () => {
    recordedEvents.length = 0;
    const { context } = await createContextHandler({
        setup: container => {
            container.registerDecorator(RecordingEventPublisher);
        }
    });
    const store = context.container.resolve(StoreWorkflowUseCase);
    const remove = context.container.resolve(DeleteWorkflowUseCase);

    return {
        // The actor is the editor in every test here; WorkflowEventActor.test.ts covers it.
        storeWorkflow: {
            execute: (input: StoreWithoutActor) => store.execute({ ...input, actor: editor })
        },
        getWorkflow: context.container.resolve(GetWorkflowUseCase),
        listWorkflows: context.container.resolve(ListWorkflowsUseCase),
        deleteWorkflow: {
            execute: (input: DeleteWithoutActor) => remove.execute({ ...input, actor: editor })
        }
    };
};
```

5. `packages/api-headless-cms-workflows/__tests__/__workflows/workflow.ts`: add `import type { Actor } from "@webiny/api-workflows/domain/review/types.js";`, the fixture below, and pass it in `storeWorkflow`:

```ts
/** The default identity of `createCmsTestHandler`, as a workflow actor (R58). */
export const ADMIN_ACTOR: Actor = {
    type: "user",
    id: "id-12345678",
    displayName: "John Doe",
    identityType: "admin"
};

export const storeWorkflow = async (
    context: CmsContext,
    values: WorkflowValues = createWorkflowValues(),
    savedOn?: string
) => {
    return context.container
        .resolve(StoreWorkflowUseCase)
        .execute({ workflow: values, savedOn, actor: ADMIN_ACTOR });
};
```

Confirm no caller is left: `grep -rn "StoreWorkflowUseCase\|DeleteWorkflowUseCase" packages/*/src packages/*/__tests__ | grep -v "^packages/api-workflows/src" | grep -v "^packages/app-workflows/"` lists only the files above and the registration tests (`packages/app-workflows` has its own, unrelated admin `StoreWorkflowUseCase` / `DeleteWorkflowUseCase`).

- [ ] **Step 6: Run the tests and the test type check**

Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-workflows,api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-workflows`, `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-workflows): take the actor on workflow store and delete and put it on their events

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
