### Task 18b: WB cancel-for-delete wrapper (the confirm path of D134)

D134 points 1 and 3, R45, R73, R74, R85. The Website Builder mirror of Task 14b. Trashing or deleting a page with a review in progress is refused (Task 16b); on confirm the admin calls `CancelWebsiteBuilderPageReviewsForDeleteUseCase` and repeats the trash or delete. The wrapper reads the identity, checks the entity-level page delete permission (`WbPageAccess.canDeleteAnyPage()`, `WbPermissions.canDelete("page", { createdBy: identity })`) before it reads the page or lists any review, so a user without page delete rights gets `Workflows/NotAuthorized` for pages with and without a review alike and learns nothing about reviews in progress (R86, same as R75); then lists the page's in-progress reviews (none means nothing to do), checks that the caller may delete the page (`WbPageAccess.canDelete`: read, `wb.page` delete, folder `d`) on the first in-progress review's revision, and cancels the reviews as the caller through `CancelTargetReviewsUseCase` with reason "content trashed" or "content deleted". No `workflows` permission and no cancel right is needed. Pages have no single-revision delete, so the input names the page only. `CancelTargetReviewsUseCase` stops at the first failure and returns that error; the reviews cancelled before it stay cancelled, and repeating the call finishes the rest. A failed R16 sync on a cancelled review leaves that review cancelled while the target's `system.workflow` is still unsynced.

**Files:**
- Create: `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/abstractions.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/CancelWebsiteBuilderPageReviewsForDeleteUseCase.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/feature.ts`
- Create: `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.ts`
- Modify: `packages/api-website-builder-workflows/src/features/wrappers/feature.ts`
- Modify: `packages/api-website-builder-workflows/__tests__/registration.test.ts`
- Create: `packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts`

**Interfaces:**
- Consumes: `CurrentReviewViewer` (`getActor()`), `ListTargetReviewsUseCase` (Task 4), `CancelTargetReviewsUseCase` (Task 5b), `ReviewActiveOnTrashAction`, `ReviewTargetNotFoundError` (Task 6), `getDeleteCancelReason` (Task 6b), `WbPageTargetReader`, `WbPageAccess.canDeleteAnyPage` and `.canDelete` (Task 15), `TrashPageUseCase`, `RecordingEventPublisher` (Task 17, test).
- Produces:
  - `CancelWebsiteBuilderPageReviewsForDeleteUseCase.Interface.execute(input: CancelWebsiteBuilderPageReviewsForDeleteInput): Promise<Result<ReviewData[], CancelWebsiteBuilderPageReviewsForDeleteUseCase.Error>>`, `CancelWebsiteBuilderPageReviewsForDeleteInput { targetId: string; action: ReviewActiveOnTrashAction }`.
  - Action text `"cancel the review to delete this content"`.

- [ ] **Step 1: Write the failing test**

Create `packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts`:

