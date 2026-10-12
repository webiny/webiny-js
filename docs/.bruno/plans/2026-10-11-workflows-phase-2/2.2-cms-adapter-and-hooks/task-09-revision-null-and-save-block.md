### Task 9: Null `system.workflow` on new revisions and the save block

Spec 4.5, 9.2, D59, D62, D80, D134 point 5, R51, R54. Two single CMS handlers; both cover CMS entries and WB pages (CMS model `wbyWbPage`) and any other app built on CMS entries:

- `NullReviewStateOnRevisionCreate` (`EntryRevisionBeforeCreate`): the new revision starts with `system.workflow = null` (CMS copies `original.system` otherwise).
- `BlockUpdateWhileInReview` (`EntryBeforeUpdate`): on a model bound to a workflow, an update of a revision with an active review (in progress, approved or rejected) fails with `Workflows/Review/TargetLocked`. The review namespace comes from `CmsEntryReviewNamespace` (R51), so the workflows' own private models are never looked up (the engine saves reviews through `UpdateEntryUseCase`). The handler first asks `GetBoundWorkflowUseCase`; only bound models look up reviews (D134 point 5), so unbound models stay editable when the review lookup fails and leftover approved or rejected reviews stop locking once their workflow is deleted. A failed lookup on a bound model blocks (fail closed); a failed workflow lookup also blocks (A38). On OpenSearch a just-created workflow may not be listed yet (A29), so for that window the model reads as unbound and the rule fails open (an accepted race, like D15): the bound-workflow lookup fails closed on a read error (A38), not on lag.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/hooks/NullReviewStateOnRevisionCreate.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/BlockUpdateWhileInReview.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/feature.ts`
- Modify: `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts`

**Interfaces:**
- Consumes: `EntryRevisionBeforeCreateEventHandler`, `EntryBeforeUpdateEventHandler` (`@webiny/api-headless-cms/features/contentEntry/{CreateEntryRevisionFrom,UpdateEntry}/index.js`), `CmsEntryReviewNamespace` + `resolveReviewNamespace` (Task 7), `GetTargetReviewUseCase`, `GetBoundWorkflowUseCase` (Task 4), `ReviewTargetLockedError` (Task 6), `DeleteWorkflowUseCase` and `ADMIN_ACTOR` (Task 2, test).
- Produces: `CmsHooksFeature` (registered by `CmsWorkflowsFeature`), with the two handlers; Tasks 10 and 11 add to it.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { UpdateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { DeleteWorkflowUseCase } from "@webiny/api-workflows/features/workflow/DeleteWorkflow/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { ADMIN_ACTOR, createWorkflowValues, storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    readEntry,
    rejectEntryReview,
    requestEntryReview
} from "~tests/__helpers/engine.js";
import type { CmsContext } from "@webiny/api-headless-cms/types/index.js";

const createWorkflowContext = async (legacyPlugins: unknown[] = []) => {
    const { context } = createContextHandler({ legacyPlugins });
    const ctx = await context();
    const workflow = expectOk(await storeWorkflow(ctx));
    return { context: ctx, workflow };
};

/** No workflow is bound to the test model. */
const createUnboundContext = async (legacyPlugins: unknown[] = []) => {
    const { context } = createContextHandler({ legacyPlugins });
    return context();
};

const updateName = async (context: CmsContext, revisionId: string, name: string) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(UpdateEntryUseCase).execute(model, revisionId, {
        values: { name }
    });
};

class FailingGetTargetReview implements GetTargetReviewUseCase.Interface {
    public constructor(private decoratee: GetTargetReviewUseCase.Interface) {}

