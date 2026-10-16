### Task 36: WB trash and delete decorators (`app-website-builder-workflows`)

R202, R204, R205, R228, R211, R235, R236, R249, D157, A82; Q28; Review Focus 8, 10, 17, 18, 19. The Website Builder half of the warning flow: three decorators that only forward to the shared `ActiveReviewGuard` (Task 33), a feature `WebsiteBuilderWorkflows` mounts inside the flag gate, and the small base fixes the A82 caller review found. Same shape as Task 35; the differences are the use-case results, the single-argument bulk form, the revision delete without a first dialog, and the trash bin.

- **`DeletePageUseCaseReviewDecorator`** (`DeletePageUseCase.createDecorator`, dependencies `[ActiveReviewGuard, WbReviewUseCases]`): `execute(params)` -> `guard.run({ action: () => decoratee.execute(params), useCases, revisionId: null })`. `params.id` is a revision id (the list passes the page's current revision), but the trash covers the whole page, so `revisionId` is `null` and the confirm cancels every revision's reviews (`cancelWebsiteBuilderPageReviewsForDelete(pageId, null, action)`, `targetId` comes from the refusal data, the page id).
- **`DeletePageRevisionUseCaseReviewDecorator`**: `revisionId: params.id` (the revision id), so the confirm cancels only that revision's reviews (the optional `revisionId` of Task 5, the block of Task 4).
- **`BulkDeletePresenterReviewDecorator`** (`BulkDeletePresenter.createDecorator`, token `"WB/BulkDeletePresenter"`, dependencies `[ActiveReviewGuard, WbReviewUseCases]`): WB's form is `execute(items: Page[])` with **one argument**: `guard.runBulk({ items, getTargetId: row => row.entryId, run: batch => decoratee.execute(batch), useCases })`; `isRetry` is ignored (every WB bulk delete is already per page); `vm` delegates. Nothing else (R228).
- **First-pass count (Q28, R228).** After a warning and a confirmed retry the results dialog shows only the retried items (accepted, documented in Task 38). The first-pass count toast (Q28 copy) is shown by `ActiveReviewGuard.runBulk` (Task 33); the WB bulk decorator only forwards and holds no count logic. Step 0 only confirms that the WB bulk flow has no count of its own (`BulkActionDelete.tsx` shows a static message, `DialogMessage.tsx` lists one row per item); the toast wording is Task 33's.
- **Feature** `WbReviewTrashFeature` (name `WebsiteBuilderWorkflows/Trash`) registers the three decorators; `WebsiteBuilderWorkflows` mounts it with `<RegisterFeature feature={WbReviewTrashFeature} />` inside the gate after the shared features (A77). Root decorators apply to the scoped child container `PagesList` builds (`collectDecorators`: parent first, so the workflows decorator sits inside the base `...WithLoading` decorators, which wrap it).
- **Use-case results.** The base WB delete use cases return `Promise<void>`, so the guard's `false` (dismissed warning) cannot travel through the typed interface, and the base `DeletePageUseCaseWithLoading` and `DeletePageRevisionUseCaseWithLoading` drop the result (`await runCallBack(...)` returns nothing). The CMS use cases return `boolean`. Fix: both WB use-case abstractions become `execute(params): Promise<boolean>` (`false` = not carried out), the two implementations return `true`, the two loading decorators `return` the `runCallBack` result (`ILoadingRepository.runCallBack<T>(Promise<T>): Promise<T>` already preserves it).

**Trash-bin delete: located, deliberately not decorated (R249, controller ruling).** The trash bin's permanent delete runs through `TrashBinPresenter.actions.deleteItem` -> `TrashBinDeleteGateway` (`@webiny/app-admin/presentation/trashBin/abstractions.js`), implemented for WB by `WbTrashBinDeleteGateway` (`packages/app-website-builder/src/features/pages/trashBin/WbTrashBinDeleteGateway.ts`), which calls the `deletePage(permanently: true)` mutation directly, with no WB use case in between. The only hook point is the `TrashBinDeleteGateway` token, which the CMS and WB trash bins share: a decorator registered on the root container would wrap the CMS adapter as well, and a second CMS refusal would then run the WB `cancelForDelete` against a `cms.*` namespace (Review Focus 1). The path also cannot hold an active review: the trash is refused while a review is in progress, and trashed targets are unreadable to the workflows server (`packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/WbPageTargetReader.ts` reads the revision through `GetRevisionByIdUseCase` with its NotDeleted decorator), so no review can be requested or started on a trashed page. The evidence goes into the commit body of the feat commit. There is no WB trash-bin hook; the CMS trash bin is covered only through `PermanentlyDeleteEntryUseCase` (Task 35). The typed error from Task 32 still flows from `WbTrashBinDeleteGateway`, the shared `TrashBinPresenter` and `useDeleteTrashBinItem` (Task 35) handle `false`, and the server block stays the safety net. If Step 0 contradicts this evidence, stop and report it (a WB-only abstraction between the gateway and the presenter would be needed, never a decorator on the shared token). The CMS needs no such exception: its trash bin goes through the decorated `PermanentlyDeleteEntryUseCase`.

**A82, the WB callers re-verified.**
- `PageListPresenter.deletePage` (`packages/app-website-builder/src/presentation/pages/PageList/PageListPresenter.ts`): `confirm(TRASH_PAGE_DIALOG, ..., execute)` resolves the execute result and returns `result !== false`; with the use case now returning `false` this is correct as is.
- `useDeletePageConfirmationDialog` (`.../PageList/hooks/useDeletePageConfirmationDialog.tsx`, used by the table row action `Table/Actions/Delete.tsx`): shows "{title} was moved to trash!" after `await deletePage(...)` without looking at the result, so a dismissed warning would announce a trash that did not happen. Fix: return without the snackbar when the result is `false`. It has no test today: a hook test with mocked `@webiny/app-admin` hooks is added (needs `@testing-library/react` as a devDependency of `app-website-builder`).
- `useRevision.deleteRevision` (`.../PageEditor/Revisions/useRevision.tsx`): fires `deletePageRevision(...)` without awaiting or reading the result and has **no first confirmation dialog** (the revision list item calls it directly), so for a revision delete the warning is the only dialog; a dismissed warning resolves `false` and nothing happens, a refusal that is not the workflow one remains an unhandled rejection as today. Unchanged.
- `BulkDeletePresenter.deleteItem` (`.../bulkActions/BulkDeletePresenter.ts`): reports `report.success` whatever the use case returned. In a bulk run the guard's collect mode records the refusal and resolves `false` (Task 33, R228, R211-safe: no rethrow), so `deleteItem` must report `false` as a failure: `if (deleted === false) report.error(...)`, no try/catch, so a thrown (non-workflow) error still rejects `execute` exactly as today.
- Results-dialog timing, verified in `packages/app-website-builder/src/presentation/pages/PageList/components/BulkActions/BulkActionDelete.tsx`: `await bulkDelete.execute(selectedItems)`, then `deselectAll()`, then `showResultsDialog(...)`, so no failure summary shows before the warning. The bulk confirmation is a generic `showConfirmationDialog` dialog, so the warning (named) stacks over it. The retry's report replaces the first pass's (accepted); the first-pass count above is what keeps the first pass visible.
- A72 (WB, from Task 32): there is no WB background-task path; the bulk delete is per page, so the collect flow covers all of it.

**Step 0: verify before Step 1.**
- Confirm the trash-bin evidence: read `packages/api-website-builder-workflows/src/features/target/WbPageTargetReader/WbPageTargetReader.ts` (`GetRevisionByIdUseCase` with its NotDeleted decorator, so a trashed page reads as missing) and `git grep -n "BlockPageTrashWhileInReview\|BlockPageDeleteWhileInReview" packages/api-website-builder-workflows/src` (the trash and delete blocks). Record both in the commit body of the feat commit.
- `git grep -n "useDeletePage\b\|\.deletePage(" packages/app-website-builder/src packages/app-website-builder-workflows/src` lists every caller of the use case; the expected callers are the two above plus `Delete.tsx` through the hook. Any other caller that ignores a `false` result is fixed in this task.

- Q28: confirm that the WB bulk flow states no count after the first pass (read `BulkActionDelete.tsx` and `DialogMessage.tsx`), so the guard's toast of Task 33 is the only first-pass summary; no WB-local count is built.

**Files:**
- Create: `packages/app-website-builder-workflows/src/features/trash/feature.ts`
- Create: `packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.ts`
- Create: `packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.ts`
- Create: `packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts`
- Create: `packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts`
- Create: `packages/app-website-builder-workflows/src/features/trash/feature.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.tsx`
- Modify: `packages/app-website-builder/src/features/pages/deletePage/abstractions.ts`
- Modify: `packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCase.ts`
- Modify: `packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCaseWithLoading.ts`
- Modify: `packages/app-website-builder/src/features/pages/deletePageRevision/abstractions.ts`
- Modify: `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCase.ts`
- Modify: `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCaseWithLoading.ts`
- Modify: `packages/app-website-builder/src/presentation/pages/PageList/hooks/useDeletePageConfirmationDialog.tsx`
- Modify: `packages/app-website-builder/src/presentation/pages/bulkActions/BulkDeletePresenter.ts`
- Modify: `packages/app-website-builder/package.json` (devDependency `@testing-library/react`)
- Create: `packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCaseWithLoading.test.ts`
- Create: `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCaseWithLoading.test.ts`
- Create: `packages/app-website-builder/src/presentation/pages/PageList/hooks/useDeletePageConfirmationDialog.test.tsx`
- Create: `packages/app-website-builder/src/presentation/pages/bulkActions/BulkDeletePresenter.test.ts`

**Interfaces:**
- Consumes:
  - Task 33: `ActiveReviewGuard` token (`@webiny/app-workflows/review/trash/ActiveReviewGuard.js`), implementations for the integration tests (`.../ActiveReviewGuard.js`, `.../ActiveReviewBlockCollector.js`). Task 34: `ActiveReviewTrashFeature`. Build `@webiny/app-workflows` before Step 1 (`yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30`).
  - Task 12: `WbReviewUseCases` (`~/features/gateway/WbReviewUseCases.js`, one token per file, `IReviewUseCases` including `cancelForDelete`), `WbReviewFeature` registered in `WebsiteBuilderWorkflows`.
  - Task 32: the typed error from the base WB gateways. Task 3 (`deletePageRevision`), Task 4 (the server block), Task 5 (`revisionId` on cancel-for-delete): the decorator is only live with them.
  - Existing: `DeletePageUseCase` and `DeletePageParams` (`@webiny/app-website-builder/features/pages/deletePage/abstractions.js`), `DeletePageRevisionUseCase` and `DeletePageRevisionParams` (`.../deletePageRevision/abstractions.js`), `BulkDeletePresenter` (`@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js`; token `"WB/BulkDeletePresenter"`, `execute(items: Page[])`), `Page` (`@webiny/app-website-builder/domain/Page/Page.js`; `Page.create`, `entryId`), `WbPageLoadingRepository` (`~/features/pages/shared/abstractions.js`, `ILoadingRepository.runCallBack`), `loadingActions` (`~/constants.js`), `Confirmation`, `Notifications` (`@webiny/app-admin/features/notifications/abstractions.js`, registered as a fake in the three real-guard tests because the guard depends on `[Confirmation, ActiveReviewBlockCollector, Notifications]`), `REVIEW_TOAST_POSITION` and `REVIEW_TOAST_DURATION` (`@webiny/app-workflows/review/toasts/constants.js`, Task 10), `RegisterFeature`, `useFeatureFlags`, `createFeature`, `GraphQLOperationError`, `ReviewErrorCode`, `CancelForDeleteParams`, `Review` (as in Task 35).
- Produces (no later consumer):
  - `WbReviewTrashFeature`, `DeletePageUseCaseReviewDecorator`, `DeletePageRevisionUseCaseReviewDecorator`, `BulkDeletePresenterReviewDecorator`.
  - Base fixes: `IDeletePageUseCase` and `IDeletePageRevisionUseCase` `execute(...): Promise<boolean>`; the loading decorators propagate the result; `useDeletePageConfirmationDialog` honours `false`; `BulkDeletePresenter.deleteItem` reports failures.

- [ ] **Step 1: Write the failing tests**

Admin packages run `yarn test <path>` only (the storage legs are for the API packages of 8a.1). `packages/app-website-builder-workflows` has its vitest setup from Task 12 (jsdom) and the DOM setup and SVG alias from Task 22 (`feature.test.tsx` imports modules that load `@webiny/icons/*.svg`); `packages/app-website-builder` runs vitest in jsdom already.

Create `packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { DeletePageUseCaseReviewDecorator } from "./DeletePageUseCaseReviewDecorator.js";

function createRefusal() {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "wb.page",
            action: "trash",
            reviews: [
                {
                    reviewId: "review-1",
                    model: "wb.page",
                    targetId: "page-1",
                    targetRevisionId: "page-1#0002",
                    title: "Home page",
                    stepPosition: 1,
                    stepCount: 2,
                    stepName: "Editor"
                }
            ]
        }
    });
}

function setup(decision: "confirm" | "dismiss" = "confirm") {
    const confirm = vi.fn(
        async (_name: string, _params: unknown, execute?: (data: unknown) => Promise<unknown>) => {
            if (decision === "dismiss") {
                return false;
            }
            return execute ? execute(undefined) : undefined;
        }
    );
    const decoratee = { execute: vi.fn() };
    const useCases = {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => [])
    };

    const container = new Container();
    container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn()
    } as unknown as Notifications.Interface);
    container.register(ActiveReviewBlockCollector).inSingletonScope();
    container.register(ActiveReviewGuard).inSingletonScope();
    container.registerInstance(WbReviewUseCases, useCases as unknown as WbReviewUseCases.Interface);
    container.registerInstance(DeletePageUseCase, decoratee);
    container.registerDecorator(DeletePageUseCaseReviewDecorator);

    return { confirm, decoratee, useCases, useCase: container.resolve(DeletePageUseCase) };
}

describe("DeletePageUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the trash succeeds", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ id: "page-1#0002", permanently: false });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({ id: "page-1#0002", permanently: false });
        expect(confirm).not.toHaveBeenCalled();
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("on the server refusal warns, cancels every revision of the page once and repeats the trash", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockResolvedValueOnce(true);

        const result = await useCase.execute({ id: "page-1#0002", permanently: false });

        expect(result).toBe(true);
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed, with nothing cancelled or repeated", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ id: "page-1#0002", permanently: false });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });

    it("rethrows any other error unchanged", async () => {
        const { confirm, decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase.execute({ id: "page-1#0002", permanently: false }).catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("propagates a second refusal after the repeat", async () => {
        const { confirm, decoratee, useCase } = setup();
        const second = createRefusal();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockRejectedValueOnce(second);

        const error = await useCase.execute({ id: "page-1#0002", permanently: false }).catch(e => e);

        expect(error).toBe(second);
        expect(confirm).toHaveBeenCalledTimes(1);
    });

    it("is not applied when the decorator is not registered (flag off)", async () => {
        const decoratee = { execute: vi.fn() };
        const refusal = createRefusal();
        decoratee.execute.mockRejectedValue(refusal);
        const container = new Container();
        container.registerInstance(DeletePageUseCase, decoratee);

        const error = await container
            .resolve(DeletePageUseCase)
            .execute({ id: "page-1#0002", permanently: false })
            .catch(e => e);

        expect(error).toBe(refusal);
    });
});
```

Create `packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeletePageRevisionUseCase } from "@webiny/app-website-builder/features/pages/deletePageRevision/abstractions.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { DeletePageRevisionUseCaseReviewDecorator } from "./DeletePageRevisionUseCaseReviewDecorator.js";

function createRefusal() {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "wb.page",
            action: "delete",
            reviews: [
                {
                    reviewId: "review-2",
                    model: "wb.page",
                    targetId: "page-1",
                    targetRevisionId: "page-1#0002",
                    title: "Home page",
                    stepPosition: 2,
                    stepCount: 2,
                    stepName: "Legal"
                }
            ]
        }
    });
}

function setup(decision: "confirm" | "dismiss" = "confirm") {
    const confirm = vi.fn(
        async (_name: string, _params: unknown, execute?: (data: unknown) => Promise<unknown>) => {
            if (decision === "dismiss") {
                return false;
            }
            return execute ? execute(undefined) : undefined;
        }
    );
    const decoratee = { execute: vi.fn() };
    const useCases = {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => [])
    };

    const container = new Container();
    container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn()
    } as unknown as Notifications.Interface);
    container.register(ActiveReviewBlockCollector).inSingletonScope();
    container.register(ActiveReviewGuard).inSingletonScope();
    container.registerInstance(WbReviewUseCases, useCases as unknown as WbReviewUseCases.Interface);
    container.registerInstance(DeletePageRevisionUseCase, decoratee);
    container.registerDecorator(DeletePageRevisionUseCaseReviewDecorator);

    return {
        confirm,
        decoratee,
        useCases,
        useCase: container.resolve(DeletePageRevisionUseCase)
    };
}

describe("DeletePageRevisionUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the delete succeeds", async () => {
        const { confirm, decoratee, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ id: "page-1#0002", permanently: true });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({ id: "page-1#0002", permanently: true });
        expect(confirm).not.toHaveBeenCalled();
    });

    it("on the server refusal cancels only that revision's reviews, then repeats the delete (R235)", async () => {
        const { decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockResolvedValueOnce(true);

        const result = await useCase.execute({ id: "page-1#0002", permanently: true });

        expect(result).toBe(true);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "wb.page",
            targetId: "page-1",
            targetRevisionId: "page-1#0002",
            action: "delete"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ id: "page-1#0002", permanently: true });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("rethrows any other error unchanged", async () => {
        const { decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase.execute({ id: "page-1#0002", permanently: true }).catch(e => e);

        expect(error).toBe(failure);
    });
});
```

Create `packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { REVIEW_TOAST_DURATION } from "@webiny/app-workflows/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "@webiny/app-workflows/review/toasts/constants.js";
import { ActiveReviewGuard as GuardAbstraction } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { DeletePageUseCaseReviewDecorator } from "./DeletePageUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

function page(entryId: string): Page {
    return Page.create({
        id: `${entryId}#0001`,
        entryId,
        properties: { title: `Title ${entryId}` }
    });
}

