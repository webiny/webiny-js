### Task 10b: CMS trash and delete rules

Spec 9.3, D134 points 1 and 3, R56, R73, R81, A34. The `cms.*` adapter's rules for trashing and deleting entries (public CMS models only, R52):

- **Refusal while a review is in progress** (D134). On a model bound to a workflow (`GetBoundWorkflowUseCase`; unbound models are never looked up), trashing or permanently deleting an entry (`EntryBeforeDelete`, `permanent: false` → action `trash`, `true` → `delete`), deleting one revision (`EntryRevisionBeforeDelete`, that revision's review) and `deleteMultiple` (`EntryBeforeDeleteMultiple`, every entry the caller may access) fail with `Workflows/Review/ActiveReviewOnTrash` listing the in-progress reviews. Lookup failures block (fail closed). The confirm path is the cancel-for-delete wrapper (Task 14b): it cancels the reviews, then the admin repeats the trash or delete, which passes. On OpenSearch a just-created workflow may not be listed yet (A29), so for that window the model reads as unbound and the rule fails open (an accepted race, like D15): the bound-workflow lookup fails closed on a read error (A38), not on lag.
- **Cleanup after a permanent delete** (spec 9.3, R56). `EntryAfterDelete` with `permanent: true` deletes every review of the entry with its assignment records; `EntryRevisionAfterDelete` deletes that revision's reviews; `EntryAfterDeleteMultiple` deletes the reviews of every listed entry that is gone. Trashing keeps the reviews (only finished ones remain, since in-progress ones are refused or cancelled first). A failed cleanup is logged and the delete stands (R81): the content is already deleted and the error event must not fire for a delete that happened; the reviews stay orphaned (accepted, A34).

The CMS bulk actions (`api-headless-cms-bulk-actions`, trash and delete through `DeleteEntryUseCase` per entry) inherit the refusal per entry; their failed items are reported by the bulk action as for any other per-entry failure.

**Files:**
- Create: `packages/api-headless-cms-workflows/src/features/hooks/listInProgressTargetReviews.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/BlockDeleteWhileInReview.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/BlockRevisionDeleteWhileInReview.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/BlockDeleteMultipleWhileInReview.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/DeleteReviewsOnEntryDelete.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/DeleteReviewsOnRevisionDelete.ts`
- Create: `packages/api-headless-cms-workflows/src/features/hooks/DeleteReviewsOnEntriesDeleteMultiple.ts`
- Modify: `packages/api-headless-cms-workflows/src/features/hooks/feature.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts`

**Interfaces:**
- Consumes: `EntryBeforeDeleteEventHandler`, `EntryAfterDeleteEventHandler` (`.../contentEntry/DeleteEntry/index.js`), `EntryRevisionBeforeDeleteEventHandler`, `EntryRevisionAfterDeleteEventHandler` (`.../DeleteEntryRevision/index.js`), `EntryBeforeDeleteMultipleEventHandler`, `EntryAfterDeleteMultipleEventHandler` (`.../DeleteMultipleEntries/index.js`), `GetLatestRevisionByEntryIdIncludingDeletedUseCase` (`.../GetLatestRevisionByEntryId/index.js`), `AccessControl`, `IdentityContext`, `Logger` (`@webiny/api-core/features/logger/index.js`), `GetBoundWorkflowUseCase`, `ListTargetReviewsUseCase` (Task 4), `DeleteTargetReviewsUseCase` (Task 5), `ReviewActiveOnTrashError` (Task 6), `toBlockingReview` (Task 3), `getCmsNamespace` (Task 7).
- Produces:
  - `InProgressReviewsLookup { getBoundWorkflow: GetBoundWorkflowUseCase.Interface; listTargetReviews: ListTargetReviewsUseCase.Interface }`, `InProgressReviewsParams { model: string; targetId: string; targetRevisionId?: string }`, `listInProgressTargetReviews(lookup, params): Promise<ReviewData[]>` (`features/hooks/listInProgressTargetReviews.ts`; also used by the WB package, Task 16b).
  - Six handlers registered by `CmsHooksFeature`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import type { CmsContext, CmsEntry } from "@webiny/api-headless-cms/types/index.js";
import { DeleteEntryUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { DeleteEntryRevisionUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { DeleteMultipleEntriesUseCase } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { CreateEntryRevisionFromUseCase } from "@webiny/api-headless-cms/features/contentEntry/CreateEntryRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { createContextHandler } from "~tests/__handler/context.js";
import { storeWorkflow } from "~tests/__workflows/workflow.js";
import { createAuthorEntry, expectOk, getAuthorModel } from "~tests/__helpers/entries.js";
import {
    approveEntryReview,
    cancelEntryReview,
    readEntry,
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

const trash = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: false });
};

const deletePermanently = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return context.container
        .resolve(DeleteEntryUseCase)
        .execute(model, entry.id, { permanently: true });
};