```ts
import { describe, expect, it } from "vitest";
import type { Container } from "@webiny/di";
import { TrashPageUseCase } from "@webiny/api-website-builder/features/pages/TrashPage/index.js";
import { GetReviewUseCase } from "@webiny/api-workflows/features/review/GetReview/index.js";
import { createUserContext } from "~tests/__helpers/userContext.js";
import { createPage, expectOk } from "~tests/__helpers/pages.js";
import { approvePageReview, requestPageReview, storeWbWorkflow } from "~tests/__helpers/engine.js";
import { toActor, WB_DELETER, WB_WRITER, WRITER } from "~tests/__helpers/identities.js";
import { RecordingEventPublisher, recordedEvents } from "~tests/__helpers/RecordingEventPublisher.js";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "~/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.js";

/** Admin stores the pages workflow; REQUESTER's review is in progress on one page. */
const createScenario = async () => {
    const admin = await createUserContext();
    await storeWbWorkflow(admin);
    const page = await createPage(admin, { title: "Page A" });
    const review = await requestPageReview(admin, page);
    return { admin, page, review };
};

/** WRITER with page delete rights and no workflows permission, recording events (R80). */
const createDeleterContext = () => {
    recordedEvents.length = 0;
    return createUserContext({
        identity: WRITER,
        permissions: WB_DELETER,
        legacyPlugins: [
            (container: Container) => {
                container.registerDecorator(RecordingEventPublisher);
            }
        ]
    });
};

describe("WB cancel-for-delete wrapper (D134)", () => {
    it("lets a user who may trash the page cancel its review, then trash it", async () => {
        const { admin, page, review } = await createScenario();
        const deleter = await createDeleterContext();
        const trashPage = deleter.container.resolve(TrashPageUseCase);

        await expect(trashPage.execute({ id: page.id })).rejects.toMatchObject({
            code: "Workflows/Review/ActiveReviewOnTrash"
        });
        const cancelled = expectOk(
            await deleter.container
                .resolve(CancelWebsiteBuilderPageReviewsForDeleteUseCase)
                .execute({ targetId: page.entryId, action: "trash" })
        );
        const trashed = await trashPage.execute({ id: page.id });

        expect(cancelled.map(item => item.id)).toEqual([review.id]);
        const facts = recordedEvents
            .filter(event => event.eventType === "Workflows/Review/Cancelled")
            .map(event => event.payload.fact);
        expect(facts).toEqual([
            expect.objectContaining({ actor: toActor(WRITER), reason: "content trashed" })
        ]);
        expect(trashed.isOk()).toBe(true);
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("cancelled");
    });

    it("refuses a user who cannot delete the page, and keeps the review", async () => {
        const { admin, page, review } = await createScenario();
        const writer = await createUserContext({ identity: WRITER, permissions: WB_WRITER });

        const result = await writer.container
            .resolve(CancelWebsiteBuilderPageReviewsForDeleteUseCase)
            .execute({ targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/NotAuthorized");
        expect(result.error.data).toEqual({ action: "cancel the review to delete this content" });
        const stored = expectOk(
            await admin.container.resolve(GetReviewUseCase).execute({ id: review.id })
        );
        expect(stored.state).toBe("inProgress");
    });

    it("answers a user without page delete permission the same for a page with and without a review (R86)", async () => {
        const { admin, page } = await createScenario();
        const idle = await createPage(admin, { title: "Page B" });
        const writer = await createUserContext({ identity: WRITER, permissions: WB_WRITER });
        const cancel = writer.container.resolve(CancelWebsiteBuilderPageReviewsForDeleteUseCase);

        const withReview = await cancel.execute({ targetId: page.entryId, action: "trash" });
        const withoutReview = await cancel.execute({ targetId: idle.entryId, action: "trash" });
        const missing = await cancel.execute({ targetId: "missing-page", action: "trash" });

        expect(withReview.error.code).toBe("Workflows/NotAuthorized");
        expect(withoutReview.error.code).toBe(withReview.error.code);
        expect(withoutReview.error.data).toEqual(withReview.error.data);
        expect(missing.error.code).toBe(withReview.error.code);
        expect(missing.error.data).toEqual(withReview.error.data);
    });

    it("cancels nothing when no review is in progress", async () => {
        const admin = await createUserContext();
        await storeWbWorkflow(admin);
        const page = await createPage(admin, { title: "Page A" });
        await approvePageReview(admin, await requestPageReview(admin, page));
        const deleter = await createDeleterContext();

        const cancelled = expectOk(
            await deleter.container
                .resolve(CancelWebsiteBuilderPageReviewsForDeleteUseCase)
                .execute({ targetId: page.entryId, action: "delete" })
        );

        expect(cancelled).toEqual([]);
    });

    it("refuses an anonymous identity", async () => {
        const { page } = await createScenario();
        const anonymous = await createUserContext({ identity: null, permissions: [] });

        const result = await anonymous.container
            .resolve(CancelWebsiteBuilderPageReviewsForDeleteUseCase)
            .execute({ targetId: page.entryId, action: "trash" });

        expect(result.error.code).toBe("Workflows/NotAuthenticated");
    });
});
```

- [ ] **Step 2: Run it to verify it fails**

Run: `yarn test packages/api-website-builder-workflows/__tests__/wrappers/cancelReviewsForDelete.test.ts 2>&1 | tail -50`
Expected: FAIL, cannot resolve `~/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.js`.