function createRefusal(entryId: string) {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "wb.page",
            action: "trash",
            reviews: [
                {
                    reviewId: `review-${entryId}`,
                    model: "wb.page",
                    targetId: entryId,
                    targetRevisionId: `${entryId}#0001`,
                    title: `Title ${entryId}`,
                    stepPosition: 1,
                    stepCount: 2,
                    stepName: "Editor"
                }
            ]
        }
    });
}

function createUseCases() {
    return {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => [])
    };
}

describe("BulkDeletePresenterReviewDecorator (forwarding)", () => {
    function setupForwarding() {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: Page[]) => undefined)
        };
        const useCases = createUseCases();
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(async <TItem>(params: GuardAbstraction.BulkParams<TItem>) => {
                await params.run(params.items, false);
                await params.run(params.items, true);
            })
        };

        const container = new Container();
        container.registerInstance(GuardAbstraction, guard as unknown as GuardAbstraction.Interface);
        container.registerInstance(WbReviewUseCases, useCases as unknown as WbReviewUseCases.Interface);
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            decoratee,
            guard,
            useCases,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    it("hands the items, the page id, the use cases and a run callback to the guard", async () => {
        const { guard, useCases, presenter } = setupForwarding();
        const items = [page("p1"), page("p2")];

        await presenter.execute(items);

        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        const params = guard.runBulk.mock.calls[0][0];
        expect(params.items).toBe(items);
        expect(params.useCases).toBe(useCases);
        expect(params.getTargetId(items[0])).toBe("p1");
    });

    it("runs the decoratee with the batch only, for the first run and the retry", async () => {
        const { decoratee, presenter } = setupForwarding();
        const items = [page("p1")];

        await presenter.execute(items);

        expect(decoratee.execute).toHaveBeenCalledTimes(2);
        expect(decoratee.execute).toHaveBeenNthCalledWith(1, items);
        expect(decoratee.execute).toHaveBeenNthCalledWith(2, items);
    });

    it("delegates the view model to the decoratee", () => {
        const { decoratee, presenter } = setupForwarding();

        expect(presenter.vm).toBe(decoratee.vm);
    });
});

