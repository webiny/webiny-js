### Task 16b: WB trash and delete rules

Spec 9.3, D134 points 1 and 3, R52, R56, R73, R81, A26, A34. The `wb.page` mirror of Task 10b, on the Website Builder page events (WB trashes and deletes pages through CMS `DeleteEntryUseCase`, but the CMS rules skip the private page model, R52):

- `BlockPageTrashWhileInReview` (`PageBeforeTrash`) and `BlockPageDeleteWhileInReview` (`PageBeforeDelete`, the permanent delete of a trashed page): with a pages workflow bound, refused with `Workflows/Review/ActiveReviewOnTrash` (action `trash` / `delete`) while any revision of the page has an in-progress review; lookups fail closed. Each handler asks `GetBoundWorkflowUseCase` first and then lists the page's reviews inline, as the CMS handlers do (Task 10b); lookup failures are thrown. WB publishes these events outside a `try`, so the refusal rejects the use case's promise (A26); phase 3 maps it in the WB resolvers. On OpenSearch a just-created workflow may not be listed yet (A29), so for that window the model reads as unbound and the rule fails open (an accepted race, like D15): the bound-workflow lookup fails closed on a read error (A38), not on lag.
- `DeleteReviewsOnPageDelete` (`PageAfterDelete`): deletes every review of the page with its assignment records; a failure is logged and the delete stands (R81). `DeletePage` is the only permanent delete of a page: `EmptyTrashBinTask` lists non-private models only (`packages/api-headless-cms-bulk-actions/src/tasks/EmptyTrashBinTask.ts`), so a future bin purge for pages must call this cleanup too (said in the handler's doc).

With D134 a page cannot reach the trash with a review in progress, so the `PageBeforeDelete` refusal only guards races; it is pinned by calling the registered handler directly.

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/hooks/BlockPageTrashWhileInReview.ts`
- Create: `packages/api-website-builder-workflows/src/features/hooks/BlockPageDeleteWhileInReview.ts`
- Create: `packages/api-website-builder-workflows/src/features/hooks/DeleteReviewsOnPageDelete.ts`
- Modify: `packages/api-website-builder-workflows/src/features/hooks/feature.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts`

**Interfaces:**
- Consumes: `PageBeforeTrashEventHandler` (`@webiny/api-website-builder/features/pages/TrashPage/index.js`), `PageBeforeDeleteEventHandler`, `PageAfterDeleteEventHandler` (`.../DeletePage/index.js`), `PageBeforeDeleteEvent` (`.../DeletePage/events.js`, test), `TrashPageUseCase`, `DeletePageUseCase`, `GetBoundWorkflowUseCase`, `ListTargetReviewsUseCase`, `DeleteTargetReviewsUseCase`, `ReviewActiveOnTrashError`, `toBlockingReview`, `Logger`.
- Produces: three handlers registered by `WbHooksFeature`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { Result } from "@webiny/feature/api";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import {
    DeletePageUseCase,
    PageBeforeDeleteEventHandler
} from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { PageBeforeDeleteEvent } from "@webiny/api-website-builder/features/pages/DeletePage/events.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { ReviewPersistenceError } from "@webiny/api-workflows/domain/review/errors.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import {
    approvePageReview,
    cancelPageReview,
    requestPageReview,
    storeWbWorkflow
} from "~tests/__helpers/engine.js";

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

describe("WB trash and delete with a review in progress (D134)", () => {
    it("refuses to trash a page with a review in progress, and trashes it after cancel", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const trashPage = context.container.resolve(TrashPageUseCase);

        // WB publishes the before event outside a try, so the handler's error rejects (A26).
        await expect(trashPage.execute({ id: page.id })).rejects.toMatchObject({
            code: "Workflows/Review/ActiveReviewOnTrash",
            data: {
                model: "wb.page",
                action: "trash",
                reviews: [{ reviewId: review.id, targetId: page.entryId, title: "Page A" }]
            }
        });
        await cancelPageReview(context, review);
        const trashed = await trashPage.execute({ id: page.id });

        expect(trashed.isOk()).toBe(true);
    });

    it("refuses the trash when the review lookup fails on a bound pages workflow (fail closed)", async () => {
        const context = await createUserContext({
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
        const page = await createPage(context, { title: "Page A" });
        await storeWbWorkflow(context);

        await expect(
            context.container.resolve(TrashPageUseCase).execute({ id: page.id })
        ).rejects.toMatchObject({ code: "Workflows/Review/Persistence" });
    });

    it("refuses a page delete while a review is in progress (handler, races only)", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        await requestPageReview(context, page);
        const handlers = context.container.resolveAll(PageBeforeDeleteEventHandler);

        const results = await Promise.allSettled(
            handlers.map(handler => handler.handle(new PageBeforeDeleteEvent({ page })))
        );

        expect(results).toContainEqual({
            status: "rejected",
            reason: expect.objectContaining({
                code: "Workflows/Review/ActiveReviewOnTrash",
                data: expect.objectContaining({ action: "delete" })
            })
        });
    });

    it("trashes pages without a pages workflow even when the review lookup fails", async () => {
        const context = await createUserContext({
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
        const page = await createPage(context, { title: "Page A" });

        const trashed = await context.container
            .resolve(TrashPageUseCase)
            .execute({ id: page.id });

        expect(trashed.isOk()).toBe(true);
    });
});

describe("WB review cleanup after a page delete (R56, R81)", () => {
    it("keeps the reviews of a trashed page and deletes them with the page", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await approvePageReview(context, await requestPageReview(context, page));
        const getReview = context.container.resolve(GetReviewUseCase);

        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));
        const afterTrash = await getReview.execute({ id: review.id });
        expectOk(await context.container.resolve(DeletePageUseCase).execute({ id: page.id }));
        const afterDelete = await getReview.execute({ id: review.id });

        expect(afterTrash.isOk()).toBe(true);
        expect(afterDelete.error.code).toBe("Workflows/Review/NotFound");
    });

    it("keeps the delete when the review cleanup fails (logged, R81)", async () => {
        const context = await createUserContext({
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
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await approvePageReview(context, await requestPageReview(context, page));
        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));

        const deleted = await context.container.resolve(DeletePageUseCase).execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        // The review is orphaned (A34).
        const orphan = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(orphan.isOk()).toBe(true);
    });
});
```

(`PageBeforeDeleteEvent` is the event `DeletePageUseCase` publishes; calling the registered handlers with it pins the refusal without a page in the trash.)

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts 2>&1 | tail -50`
Expected: FAIL. The trash under review succeeds; no handler refuses the delete event; the deleted page's review is still found. The unbound-trash and failing-cleanup tests pass already.

- [ ] **Step 3: Implement the handlers**

Create `packages/api-website-builder-workflows/src/features/hooks/BlockPageTrashWhileInReview.ts`:

```ts
import { PageBeforeTrashEventHandler } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Trashing a page is refused while any of its revisions has an in-progress review (D134, R73).
 * The admin confirms by calling `CancelWebsiteBuilderPageReviewsForDelete` and trashing again.
 * Only with a pages workflow bound; lookup failures refuse.
 */
class BlockPageTrashWhileInReviewImpl implements PageBeforeTrashEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageBeforeTrashEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        const bound = await this.getBoundWorkflow.execute({ model: WB_PAGE_NAMESPACE });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: page.entryId
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value.filter(review => review.state === "inProgress");
        if (inProgress.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: WB_PAGE_NAMESPACE,
            action: "trash",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockPageTrashWhileInReview = PageBeforeTrashEventHandler.createImplementation({
    implementation: BlockPageTrashWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/hooks/BlockPageDeleteWhileInReview.ts`:

```ts
import { PageBeforeDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Deleting a page from the trash is refused while a review is in progress (D134, R73). A page
 * cannot reach the trash with one (`BlockPageTrashWhileInReview`), so this only guards races.
 */
class BlockPageDeleteWhileInReviewImpl implements PageBeforeDeleteEventHandler.Interface {
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageBeforeDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        const bound = await this.getBoundWorkflow.execute({ model: WB_PAGE_NAMESPACE });
        if (bound.isFail()) {
            throw bound.error;
        }
        if (!bound.value) {
            return;
        }

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: page.entryId
        });
        if (reviews.isFail()) {
            throw reviews.error;
        }
        const inProgress = reviews.value.filter(review => review.state === "inProgress");
        if (inProgress.length === 0) {
            return;
        }

        throw new ReviewActiveOnTrashError({
            model: WB_PAGE_NAMESPACE,
            action: "delete",
            reviews: inProgress.map(toBlockingReview)
        });
    }
}

export const BlockPageDeleteWhileInReview = PageBeforeDeleteEventHandler.createImplementation({
    implementation: BlockPageDeleteWhileInReviewImpl,
    dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
});
```

Create `packages/api-website-builder-workflows/src/features/hooks/DeleteReviewsOnPageDelete.ts`:

```ts
import { PageAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Deletes every review of a permanently deleted page with its assignment records (spec 9.3, R56).
 * `DeletePage` is the only permanent delete of a page today: the CMS "empty trash bin" task skips
 * private models, the page model included. A future bin purge for pages must run this cleanup too,
 * or the reviews are orphaned. A failure is logged and the delete stands (R81, A34).
 */
class DeleteReviewsOnPageDeleteImpl implements PageAfterDeleteEventHandler.Interface {
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: PageAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;
        const deleted = await this.deleteTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: page.entryId
        });
        if (deleted.isFail()) {
            this.logger.error(
                { error: deleted.error, model: WB_PAGE_NAMESPACE, targetId: page.entryId },
                "Could not delete the reviews of a deleted page; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnPageDelete = PageAfterDeleteEventHandler.createImplementation({
    implementation: DeleteReviewsOnPageDeleteImpl,
    dependencies: [DeleteTargetReviewsUseCase, Logger]
});
```

In `packages/api-website-builder-workflows/src/features/hooks/feature.ts` import the three handlers and add after `container.register(BlockPageMoveWhileInReview);`:

```ts
        // Trash and delete (D134, R73) and review cleanup after a page delete (R56, R81)
        container.register(BlockPageTrashWhileInReview);
        container.register(BlockPageDeleteWhileInReview);
        container.register(DeleteReviewsOnPageDelete);
```

- [ ] **Step 4: Run the tests**

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 5: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows`), then commit:

```
feat(api-website-builder-workflows): refuse page trash and delete under review and delete reviews with pages

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
