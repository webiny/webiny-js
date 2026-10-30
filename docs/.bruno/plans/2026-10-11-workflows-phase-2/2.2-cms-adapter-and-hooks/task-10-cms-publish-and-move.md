### Task 10: CMS publish and move rules

Spec 5.1, 9.3, D79, D84, D121, D134 point 2, R52, R53, R55, R83, A24, A30. The `cms.*` adapter's publish and move rules on CMS entry events (the trash and delete rules are Task 10b). They act only on public CMS models (`getCmsNamespace`), because WB pages are CMS entries too and the WB adapter handles them on the WB page events (Task 16), and only on models bound to a workflow (`GetBoundWorkflowUseCase`):

- `RequireApprovedReviewOnPublish` (`EntryBeforePublish`): on a bound model, the revision needs an approved active review; lookups fail closed. Creating an entry or a revision with `status: "published"` is not a publish and stays allowed (D134 point 2, R83); a test pins it.
- `BlockMoveWhileInReview` (`EntryBeforeMove`): on a bound model, no move while any revision of the entry has an in-progress review. On OpenSearch a just-created workflow may not be listed yet (A29), so for that window the model reads as unbound and the rule fails open (an accepted race, like D15): the bound-workflow lookup fails closed on a read error (A38), not on lag.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/hooks/RequireApprovedReviewOnPublish.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/BlockMoveWhileInReview.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/hooks/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts`

**Interfaces:**
- Consumes: `EntryBeforePublishEventHandler`, `EntryBeforeMoveEventHandler` (api-headless-cms), `GetBoundWorkflowUseCase`, `GetTargetReviewUseCase`, `ListTargetReviewsUseCase` (Task 4), `ReviewPublishBlockedError`, `ReviewTargetLockedError` (Task 6), `getCmsNamespace` (Task 7), `CreateEntryUseCase`, `ListWorkflowsUseCase` (tests).
- Produces: two handlers registered by `CmsHooksFeature`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { PublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { UnpublishEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/UnpublishEntry/index.js";
import { MoveEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { CreateEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntry/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { ListWorkflowsUseCase } from "@webiny/api-workflows/features/workflow/ListWorkflows/index.js";
import { WorkflowPersistenceError } from "@webiny/api-workflows/domain/workflow/errors.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    rejectEntryReview,
    requestEntryReview
} from "~tests/__helpers/engine.js";

interface ContextParams {
    withWorkflow?: boolean;
    legacyPlugins?: unknown[];
    privateModel?: boolean;
}

const createTestContext = async (params: ContextParams = {}) => {
    const { context } = createContextHandler({
        legacyPlugins: params.legacyPlugins ?? [],
        modifyModel: params.privateModel
            ? model => {
                  return { ...model, isPrivate: true };
              }
            : undefined
    });
    const ctx = await context();
    if (params.withWorkflow !== false) {
        expectOk(await storeWorkflow(ctx));
    }
    return ctx;
};

const publish = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(PublishEntryUseCase).execute(model, entry.id);
};

const move = async (context: CmsContext, entry: CmsEntry, folderId: string) => {
    const model = await getAuthorModel(context);
    return context.container.resolve(MoveEntryUseCase).execute(model, entry.id, folderId);
};

let listWorkflowsCalls = 0;

class CountingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(input?: ListWorkflowsUseCase.Input): ListWorkflowsUseCase.Return {
        listWorkflowsCalls++;
        return this.decoratee.execute(input);
    }
}

class FailingListWorkflows implements ListWorkflowsUseCase.Interface {
    public constructor(private decoratee: ListWorkflowsUseCase.Interface) {}

    public async execute(): ListWorkflowsUseCase.Return {
        return Result.fail(new WorkflowPersistenceError(new Error("Storage is down.")));
    }
}

describe("CMS publish rule (D79, D121)", () => {
    it("publishes normally on a model without a workflow", async () => {
        const context = await createTestContext({ withWorkflow: false });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const published = await publish(context, entry);

        expect(published.isOk()).toBe(true);
    });

    it("blocks publishing without a review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await publish(context, entry);

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(blocked.error.data).toEqual({
            model: "cms.author",
            targetRevisionId: entry.id,
            workflowId: "workflow-1",
            reviewState: null
        });
    });

    it("blocks publishing while the review is in progress or rejected", async () => {
        const context = await createTestContext();
        const inProgress = await createAuthorEntry(context, { name: "In progress" });
        const rejected = await createAuthorEntry(context, { name: "Rejected" });
        await requestEntryReview(context, inProgress);
        await rejectEntryReview(context, await requestEntryReview(context, rejected));

        const inProgressResult = await publish(context, inProgress);
        const rejectedResult = await publish(context, rejected);

        expect(inProgressResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(inProgressResult.error.data).toMatchObject({ reviewState: "inProgress" });
        expect(rejectedResult.error.code).toBe("Workflows/Review/PublishBlocked");
        expect(rejectedResult.error.data).toMatchObject({ reviewState: "rejected" });
    });

    it("publishes an approved revision and republishes it after unpublishing (D121)", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await approveEntryReview(context, await requestEntryReview(context, entry));
        const model = await getAuthorModel(context);

        const published = await publish(context, entry);
        expectOk(await context.container.resolve(UnpublishEntryUseCase).execute(model, entry.id));
        const republished = await publish(context, entry);

        expect(published.isOk()).toBe(true);
        expect(republished.isOk()).toBe(true);
    });

    it("blocks publishing when the workflow lookup fails (fail closed)", async () => {
        const context = await createTestContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListWorkflowsUseCase.createDecorator({
                            decorator: FailingListWorkflows,
                            dependencies: []
                        })
                    );
                }
            ],
            withWorkflow: false
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const blocked = await publish(context, entry);

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Workflow/Persistence");
    });

    it("creates entries and revisions as published on a bound model without a review (D134, R83)", async () => {
        const context = await createTestContext();
        const model = await getAuthorModel(context);

        const created = expectOk(
            await context.container.resolve(CreateEntryUseCase).execute(model, {
                values: { name: "Imported" },
                status: "published",
                location: { folderId: "root" }
            })
        );
        const revision = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, created.id, { values: {}, status: "published" })
        );

        expect(created.status).toBe("published");
        expect(revision.status).toBe("published");
    });

    it("ignores private models such as Website Builder pages (R52)", async () => {
        listWorkflowsCalls = 0;
        const context = await createTestContext({
            privateModel: true,
            withWorkflow: false,
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListWorkflowsUseCase.createDecorator({
                            decorator: CountingListWorkflows,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const published = await publish(context, entry);

        expect(published.isOk()).toBe(true);
        expect(listWorkflowsCalls).toBe(0);
    });
});

describe("CMS move rule (D84)", () => {
    it("blocks moving while a review is in progress and allows it after cancel", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const review = await requestEntryReview(context, entry);

        const blocked = await move(context, entry, "folder-2");
        await cancelEntryReview(context, review);
        const moved = await move(context, entry, "folder-2");

        expect(blocked.isFail()).toBe(true);
        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
        expect(blocked.error.data).toMatchObject({ action: "move", reviewState: "inProgress" });
        expect(moved.isOk()).toBe(true);
    });

    it("moves an entry of an unbound model without looking up reviews", async () => {
        const context = await createTestContext({ withWorkflow: false });
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });

        const moved = await move(context, entry, "folder-2");

        expect(moved.isOk()).toBe(true);
    });

    it("moves a target whose review is approved", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        await approveEntryReview(context, await requestEntryReview(context, entry));

        const moved = await move(context, entry, "folder-2");

        expect(moved.isOk()).toBe(true);
    });

    it("blocks a move while another revision of the entry is in review (R55)", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "Ann", folderId: "folder-1" });
        const model = await getAuthorModel(context);
        const second = expectOk(
            await context.container
                .resolve(CreateEntryRevisionFromUseCase)
                .execute(model, first.id, { values: {} })
        );
        await requestEntryReview(context, second);

        const blocked = await move(context, first, "folder-2");

        expect(blocked.error.code).toBe("Workflows/Review/TargetLocked");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/publishAndMove.test.ts 2>&1 | tail -50`