describe("BulkDeletePresenterReviewDecorator (with the real guard and the per-page decorator)", () => {
    function setupIntegrated(decision: "confirm" | "deferred") {
        let release: () => void = () => undefined;
        const gate = new Promise<void>(resolve => {
            release = resolve;
        });
        const confirm = vi.fn(
            async (_name: string, _params: unknown, execute?: (data: unknown) => Promise<unknown>) => {
                if (decision === "deferred") {
                    await gate;
                }
                return execute ? execute(undefined) : undefined;
            }
        );
        const blocked = new Set(["p1", "p3"]);
        const deleted: string[] = [];
        const failed: string[] = [];
        const deletePage = {
            execute: vi.fn(async (params: { id: string; permanently: boolean }) => {
                const entryId = params.id.split("#")[0];
                if (blocked.has(entryId)) {
                    throw createRefusal(entryId);
                }
                deleted.push(entryId);
                return true;
            })
        };
        const useCases = createUseCases();
        useCases.cancelForDelete.mockImplementation(async params => {
            blocked.delete(params.targetId);
            return [];
        });

        const container = new Container();
        container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
        // The real guard reports the first-pass count through Notifications (Task 33).
        const notifications = { notify: vi.fn(), success: vi.fn(), warning: vi.fn() };
        container.registerInstance(Notifications, notifications as unknown as Notifications.Interface);
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        container.registerInstance(WbReviewUseCases, useCases as unknown as WbReviewUseCases.Interface);
        container.registerInstance(DeletePageUseCase, deletePage);
        container.registerDecorator(DeletePageUseCaseReviewDecorator);

        // Stands in for the base presenter: a per-page series that calls the decorated use case.
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (items: Page[]) => {
                const useCase = container.resolve(DeletePageUseCase);
                for (const item of items) {
                    // Like the base presenter: a false result is "not deleted", reported as failed.
                    const result = await useCase.execute({ id: item.id, permanently: false });
                    if (result === false) {
                        failed.push(item.entryId);
                    }
                }
            })
        };
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            release,
            deleted,
            failed,
            decoratee,
            useCases,
            notifications,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [page("p1"), page("p2"), page("p3")];

    it("collects every refused page, warns once and retries only the blocked pages", async () => {
        const { confirm, deleted, failed, decoratee, useCases, notifications, presenter } =
            setupIntegrated("confirm");

        await presenter.execute(items);

        // First pass: p2 was done, p1 and p3 were refused (Q28, Task 33).
        expect(notifications.warning).toHaveBeenCalledTimes(1);
        expect(notifications.warning).toHaveBeenCalledWith(
            expect.objectContaining({
                title: "1 of 3 items done. 2 still need your confirmation.",
                position: REVIEW_TOAST_POSITION,
                duration: REVIEW_TOAST_DURATION,
                dismissible: true
            })
        );

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as GuardAbstraction.DialogParams;
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-p1",
            "review-p3"
        ]);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "wb.page",
            targetId: "p1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
        expect(decoratee.execute.mock.calls[1][0].map(item => item.entryId)).toEqual(["p1", "p3"]);
        expect(failed).toEqual(["p1", "p3"]);
        expect(deleted).toEqual(["p2", "p1", "p3"]);
    });

    it("resolves execute only after the warning flow has ended (R228)", async () => {
        const { confirm, release, presenter } = setupIntegrated("deferred");
        const settled = vi.fn();

        const promise = presenter.execute(items).then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;
        expect(settled).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-website-builder-workflows/src/features/trash/feature.test.tsx`:

```tsx
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { DeletePageRevisionUseCase } from "@webiny/app-website-builder/features/pages/deletePageRevision/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WebsiteBuilderWorkflows } from "~/index.js";
import { WbReviewTrashFeature } from "./feature.js";

const flags = vi.hoisted(() => ({ enabled: true }));

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return {
        ...actual,
        useFeatureFlags: () => ({ isEnabled: () => flags.enabled })
    };
});