- [ ] **Step 3: The wrapper**

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/abstractions.ts`:

```ts
import { createAbstraction, type Result } from "@webiny/feature/api";
import type { ReviewData } from "@webiny/api-workflows/domain/review/types.js";
import type {
    ReviewActiveOnTrashAction,
    ReviewTargetNotFoundError
} from "@webiny/api-workflows/domain/review/errors.js";
import type {
    WorkflowsNotAuthenticatedError,
    WorkflowsNotAuthorizedError
} from "@webiny/api-workflows/domain/permissions/errors.js";
import type { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import type { CancelTargetReviewsUseCase } from "@webiny/api-workflows/features/review/CancelTargetReviews/index.js";

export interface CancelWebsiteBuilderPageReviewsForDeleteInput {
    /** The page id (all revisions). */
    targetId: string;
    /** Recorded as the cancel reason: "content trashed" or "content deleted". */
    action: ReviewActiveOnTrashAction;
}

export interface ICancelWebsiteBuilderPageReviewsForDeleteUseCaseErrors {
    notAuthenticated: WorkflowsNotAuthenticatedError;
    notAuthorized: WorkflowsNotAuthorizedError;
    targetNotFound: ReviewTargetNotFoundError;
    list: ListTargetReviewsUseCase.Error;
    cancel: CancelTargetReviewsUseCase.Error;
}

type UseCaseError =
    ICancelWebsiteBuilderPageReviewsForDeleteUseCaseErrors[keyof ICancelWebsiteBuilderPageReviewsForDeleteUseCaseErrors];

export interface ICancelWebsiteBuilderPageReviewsForDeleteUseCase {
    execute(
        input: CancelWebsiteBuilderPageReviewsForDeleteInput
    ): Promise<Result<ReviewData[], UseCaseError>>;
}

/**
 * The confirm path for trashing or deleting a page with a review in progress (D134, R74): cancels
 * the page's in-progress reviews as the caller, who needs delete access to the page and no cancel
 * right. The admin calls it, then repeats the trash or delete.
 */
export const CancelWebsiteBuilderPageReviewsForDeleteUseCase =
    createAbstraction<ICancelWebsiteBuilderPageReviewsForDeleteUseCase>(
        "CancelWebsiteBuilderPageReviewsForDeleteUseCase"
    );

export namespace CancelWebsiteBuilderPageReviewsForDeleteUseCase {
    export type Interface = ICancelWebsiteBuilderPageReviewsForDeleteUseCase;
    export type Input = CancelWebsiteBuilderPageReviewsForDeleteInput;
    export type Error = UseCaseError;
    export type Return = Promise<Result<ReviewData[], UseCaseError>>;
}
```

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/CancelWebsiteBuilderPageReviewsForDeleteUseCase.ts`:

```ts
import { Result } from "@webiny/feature/api";
import { CurrentReviewViewer } from "@webiny/api-workflows/features/identity/CurrentReviewViewer/index.js";
import { ListTargetReviewsUseCase } from "@webiny/api-workflows/features/review/ListTargetReviews/index.js";
import { CancelTargetReviewsUseCase } from "@webiny/api-workflows/features/review/CancelTargetReviews/index.js";
import { WorkflowsNotAuthorizedError } from "@webiny/api-workflows/domain/permissions/errors.js";
import { ReviewTargetNotFoundError } from "@webiny/api-workflows/domain/review/errors.js";
import { getDeleteCancelReason } from "@webiny/api-workflows/domain/review/getDeleteCancelReason.js";
import { WbPageTargetReader } from "~/features/target/WbPageTargetReader/index.js";
import { WbPageAccess } from "~/features/target/WbPageAccess/index.js";
import { WB_PAGE_NAMESPACE } from "~/constants.js";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase as UseCase } from "./abstractions.js";

class CancelWebsiteBuilderPageReviewsForDeleteUseCaseImpl implements UseCase.Interface {
    public constructor(
        private viewer: CurrentReviewViewer.Interface,
        private listTargetReviews: ListTargetReviewsUseCase.Interface,
        private targets: WbPageTargetReader.Interface,
        private access: WbPageAccess.Interface,
        private cancelTargetReviews: CancelTargetReviewsUseCase.Interface
    ) {}

    public async execute(input: UseCase.Input): UseCase.Return {
        const actor = this.viewer.getActor();
        if (actor.isFail()) {
            return Result.fail(actor.error);
        }

        // Entity-level check first: the answer must not reveal whether a page has a review in
        // progress or exists at all (R86, same as R75).
        if (!(await this.access.canDeleteAnyPage())) {
            return Result.fail(this.notAuthorized());
        }

        const reviews = await this.listTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId
        });
        if (reviews.isFail()) {
            return Result.fail(reviews.error);
        }
        const inProgress = reviews.value.filter(review => review.state === "inProgress");
        if (inProgress.length === 0) {
            return Result.ok([]);
        }

        // Page permissions (own) and the folder are page-level: one revision answers for all.
        const target = await this.targets.read({
            model: WB_PAGE_NAMESPACE,
            targetRevisionId: inProgress[0].targetRevisionId
        });
        if (!target || target.page.entryId !== input.targetId) {
            return Result.fail(
                new ReviewTargetNotFoundError({
                    model: WB_PAGE_NAMESPACE,
                    targetRevisionId: inProgress[0].targetRevisionId
                })
            );
        }
        if (!(await this.access.canDelete(target))) {
            return Result.fail(this.notAuthorized());
        }

        return this.cancelTargetReviews.execute({
            model: WB_PAGE_NAMESPACE,
            targetId: input.targetId,
            actor: actor.value,
            reason: getDeleteCancelReason(input.action)
        });
    }

    private notAuthorized(): WorkflowsNotAuthorizedError {
        return new WorkflowsNotAuthorizedError({
            action: "cancel the review to delete this content"
        });
    }
}

export const CancelWebsiteBuilderPageReviewsForDeleteUseCase = UseCase.createImplementation({
    implementation: CancelWebsiteBuilderPageReviewsForDeleteUseCaseImpl,
    dependencies: [
        CurrentReviewViewer,
        ListTargetReviewsUseCase,
        WbPageTargetReader,
        WbPageAccess,
        CancelTargetReviewsUseCase
    ]
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/api";
import { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "./CancelWebsiteBuilderPageReviewsForDeleteUseCase.js";

export const CancelWebsiteBuilderPageReviewsForDeleteFeature = createFeature({
    name: "WebsiteBuilderWorkflows/CancelWebsiteBuilderPageReviewsForDelete",
    register(container) {
        container.register(CancelWebsiteBuilderPageReviewsForDeleteUseCase);
    }
});
```

Create `packages/api-website-builder-workflows/src/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.ts`:

```ts
export { CancelWebsiteBuilderPageReviewsForDeleteUseCase } from "./abstractions.js";
export type { CancelWebsiteBuilderPageReviewsForDeleteInput } from "./abstractions.js";
```

- [ ] **Step 4: Register and pin the registration**

In `packages/api-website-builder-workflows/src/features/wrappers/feature.ts` import `CancelWebsiteBuilderPageReviewsForDeleteFeature` from `./CancelWebsiteBuilderPageReviewsForDelete/feature.js` and add after `CancelWebsiteBuilderPageReviewFeature.register(container);`:

```ts
        // Confirm path for trash and delete with a review in progress (D134)
        CancelWebsiteBuilderPageReviewsForDeleteFeature.register(container);
```

In `packages/api-website-builder-workflows/__tests__/registration.test.ts` import `CancelWebsiteBuilderPageReviewsForDeleteUseCase` from `~/features/wrappers/CancelWebsiteBuilderPageReviewsForDelete/index.js` and add it to the list of wrapper abstractions after `CancelWebsiteBuilderPageReviewUseCase`.

- [ ] **Step 5: Run the tests**

Run: `yarn test packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS.
Run: `yarn check:test:types -p api-website-builder-workflows --report cli 2>&1 | tail -40` Expected: no errors.
Run: `yarn test:os packages/api-website-builder-workflows 2>&1 | tail -50` Expected: PASS, or "not run" (A9).

- [ ] **Step 6: Commit**

Run the Global Constraints chain (build `@webiny/api-website-builder-workflows`), then commit:

```
feat(api-website-builder-workflows): cancel a page's reviews before it is trashed or deleted

Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>
Claude-Session: https://claude.ai/code/session_01U31bVptN4E9cWVxet6Tjxn
```