Expected: FAIL. Publishing without a review succeeds; the move under review succeeds. The tests without a workflow, after approval and for create-as-published already pass (the last one must keep passing: nothing in this task may block it).

- [ ] **Step 3: Implement the publish rule**

Create `packages/api-headless-cms-workflows/src/features/hooks/RequireApprovedReviewOnPublish.ts`:

```ts
import { EntryBeforePublishEventHandler } from "@webiny/api-headless-cms/features/contentEntry/PublishEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { GetTargetReviewUseCase } from "@webiny/api-workflows/features/review/GetTargetReview/index.js";
import { ReviewPublishBlockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Publish rule of the `cms.*` adapter (spec 5.1, D79, D121, R53). On a model bound to a workflow a
 * revision is published only with its active review approved; an approved revision that was
 * unpublished can be published again because approved reviews stay active (D23). Lookup failures
 * block (fail closed). `system.workflow` is not trusted: the update input can set it. Private
 * models (Website Builder pages, R52) are left to their app. Only the publish action is guarded:
 * creating content as published stays allowed for data transfer (D134 point 2, R83).
 */
class RequireApprovedReviewOnPublishImpl implements EntryBeforePublishEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private getTargetReview: GetTargetReviewUseCase.Interface
    ) {}

    public async handle(event: EntryBeforePublishEventHandler.Event): Promise<void> {
        const { model, original } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const bound = await this.getBoundWorkflow.execute({ model: namespace });
        if (bound.isFail()) {
            throw bound.error;
        }
        const workflow = bound.value;
        if (!workflow) {
            return;
        }

        const review = await this.getTargetReview.execute({
            model: namespace,
            targetRevisionId: original.id
        });
        if (review.isFail()) {
            throw review.error;
        }
        if (review.value?.state === "approved") {
            return;
        }

        throw new ReviewPublishBlockedError({
            model: namespace,
            targetRevisionId: original.id,
            workflowId: workflow.id,
            reviewState: review.value?.state ?? null
        });
    }
}

export const RequireApprovedReviewOnPublish = EntryBeforePublishEventHandler.createImplementation({
    implementation: RequireApprovedReviewOnPublishImpl,
    dependencies: [GetBoundWorkflowUseCase, GetTargetReviewUseCase]
});
```