function findElements(
    node: React.ReactNode,
    predicate: (element: React.ReactElement) => boolean
): React.ReactElement[] {
    const found: React.ReactElement[] = [];
    React.Children.forEach(node, child => {
        if (!React.isValidElement(child)) {
            return;
        }
        if (predicate(child)) {
            found.push(child);
        }
        const props = child.props as { children?: React.ReactNode };
        found.push(...findElements(props.children, predicate));
    });
    return found;
}

describe("WebsiteBuilderWorkflows (composition root)", () => {
    beforeEach(() => {
        flags.enabled = true;
    });

    it("mounts the trash feature when the flag is on", () => {
        const tree = WebsiteBuilderWorkflows();

        const features = findElements(tree, element => {
            const props = element.props as { feature?: unknown };
            return props.feature === WbReviewTrashFeature;
        });
        expect(features).toHaveLength(1);
    });

    it("mounts nothing when the flag is off", () => {
        flags.enabled = false;

        expect(WebsiteBuilderWorkflows()).toBeNull();
    });
});

describe("WbReviewTrashFeature", () => {
    function setup() {
        const guard = {
            run: vi.fn(async <TResult,>(params: ActiveReviewGuard.Params<TResult>) => params.action()),
            runBulk: vi.fn(async <TItem,>(params: ActiveReviewGuard.BulkParams<TItem>) =>
                params.run(params.items, false)
            )
        };
        const useCases = { cancelForDelete: vi.fn() };
        const container = new Container();
        container.registerInstance(ActiveReviewGuard, guard as unknown as ActiveReviewGuard.Interface);
        container.registerInstance(WbReviewUseCases, useCases as unknown as WbReviewUseCases.Interface);
        container.registerInstance(DeletePageUseCase, { execute: vi.fn(async () => true) });
        container.registerInstance(DeletePageRevisionUseCase, { execute: vi.fn(async () => true) });
        container.registerInstance(BulkDeletePresenter, {
            vm: { processing: false, results: [] },
            execute: vi.fn(async () => undefined)
        });
        WbReviewTrashFeature.register(container);
        return { container, guard, useCases };
    }

    it("decorates the two delete use cases and the bulk presenter", async () => {
        const { container, guard, useCases } = setup();

        await container.resolve(DeletePageUseCase).execute({ id: "page-1#0001", permanently: false });
        await container
            .resolve(DeletePageRevisionUseCase)
            .execute({ id: "page-1#0002", permanently: true });
        await container
            .resolve(BulkDeletePresenter)
            .execute([Page.create({ id: "p1#0001", entryId: "p1" })]);

        expect(guard.run).toHaveBeenCalledTimes(2);
        expect(guard.run.mock.calls.map(call => call[0].revisionId)).toEqual([null, "page-1#0002"]);
        expect(guard.run.mock.calls.every(call => call[0].useCases === useCases)).toBe(true);
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCaseWithLoading.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { loadingActions } from "~/constants.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { DeletePageRepository } from "./abstractions.js";
import { DeletePageUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeletePageUseCase } from "./DeletePageUseCase.js";
import { DeletePageUseCaseWithLoading } from "./DeletePageUseCaseWithLoading.js";

describe("DeletePageUseCase result", () => {
    it("resolves true after the repository deleted the page", async () => {
        const repository = { execute: vi.fn(async () => undefined) };
        const container = new Container();
        container.registerInstance(DeletePageRepository, repository);
        container.register(DeletePageUseCase);

        const result = await container
            .resolve(UseCaseAbstraction)
            .execute({ id: "page-1#0001", permanently: false });

        expect(result).toBe(true);
        expect(repository.execute).toHaveBeenCalledTimes(1);
    });
});

describe("DeletePageUseCaseWithLoading", () => {
    function setup(decorateeResult: boolean) {
        const decoratee = { execute: vi.fn(async () => decorateeResult) };
        const loading = {
            runCallBack: vi.fn((promise: Promise<unknown>, _action: string) => promise)
        };
        const container = new Container();
        container.registerInstance(WbPageLoadingRepository, loading as never);
        container.registerInstance(UseCaseAbstraction, decoratee);
        container.registerDecorator(DeletePageUseCaseWithLoading);

        return { decoratee, loading, useCase: container.resolve(UseCaseAbstraction) };
    }

    it("runs the delete under the delete loading action and returns true", async () => {
        const { decoratee, loading, useCase } = setup(true);

        const result = await useCase.execute({ id: "page-1#0001", permanently: false });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({ id: "page-1#0001", permanently: false });
        expect(loading.runCallBack).toHaveBeenCalledTimes(1);
        expect(loading.runCallBack.mock.calls[0][1]).toBe(loadingActions.delete);
    });

    it("passes a false result of the decoratee through (the warning was dismissed)", async () => {
        const { useCase } = setup(false);

        const result = await useCase.execute({ id: "page-1#0001", permanently: false });

        expect(result).toBe(false);
    });
});
```

Create `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCaseWithLoading.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { loadingActions } from "~/constants.js";
import { WbPageLoadingRepository } from "~/features/pages/shared/abstractions.js";
import { DeletePageRevisionRepository } from "./abstractions.js";
import { DeletePageRevisionUseCase as UseCaseAbstraction } from "./abstractions.js";
import { DeletePageRevisionUseCase } from "./DeletePageRevisionUseCase.js";
import { DeletePageRevisionUseCaseWithLoading } from "./DeletePageRevisionUseCaseWithLoading.js";

describe("DeletePageRevisionUseCase result", () => {
    it("resolves true after the repository deleted the revision", async () => {
        const repository = { execute: vi.fn(async () => undefined) };
        const container = new Container();
        container.registerInstance(DeletePageRevisionRepository, repository);
        container.register(DeletePageRevisionUseCase);

        const result = await container
            .resolve(UseCaseAbstraction)
            .execute({ id: "page-1#0002", permanently: true });

        expect(result).toBe(true);
        expect(repository.execute).toHaveBeenCalledTimes(1);
    });
});

describe("DeletePageRevisionUseCaseWithLoading", () => {
    function setup(decorateeResult: boolean) {
        const decoratee = { execute: vi.fn(async () => decorateeResult) };
        const loading = {
            runCallBack: vi.fn((promise: Promise<unknown>, _action: string) => promise)
        };
        const container = new Container();
        container.registerInstance(WbPageLoadingRepository, loading as never);
        container.registerInstance(UseCaseAbstraction, decoratee);
        container.registerDecorator(DeletePageRevisionUseCaseWithLoading);

        return { decoratee, loading, useCase: container.resolve(UseCaseAbstraction) };
    }

    it("runs the delete under the delete loading action and returns true", async () => {
        const { loading, useCase } = setup(true);

        const result = await useCase.execute({ id: "page-1#0002", permanently: true });

        expect(result).toBe(true);
        expect(loading.runCallBack.mock.calls[0][1]).toBe(loadingActions.delete);
    });

    it("passes a false result of the decoratee through (the warning was dismissed)", async () => {
        const { useCase } = setup(false);

        const result = await useCase.execute({ id: "page-1#0002", permanently: true });

        expect(result).toBe(false);
    });
});
```

Create `packages/app-website-builder/src/presentation/pages/PageList/hooks/useDeletePageConfirmationDialog.test.tsx` (all imports at the top; `vi.mock` and `vi.hoisted` are hoisted above them by vitest, so the mocks still apply to the hook import):

```tsx
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { PageDto } from "~/domain/Page/index.js";
import { useDeletePageConfirmationDialog } from "./useDeletePageConfirmationDialog.js";

const mocks = vi.hoisted(() => ({
    deletePage: vi.fn(),
    showSnackbar: vi.fn()
}));

vi.mock("~/features/pages/index.js", () => ({
    useDeletePage: () => ({ deletePage: mocks.deletePage })
}));

vi.mock("@webiny/app-admin", () => ({
    useConfirmationDialog: () => ({
        showConfirmation: (callback: () => Promise<void>) => callback()
    }),
    useSnackbar: () => ({ showSnackbar: mocks.showSnackbar })
}));

const PAGE = { id: "page-1#0001", properties: { title: "Home page" } } as unknown as PageDto;

describe("useDeletePageConfirmationDialog", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("announces the trash when the page was moved to trash", async () => {
        mocks.deletePage.mockResolvedValue(true);
        const { result } = renderHook(() => useDeletePageConfirmationDialog({ page: PAGE }));

        await result.current.openDeletePageConfirmationDialog();

        expect(mocks.deletePage).toHaveBeenCalledWith({ id: "page-1#0001", permanently: false });
        expect(mocks.showSnackbar).toHaveBeenCalledWith("Home page was moved to trash!");
    });

    it("announces nothing when the trash was not carried out (warning dismissed)", async () => {
        mocks.deletePage.mockResolvedValue(false);
        const { result } = renderHook(() => useDeletePageConfirmationDialog({ page: PAGE }));

        await result.current.openDeletePageConfirmationDialog();

        expect(mocks.showSnackbar).not.toHaveBeenCalled();
    });

    it("shows the error message when the trash throws", async () => {
        mocks.deletePage.mockRejectedValue(new Error("Network down"));
        const { result } = renderHook(() => useDeletePageConfirmationDialog({ page: PAGE }));

        await result.current.openDeletePageConfirmationDialog();

        expect(mocks.showSnackbar).toHaveBeenCalledWith("Network down");
    });
});
```

Create `packages/app-website-builder/src/presentation/pages/bulkActions/BulkDeletePresenter.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Page } from "~/domain/Page/Page.js";
import { DeletePageUseCase } from "~/features/pages/deletePage/abstractions.js";
import { BulkDeletePresenter as Abstraction } from "./abstractions.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";

function page(entryId: string): Page {
    return Page.create({
        id: `${entryId}#0001`,
        entryId,
        properties: { title: `Title ${entryId}` }
    });
}

function setup(results: Record<string, Error | boolean> = {}) {
    const container = new Container();
    const deletePage = {
        execute: vi.fn(async (params: { id: string }) => {
            const outcome = results[params.id.split("#")[0]] ?? true;
            if (outcome instanceof Error) {
                throw outcome;
            }
            return outcome;
        })
    };
    container.registerInstance(DeletePageUseCase, deletePage);
    container.register(BulkDeletePresenter);

    return { deletePage, presenter: container.resolve(Abstraction) };
}

describe("BulkDeletePresenter", () => {
    it("deletes every page and reports each as a success", async () => {
        const { deletePage, presenter } = setup();

        await presenter.execute([page("p1"), page("p2")]);

        expect(deletePage.execute).toHaveBeenCalledTimes(2);
        expect(deletePage.execute).toHaveBeenCalledWith({ id: "p1#0001", permanently: false });
        expect(presenter.vm.results.map(result => result.status)).toEqual(["success", "success"]);
    });

    it("reports a page whose delete returned false as a failure and continues with the rest", async () => {
        const { deletePage, presenter } = setup({ p1: false });

        await presenter.execute([page("p1"), page("p2"), page("p3")]);

        expect(deletePage.execute).toHaveBeenCalledTimes(3);
        const byTitle = Object.fromEntries(
            presenter.vm.results.map(result => [result.title, result])
        );
        expect(byTitle["Title p1"].status).toBe("failure");
        expect(byTitle["Title p1"].message).toBe("The page was not deleted.");
        expect(byTitle["Title p2"].status).toBe("success");
        expect(byTitle["Title p3"].status).toBe("success");
    });

    it("leaves non-workflow error behaviour unchanged: a thrown error still rejects execute", async () => {
        const failure = new Error("Network down");
        const { presenter } = setup({ p1: failure });

        const error = await presenter.execute([page("p1")]).catch(e => e);

        expect(error).toBe(failure);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCaseWithLoading.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCaseWithLoading.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/presentation/pages/PageList/hooks/useDeletePageConfirmationDialog.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder/src/presentation/pages/bulkActions/BulkDeletePresenter.test.ts 2>&1 | tail -50
```

Expected: FAIL. The four `features/trash` files fail with `Failed to resolve import "./...Decorator.js"` / `"./feature.js"`. The base tests fail on behaviour: both `...WithLoading.test.ts` files (`resolves true after the repository deleted` returns `undefined`, `passes a false result through` returns `undefined`), `useDeletePageConfirmationDialog.test.tsx` ("announces nothing" sees the snackbar, and the file fails to import `@testing-library/react` until Step 3 adds it), `BulkDeletePresenter.test.ts` ("reports a failing page" rejects, "returns false" reports a success). Record the RED output.

- [ ] **Step 3: Implement**

Add the devDependency to `packages/app-website-builder/package.json` (`devDependencies`, keep alphabetical order):

```json
    "@testing-library/react": "^16.3.2",
```

Then `yarn > /dev/null 2>&1` so the lockfile updates.

Create `packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.ts`:

```ts
import { DeletePageUseCase } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import type { DeletePageParams } from "@webiny/app-website-builder/features/pages/deletePage/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";

class DeletePageUseCaseReviewDecoratorImpl implements DeletePageUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: WbReviewUseCases.Interface,
        private decoratee: DeletePageUseCase.Interface
    ) {}

    async execute(params: DeletePageParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: null
        });
    }
}

export const DeletePageUseCaseReviewDecorator = DeletePageUseCase.createDecorator({
    decorator: DeletePageUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, WbReviewUseCases]
});
```

Create `packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.ts`:

```ts
import { DeletePageRevisionUseCase } from "@webiny/app-website-builder/features/pages/deletePageRevision/abstractions.js";
import type { DeletePageRevisionParams } from "@webiny/app-website-builder/features/pages/deletePageRevision/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";

class DeletePageRevisionUseCaseReviewDecoratorImpl implements DeletePageRevisionUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: WbReviewUseCases.Interface,
        private decoratee: DeletePageRevisionUseCase.Interface
    ) {}

    async execute(params: DeletePageRevisionParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: params.id
        });
    }
}