const createSecondRevision = async (context: CmsContext, entry: CmsEntry) => {
    const model = await getAuthorModel(context);
    return expectOk(
        await context.container
            .resolve(CreateEntryRevisionFromUseCase)
            .execute(model, entry.id, { values: {} })
    );
};

const getReview = (context: CmsContext, id: string) => {
    return context.container.resolve(GetReviewUseCase).execute({ id });
};

class FailingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(): ListTargetReviewsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

class FailingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(): DeleteTargetReviewsUseCase.Return {
        return Result.fail(new ReviewPersistenceError(new Error("Storage is down.")));
    }
}

/** Engine calls the handlers made, by use case name. */
const engineCalls: string[] = [];

class CountingGetBoundWorkflow implements GetBoundWorkflowUseCase.Interface {
    public constructor(private decoratee: GetBoundWorkflowUseCase.Interface) {}

    public async execute(input: GetBoundWorkflowUseCase.Input): GetBoundWorkflowUseCase.Return {
        engineCalls.push("GetBoundWorkflow");
        return this.decoratee.execute(input);
    }
}

class CountingListTargetReviews implements ListTargetReviewsUseCase.Interface {
    public constructor(private decoratee: ListTargetReviewsUseCase.Interface) {}

    public async execute(
        input: Parameters<ListTargetReviewsUseCase.Interface["execute"]>[0]
    ): ListTargetReviewsUseCase.Return {
        engineCalls.push("ListTargetReviews");
        return this.decoratee.execute(input);
    }
}

class CountingDeleteTargetReviews implements DeleteTargetReviewsUseCase.Interface {
    public constructor(private decoratee: DeleteTargetReviewsUseCase.Interface) {}

    public async execute(input: DeleteTargetReviewsUseCase.Input): DeleteTargetReviewsUseCase.Return {
        engineCalls.push("DeleteTargetReviews");
        return this.decoratee.execute(input);
    }
}