- [ ] **Step 4: Implement the move rule**

Create `packages/api-headless-cms-workflows/src/features/hooks/BlockMoveWhileInReview.ts`:

```ts
import { EntryBeforeMoveEventHandler } from "@webiny/api-headless-cms/features/contentEntry/MoveEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewTargetLockedError } from "@webiny/api-workflows/domain/review/errors.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Move rule of the `cms.*` adapter (spec 9.3, D84, R55): on a bound model, no folder move while
 * the review is in progress. The location belongs to the entry, not the revision, so any revision
 * in review blocks (A24). Approved, rejected and cancelled reviews do not block. Unbound models
 * never look up reviews; lookup failures on bound models block.
 */
class BlockMoveWhileInReviewImpl implements EntryBeforeMoveEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeMoveEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const bound = await this.getBoundWorkflow.execute({ model: namespace });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const reviews = await this.listTargetReviews.execute({
            model: namespace,
            targetId: entry.entryId
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value.find(review => review.state === "inProgress");
        if (!inProgress) {
            return;
        }

        throw new ReviewTargetLockedError({
            reviewId: inProgress.id,
            model: namespace,
            targetRevisionId: inProgress.targetRevisionId,
            reviewState: inProgress.state,
            action: "move"
        });
    }
}

export const BlockMoveWhileInReview = EntryBeforeMoveEventHandler.createImplementation({
    implementation: BlockMoveWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
```

- [ ] **Step 5: Register**

In `packages/api-headless-cms-workflows/src/features/hooks/feature.ts` import the two handlers and add after `container.register(BlockUpdateWhileInReview);`:

```ts

        // `cms.*` adapter rules (public CMS models only, R52)
        container.register(RequireApprovedReviewOnPublish);
        container.register(BlockMoveWhileInReview);
```

- [ ] **Step 6: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 7: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): enforce the publish and move rules on bound models

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