    public async execute(): GetTargetReviewUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

const FailingGetTargetReviewDecorator = GetTargetReviewUseCase.createDecorator({
    decorator: FailingGetTargetReview,
    dependencies: []
});

class FailingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(): ListWorkflowsUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

const FailingListWorkflowsDecorator = ListWorkflowsUseCase.createDecorator({
    decorator: FailingListWorkflows,
    dependencies: []
});

describe("Revision create and save block", () => {
    it("starts a new revision without system.workflow (D59)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        await approveEntryReview(context, review);
        const model = await getAuthorModel(context);

        const revision = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, entry.id, { values: {} })
        );

        expect(revision.system?.workflow).toBeNull();
        expect((await readEntry(context, revision.id)).system?.workflow).toBeNull();
        expect((await readEntry(context, entry.id)).system?.workflow?.reviewState).toBe(
            "approved"
        );
    });

    it("blocks updating a revision under review and allows it after cancel (D62)", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);

        const blocked = await updateName(context, entry.id, "Changed");
        await cancelEntryReview(context, review);
        const allowed = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blocked.error.data).toEqual({
            reviewId: review.id,
            model: "cms.author",
            targetRevisionId: entry.id,
            reviewState: "inProgress",
            action: "update"
        });
        expect(allowed.isOk()).toBe(true);
    });

    it("keeps approved and rejected revisions locked (D80, D23)", async () => {
        const { context } = await createWorkflowContext();
        const approvedEntry = await createAuthorEntry(context, { name: "Approved" });
        const rejectedEntry = await createAuthorEntry(context, { name: "Rejected" });
        await approveEntryReview(context, await requestEntryReview(context, approvedEntry));
        await rejectEntryReview(context, await requestEntryReview(context, rejectedEntry));

        const approved = await updateName(context, approvedEntry.id, "Changed");
        const rejected = await updateName(context, rejectedEntry.id, "Changed");

        expect(approved.error.code).toBe("Workflows/Review/TargetLocked");
        expect(approved.error.data).toMatchObject({ reviewState: "approved" });
        expect(rejected.error.code).toBe("Workflows/Review/TargetLocked");
        expect(rejected.error.data).toMatchObject({ reviewState: "rejected" });
    });

    it("does not block saving workflows and reviews (R51)", async () => {
        const { context, workflow } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);

        // The workflow and the review are private CMS entries saved through UpdateEntryUseCase.
        const storedAgain = await storeWorkflow(
            context,
            { ...createWorkflowValues(), name: "Renamed workflow" },
            workflow.savedOn
        );
        const approved = await approveEntryReview(context, review);

        expect(storedAgain.isOk()).toBe(true);
        expect(approved.state).toBe("approved");
    });

    it("updates entries of a model without reviews", async () => {
        const { context } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const updated = await updateName(context, entry.id, "Changed");

        expect(updated.isOk()).toBe(true);
    });

    it("updates entries of an unbound model even when the review lookup fails (D134)", async () => {
        const context = await createUnboundContext([
            (container: Container) => {
                container.registerDecorator(FailingGetTargetReviewDecorator);
            }
        ]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const updated = await updateName(context, entry.id, "Changed");

        expect(updated.isOk()).toBe(true);
    });

    it("stops locking an approved revision once its workflow is deleted (D134)", async () => {
        const { context, workflow } = await createWorkflowContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await approveEntryReview(context, await requestEntryReview(context, entry));
        expectOk(
            await context.container
                .resolve(DeleteWorkflowUseCase)
                .execute({ id: workflow.id, actor: ADMIN_ACTOR })
        );

        const updated = await updateName(context, entry.id, "Changed");

        expect(updated.isOk()).toBe(true);
    });

    it("blocks updates when the review lookup fails (fail closed, R54)", async () => {
        const { context } = await createWorkflowContext([
            (container: Container) => {
                container.registerDecorator(FailingGetTargetReviewDecorator);
            }
        ]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/Persistence");
    });

    it("blocks updates when the workflow lookup fails (fail closed, A38)", async () => {
        const context = await createUnboundContext([
            (container: Container) => {
                container.registerDecorator(FailingListWorkflowsDecorator);
            }
        ]);
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await updateName(context, entry.id, "Changed");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/Persistence");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/revisionAndSaveBlock.test.ts 2>&1 | tail -50`
Expected: FAIL. The new revision copies `reviewState: "approved"`; the update under review succeeds; the failing lookups are never called. The unbound-model and deleted-workflow tests pass already (nothing blocks yet).

- [ ] **Step 3: Implement the handlers**

Create `packages/api-headless-cms-workflows/src/features/hooks/NullReviewStateOnRevisionCreate.ts`:

```ts
import { EntryRevisionBeforeCreateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";

/**
 * Every new revision starts without a review state (spec 4.5, D59). One handler for CMS entries,
 * Website Builder pages and any app built on CMS entries; CMS copies `original.system` otherwise.
 * Mutates the entry the use case persists next.
 */
class NullReviewStateOnRevisionCreateImpl implements EntryRevisionBeforeCreateEventHandler.Interface {
    public async handle(event: EntryRevisionBeforeCreateEventHandler.Event): Promise<void> {
        const { entry } = event.payload;
        entry.system = { ...entry.system, workflow: null };
    }
}

export const NullReviewStateOnRevisionCreate =
    EntryRevisionBeforeCreateEventHandler.createImplementation({
        implementation: NullReviewStateOnRevisionCreateImpl,
        dependencies: []
    });
```

Create `packages/api-headless-cms-workflows/src/features/hooks/BlockUpdateWhileInReview.ts`:

```ts
import { EntryBeforeUpdateEventHandler } from "@webiny/api-headless-cms/features/contentEntry/UpdateEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import {
    CmsEntryReviewNamespace,
    resolveReviewNamespace
} from "~/features/target/CmsEntryReviewNamespace/index.js";

/**
 * The save block (spec 9.2, D62, D80, D134, R54): on a model bound to a workflow, a revision with
 * an active review cannot be updated, including an approved or rejected one. Covers every model
 * with a review namespace (R51), so CMS entries and Website Builder pages; private models without
 * one (the workflows' own) are skipped. Unbound models never look up reviews. Failed lookups block
 * the update. `UpdateEntrySystemUseCase` does not publish this event, so the `system.workflow`
 * sync is exempt. Phase 5 adds the automation and AI bypass context here (D36, D62), as a check
 * before the binding lookup.
 */
class BlockUpdateWhileInReviewImpl implements EntryBeforeUpdateEventHandler.Interface {
    public constructor(
        private namespaces: CmsEntryReviewNamespace.Interface[],
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeUpdateEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;
        const namespace = resolveReviewNamespace(this.namespaces, model);
        if (!namespace) {
            return;
        }

        const workflow = await this.getBoundWorkflow.execute({ model: namespace });
        if (workflow.isFail()) {
            throw workflow.error;
        }
        if (!workflow.value) {
            return;
        }

        const review = await this.getTargetReview.execute({
            model: namespace,
            targetRevisionId: original.id
        });
        if (review.isFail()) {
            throw review.error;
        }
        if (!review.value) {
            return;
        }

        throw new ReviewTargetLockedError({
            reviewId: review.value.id,
            model: namespace,
            targetRevisionId: original.id,
            reviewState: review.value.state,
            action: "update"
        });
    }
}

export const BlockUpdateWhileInReview = EntryBeforeUpdateEventHandler.createImplementation({
    implementation: BlockUpdateWhileInReviewImpl,
    dependencies: [
        [CmsEntryReviewNamespace, { multiple: true }],
        GetBoundWorkflowUseCase,
        GetTargetReviewUseCase
    ]
});
```

Create `packages/api-headless-cms-workflows/src/features/hooks/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { NullReviewStateOnRevisionCreate } from "./NullReviewStateOnRevisionCreate.js";
import { BlockUpdateWhileInReview } from "./BlockUpdateWhileInReview.js";

/**
 * Workflow handlers on CMS events (spec 9.2). The single handlers cover every app built on CMS
 * entries (R51); the `cms.*` adapter rules act on public CMS models only (R52).
 */
export const CmsHooksFeature = createFeature({
    name: "CmsWorkflows/Hooks",
    register(container) {
        // Single handlers (CMS entries and Website Builder pages)
        container.register(NullReviewStateOnRevisionCreate);
        container.register(BlockUpdateWhileInReview);
    }
});
```

In `packages/api-headless-cms-workflows/src/CmsWorkflowsFeature.ts` import `CmsHooksFeature` from `./features/hooks/feature.js` and register it after `CmsTargetFeature.register(container);`:

```ts
        // Workflow handlers on CMS events (spec 9.2).
        CmsHooksFeature.register(container);
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test packages/api-workflows 2>&1 | tail -50` Expected: PASS (the engine package does not register the hooks).
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): null review state on new revisions and block saves under review

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