export const DeletePageRevisionUseCaseReviewDecorator = DeletePageRevisionUseCase.createDecorator({
    decorator: DeletePageRevisionUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, WbReviewUseCases]
});
```

Create `packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts`:

```ts
import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { BulkDeletePresenter } from "@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";

class BulkDeletePresenterReviewDecoratorImpl implements BulkDeletePresenter.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: WbReviewUseCases.Interface,
        private decoratee: BulkDeletePresenter.Interface
    ) {}

    get vm() {
        return this.decoratee.vm;
    }

    async execute(items: Page[]): Promise<void> {
        await this.guard.runBulk({
            items,
            getTargetId: row => row.entryId,
            run: batch => this.decoratee.execute(batch),
            useCases: this.useCases
        });
    }
}

export const BulkDeletePresenterReviewDecorator = BulkDeletePresenter.createDecorator({
    decorator: BulkDeletePresenterReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, WbReviewUseCases]
});
```

Create `packages/app-website-builder-workflows/src/features/trash/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { DeletePageUseCaseReviewDecorator } from "./DeletePageUseCaseReviewDecorator.js";
import { DeletePageRevisionUseCaseReviewDecorator } from "./DeletePageRevisionUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

export const WbReviewTrashFeature = createFeature({
    name: "WebsiteBuilderWorkflows/Trash",
    register(container) {
        container.registerDecorator(DeletePageUseCaseReviewDecorator);
        container.registerDecorator(DeletePageRevisionUseCaseReviewDecorator);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);
    }
});
```

Modify `packages/app-website-builder-workflows/src/index.tsx` (Task 12 added `WbReviewFeature` to the gated fragment; the new line goes right after it, A77; verify the anchor and, if Task 12 named it differently, put the line after the last `RegisterFeature` of the shared features):

```tsx
// Before:
import { PageGetWorkflowsFeature } from "~/presentation/page/PageGet/feature.js";