describe("CMS trash with a review in progress (D134)", () => {
    it("refuses to trash an entry with a review in progress", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);

        const refused = await trash(context, entry);

        expect(refused.isFail()).toBe(true);
        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toEqual({
            model: "cms.author",
            action: "trash",
            reviews: [
                {
                    reviewId: review.id,
                    model: "cms.author",
                    targetId: entry.entryId,
                    targetRevisionId: entry.id,
                    title: "Ann",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Step 1"
                }
            ]
        });
        expect((await readEntry(context, entry.id)).id).toBe(entry.id);
    });

    it("trashes the entry once the review is cancelled, and keeps the cancelled review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        await cancelEntryReview(context, review);

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
        expect(expectOk(await getReview(context, review.id)).state).toBe("cancelled");
    });

    it("trashes an entry whose review is approved and keeps the review", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
        expect(expectOk(await getReview(context, review.id)).state).toBe("approved");
    });

    it("trashes entries of an unbound model without looking up reviews", async () => {
        const context = await createTestContext({
            withWorkflow: false,
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListTargetReviewsUseCase.createDecorator({
                            decorator: FailingListTargetReviews,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const trashed = await trash(context, entry);

        expect(trashed.isOk()).toBe(true);
    });

    it("refuses the trash when the review lookup fails on a bound model (fail closed)", async () => {
        const context = await createTestContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        ListTargetReviewsUseCase.createDecorator({
                            decorator: FailingListTargetReviews,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });

        const refused = await trash(context, entry);

        expect(refused.error.code).toBe("Workflows/Review/Persistence");
    });
});

describe("CMS delete with a review in progress (D134)", () => {
    it("refuses to delete an entry permanently with a review in progress", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);

        const refused = await deletePermanently(context, entry);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({ action: "delete" });
    });

    it("refuses to delete a revision under review and deletes its reviews after cancel", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "Ann" });
        const firstReview = await approveEntryReview(
            context,
            await requestEntryReview(context, first)
        );
        const second = await createSecondRevision(context, first);
        const secondReview = await requestEntryReview(context, second);
        const model = await getAuthorModel(context);
        const deleteRevision = context.container.resolve(DeleteEntryRevisionUseCase);

        const refused = await deleteRevision.execute(model, second.id);
        await cancelEntryReview(context, secondReview);
        const deleted = await deleteRevision.execute(model, second.id);

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({
            action: "delete",
            reviews: [{ reviewId: secondReview.id }]
        });
        expect(deleted.isOk()).toBe(true);
        expect((await getReview(context, secondReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect(expectOk(await getReview(context, firstReview.id)).id).toBe(firstReview.id);
    });

    it("refuses deleteMultiple when an entry has a review in progress", async () => {
        const context = await createTestContext();
        const free = await createAuthorEntry(context, { name: "Free" });
        const busy = await createAuthorEntry(context, { name: "Busy" });
        const review = await requestEntryReview(context, busy);
        const model = await getAuthorModel(context);

        const refused = await context.container
            .resolve(DeleteMultipleEntriesUseCase)
            .execute(model, { entries: [free.id, busy.id] });

        expect(refused.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(refused.error.data).toMatchObject({
            action: "delete",
            reviews: [{ reviewId: review.id, targetId: busy.entryId }]
        });
        expect((await readEntry(context, free.id)).id).toBe(free.id);
    });
});

describe("CMS trash and delete on a private model (R52)", () => {
    it("neither blocks nor cleans up: the engine deletes its own review and assignment entries", async () => {
        engineCalls.length = 0;
        // The workflow, review and assignment models are private. Their entries fire the same CMS
        // events, and the engine deletes them through `DeleteEntryUseCase`, so the handlers must
        // skip private models or the engine would call itself.
        const context = await createTestContext({
            privateModel: true,
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        GetBoundWorkflowUseCase.createDecorator({
                            decorator: CountingGetBoundWorkflow,
                            dependencies: []
                        })
                    );
                    container.registerDecorator(
                        ListTargetReviewsUseCase.createDecorator({
                            decorator: CountingListTargetReviews,
                            dependencies: []
                        })
                    );
                    container.registerDecorator(
                        DeleteTargetReviewsUseCase.createDecorator({
                            decorator: CountingDeleteTargetReviews,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const model = await getAuthorModel(context);
        const trashed = await createAuthorEntry(context, { name: "Trashed" });
        const deleted = await createAuthorEntry(context, { name: "Deleted" });
        const revised = await createAuthorEntry(context, { name: "Revised" });
        const revision = await createSecondRevision(context, revised);
        const bulk = await createAuthorEntry(context, { name: "Bulk" });
        engineCalls.length = 0;

        expect((await trash(context, trashed)).isOk()).toBe(true);
        expect((await deletePermanently(context, deleted)).isOk()).toBe(true);
        expect(
            (await context.container.resolve(DeleteEntryRevisionUseCase).execute(model, revision.id)).isOk()
        ).toBe(true);
        expect(
            (
                await context.container
                    .resolve(DeleteMultipleEntriesUseCase)
                    .execute(model, { entries: [bulk.id] })
            ).isOk()
        ).toBe(true);

        expect(engineCalls).toEqual([]);
    });
});

describe("CMS review cleanup after a permanent delete (R56, R81)", () => {
    it("deletes the reviews of a permanently deleted entry", async () => {
        const context = await createTestContext();
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        expectOk(await deletePermanently(context, entry));

        expect((await getReview(context, review.id)).error.code).toBe("Workflows/Review/NotFound");
    });

    it("deletes the reviews of entries deleted in bulk", async () => {
        const context = await createTestContext();
        const first = await createAuthorEntry(context, { name: "First" });
        const second = await createAuthorEntry(context, { name: "Second" });
        const firstReview = await approveEntryReview(
            context,
            await requestEntryReview(context, first)
        );
        const secondReview = await requestEntryReview(context, second);
        await cancelEntryReview(context, secondReview);
        const model = await getAuthorModel(context);

        expectOk(
            await context.container
                .resolve(DeleteMultipleEntriesUseCase)
                .execute(model, { entries: [first.id, second.id] })
        );

        expect((await getReview(context, firstReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect((await getReview(context, secondReview.id)).error.code).toBe(
            "Workflows/Review/NotFound"
        );
    });

    it("keeps the delete when the review cleanup fails (logged, R81)", async () => {
        const context = await createTestContext({
            legacyPlugins: [
                (container: Container) => {
                    container.registerDecorator(
                        DeleteTargetReviewsUseCase.createDecorator({
                            decorator: FailingDeleteTargetReviews,
                            dependencies: []
                        })
                    );
                }
            ]
        });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await approveEntryReview(context, await requestEntryReview(context, entry));

        const deleted = await deletePermanently(context, entry);

        expect(deleted.isOk()).toBe(true);
        // The review is orphaned (A34).
        expect(expectOk(await getReview(context, review.id)).id).toBe(review.id);
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts 2>&1 | tail -50`
Expected: FAIL. Trash and delete under review succeed; the deleted entries' reviews are still found. The tests that trash after cancel or approval, the unbound-model trash, the private-model test and the failing-cleanup test pass already (the private-model test guards the handlers' `getCmsNamespace` skip: it fails if a handler stops skipping private models).

- [ ] **Step 3: The in-progress lookup**

Create `packages/api-headless-cms-workflows/src/features/hooks/listInProgressTargetReviews.ts`:

```ts
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import type { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";

export interface InProgressReviewsLookup {
    getBoundWorkflow: GetBoundWorkflowUseCase.Interface;
    listTargetReviews: ListTargetReviewsUseCase.Interface;
}

export interface InProgressReviewsParams {
    /** Namespace id, e.g. "cms.article" or "wb.page". */
    model: string;
    targetId: string;
    /** Only this revision's review; every revision of the target when omitted. */
    targetRevisionId?: string;
}

/**
 * The in-progress reviews of a target (or one revision) on a model bound to a workflow; `[]` for
 * an unbound model, whose reviews are never looked up (D134). Lookup failures are thrown, so the
 * trash or delete is refused (fail closed). Shared by the CMS and WB trash and delete rules.
 */
export const listInProgressTargetReviews = async (
    lookup: InProgressReviewsLookup,
    params: InProgressReviewsParams
): Promise<ReviewData[]> => {
    const bound = await lookup.getBoundWorkflow.execute({ model: params.model });
    if (bound.isFail()) {
        throw bound.error;
    }
    if (!bound.value) {
        return [];
    }

    const reviews = await lookup.listTargetReviews.execute({
        model: params.model,
        targetId: params.targetId
    });
    if (reviews.isFail()) {
        throw reviews.error;
    }
    return reviews.value.filter(review => {
        if (review.state !== "inProgress") {
            return false;
        }
        return !params.targetRevisionId || review.targetRevisionId === params.targetRevisionId;
    });
};
```

- [ ] **Step 4: The refusal handlers**

Create `packages/api-headless-cms-workflows/src/features/hooks/BlockDeleteWhileInReview.ts`:

```ts
import { EntryBeforeDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { listInProgressTargetReviews } from "./listInProgressTargetReviews.js";

/**
 * Trash and permanent delete of a CMS entry are refused while any revision has an in-progress
 * review (D134, R73): `permanent: false` is the trash, `true` the delete. The admin confirms by
 * calling `CancelCmsEntryReviewsForDelete` and repeating the action. Bound models only.
 */
class BlockDeleteWhileInReviewImpl implements EntryBeforeDeleteEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const inProgress = await listInProgressTargetReviews(
            { getBoundWorkflow: this.getBoundWorkflow, listTargetReviews: this.listTargetReviews },
            { model: namespace, targetId: entry.entryId }
        );
        if (inProgress.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: namespace,
            action: permanent ? "delete" : "trash",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockDeleteWhileInReview = EntryBeforeDeleteEventHandler.createImplementation({
    implementation: BlockDeleteWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
```

Create `packages/api-headless-cms-workflows/src/features/hooks/BlockRevisionDeleteWhileInReview.ts`:

```ts
import { EntryRevisionBeforeDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { getCmsNamespace } from "~/utils/appName.js";
import { listInProgressTargetReviews } from "./listInProgressTargetReviews.js";

/**
 * Deleting one revision is refused while that revision's review is in progress (D134, R73).
 * Deleting the only revision deletes the entry, which `BlockDeleteWhileInReview` guards.
 */
class BlockRevisionDeleteWhileInReviewImpl
    implements EntryRevisionBeforeDeleteEventHandler.Interface
{
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryRevisionBeforeDeleteEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const inProgress = await listInProgressTargetReviews(
            { getBoundWorkflow: this.getBoundWorkflow, listTargetReviews: this.listTargetReviews },
            { model: namespace, targetId: entry.entryId, targetRevisionId: entry.id }
        );
        if (inProgress.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: namespace,
            action: "delete",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockRevisionDeleteWhileInReview =
    EntryRevisionBeforeDeleteEventHandler.createImplementation({
        implementation: BlockRevisionDeleteWhileInReviewImpl,
        dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    });
```

Create `packages/api-headless-cms-workflows/src/features/hooks/BlockDeleteMultipleWhileInReview.ts`:

```ts
import { EntryBeforeDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { AccessControl } from "@webiny/api-headless-cms/features/shared/abstractions.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import type { WorkflowBlockingReview } from "@webiny/api-workflows/domain/workflow/types.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * `deleteMultiple` (permanent, up to 50 entries) is refused while any entry it would delete has an
 * in-progress review (D134, R73). Only the entries the caller may access are considered, with the
 * same check `DeleteMultipleEntriesUseCase` applies, so the error never names a review of content
 * the caller cannot see. Bound models only; the binding is looked up once.
 */
class BlockDeleteMultipleWhileInReviewImpl
    implements EntryBeforeDeleteMultipleEventHandler.Interface
{
    public constructor(
        private accessControl: AccessControl.Interface,
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: EntryBeforeDeleteMultipleEventHandler.Event): Promise<void> {
        const { model, entries } = event.payload;
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

        const blocking: WorkflowBlockingReview[] = [];
        for (const entry of entries) {
            if (!(await this.accessControl.canAccessEntry({ model, entry }))) {
                continue;
            }
            const reviews = await this.listTargetReviews.execute({
                model: namespace,
                targetId: entry.entryId
            });
            if (reviews.isFail()) {
                throw reviews.error;
            }
            for (const review of reviews.value) {
                if (review.state === "inProgress") {
                    blocking.push(toBlockingReview(review));
                }
            }
        }
        if (blocking.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: namespace,
            action: "delete",
            reviews: blocking
        });
    }
}

export const BlockDeleteMultipleWhileInReview =
    EntryBeforeDeleteMultipleEventHandler.createImplementation({
        implementation: BlockDeleteMultipleWhileInReviewImpl,
        dependencies: [AccessControl, GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    });
```

- [ ] **Step 5: The cleanup handlers**

Create `packages/api-headless-cms-workflows/src/features/hooks/DeleteReviewsOnEntryDelete.ts`:

```ts
import { EntryAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntry/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Deletes every review of a permanently deleted CMS entry with its assignment records (spec 9.3,
 * R56). Trashing keeps them: the entry can be restored. A failure is logged, not thrown: the entry
 * is already deleted, and a throw would make the use case report a failure and publish its error
 * event for a delete that happened (R81). The reviews then stay orphaned (A34).
 */
class DeleteReviewsOnEntryDeleteImpl implements EntryAfterDeleteEventHandler.Interface {
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: EntryAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry, permanent } = event.payload;
        if (!permanent) {
            return;
        }
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const deleted = await this.deleteTargetReviews.execute({
            model: namespace,
            targetId: entry.entryId
        });
        if (deleted.isFail()) {
            this.logger.error(
                { error: deleted.error, model: namespace, targetId: entry.entryId },
                "Could not delete the reviews of a deleted entry; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnEntryDelete = EntryAfterDeleteEventHandler.createImplementation({
    implementation: DeleteReviewsOnEntryDeleteImpl,
    dependencies: [DeleteTargetReviewsUseCase, Logger]
});
```

Create `packages/api-headless-cms-workflows/src/features/hooks/DeleteReviewsOnRevisionDelete.ts`:

```ts
import { EntryRevisionAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { getCmsNamespace } from "~/utils/appName.js";

/**
 * Deletes the reviews of a deleted CMS revision with their assignment records (spec 9.3, R56).
 * Deleting the last revision deletes the entry, which `DeleteReviewsOnEntryDelete` handles.
 * Failures are logged (R81).
 */
class DeleteReviewsOnRevisionDeleteImpl implements EntryRevisionAfterDeleteEventHandler.Interface {
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: EntryRevisionAfterDeleteEventHandler.Event): Promise<void> {
        const { model, entry } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        const deleted = await this.deleteTargetReviews.execute({
            model: namespace,
            targetId: entry.entryId,
            targetRevisionId: entry.id
        });
        if (deleted.isFail()) {
            this.logger.error(
                { error: deleted.error, model: namespace, targetRevisionId: entry.id },
                "Could not delete the reviews of a deleted revision; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnRevisionDelete =
    EntryRevisionAfterDeleteEventHandler.createImplementation({
        implementation: DeleteReviewsOnRevisionDeleteImpl,
        dependencies: [DeleteTargetReviewsUseCase, Logger]
    });
```

Create `packages/api-headless-cms-workflows/src/features/hooks/DeleteReviewsOnEntriesDeleteMultiple.ts`:

```ts
import { EntryAfterDeleteMultipleEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteMultipleEntries/index.js";
import { GetLatestRevisionByEntryIdIncludingDeletedUseCase } from "@webiny/api-headless-cms/features/contentEntry/GetLatestRevisionByEntryId/index.js";
import { IdentityContext } from "@webiny/api-core/features/security/IdentityContext/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { getCmsNamespace } from "~/utils/appName.js";

const ENTRY_NOT_FOUND = "Cms/Entry/NotFound";

/**
 * Deletes the reviews of entries deleted by `deleteMultiple` (spec 9.3, R56), which publishes no
 * per-entry delete event. The payload lists every requested entry, but the use case deletes only
 * those the caller may access, so each entry is confirmed gone (read as the system, including the
 * trash) before its reviews are deleted. Failures are logged (R81).
 */
class DeleteReviewsOnEntriesDeleteMultipleImpl
    implements EntryAfterDeleteMultipleEventHandler.Interface
{
    public constructor(
        private identityContext: IdentityContext.Interface,
        private getLatestRevision: GetLatestRevisionByEntryIdIncludingDeletedUseCase.Interface,
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: EntryAfterDeleteMultipleEventHandler.Event): Promise<void> {
        const { model, entries } = event.payload;
        const namespace = getCmsNamespace(model);
        if (!namespace) {
            return;
        }

        for (const entry of entries) {
            const latest = await this.identityContext.withoutAuthorization(() => {
                return this.getLatestRevision.execute(model, { id: entry.entryId });
            });
            if (latest.isOk() || latest.error.code !== ENTRY_NOT_FOUND) {
                continue;
            }

            const deleted = await this.deleteTargetReviews.execute({
                model: namespace,
                targetId: entry.entryId
            });
            if (deleted.isFail()) {
                this.logger.error(
                    { error: deleted.error, model: namespace, targetId: entry.entryId },
                    "Could not delete the reviews of a deleted entry; they are left orphaned."
                );
            }
        }
    }
}

export const DeleteReviewsOnEntriesDeleteMultiple =
    EntryAfterDeleteMultipleEventHandler.createImplementation({
        implementation: DeleteReviewsOnEntriesDeleteMultipleImpl,
        dependencies: [
            IdentityContext,
            GetLatestRevisionByEntryIdIncludingDeletedUseCase,
            DeleteTargetReviewsUseCase,
            Logger
        ]
    });
```

- [ ] **Step 6: Register**

In `packages/api-headless-cms-workflows/src/features/hooks/feature.ts` import the six handlers and add after `container.register(BlockMoveWhileInReview);`:

```ts
        // Trash and delete (D134, R73) and review cleanup after a permanent delete (R56, R81)
        container.register(BlockDeleteWhileInReview);
        container.register(BlockRevisionDeleteWhileInReview);
        container.register(BlockDeleteMultipleWhileInReview);
        container.register(DeleteReviewsOnEntryDelete);
        container.register(DeleteReviewsOnRevisionDelete);
        container.register(DeleteReviewsOnEntriesDeleteMultiple);
```

- [ ] **Step 7: Run the tests**

Run: `yarn test packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-headless-cms-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-headless-cms-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 8: Commit**

Run the Global Constraints chain (build `@webiny/api-headless-cms-workflows`), then commit:

```
feat(api-headless-cms-workflows): refuse trash and delete under review and delete reviews with entries

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
