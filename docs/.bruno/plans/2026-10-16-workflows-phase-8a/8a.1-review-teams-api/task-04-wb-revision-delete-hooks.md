### Task 4: `BlockPageRevisionDeleteWhileInReview`, revision-review cleanup and the A87 test

Spec 13.4; Q12 and Q14 (`../00-answers.md`); R73, R81, R235, R236, A87; D134. Task 3 gave the Website Builder a revision delete with its own events. Without a hook, a page revision under review could be deleted and its review orphaned, and the admin WB revision decorator (Task 36) could never receive `Workflows/Review/ActiveReviewOnTrash`. This task adds the two workflows hooks for it, in `api-website-builder-workflows`, and proves the CMS revision hooks stay out of the way.

- `BlockPageRevisionDeleteWhileInReview` (`PageRevisionBeforeDeleteEventHandler`, dependencies `[GetBoundWorkflowUseCase, ListTargetReviewsUseCase]`): with a workflow bound to `wb.page`, throws `ReviewActiveOnTrashError({ model: "wb.page", action: "delete", reviews })` for the in-progress reviews whose `targetRevisionId === page.id` (the shared error code, data shape and `toBlockingReview` rows of the other blocks). A failed bound-workflow or review lookup throws (the delete is refused, fail closed). No bound workflow returns.
- `DeleteReviewsOnPageRevisionDelete` (`PageRevisionAfterDeleteEventHandler`, dependencies `[DeleteTargetReviewsUseCase, Logger]`): deletes the reviews of that revision (`targetId: page.entryId`, `targetRevisionId: page.id`) with their assignment records; a failed result or a throw is logged with a fixed text and never thrown (R81).
- The only-revision case: Task 3 also publishes the page-delete events there, so the existing `BlockPageDeleteWhileInReview` throws the same error (data identical) and `DeleteReviewsOnPageDelete` cleans up every review of the page. The revision block runs first (its before event is published first), so the caller gets one error, not two.
- Registered in `WbHooksFeature` next to the page-delete hooks.
- **A87:** the CMS hooks `BlockRevisionDeleteWhileInReview`, `DeleteReviewsOnRevisionDelete` and `BlockDeleteWhileInReview` call `getCmsNamespace(model)` (`packages/api-headless-cms-workflows/src/utils/appName.ts`), which returns `null` for a private model, and return early. Deleting a page revision through `DeleteEntryRevisionUseCase` on the private page model therefore does not double-fire them. The test feeds the real handlers a revision-delete event for a private model while a review is in progress (the strongest check the CMS workflows harness allows; `trashAndDelete.test.ts` already covers the CMS use-case path on a private model) and a control on the public model.
- Build order: Task 3 must be built first (`yarn build -p @webiny/api-website-builder --no-cache`), the hooks import `@webiny/api-website-builder/features/pages/DeletePageRevision/index.js`.

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/hooks/BlockPageRevisionDeleteWhileInReview.ts`
- Create: `packages/api-website-builder-workflows/src/features/hooks/DeleteReviewsOnPageRevisionDelete.ts`
- Modify: `packages/api-website-builder-workflows/src/features/hooks/feature.ts`
- Create: `packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/graphql/pageRevisionDelete.test.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`
- Create: `packages/api-headless-cms-workflows/__tests__/hooks/privateModelRevisionDelete.test.ts`
- Existing, must stay green: `packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts`, `packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts`

**Interfaces:**
- Consumes: Task 3 (`PageRevisionBeforeDeleteEventHandler`, `PageRevisionAfterDeleteEventHandler`, `DeletePageRevisionUseCase`, the `deletePageRevision` mutation); existing `GetBoundWorkflowUseCase` (`@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js`), `ListTargetReviewsUseCase` (`.../features/review/ListTargetReviews/index.js`), `DeleteTargetReviewsUseCase` (`.../features/review/DeleteTargetReviews/index.js`, accepts `targetRevisionId`), `ReviewActiveOnTrashError` (`@webiny/api-workflows/domain/review/errors.js`), `toBlockingReview` (`@webiny/api-workflows/domain/review/toBlockingReview.js`), `Logger`, `WB_PAGE_NAMESPACE` (`~/constants.js`); the model hooks `BlockPageDeleteWhileInReview.ts`, `DeleteReviewsOnPageDelete.ts` (same folder) and CMS `BlockRevisionDeleteWhileInReview.ts`, `DeleteReviewsOnRevisionDelete.ts`; test helpers `createUserContext`, `createPage`, `expectOk`, `storeWbWorkflow`, `requestPageReview`, `approvePageReview`, `cancelPageReview`, `failListTargetReviews`, `failGetBoundWorkflow`, `failDeleteTargetReviews`, `throwDeleteTargetReviews`, `captureLoggedErrors`, `asGraphQLUser`, `CANCEL_REVIEWS_FOR_DELETE`.
- Produces: `BlockPageRevisionDeleteWhileInReview` and `DeleteReviewsOnPageRevisionDelete`, registered in `WbHooksFeature` (Task 36 relies on the block; no other consumer).

- [ ] **Step 1: Write the failing tests**

Create `packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { DeletePageRevisionUseCase } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { DeletePageUseCase } from "@webiny/api-website-builder/features/pages/DeletePage/index.js";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { captureLoggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { loggedErrors } from "~tests/__helpers/CapturingLogger.js";
import { failDeleteTargetReviews } from "~tests/__helpers/FailingDeleteTargetReviews.js";
import { throwDeleteTargetReviews } from "~tests/__helpers/FailingDeleteTargetReviews.js";
import { failGetBoundWorkflow } from "~tests/__helpers/FailingGetBoundWorkflow.js";
import { failListTargetReviews } from "~tests/__helpers/FailingListTargetReviews.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { expectOk } from "~tests/__helpers/pages.js";
import { approvePageReview } from "~tests/__helpers/engine.js";
import { cancelPageReview } from "~tests/__helpers/engine.js";
import { requestPageReview } from "~tests/__helpers/engine.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";

const CLEANUP_FAILURE = "Could not delete the reviews of a deleted page revision; they are left orphaned.";

/** Page A with revision 1 under review and revision 2 without one, on a bound pages workflow. */
const createScenario = async (legacyPlugins: unknown[] = []) => {
    const context = await createUserContext({ legacyPlugins });
    await storeWbWorkflow(context);
    const page = await createPage(context, { title: "Page A" });
    const review = await requestPageReview(context, page);
    const second = expectOk(
        await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
    );
    return { context, page, review, second };
};

describe("WB revision delete with a review in progress (D134, R235)", () => {
    beforeEach(() => {
        loggedErrors.length = 0;
    });

    it("refuses to delete the revision under review with the shared error code and data", async () => {
        const { context, page, review } = await createScenario();
        const deleteRevision = context.container.resolve(DeletePageRevisionUseCase);

        // The before event is published outside a try, so the handler's error rejects (A26).
        const error = await deleteRevision.execute({ id: page.id }).catch(thrown => thrown);

        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data).toEqual({
            model: "wb.page",
            action: "delete",
            reviews: [
                {
                    reviewId: review.id,
                    model: "wb.page",
                    targetId: page.entryId,
                    targetRevisionId: page.id,
                    title: "Page A",
                    stepPosition: 1,
                    stepCount: 1,
                    stepName: "Step 1"
                }
            ]
        });
    });

    it("does not block a revision that has no review, and keeps the other revision's review", async () => {
        const { context, page, review, second } = await createScenario();

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: second.id });

        expect(deleted.isOk()).toBe(true);
        const stored = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
        expect(stored.targetRevisionId).toBe(page.id);
    });

    it("does not block when no workflow is bound to pages", async () => {
        const context = await createUserContext();
        const page = await createPage(context, { title: "Page A" });
        const second = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: second.id });

        expect(deleted.isOk()).toBe(true);
    });

    it("refuses the delete when the review lookup fails on a bound pages workflow (fail closed)", async () => {
        const context = await createUserContext({ legacyPlugins: [failListTargetReviews] });
        const page = await createPage(context, { title: "Page A" });
        const second = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );
        await storeWbWorkflow(context);

        await expect(
            context.container.resolve(DeletePageRevisionUseCase).execute({ id: second.id })
        ).rejects.toMatchObject({ code: "Workflows/Review/Persistence" });
    });

    it("refuses the delete when the bound workflow lookup fails (fail closed)", async () => {
        const context = await createUserContext({ legacyPlugins: [failGetBoundWorkflow] });
        const page = await createPage(context, { title: "Page A" });
        const second = expectOk(
            await context.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
        );

        await expect(
            context.container.resolve(DeletePageRevisionUseCase).execute({ id: second.id })
        ).rejects.toMatchObject({ code: "Workflows/Workflow/Persistence" });
    });

    it("deletes the reviews of the deleted revision only", async () => {
        const { context, page, review, second } = await createScenario();
        const secondReview = await requestPageReview(context, second);
        await approvePageReview(context, review);
        const getReview = context.container.resolve(GetReviewUseCase);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect((await getReview.execute({ id: review.id })).error.code).toBe(
            "Workflows/Review/NotFound"
        );
        expect(expectOk(await getReview.execute({ id: secondReview.id })).state).toBe("inProgress");
    });

    it("keeps the delete when the review cleanup fails, and logs it (R81)", async () => {
        const { context, page, review } = await createScenario([
            captureLoggedErrors,
            failDeleteTargetReviews
        ]);
        await cancelPageReview(context, review);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            {
                message: CLEANUP_FAILURE,
                fields: expect.objectContaining({ model: "wb.page", targetRevisionId: page.id })
            }
        ]);
        const orphan = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(orphan.isOk()).toBe(true);
    });

    it("keeps the delete when the review cleanup throws, and logs it (R81)", async () => {
        const { context, page, review } = await createScenario([
            captureLoggedErrors,
            throwDeleteTargetReviews
        ]);
        await cancelPageReview(context, review);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        expect(loggedErrors).toEqual([
            {
                message: CLEANUP_FAILURE,
                fields: expect.objectContaining({ model: "wb.page", targetRevisionId: page.id })
            }
        ]);
    });

    it("also refuses the only revision with one error, from the revision block", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        const deleteRevision = context.container.resolve(DeletePageRevisionUseCase);

        const error = await deleteRevision.execute({ id: page.id }).catch(thrown => thrown);

        expect(error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(error.data.action).toBe("delete");
        expect(error.data.reviews).toHaveLength(1);
        expect(error.data.reviews[0].reviewId).toBe(review.id);
        // The revision block runs first and its error ends the before phase, so the page-delete
        // block (`BlockPageDeleteWhileInReview`) is not reached behind it here; it keeps guarding
        // the page-delete event on its own (`WbPageTrashAndDelete.test.ts`).
    });

    it("deletes the only revision after the review is cancelled, and removes its reviews with the page", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await requestPageReview(context, page);
        await cancelPageReview(context, review);

        const deleted = await context.container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: page.id });

        expect(deleted.isOk()).toBe(true);
        const gone = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(gone.error.code).toBe("Workflows/Review/NotFound");
    });

    it("leaves the page delete rules untouched: a trashed page still deletes as before", async () => {
        const context = await createUserContext();
        await storeWbWorkflow(context);
        const page = await createPage(context, { title: "Page A" });
        const review = await approvePageReview(context, await requestPageReview(context, page));
        expectOk(await context.container.resolve(TrashPageUseCase).execute({ id: page.id }));

        expectOk(await context.container.resolve(DeletePageUseCase).execute({ id: page.id }));

        const gone = await context.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(gone.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

Create `packages/api-website-builder-workflows/__tests__/graphql/pageRevisionDelete.test.ts`:

```ts
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { CreatePageRevisionFromUseCase } from "@webiny/api-website-builder/features/pages/CreatePageRevisionFrom/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage } from "~tests/__helpers/pages.js";
import { expectOk } from "~tests/__helpers/pages.js";
import { requestPageReview } from "~tests/__helpers/engine.js";
import { storeWbWorkflow } from "~tests/__helpers/engine.js";
import { REQUESTER } from "~tests/__helpers/identities.js";
import { WB_DELETER } from "~tests/__helpers/identities.js";
import { folderLevels } from "~tests/__helpers/FakeFolderLevelPermissions.js";
import { asGraphQLUser } from "~tests/__helpers/graphql.js";
import { CANCEL_REVIEWS_FOR_DELETE } from "~tests/__helpers/graphql.js";

const DELETE_PAGE_REVISION = /* GraphQL */ `
    mutation DeletePageRevision($id: ID!) {
        websiteBuilder {
            deletePageRevision(id: $id) {
                data
                error {
                    code
                    message
                    data
                }
            }
        }
    }
`;

/** Admin stores the pages workflow; revision 1 of "Page A" is under review, revision 2 is not. */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const review = await requestPageReview(admin, page);
    const second = expectOk(
        await admin.container.resolve(CreatePageRevisionFromUseCase).execute({ id: page.id })
    );
    return { admin, page, review, second };
};

describe("WB deletePageRevision through GraphQL with workflows (R235, D134)", () => {
    beforeEach(() => {
        folderLevels.clear();
    });

    afterEach(() => {
        folderLevels.clear();
    });

    it("refuses with Workflows/Review/ActiveReviewOnTrash while the revision's review is in progress", async () => {
        const { page, review } = await createScenario();
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const body = await deleter.run(DELETE_PAGE_REVISION, { id: page.id });

        expect(body.errors).toBeUndefined();
        const result = body.data.websiteBuilder.deletePageRevision;
        expect(result.data).toBeNull();
        expect(result.error.code).toBe("Workflows/Review/ActiveReviewOnTrash");
        expect(result.error.data).toMatchObject({
            model: "wb.page",
            action: "delete",
            reviews: [{ reviewId: review.id, targetRevisionId: page.id }]
        });
    });

    it("deletes the revision after the page-wide cancel-for-delete", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = asGraphQLUser({ identity: REQUESTER, permissions: WB_DELETER });

        const cancelled = await deleter.run(CANCEL_REVIEWS_FOR_DELETE, {
            pageId: page.entryId,
            action: "delete"
        });
        const body = await deleter.run(DELETE_PAGE_REVISION, { id: page.id });

        expect(
            cancelled.data.websiteBuilder.cancelWebsiteBuilderPageReviewsForDelete.error
        ).toBeNull();
        expect(body.data.websiteBuilder.deletePageRevision).toEqual({ data: true, error: null });
        const gone = await admin.container.resolve(GetReviewUseCase).execute({ id: review.id });
        expect(gone.error.code).toBe("Workflows/Review/NotFound");
    });
});
```

Create `packages/api-headless-cms-workflows/__tests__/hooks/privateModelRevisionDelete.test.ts`. A review cannot be requested on a private model (no workflow can be bound to one), so the real `DeleteEntryRevisionUseCase` path on a private model (already pinned by `trashAndDelete.test.ts`, "neither blocks nor cleans up") cannot carry an in-progress review. This test therefore hands the two real CMS workflow handlers a revision-delete event for a private model while a review is in progress on the public model's entry. The handlers are picked by class name; the test asserts it found exactly one of each, so a rename fails loudly instead of passing vacuously:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { EntryRevisionAfterDeleteEvent } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.js";
import { EntryRevisionBeforeDeleteEvent } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/events.js";
import { EntryRevisionAfterDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { EntryRevisionBeforeDeleteEventHandler } from "@webiny/api-headless-cms/features/contentEntry/DeleteEntryRevision/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { createAuthorEntry } from "~tests/__helpers/entries.js";
import { expectOk } from "~tests/__helpers/entries.js";
import { getAuthorModel } from "~tests/__helpers/entries.js";
import { createTestContext } from "~tests/__helpers/testContext.js";
import { countEngineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { engineCalls } from "~tests/__helpers/CountingEngineCalls.js";
import { requestEntryReview } from "~tests/__helpers/engine.js";

const BLOCK_HANDLER = "BlockRevisionDeleteWhileInReviewImpl";
const CLEANUP_HANDLER = "DeleteReviewsOnRevisionDeleteImpl";

/** Only the workflow handlers: other packages' handlers are not under test here. */
const pickByName = <THandler extends object>(handlers: THandler[], name: string): THandler[] => {
    return handlers.filter(handler => handler.constructor.name === name);
};

/**
 * Website Builder pages are entries of a private CMS model. The CMS revision hooks must ignore a
 * private model (A87), so deleting a page revision runs only the Website Builder hooks
 * (`BlockPageRevisionDeleteWhileInReview`, `DeleteReviewsOnPageRevisionDelete`).
 */
describe("CMS revision hooks ignore the private model (A87, R52)", () => {
    beforeEach(() => {
        engineCalls.length = 0;
    });

    it("neither blocks nor cleans up for a private model's revision, even with a review in progress", async () => {
        const context = await createTestContext({ legacyPlugins: [countEngineCalls] });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        const review = await requestEntryReview(context, entry);
        const model = await getAuthorModel(context);
        const privateModel = { ...model, isPrivate: true };
        engineCalls.length = 0;
        const block = pickByName(
            context.container.resolveAll(EntryRevisionBeforeDeleteEventHandler),
            BLOCK_HANDLER
        );
        const cleanup = pickByName(
            context.container.resolveAll(EntryRevisionAfterDeleteEventHandler),
            CLEANUP_HANDLER
        );

        await block[0].handle(new EntryRevisionBeforeDeleteEvent({ entry, model: privateModel }));
        await cleanup[0].handle(new EntryRevisionAfterDeleteEvent({ entry, model: privateModel }));

        expect(block).toHaveLength(1);
        expect(cleanup).toHaveLength(1);
        expect(engineCalls).toEqual([]);
        const stored = expectOk(
            await context.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("still blocks the same revision on a public model (control)", async () => {
        const context = await createTestContext({ legacyPlugins: [countEngineCalls] });
        const entry = await createAuthorEntry(context, { name: "Ann" });
        await requestEntryReview(context, entry);
        const model = await getAuthorModel(context);
        const block = pickByName(
            context.container.resolveAll(EntryRevisionBeforeDeleteEventHandler),
            BLOCK_HANDLER
        );

        await expect(
            block[0].handle(new EntryRevisionBeforeDeleteEvent({ entry, model }))
        ).rejects.toMatchObject({ code: "Workflows/Review/ActiveReviewOnTrash" });
    });
});
```

`packages/api-website-builder-workflows/__tests__/registration.test.ts`, add the import next to the `DeletePage` import, and replace the `handlers` array (one each, none left over without the license):

```ts
import { PageRevisionAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { PageRevisionBeforeDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
```

```ts
        const handlers: Abstraction<unknown>[] = [
            PageBeforePublishEventHandler,
            PageBeforeMoveEventHandler,
            PageBeforeTrashEventHandler,
            PageBeforeDeleteEventHandler,
            PageAfterDeleteEventHandler,
            PageRevisionBeforeDeleteEventHandler,
            PageRevisionAfterDeleteEventHandler
        ];
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRevisionDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/hooks/privateModelRevisionDelete.test.ts 2>&1 | tail -50
```

Expected: FAIL for the WB tests (the revision with a review is deleted instead of refused: `expected undefined to be "Workflows/Review/ActiveReviewOnTrash"`; the registration difference is 0, not 1; the GraphQL test gets `data: true`). The A87 test already passes (it pins existing behaviour; it must stay green after the change).

- [ ] **Step 3: Implement**

`packages/api-website-builder-workflows/src/features/hooks/BlockPageRevisionDeleteWhileInReview.ts`:

```ts
import { PageRevisionBeforeDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { GetBoundWorkflowUseCase } from "@webiny/api-workflows/features/workflow/GetBoundWorkflow/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { ReviewActiveOnTrashError } from "@webiny/api-workflows/domain/review/errors.js";
import { toBlockingReview } from "@webiny/api-workflows/domain/review/toBlockingReview.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Deleting one revision of a page is refused while that revision's review is in progress (D134,
 * R73, R235). Deleting the only revision also publishes the page-delete event, which
 * `BlockPageDeleteWhileInReview` guards with the same error.
 *
 * The CMS revision hooks ignore the private page model (A87), so only this one runs for pages.
 */
class BlockPageRevisionDeleteWhileInReviewImpl
    implements PageRevisionBeforeDeleteEventHandler.Interface
{
    public constructor(
        private getBoundWorkflow: GetBoundWorkflowUseCase.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface
    ) {}

    public async handle(event: PageRevisionBeforeDeleteEventHandler.Event): Promise<void> {
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
        const inProgress = reviews.value.filter(review => {
            return review.state === "inProgress" && review.targetRevisionId === page.id;
        });
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

export const BlockPageRevisionDeleteWhileInReview =
    PageRevisionBeforeDeleteEventHandler.createImplementation({
        implementation: BlockPageRevisionDeleteWhileInReviewImpl,
        dependencies: [GetBoundWorkflowUseCase, ListTargetReviewsUseCase]
    });
```

`packages/api-website-builder-workflows/src/features/hooks/DeleteReviewsOnPageRevisionDelete.ts`:

```ts
import { PageRevisionAfterDeleteEventHandler } from "@webiny/api-website-builder/features/pages/DeletePageRevision/index.js";
import { Logger } from "@webiny/api-core/features/logger/index.js";
import { DeleteTargetReviewsUseCase } from "@webiny/api-workflows/features/review/DeleteTargetReviews/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";

/**
 * Deletes the reviews of a deleted page revision with their assignment records (spec 9.3, R56,
 * R235). Deleting the only revision also publishes the page-delete event, which
 * `DeleteReviewsOnPageDelete` handles for every revision. A failure (a failed result or a throw)
 * is logged, not thrown: the revision is already deleted (R81).
 */
class DeleteReviewsOnPageRevisionDeleteImpl implements PageRevisionAfterDeleteEventHandler.Interface {
    public constructor(
        private deleteTargetReviews: DeleteTargetReviewsUseCase.Interface,
        private logger: Logger.Interface
    ) {}

    public async handle(event: PageRevisionAfterDeleteEventHandler.Event): Promise<void> {
        const { page } = event.payload;

        try {
            const deleted = await this.deleteTargetReviews.execute({
                model: WB_PAGE_NAMESPACE,
                targetId: page.entryId,
                targetRevisionId: page.id
            });
            if (deleted.isFail()) {
                this.logger.error(
                    { error: deleted.error, model: WB_PAGE_NAMESPACE, targetRevisionId: page.id },
                    "Could not delete the reviews of a deleted page revision; they are left orphaned."
                );
            }
        } catch (error) {
            this.logger.error(
                { error, model: WB_PAGE_NAMESPACE, targetRevisionId: page.id },
                "Could not delete the reviews of a deleted page revision; they are left orphaned."
            );
        }
    }
}

export const DeleteReviewsOnPageRevisionDelete =
    PageRevisionAfterDeleteEventHandler.createImplementation({
        implementation: DeleteReviewsOnPageRevisionDeleteImpl,
        dependencies: [DeleteTargetReviewsUseCase, Logger]
    });
```

`packages/api-website-builder-workflows/src/features/hooks/feature.ts`:

```diff
 import { BlockPageDeleteWhileInReview } from "./BlockPageDeleteWhileInReview.js";
 import { DeleteReviewsOnPageDelete } from "./DeleteReviewsOnPageDelete.js";
+import { BlockPageRevisionDeleteWhileInReview } from "./BlockPageRevisionDeleteWhileInReview.js";
+import { DeleteReviewsOnPageRevisionDelete } from "./DeleteReviewsOnPageRevisionDelete.js";
@@
         container.register(BlockPageTrashWhileInReview);
         container.register(BlockPageDeleteWhileInReview);
         container.register(DeleteReviewsOnPageDelete);
+        // The page revision delete (R235): the same block and cleanup for one revision
+        container.register(BlockPageRevisionDeleteWhileInReview);
+        container.register(DeleteReviewsOnPageRevisionDelete);
```

- [ ] **Step 4: Run the new tests on both storages, expect pass**

Run one command at a time:

```bash
yarn test packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/target/WbPageRevisionDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/graphql/pageRevisionDelete.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/graphql/pageRevisionDelete.test.ts 2>&1 | tail -50
yarn test packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/registration.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/hooks/privateModelRevisionDelete.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/hooks/privateModelRevisionDelete.test.ts 2>&1 | tail -50
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts 2>&1 | tail -50
yarn test:os packages/api-website-builder-workflows/__tests__/target/WbPageTrashAndDelete.test.ts 2>&1 | tail -50
yarn test packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts 2>&1 | tail -50
yarn test:os packages/api-headless-cms-workflows/__tests__/hooks/trashAndDelete.test.ts 2>&1 | tail -50
yarn check:test:types -p api-website-builder-workflows,api-headless-cms-workflows --report cli 2>&1 | tail -40
```

Expected: all PASS, no type errors.

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full and restore `.gitleaks.toml`:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/api-website-builder-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(api-website-builder-workflows): block and clean up reviews on a page revision delete" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start.

## Contract notes

- **Unverified code.** The two hooks and the tests were written by analogy to the working page-delete and CMS revision hooks and to `WbPageTrashAndDelete.test.ts`; they were **not run** when this plan was written (Task 3 must exist first). The implementer runs them in Steps 2 and 4.
- verify: the cleanup log text `Could not delete the reviews of a deleted page revision; they are left orphaned.` is new (the page-delete one says "deleted page"); the tests pin it, change both together if the wording changes.
- verify: the test "deletes the reviews of the deleted revision only" requests a review on revision 2 while revision 1 is approved; if the engine refuses a second active review on one page, request revision 2's review before approving revision 1's.