// After:
import { PageGetWorkflowsFeature } from "~/presentation/page/PageGet/feature.js";
import { WbReviewTrashFeature } from "~/features/trash/feature.js";
```

```tsx
// Before:
            <RegisterFeature feature={WbReviewFeature} />

// After:
            <RegisterFeature feature={WbReviewFeature} />
            <RegisterFeature feature={WbReviewTrashFeature} />
```

Modify `packages/app-website-builder/src/features/pages/deletePage/abstractions.ts`:

```ts
// Before:
export interface IDeletePageUseCase {
    execute(params: DeletePageParams): Promise<void>;
}

// After:
export interface IDeletePageUseCase {
    /**
     * Resolves false when the delete was not carried out (a decorator's warning was dismissed).
     */
    execute(params: DeletePageParams): Promise<boolean>;
}
```

Modify `packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCase.ts`:

```ts
// Before:
    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }), params.permanently);
    }

// After:
    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }), params.permanently);
        return true;
    }
```

Modify `packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCaseWithLoading.ts`:

```ts
// Before:
    async execute(params: UseCaseAbstraction.Params) {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.delete
        );
    }

// After:
    async execute(params: UseCaseAbstraction.Params) {
        return this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.delete
        );
    }
```

Modify `packages/app-website-builder/src/features/pages/deletePageRevision/abstractions.ts`:

```ts
// Before:
export interface IDeletePageRevisionUseCase {
    execute(params: DeletePageRevisionParams): Promise<void>;
}

// After:
export interface IDeletePageRevisionUseCase {
    /**
     * Resolves false when the delete was not carried out (a decorator's warning was dismissed).
     */
    execute(params: DeletePageRevisionParams): Promise<boolean>;
}
```

Modify `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCase.ts`:

```ts
// Before:
    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }), params.permanently);
    }

// After:
    async execute(params: UseCaseAbstraction.Params) {
        await this.repository.execute(Page.create({ id: params.id }), params.permanently);
        return true;
    }
```

Modify `packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCaseWithLoading.ts`:

```ts
// Before:
    async execute(params: UseCaseAbstraction.Params) {
        await this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.delete
        );
    }

// After:
    async execute(params: UseCaseAbstraction.Params) {
        return this.loadingRepository.runCallBack(
            this.decoratee.execute(params),
            loadingActions.delete
        );
    }
```

Modify `packages/app-website-builder/src/presentation/pages/PageList/hooks/useDeletePageConfirmationDialog.tsx`:

```tsx
// Before:
                try {
                    await deletePage({
                        id: page.id,
                        permanently: false
                    });
                    showSnackbar(`${page.properties.title} was moved to trash!`);
                } catch (ex) {

// After:
                try {
                    const deleted = await deletePage({
                        id: page.id,
                        permanently: false
                    });
                    if (deleted === false) {
                        return;
                    }

                    showSnackbar(`${page.properties.title} was moved to trash!`);
                } catch (ex) {
```

Modify `packages/app-website-builder/src/presentation/pages/bulkActions/BulkDeletePresenter.ts`:

```ts
// Before:
    private async deleteItem(item: Page, report: Report): Promise<void> {
        await this.deletePageUseCase.execute({ id: item.id, permanently: false });
        report.success({ title: item.properties.title, message: "Page successfully deleted." });
    }

// After:
    private async deleteItem(item: Page, report: Report): Promise<void> {
        const deleted = await this.deletePageUseCase.execute({ id: item.id, permanently: false });

        if (deleted === false) {
            report.error({ title: item.properties.title, message: "The page was not deleted." });
            return;
        }

        report.success({ title: item.properties.title, message: "Page successfully deleted." });
    }
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/deletePage/DeletePageUseCaseWithLoading.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/deletePageRevision/DeletePageRevisionUseCaseWithLoading.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/presentation/pages/PageList/hooks/useDeletePageConfirmationDialog.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder/src/presentation/pages/bulkActions/BulkDeletePresenter.test.ts 2>&1 | tail -50
```

Expected: PASS (8 files). If `feature.test.tsx` cannot import `~/index.js` because a module of the root has an import-time side effect that needs a browser global, add the missing global stub to that test file only and name it in the commit body.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-website-builder/src/features/pages/deletePage/DeletePage.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder/src/features/pages/deletePage/DeletePageGateway.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-website-builder --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Neither package has a `__tests__/**/*.test.ts` file (the tests are co-located), so `check:test:types` does not list them and the package builds are the type check of their tests (R243). Expected: PASS and no type errors. A type error in another consumer of the two widened use-case interfaces is fixed in the same commit: `git grep -n "DeletePageUseCase\|DeletePageRevisionUseCase" packages/*/src` lists them (expected: the features above, `PageListPresenter`, `BulkDeletePresenter`, `useDeletePage`, `useDeletePageRevision`; none depends on a `void` result).

- [ ] **Step 6: Three commits, in this order (R228: base behaviour changes never share a commit with the `feat`)**

Stage only the listed files for each commit, run the chain with that commit's build lines, commit, then continue. If a chain step fails and you fix anything, rerun the chain for that commit from the start.

Chain (before every commit; `<build lines>` per commit; restore `.gitleaks.toml` after format and build):

```bash
git add <the commit's files>
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
git checkout -- .gitleaks.toml
yarn lint:fix
yarn webiny sync-dependencies
<build lines>
git checkout -- .gitleaks.toml
git add <the commit's files>
```

Commit 1 (no behaviour change for callers that ignored the result), files: both `abstractions.ts`, both `...UseCase.ts`, both `...UseCaseWithLoading.ts` and the two `...WithLoading.test.ts` under `packages/app-website-builder/src/features/pages/{deletePage,deletePageRevision}/`. Build lines: `yarn build -p @webiny/app-website-builder --no-cache 2>&1 | tail -30`.

```bash
git commit -m "refactor(app-website-builder): return a boolean from the page delete use cases" -m "The delete page and delete page revision use cases resolve true and their loading decorators pass the result on, so a decorator can report that the delete was not carried out." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

Commit 2, files: `useDeletePageConfirmationDialog.tsx`, `useDeletePageConfirmationDialog.test.tsx`, `BulkDeletePresenter.ts`, `BulkDeletePresenter.test.ts`, `packages/app-website-builder/package.json` and `yarn.lock`. Build lines: the same single build.

```bash
git commit -m "fix(app-website-builder): treat a false delete result as not done" -m "The table delete action no longer announces a trash that did not happen and the bulk delete reports a page whose delete returned false as a failure." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

Commit 3, files: everything under `packages/app-website-builder-workflows/src/features/trash/` and `packages/app-website-builder-workflows/src/index.tsx`. Build lines: `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30` then `yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30`. `yarn adio` may list `@webiny/di` and `vitest` for `app-website-builder-workflows` (Task 12 added them). The commit body records the Step 0 trash-bin evidence.

```bash
git commit -m "feat(app-website-builder-workflows): guard the page trash and delete with the review warning" -m "Three decorators forward the page trash, revision delete and bulk delete to the shared guard. The trash-bin delete is not decorated: trashed pages are unreadable to the workflows server and the trash is refused while a review is in progress, so that path cannot hold an active review." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

**Contract notes:**
- The WB revision delete has no first confirmation dialog in the admin (`useRevision.deleteRevision`), so D157's "normal dialog first" order does not exist there and the warning is the only dialog. Not changed (out of scope); Task 38 records it.
- The WB revision delete does not update the revision list cache after a successful delete (existing behaviour of `DeletePageRevisionRepository`); not touched.
- For Task 38: a bulk retry's results dialog shows only the retried items (accepted); the first-pass count toast (Q28 copy) is shown by `ActiveReviewGuard.runBulk` (Task 33), the WB bulk decorator only forwards.
- verify: `WbReviewUseCases` file and export (Task 12), the `WbReviewFeature` anchor line in `index.tsx`, and that `@webiny/app-website-builder` exposes the deep imports used here (`./*` export; the existing `app-website-builder-workflows` sources already import `@webiny/app-website-builder/presentation/...`).
