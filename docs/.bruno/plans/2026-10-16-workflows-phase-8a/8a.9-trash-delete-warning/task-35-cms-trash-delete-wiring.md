### Task 35: CMS trash and delete decorators (`app-headless-cms-workflows`)

R202, R204, R205, R228, R211, D157, A71, A82; Review Focus 8, 10, 17. The CMS half of the warning flow: four decorators that only forward to the shared `ActiveReviewGuard` (Task 33), registered by a feature that `CmsWorkflows` mounts inside the flag gate. Plus the small base fixes the A82 caller review found. Review Focus 17: the decorators hold no logic, the guard holds all of it.

- **`DeleteEntryUseCaseReviewDecorator`** (`DeleteEntryUseCase.createDecorator`, dependencies `[ActiveReviewGuard, CmsReviewUseCases]`): `execute(params)` -> `guard.run({ action: () => decoratee.execute(params), useCases, revisionId: null })`. The trash covers every revision.
- **`DeleteEntryRevisionUseCaseReviewDecorator`**: `revisionId: params.revisionId`, so the confirm cancels only that revision's reviews (the CMS `cancelCmsEntryReviewsForDelete(revisionId)` of Task 11).
- **`PermanentlyDeleteEntryUseCaseReviewDecorator`**: `revisionId: null`. This also covers the trash-bin delete: `CmsTrashBinDeleteGatewayAdapter` (`packages/app-headless-cms/src/features/contentEntry/trashBin/CmsTrashBinGatewayAdapter.ts`) calls `PermanentlyDeleteEntryUseCase`, so the trash-bin hook point for the CMS is this use case and needs no separate file (A71: the trash-bin dialog is `useConfirmationDialog` in `@webiny/app-admin`, not a named dialog; the warning is a named dialog and simply opens over it).
- **`BulkDeletePresenterReviewDecorator`** (`BulkDeletePresenter.createDecorator`): `execute(items, allSelected)` -> `guard.runBulk({ items, getTargetId: item => item.entryId, run: (batch, isRetry) => decoratee.execute(batch, isRetry ? false : allSelected), useCases })`; `vm` delegates to the decoratee. The retry always runs per item (`false`), because the refused items must be deleted one by one after their reviews are cancelled. The first-pass count toast (Q28 copy) is owned by `ActiveReviewGuard.runBulk` (Task 33); this decorator only forwards.
- **Feature** `CmsReviewTrashFeature` (name `CmsWorkflows/Trash`) registers the four decorators with `container.registerDecorator`. Decorators registered on the root container apply to every container that resolves these tokens, including the scoped child containers the CMS list and editor create (`node_modules/@webiny/di/dist/index.js` `collectDecorators`: parent decorators first, so they sit closest to the use case). `CmsWorkflows` mounts it with `<RegisterFeature feature={CmsReviewTrashFeature} />` inside the gate, after the shared features (A77); with the flag off nothing is registered and every use case stays undecorated.

**A82, the callers re-verified.** Each decorated use case returns `false` when the warning is dismissed (the guard's contract). Three base callers did not treat `false` as "not done", one never ran at all, and one bulk presenter aborts on the first failing item; all are fixed here, each with a test:
- `ContentEntriesPresenter.deleteEntry` (`.../list/ContentEntriesPresenter.ts`): `confirm(TRASH_ENTRY_DIALOG, ..., execute)` resolves the execute result and the method returns `result !== false`. Correct as is (existing precedent test stays green).
- `ContentEntryFormPresenter.deleteEntry` (`.../form/ContentEntryFormPresenter.ts`): clears `entry` and `form` after `await this.deleteEntryUseCase.execute(...)` without looking at the result, so a dismissed warning would blank the editor of an entry that was not trashed. Fix: return `false` when the use case returned `false`.
- `RevisionsListPresenter.deleteRevision` (`.../revisionsList/RevisionsListPresenter.ts`): returns `true` after the use case regardless of its result. Fix: `deleted !== false`. It also guards the confirmation with `if (!confirmed) return false`, but `Confirmation.confirm(name, params)` without `execute` resolves whatever `onConfirm(data)` was called with, and `DeleteRevisionConfirmDialog` calls `onConfirm()` with nothing, so `confirmed` is `undefined` on a real confirm and the delete never runs (verify in Step 0 below). Fix: `if (confirmed === false) return false` (cancel resolves `false`).
- `DeleteItems.tsx` (`packages/app-admin/src/presentation/trashBin/components/BulkActions/DeleteItems.tsx:50`, the trash bin "Delete" bulk action): reports "Item successfully deleted." after `await actions.deleteItem(item.id)` whatever it returned. Fix: `false` is reported as a failure ("The item was not deleted."); its existing per-item catch stays.
- `TrashBinPresenter.deleteItem` (`packages/app-admin/src/presentation/trashBin/TrashBinPresenter.ts`, shared by the CMS and WB trash bins): removes the row and `useDeleteTrashBinItem` toasts success even when the gateway returned `false`. Fix: `deleteItem` returns `Promise<boolean>` (false when the gateway returned false, row kept), `useDeleteTrashBinItem` shows the success toast only for a true result. Defensive: a trashed item cannot have an active review (trashing cancels it first), so this path only matters if the server refuses anyway.
- `BulkDeletePresenter.deleteItem` (`.../bulkActions/BulkDeletePresenter.ts`): reports `report.success` after the use case regardless of its result. In a bulk run the guard's collect mode records the refusal and resolves `false` (Task 33, controller ruling, R211-safe: no rethrow), so `deleteItem` must report `false` as a failure: `if (deleted === false) report.error(...)`, no try/catch, so a thrown (non-workflow) error still rejects `execute` exactly as today. The series continues for the remaining items, so every blocked item is collected.
- Results-dialog timing, verified in `packages/app-headless-cms/src/admin/components/ContentEntries/BulkActions/ActionDelete.tsx`: `await bulkDelete.execute(selectedItems, selection.allSelected)` then `deselectAll()`, then `showResultsDialog(...)` (or the background toast when `allSelected`). So `execute` resolving only after the warning means no failure summary shows before it. The bulk confirmation uses `useBulkActionDialog().showConfirmationDialog` (the generic `showDialog` list of `DialogsProvider`), so the warning, a named dialog, stacks over that busy dialog instead of replacing it.
- The "all selected" path (`onBulk`): see Task 31 A72; unchanged, no pre-warning, documented in Task 38.

**Step 0: verify before Step 1.** Run `git grep -n "onConfirm()" -- packages/app-headless-cms/src/admin/components/Dialogs/DeleteRevisionConfirmDialog.tsx` (expect the bare `await onConfirm();`) and read `packages/app-admin/src/features/confirmation/Confirmation.ts` (`resolve(data)` with `data` undefined). If a real confirm somehow passes a truthy value, the `confirmed === false` fix is still correct; record which it was in the commit body.

**Files:**
- Create: `packages/app-headless-cms-workflows/src/features/trash/feature.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts`
- Create: `packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx`
- Modify: `packages/app-headless-cms-workflows/src/index.tsx`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.ts`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/revisionsList/RevisionsListPresenter.ts`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.ts`
- Create: `packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.test.ts`
- Create: `packages/app-headless-cms/src/presentation/contentEntries/revisionsList/RevisionsListPresenter.test.ts`
- Create: `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts`
- Modify: `packages/app-admin/src/presentation/trashBin/abstractions.ts`
- Modify: `packages/app-admin/src/presentation/trashBin/TrashBinPresenter.ts`
- Modify: `packages/app-admin/src/presentation/trashBin/hooks/useDeleteTrashBinItem.tsx`
- Create: `packages/app-admin/src/presentation/trashBin/TrashBinPresenter.test.ts`
- Create: `packages/app-admin/src/presentation/trashBin/hooks/useDeleteTrashBinItem.test.tsx`
- Modify: `packages/app-admin/src/presentation/trashBin/components/BulkActions/DeleteItems.tsx`
- Create: `packages/app-admin/src/presentation/trashBin/components/BulkActions/DeleteItems.test.tsx`

**Interfaces:**
- Consumes:
  - Task 33: `ActiveReviewGuard` token (`@webiny/app-workflows/review/trash/ActiveReviewGuard.js`; `run`, `runBulk`), the implementations for the integration tests (`.../ActiveReviewGuardImpl.js`, `.../ActiveReviewBlockCollectorImpl.js`). Task 34: `ActiveReviewTrashFeature` (registers them in the app; the dialog). Build `@webiny/app-workflows` before Step 1 so the deep imports resolve (`yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30`).
  - Task 11: `CmsReviewUseCases` (`~/features/gateway/CmsReviewUseCases.js`, one token per file, interface `IReviewUseCases`, which includes `cancelForDelete`); `CmsReviewFeature` registered in `CmsWorkflows`.
  - Task 31: the typed error from the base CMS gateways (what makes the refusal reach the decorators).
  - Existing: `DeleteEntryUseCase` and `IDeleteEntryParams` (`@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js`), `DeleteEntryRevisionUseCase` and `IDeleteEntryRevisionParams` (`.../deleteEntryRevision/abstractions.js`), `PermanentlyDeleteEntryUseCase` and `IPermanentlyDeleteEntryParams` (`.../permanentlyDeleteEntry/abstractions.js`), `BulkDeletePresenter` (`@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js`; `execute(items: CmsContentEntry[], allSelected: boolean)`, `vm: BulkActionViewModel`), `CmsContentEntry` and `CmsModel` (`@webiny/app-headless-cms/types.js`), `Confirmation` (`@webiny/app-admin/features/confirmation/abstractions.js`), `Notifications` (`@webiny/app-admin/features/notifications/abstractions.js`, registered in the integrated test because the real guard depends on it), `RegisterFeature` and `useFeatureFlags` (`@webiny/app-admin`), `createFeature` (`@webiny/feature/admin`), `GraphQLOperationError` (`@webiny/app/errors/index.js`), `ReviewErrorCode` (`@webiny/app-workflows/review/domain/ReviewErrorCode.js`), `CancelForDeleteParams` (`@webiny/app-workflows/review/gateway/IReviewGateway.js`), `Review` (`@webiny/app-workflows/review/domain/types.js`).
- Produces (no later consumer):
  - `CmsReviewTrashFeature`, `DeleteEntryUseCaseReviewDecorator`, `DeleteEntryRevisionUseCaseReviewDecorator`, `PermanentlyDeleteEntryUseCaseReviewDecorator`, `BulkDeletePresenterReviewDecorator`.
  - Base fixes: `ContentEntryFormPresenter.deleteEntry` and `RevisionsListPresenter.deleteRevision` treat `false` as not done; `RevisionsListPresenter.deleteRevision` confirms correctly; `BulkDeletePresenter.deleteItem` reports failures; `ITrashBinActions.deleteItem(id): Promise<boolean>`.

- [ ] **Step 1: Write the failing tests**

Admin packages run `yarn test <path>` only (the storage legs are for the API packages of 8a.1). `packages/app-headless-cms-workflows` has its vitest setup from Task 11 (jsdom). The CMS presenter tests carry the `@vitest-environment jsdom` docblock like their precedent `ContentEntriesPresenter.test.ts`.

Create `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { DeleteEntryUseCaseReviewDecorator } from "./DeleteEntryUseCaseReviewDecorator.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function createRefusal(action: "trash" | "delete" = "trash") {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "cms.article",
            action,
            reviews: [
                {
                    reviewId: "review-1",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    title: "Launch article",
                    stepPosition: 2,
                    stepCount: 3,
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
    container.registerInstance(CmsReviewUseCases, useCases as unknown as CmsReviewUseCases.Interface);
    container.registerInstance(DeleteEntryUseCase, decoratee);
    container.registerDecorator(DeleteEntryUseCaseReviewDecorator);

    return { confirm, decoratee, useCases, useCase: container.resolve(DeleteEntryUseCase) };
}

describe("DeleteEntryUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the trash succeeds", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith({ model: MODEL, id: "entry-1" });
        expect(confirm).not.toHaveBeenCalled();
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("on the server refusal warns, cancels the whole entry once and repeats the trash", async () => {
        const { confirm, decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal("trash")).mockResolvedValueOnce(true);

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(true);
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: null,
            action: "trash"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed, with nothing cancelled or repeated", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });

    it("rethrows any other error unchanged", async () => {
        const { confirm, decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase.execute({ model: MODEL, id: "entry-1" }).catch(e => e);

        expect(error).toBe(failure);
        expect(confirm).not.toHaveBeenCalled();
    });

    it("propagates a second refusal after the repeat", async () => {
        const { confirm, decoratee, useCase } = setup();
        const second = createRefusal();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockRejectedValueOnce(second);

        const error = await useCase.execute({ model: MODEL, id: "entry-1" }).catch(e => e);

        expect(error).toBe(second);
        expect(confirm).toHaveBeenCalledTimes(1);
    });

    it("is not applied when the decorator is not registered (flag off)", async () => {
        const decoratee = { execute: vi.fn() };
        const refusal = createRefusal();
        decoratee.execute.mockRejectedValue(refusal);
        const container = new Container();
        container.registerInstance(DeleteEntryUseCase, decoratee);

        const error = await container
            .resolve(DeleteEntryUseCase)
            .execute({ model: MODEL, id: "entry-1" })
            .catch(e => e);

        expect(error).toBe(refusal);
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { DeleteEntryRevisionUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { DeleteEntryRevisionUseCaseReviewDecorator } from "./DeleteEntryRevisionUseCaseReviewDecorator.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function createRefusal() {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "cms.article",
            action: "delete",
            reviews: [
                {
                    reviewId: "review-2",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0002",
                    title: "Launch article",
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
    container.registerInstance(CmsReviewUseCases, useCases as unknown as CmsReviewUseCases.Interface);
    container.registerInstance(DeleteEntryRevisionUseCase, decoratee);
    container.registerDecorator(DeleteEntryRevisionUseCaseReviewDecorator);

    return {
        confirm,
        decoratee,
        useCases,
        useCase: container.resolve(DeleteEntryRevisionUseCase)
    };
}

describe("DeleteEntryRevisionUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the delete succeeds", async () => {
        const { confirm, decoratee, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ model: MODEL, revisionId: "entry-1#0002" });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({ model: MODEL, revisionId: "entry-1#0002" });
        expect(confirm).not.toHaveBeenCalled();
    });

    it("on the server refusal cancels only that revision's reviews, then repeats the delete", async () => {
        const { decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockResolvedValueOnce(true);

        const result = await useCase.execute({ model: MODEL, revisionId: "entry-1#0002" });

        expect(result).toBe(true);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(1);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: "entry-1#0002",
            action: "delete"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ model: MODEL, revisionId: "entry-1#0002" });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("rethrows any other error unchanged", async () => {
        const { decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase
            .execute({ model: MODEL, revisionId: "entry-1#0002" })
            .catch(e => e);

        expect(error).toBe(failure);
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { PermanentlyDeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { PermanentlyDeleteEntryUseCaseReviewDecorator } from "./PermanentlyDeleteEntryUseCaseReviewDecorator.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function createRefusal() {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "cms.article",
            action: "delete",
            reviews: [
                {
                    reviewId: "review-1",
                    model: "cms.article",
                    targetId: "entry-1",
                    targetRevisionId: "entry-1#0001",
                    title: "Launch article",
                    stepPosition: 1,
                    stepCount: 1,
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
    container.registerInstance(CmsReviewUseCases, useCases as unknown as CmsReviewUseCases.Interface);
    container.registerInstance(PermanentlyDeleteEntryUseCase, decoratee);
    container.registerDecorator(PermanentlyDeleteEntryUseCaseReviewDecorator);

    return {
        confirm,
        decoratee,
        useCases,
        useCase: container.resolve(PermanentlyDeleteEntryUseCase)
    };
}

describe("PermanentlyDeleteEntryUseCaseReviewDecorator", () => {
    it("passes through to the decoratee when the delete succeeds", async () => {
        const { confirm, decoratee, useCase } = setup();
        decoratee.execute.mockResolvedValue(true);

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(true);
        expect(decoratee.execute).toHaveBeenCalledWith({ model: MODEL, id: "entry-1" });
        expect(confirm).not.toHaveBeenCalled();
    });

    it("on the server refusal cancels the whole entry (no revision id), then repeats the delete", async () => {
        const { decoratee, useCases, useCase } = setup();
        decoratee.execute.mockRejectedValueOnce(createRefusal()).mockResolvedValueOnce(true);

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(true);
        expect(useCases.cancelForDelete).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetId: "entry-1",
            targetRevisionId: null,
            action: "delete"
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
    });

    it("resolves false when the warning is dismissed", async () => {
        const { decoratee, useCases, useCase } = setup("dismiss");
        decoratee.execute.mockRejectedValue(createRefusal());

        const result = await useCase.execute({ model: MODEL, id: "entry-1" });

        expect(result).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
    });

    it("rethrows any other error unchanged", async () => {
        const { decoratee, useCase } = setup();
        const failure = new Error("Network down");
        decoratee.execute.mockRejectedValue(failure);

        const error = await useCase.execute({ model: MODEL, id: "entry-1" }).catch(e => e);

        expect(error).toBe(failure);
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { GraphQLOperationError } from "@webiny/app/errors/index.js";
import type { Result } from "@webiny/app-admin/components/BulkActions/Worker.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ReviewErrorCode } from "@webiny/app-workflows/review/domain/ReviewErrorCode.js";
import type { Review } from "@webiny/app-workflows/review/domain/types.js";
import type { CancelForDeleteParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import { ActiveReviewGuard as GuardAbstraction } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { ActiveReviewBlockCollector } from "@webiny/app-workflows/review/trash/ActiveReviewBlockCollectorImpl.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuardImpl.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { DeleteEntryUseCaseReviewDecorator } from "./DeleteEntryUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function entry(entryId: string): CmsContentEntry {
    return { id: `${entryId}#0001`, entryId, meta: { title: entryId } } as CmsContentEntry;
}

function createRefusal(entryId: string) {
    return new GraphQLOperationError({
        message: "This content has a review in progress.",
        code: ReviewErrorCode.ActiveReviewOnTrash,
        data: {
            model: "cms.article",
            action: "trash",
            reviews: [
                {
                    reviewId: `review-${entryId}`,
                    model: "cms.article",
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

function createNotifications() {
    return { notify: vi.fn(), success: vi.fn(), warning: vi.fn() };
}

describe("BulkDeletePresenterReviewDecorator (forwarding)", () => {
    function setupForwarding() {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => undefined)
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
        container.registerInstance(CmsReviewUseCases, useCases as unknown as CmsReviewUseCases.Interface);
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return { decoratee, guard, useCases, presenter: container.resolve(BulkDeletePresenter) };
    }

    it("hands the items, the entry id, the use cases and a run callback to the guard", async () => {
        const { guard, useCases, presenter } = setupForwarding();
        const items = [entry("e1"), entry("e2")];

        await presenter.execute(items, false);

        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        const params = guard.runBulk.mock.calls[0][0];
        expect(params.items).toBe(items);
        expect(params.useCases).toBe(useCases);
        expect(params.getTargetId(items[0])).toBe("e1");
    });

    it("forwards allSelected on the first run and always false on the retry", async () => {
        const { decoratee, presenter } = setupForwarding();
        const items = [entry("e1")];

        await presenter.execute(items, true);

        expect(decoratee.execute).toHaveBeenNthCalledWith(1, items, true);
        expect(decoratee.execute).toHaveBeenNthCalledWith(2, items, false);
    });

    it("delegates the view model to the decoratee", () => {
        const { decoratee, presenter } = setupForwarding();

        expect(presenter.vm).toBe(decoratee.vm);
    });
});

describe("BulkDeletePresenterReviewDecorator (with the real guard and the per-item decorator)", () => {
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
        const blocked = new Set(["e1", "e3"]);
        const deleted: string[] = [];
        const failed: string[] = [];
        const deleteEntry = {
            execute: vi.fn(async (params: { id: string }) => {
                if (blocked.has(params.id)) {
                    throw createRefusal(params.id);
                }
                deleted.push(params.id);
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
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        container.registerInstance(CmsReviewUseCases, useCases as unknown as CmsReviewUseCases.Interface);
        container.registerInstance(DeleteEntryUseCase, deleteEntry);
        container.registerDecorator(DeleteEntryUseCaseReviewDecorator);

        // Stands in for the base presenter: a per-item series that calls the decorated use case.
        const decoratee = {
            vm: { processing: false, results: [] as Result[] },
            execute: vi.fn(async (items: CmsContentEntry[], _allSelected: boolean) => {
                const useCase = container.resolve(DeleteEntryUseCase);
                decoratee.vm.results = [];
                for (const item of items) {
                    // Like the base presenter: a false result is "not deleted", reported as failed.
                    const result = await useCase.execute({ model: MODEL, id: item.entryId });
                    if (result === false) {
                        failed.push(item.entryId);
                        decoratee.vm.results.push({ title: item.entryId, status: "failure" });
                    } else {
                        decoratee.vm.results.push({ title: item.entryId, status: "success" });
                    }
                }
            })
        };
        // The real guard reports the first-pass count through Notifications (Task 33).
        const notifications = createNotifications();
        container.registerInstance(Notifications, notifications as unknown as Notifications.Interface);
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            release,
            deleted,
            failed,
            decoratee,
            useCases,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [entry("e1"), entry("e2"), entry("e3")];

    it("collects every refused item, warns once and retries only the blocked items", async () => {
        const { confirm, deleted, failed, decoratee, useCases, presenter } =
            setupIntegrated("confirm");

        await presenter.execute(items, false);

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as GuardAbstraction.DialogParams;
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-e1",
            "review-e3"
        ]);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
        expect(decoratee.execute).toHaveBeenCalledTimes(2);
        expect(decoratee.execute.mock.calls[1][0].map(item => item.entryId)).toEqual(["e1", "e3"]);
        expect(decoratee.execute.mock.calls[1][1]).toBe(false);
        expect(failed).toEqual(["e1", "e3"]);
        expect(deleted).toEqual(["e2", "e1", "e3"]);
    });

    it("resolves execute only after the warning flow has ended (R228)", async () => {
        const { confirm, release, presenter } = setupIntegrated("deferred");
        const settled = vi.fn();

        const promise = presenter.execute(items, false).then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;
        expect(settled).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import { DeleteEntryRevisionUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import { PermanentlyDeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { CmsModel } from "@webiny/app-headless-cms/types.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflows } from "~/index.js";
import { CmsReviewTrashFeature } from "./feature.js";

// The composition root also mounts the other CMS workflow features; they are stubbed exactly as in
// Task 11's `src/index.test.tsx` (copy its `vi.mock` blocks for the modules `CmsWorkflows` imports at
// this point; this test pins only what Task 35 adds).
const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

describe("CmsWorkflows (composition root)", () => {
    const createContainer = (isEnabled: boolean) => {
        const flagsService: FeatureFlagsService.Interface = {
            getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
            isLoaded: () => true,
            loadFlags: async () => undefined
        };
        const guard = {
            run: vi.fn(async <TResult,>(params: ActiveReviewGuard.Params<TResult>) => params.action()),
            runBulk: vi.fn()
        };
        const decoratee = { execute: vi.fn(async () => true) };
        const container = new Container();
        container.registerInstance(FeatureFlagsService, flagsService);
        container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
        container.registerInstance(ActiveReviewGuard, guard as unknown as ActiveReviewGuard.Interface);
        container.registerInstance(DeleteEntryUseCase, decoratee);
        return { container, guard, decoratee };
    };

    it("wraps the delete use case with the review guard when the flag is on", async () => {
        const { container, guard, decoratee } = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        await container.resolve(DeleteEntryUseCase).execute({ model: MODEL, id: "entry-1" });

        expect(guard.run).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });

    it("leaves the delete use case unwrapped when the flag is off", async () => {
        const { container, guard, decoratee } = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        await container.resolve(DeleteEntryUseCase).execute({ model: MODEL, id: "entry-1" });

        expect(guard.run).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
    });
});

describe("CmsReviewTrashFeature", () => {
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
        container.registerInstance(CmsReviewUseCases, useCases as unknown as CmsReviewUseCases.Interface);
        container.registerInstance(DeleteEntryUseCase, { execute: vi.fn(async () => true) });
        container.registerInstance(DeleteEntryRevisionUseCase, { execute: vi.fn(async () => true) });
        container.registerInstance(PermanentlyDeleteEntryUseCase, {
            execute: vi.fn(async () => true)
        });
        container.registerInstance(BulkDeletePresenter, {
            vm: { processing: false, results: [] },
            execute: vi.fn(async () => undefined)
        });
        CmsReviewTrashFeature.register(container);
        return { container, guard, useCases };
    }

    it("decorates the three delete use cases and the bulk presenter", async () => {
        const { container, guard, useCases } = setup();

        await container.resolve(DeleteEntryUseCase).execute({ model: MODEL, id: "entry-1" });
        await container
            .resolve(DeleteEntryRevisionUseCase)
            .execute({ model: MODEL, revisionId: "entry-1#0002" });
        await container.resolve(PermanentlyDeleteEntryUseCase).execute({ model: MODEL, id: "entry-1" });
        await container
            .resolve(BulkDeletePresenter)
            .execute([{ id: "e1#0001", entryId: "e1" } as CmsContentEntry], false);

        expect(guard.run).toHaveBeenCalledTimes(3);
        expect(guard.run.mock.calls.map(call => call[0].revisionId)).toEqual([
            null,
            "entry-1#0002",
            null
        ]);
        expect(guard.run.mock.calls.every(call => call[0].useCases === useCases)).toBe(true);
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { FormModelFactory } from "@webiny/app-admin/features/formModel/abstractions.js";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsContentEntry } from "~/types.js";
import type { CmsModel } from "~/types.js";
import { CmsFormModelBuilder } from "~/features/formModel/abstractions.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { GetEntryUseCase } from "~/features/contentEntry/getEntry/abstractions.js";
import { CreateEntryUseCase } from "~/features/contentEntry/createEntry/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { UpdateEntryUseCase } from "~/features/contentEntry/updateEntry/abstractions.js";
import { PublishEntryUseCase } from "~/features/contentEntry/publishEntry/abstractions.js";
import { UnpublishEntryUseCase } from "~/features/contentEntry/unpublishEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { UpdateRevisionDescriptionUseCase } from "~/features/contentEntry/updateRevisionDescription/abstractions.js";
import { ContentEntryFormPresenter as Abstraction } from "./abstractions.js";
import { ContentEntryFormPresenter } from "./ContentEntryFormPresenter.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

const ENTRY = {
    id: "entry-1#0001",
    entryId: "entry-1",
    values: {},
    meta: { title: "Entry 1", locked: false, status: "draft" }
} as unknown as CmsContentEntry;

async function setup(deleteEntry: () => Promise<boolean>) {
    const container = new Container();
    const form = { setData: vi.fn(), reset: vi.fn(), vm: {}, isDirty: false };

    container.registerInstance(FormModelFactory, {
        create: vi.fn(() => form)
    } as unknown as FormModelFactory.Interface);
    container.registerInstance(CmsFormModelBuilder, {
        build: vi.fn(() => ({}))
    } as unknown as CmsFormModelBuilder.Interface);
    container.registerInstance(Confirmation, {
        confirm: vi.fn(
            async (_name: string, _params: unknown, execute?: (data: unknown) => Promise<unknown>) =>
                execute ? execute(undefined) : undefined
        )
    } as unknown as Confirmation.Interface);
    container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
    container.registerInstance(GetEntryUseCase, { execute: vi.fn(async () => ENTRY) });
    container.registerInstance(CreateEntryUseCase, { execute: vi.fn() });
    container.registerInstance(CreateRevisionFromUseCase, { execute: vi.fn() });
    container.registerInstance(UpdateEntryUseCase, { execute: vi.fn() });
    container.registerInstance(PublishEntryUseCase, { execute: vi.fn() });
    container.registerInstance(UnpublishEntryUseCase, { execute: vi.fn() });
    container.registerInstance(DeleteEntryUseCase, { execute: vi.fn(deleteEntry) });
    container.registerInstance(UpdateRevisionDescriptionUseCase, { execute: vi.fn() });
    container.register(ContentEntryFormPresenter).inSingletonScope();

    const presenter = container.resolve(Abstraction);
    await presenter.loadRevision("entry-1#0001");
    return presenter;
}

describe("ContentEntryFormPresenter.deleteEntry", () => {
    it("clears the entry and the form after a successful trash", async () => {
        const presenter = await setup(async () => true);
        expect(presenter.vm.entry).not.toBeNull();

        const result = await presenter.deleteEntry();

        expect(result).toBe(true);
        expect(presenter.vm.entry).toBeNull();
        expect(presenter.vm.form).toBeNull();
    });

    it("keeps the entry and the form and returns false when the use case returns false (warning dismissed)", async () => {
        const presenter = await setup(async () => false);

        const result = await presenter.deleteEntry();

        expect(result).toBe(false);
        expect(presenter.vm.entry).not.toBeNull();
        expect(presenter.vm.canDelete).toBe(true);
    });

    it("keeps the entry and returns false when the use case throws", async () => {
        const presenter = await setup(async () => {
            throw new Error("Network down");
        });

        const result = await presenter.deleteEntry();

        expect(result).toBe(false);
        expect(presenter.vm.entry).not.toBeNull();
    });
});
```

Create `packages/app-headless-cms/src/presentation/contentEntries/revisionsList/RevisionsListPresenter.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { Confirmation } from "@webiny/app-admin/features/confirmation/abstractions.js";
import type { CmsModel } from "~/types.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { ListRevisionsUseCase } from "~/features/contentEntry/listRevisions/abstractions.js";
import { CreateRevisionFromUseCase } from "~/features/contentEntry/createRevisionFrom/abstractions.js";
import { DeleteEntryRevisionUseCase } from "~/features/contentEntry/deleteEntryRevision/abstractions.js";
import { RevisionsListPresenter as Abstraction } from "./abstractions.js";
import { DELETE_REVISION_DIALOG } from "./RevisionsListPresenter.js";
import { RevisionsListPresenter } from "./RevisionsListPresenter.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

type ConfirmResult = undefined | false;

function setup(confirmed: ConfirmResult, deleteRevision: () => Promise<boolean>) {
    const container = new Container();
    const confirm = vi.fn(async (_name: string, _params: unknown) => confirmed);
    const deleteUseCase = { execute: vi.fn(deleteRevision) };

    container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
    container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
    container.registerInstance(ListRevisionsUseCase, { execute: vi.fn(async () => []) });
    container.registerInstance(CreateRevisionFromUseCase, { execute: vi.fn() });
    container.registerInstance(DeleteEntryRevisionUseCase, deleteUseCase);
    container.register(RevisionsListPresenter).inSingletonScope();

    return { confirm, deleteUseCase, presenter: container.resolve(Abstraction) };
}

describe("RevisionsListPresenter.deleteRevision", () => {
    it("runs the delete after a real confirm, which resolves undefined, and returns true", async () => {
        const { confirm, deleteUseCase, presenter } = setup(undefined, async () => true);

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(true);
        expect(confirm).toHaveBeenCalledWith(DELETE_REVISION_DIALOG, { revisionId: "entry-1#0002" });
        expect(deleteUseCase.execute).toHaveBeenCalledWith({
            model: MODEL,
            revisionId: "entry-1#0002"
        });
    });

    it("does not delete when the dialog is cancelled (confirm resolves false)", async () => {
        const { deleteUseCase, presenter } = setup(false, async () => true);

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(false);
        expect(deleteUseCase.execute).not.toHaveBeenCalled();
    });

    it("returns false when the use case returns false (warning dismissed)", async () => {
        const { deleteUseCase, presenter } = setup(undefined, async () => false);

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(false);
        expect(deleteUseCase.execute).toHaveBeenCalledTimes(1);
    });

    it("returns false and clears loading when the use case throws", async () => {
        const { presenter } = setup(undefined, async () => {
            throw new Error("Network down");
        });

        const result = await presenter.deleteRevision("entry-1#0002");

        expect(result).toBe(false);
        expect(presenter.vm.loading).toBe(false);
    });
});
```

Create `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts`:

```ts
/**
 * @vitest-environment jsdom
 */
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import type { CmsContentEntry } from "~/types.js";
import type { CmsModel } from "~/types.js";
import { CmsModelContext } from "~/features/contentEntry/abstractions.js";
import { DeleteEntryUseCase } from "~/features/contentEntry/deleteEntry/abstractions.js";
import { BulkActionUseCase } from "~/features/contentEntry/bulkAction/abstractions.js";
import { BulkDeletePresenter as Abstraction } from "./abstractions.js";
import { BulkDeletePresenter } from "./BulkDeletePresenter.js";

const MODEL = { modelId: "article", singularApiName: "Article" } as CmsModel;

function entry(entryId: string): CmsContentEntry {
    return { id: `${entryId}#0001`, entryId, meta: { title: `Title ${entryId}` } } as CmsContentEntry;
}

function setup(outcomes: Record<string, Error | boolean> = {}) {
    const container = new Container();
    const deleteEntry = {
        execute: vi.fn(async (params: { id: string }) => {
            const outcome = outcomes[params.id] ?? true;
            if (outcome instanceof Error) {
                throw outcome;
            }
            return outcome;
        })
    };
    const bulkAction = { execute: vi.fn(async () => ({ id: "task-1" })) };

    container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
    container.registerInstance(DeleteEntryUseCase, deleteEntry);
    container.registerInstance(BulkActionUseCase, bulkAction);
    container.register(BulkDeletePresenter);

    return { deleteEntry, bulkAction, presenter: container.resolve(Abstraction) };
}

describe("BulkDeletePresenter", () => {
    it("trashes every item and reports each as a success", async () => {
        const { deleteEntry, presenter } = setup();

        await presenter.execute([entry("e1"), entry("e2")], false);

        expect(deleteEntry.execute).toHaveBeenCalledTimes(2);
        expect(presenter.vm.results.map(result => result.status)).toEqual(["success", "success"]);
    });

    it("reports an entry whose trash returned false as a failure and continues with the rest", async () => {
        const { deleteEntry, presenter } = setup({ e1: false });

        await presenter.execute([entry("e1"), entry("e2"), entry("e3")], false);

        expect(deleteEntry.execute).toHaveBeenCalledTimes(3);
        const byTitle = Object.fromEntries(
            presenter.vm.results.map(result => [result.title, result])
        );
        expect(byTitle["Title e1"].status).toBe("failure");
        expect(byTitle["Title e1"].message).toBe("The entry was not moved to trash.");
        expect(byTitle["Title e2"].status).toBe("success");
        expect(byTitle["Title e3"].status).toBe("success");
    });

    it("leaves non-workflow error behaviour unchanged: a thrown error still rejects execute", async () => {
        const failure = new Error("Network down");
        const { presenter } = setup({ e1: failure });

        const error = await presenter.execute([entry("e1")], false).catch(e => e);

        expect(error).toBe(failure);
    });

    it("uses the background bulk action when all are selected", async () => {
        const { deleteEntry, bulkAction, presenter } = setup();

        await presenter.execute([entry("e1"), entry("e2")], true);

        expect(deleteEntry.execute).not.toHaveBeenCalled();
        expect(bulkAction.execute).toHaveBeenCalledWith({
            model: MODEL,
            action: "MoveToTrash",
            where: { id_in: ["e1#0001", "e2#0001"] }
        });
    });
});
```

Create `packages/app-admin/src/presentation/trashBin/TrashBinPresenter.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { ListPresenter } from "~/presentation/listPresenter/abstractions.js";
import type { IDataSource } from "~/presentation/listPresenter/abstractions.js";
import { TrashBinBulkActionGateway } from "./abstractions.js";
import { TrashBinDeleteGateway } from "./abstractions.js";
import { TrashBinListGateway } from "./abstractions.js";
import { TrashBinPresenter as Abstraction } from "./abstractions.js";
import { TrashBinRestoreGateway } from "./abstractions.js";
import type { TrashBinItem } from "./abstractions.js";
import { TrashBinPresenter } from "./TrashBinPresenter.js";

function item(id: string): TrashBinItem {
    return {
        id,
        title: `Item ${id}`,
        location: { folderId: undefined },
        createdBy: { id: "u1", displayName: "User", type: "admin" },
        deletedBy: { id: "u1", displayName: "User", type: "admin" },
        deletedOn: "2026-10-16T10:00:00.000Z"
    };
}

async function setup(deleteResult: boolean) {
    const container = new Container();
    const listPresenter = {
        init: vi.fn((_config: { dataSource: IDataSource<TrashBinItem> }) => undefined),
        vm: {},
        actions: {}
    };
    const deleteGateway = { execute: vi.fn(async (_id: string) => deleteResult) };

    container.registerInstance(ListPresenter, listPresenter as unknown as ListPresenter.Interface);
    container.registerInstance(TrashBinListGateway, {
        execute: vi.fn(async () => ({
            data: [item("a"), item("b")],
            meta: { cursor: null, hasMoreItems: false, totalCount: 2 }
        }))
    });
    container.registerInstance(TrashBinDeleteGateway, deleteGateway);
    container.registerInstance(TrashBinRestoreGateway, { execute: vi.fn() });
    container.registerInstance(TrashBinBulkActionGateway, { execute: vi.fn() });
    container.register(TrashBinPresenter).inSingletonScope();

    const presenter = container.resolve(Abstraction);
    presenter.init({ nameColumnId: "title" });
    const dataSource = listPresenter.init.mock.calls[0][0].dataSource;
    await dataSource.query({});

    return { presenter, deleteGateway, dataSource };
}

describe("TrashBinPresenter.deleteItem", () => {
    it("removes the row and returns true when the gateway deleted the item", async () => {
        const { presenter, deleteGateway, dataSource } = await setup(true);

        const result = await presenter.actions.deleteItem("a");

        expect(result).toBe(true);
        expect(deleteGateway.execute).toHaveBeenCalledWith("a");
        expect(dataSource.rows.map(row => row.id)).toEqual(["b"]);
    });

    it("keeps the row and returns false when the gateway returned false", async () => {
        const { presenter, dataSource } = await setup(false);

        const result = await presenter.actions.deleteItem("a");

        expect(result).toBe(false);
        expect(dataSource.rows.map(row => row.id)).toEqual(["a", "b"]);
    });
});
```

Create `packages/app-admin/src/presentation/trashBin/hooks/useDeleteTrashBinItem.test.tsx`:

```tsx
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { renderHook } from "@testing-library/react";
import type { TrashBinItem } from "../abstractions.js";

const mocks = vi.hoisted(() => ({
    deleteItem: vi.fn(),
    showSuccessToast: vi.fn(),
    showWarningToast: vi.fn()
}));

vi.mock("~/index.js", () => ({
    useConfirmationDialog: () => ({
        showConfirmation: (callback: () => Promise<void>) => callback()
    })
}));

vi.mock("./useTrashBinPresenter.js", () => ({
    useTrashBinPresenter: () => ({ actions: { deleteItem: mocks.deleteItem } })
}));

vi.mock("@webiny/admin-ui", () => ({
    useToast: () => ({
        showSuccessToast: mocks.showSuccessToast,
        showWarningToast: mocks.showWarningToast
    })
}));

import { useDeleteTrashBinItem } from "./useDeleteTrashBinItem.js";

const ITEM = { id: "a", title: "Item a" } as TrashBinItem;

describe("useDeleteTrashBinItem", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("shows the success toast when the item was deleted", async () => {
        mocks.deleteItem.mockResolvedValue(true);
        const { result } = renderHook(() => useDeleteTrashBinItem({ item: ITEM }));

        await result.current.openDialogDeleteItem();

        expect(mocks.showSuccessToast).toHaveBeenCalledWith({
            title: "Item a was deleted successfully!"
        });
    });

    it("shows no toast when the delete was not carried out (warning dismissed)", async () => {
        mocks.deleteItem.mockResolvedValue(false);
        const { result } = renderHook(() => useDeleteTrashBinItem({ item: ITEM }));

        await result.current.openDialogDeleteItem();

        expect(mocks.showSuccessToast).not.toHaveBeenCalled();
        expect(mocks.showWarningToast).not.toHaveBeenCalled();
    });

    it("shows the warning toast when the delete throws", async () => {
        mocks.deleteItem.mockRejectedValue(new Error("Network down"));
        const { result } = renderHook(() => useDeleteTrashBinItem({ item: ITEM }));

        await result.current.openDialogDeleteItem();

        expect(mocks.showWarningToast).toHaveBeenCalledWith({ title: "Network down" });
    });
});
```

Create `packages/app-admin/src/presentation/trashBin/components/BulkActions/DeleteItems.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";

interface TestItem {
    id: string;
    title: string;
}

interface TestReport {
    success: ReturnType<typeof vi.fn>;
    error: ReturnType<typeof vi.fn>;
}

const mocks = vi.hoisted(() => ({
    deleteItem: vi.fn(),
    refresh: vi.fn(),
    report: { success: vi.fn(), error: vi.fn() }
}));

const items: TestItem[] = [
    { id: "a", title: "Item a" },
    { id: "b", title: "Item b" }
];

vi.mock("~/index.js", () => ({
    useSnackbar: () => ({ showSnackbar: vi.fn() })
}));

vi.mock("../../hooks/index.js", () => ({
    useTrashBinPresenter: () => ({
        actions: { deleteItem: mocks.deleteItem, refresh: mocks.refresh }
    })
}));

vi.mock("../../configs/index.js", () => ({
    TrashBinListConfig: {
        Browser: {
            BulkAction: {
                useWorker: () => ({
                    items,
                    isSelectedAll: false,
                    resetItems: vi.fn(),
                    results: [],
                    processInSeries: async (
                        callback: (params: { item: TestItem; report: TestReport }) => Promise<void>
                    ) => {
                        for (const item of items) {
                            await callback({ item, report: mocks.report });
                        }
                    }
                }),
                useButtons: () => ({
                    ButtonDefault: (props: { onAction: () => void; children: React.ReactNode }) => (
                        <button onClick={props.onAction}>{props.children}</button>
                    )
                }),
                useDialog: () => ({
                    showConfirmationDialog: (params: { execute: () => Promise<void> }) =>
                        params.execute(),
                    showResultsDialog: vi.fn()
                })
            }
        }
    }
}));

vi.mock("@webiny/admin-ui", () => ({
    Tooltip: (props: { trigger: React.ReactNode }) => props.trigger
}));

vi.mock("@webiny/icons/delete.svg", () => ({ ReactComponent: () => null }));

import { BulkActionsDeleteItems } from "./DeleteItems.js";

describe("BulkActionsDeleteItems", () => {
    afterEach(() => {
        cleanup();
        vi.clearAllMocks();
    });

    it("reports a deleted item as a success", async () => {
        mocks.deleteItem.mockResolvedValue(true);
        render(<BulkActionsDeleteItems />);

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(mocks.report.success).toHaveBeenCalledTimes(2));
        expect(mocks.report.error).not.toHaveBeenCalled();
    });

    it("reports an item whose delete returned false as a failure, not a success", async () => {
        mocks.deleteItem.mockResolvedValueOnce(false).mockResolvedValueOnce(true);
        render(<BulkActionsDeleteItems />);

        fireEvent.click(screen.getByRole("button", { name: "Delete" }));

        await waitFor(() => expect(mocks.report.error).toHaveBeenCalledTimes(1));
        expect(mocks.report.error).toHaveBeenCalledWith({
            title: "Item a",
            message: "The item was not deleted."
        });
        expect(mocks.report.success).toHaveBeenCalledTimes(1);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/presentation/contentEntries/revisionsList/RevisionsListPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts 2>&1 | tail -50
yarn test packages/app-admin/src/presentation/trashBin/TrashBinPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-admin/src/presentation/trashBin/hooks/useDeleteTrashBinItem.test.tsx 2>&1 | tail -50
yarn test packages/app-admin/src/presentation/trashBin/components/BulkActions/DeleteItems.test.tsx 2>&1 | tail -50
```

Expected: FAIL. The five `features/trash` files fail with `Failed to resolve import "./...Decorator.js"` / `"./feature.js"`. The base tests fail on behaviour: `ContentEntryFormPresenter.test.ts` "keeps the entry ... false" (the entry is cleared), `RevisionsListPresenter.test.ts` "runs the delete after a real confirm" (`deleteUseCase.execute` never called, result `false`) and "returns false when the use case returns false" (returns `true`), `BulkDeletePresenter.test.ts` "reports a failing item" (the series rejects: `execute` throws), `TrashBinPresenter.test.ts` (returns `undefined`, row removed), `useDeleteTrashBinItem.test.tsx` "shows no toast" (success toast shown). Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.ts`:

```ts
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import type { IDeleteEntryParams } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";

class DeleteEntryUseCaseReviewDecoratorImpl implements DeleteEntryUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private decoratee: DeleteEntryUseCase.Interface
    ) {}

    async execute(params: IDeleteEntryParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: null
        });
    }
}

export const DeleteEntryUseCaseReviewDecorator = DeleteEntryUseCase.createDecorator({
    decorator: DeleteEntryUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, CmsReviewUseCases]
});
```

Create `packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.ts`:

```ts
import { DeleteEntryRevisionUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import type { IDeleteEntryRevisionParams } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";

class DeleteEntryRevisionUseCaseReviewDecoratorImpl implements DeleteEntryRevisionUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private decoratee: DeleteEntryRevisionUseCase.Interface
    ) {}

    async execute(params: IDeleteEntryRevisionParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: params.revisionId
        });
    }
}

export const DeleteEntryRevisionUseCaseReviewDecorator = DeleteEntryRevisionUseCase.createDecorator({
    decorator: DeleteEntryRevisionUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, CmsReviewUseCases]
});
```

Create `packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.ts`:

```ts
import { PermanentlyDeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import type { IPermanentlyDeleteEntryParams } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";

class PermanentlyDeleteEntryUseCaseReviewDecoratorImpl implements PermanentlyDeleteEntryUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private decoratee: PermanentlyDeleteEntryUseCase.Interface
    ) {}

    async execute(params: IPermanentlyDeleteEntryParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            useCases: this.useCases,
            revisionId: null
        });
    }
}

export const PermanentlyDeleteEntryUseCaseReviewDecorator =
    PermanentlyDeleteEntryUseCase.createDecorator({
        decorator: PermanentlyDeleteEntryUseCaseReviewDecoratorImpl,
        dependencies: [ActiveReviewGuard, CmsReviewUseCases]
    });
```

Create `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts`:

```ts
import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";

class BulkDeletePresenterReviewDecoratorImpl implements BulkDeletePresenter.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private decoratee: BulkDeletePresenter.Interface
    ) {}

    get vm() {
        return this.decoratee.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<void> {
        await this.guard.runBulk({
            items,
            getTargetId: item => item.entryId,
            run: (batch, isRetry) => this.decoratee.execute(batch, isRetry ? false : allSelected),
            useCases: this.useCases
        });
    }
}

export const BulkDeletePresenterReviewDecorator = BulkDeletePresenter.createDecorator({
    decorator: BulkDeletePresenterReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, CmsReviewUseCases]
});
```

Create `packages/app-headless-cms-workflows/src/features/trash/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { DeleteEntryUseCaseReviewDecorator } from "./DeleteEntryUseCaseReviewDecorator.js";
import { DeleteEntryRevisionUseCaseReviewDecorator } from "./DeleteEntryRevisionUseCaseReviewDecorator.js";
import { PermanentlyDeleteEntryUseCaseReviewDecorator } from "./PermanentlyDeleteEntryUseCaseReviewDecorator.js";
import { BulkDeletePresenterReviewDecorator } from "./BulkDeletePresenterReviewDecorator.js";

export const CmsReviewTrashFeature = createFeature({
    name: "CmsWorkflows/Trash",
    register(container) {
        container.registerDecorator(DeleteEntryUseCaseReviewDecorator);
        container.registerDecorator(DeleteEntryRevisionUseCaseReviewDecorator);
        container.registerDecorator(PermanentlyDeleteEntryUseCaseReviewDecorator);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);
    }
});
```

Modify `packages/app-headless-cms-workflows/src/index.tsx` (Task 11 added `CmsReviewFeature` to the gated fragment; the new line goes right after it, A77; verify the anchor and, if Task 11 named it differently, put the line after the last `RegisterFeature` of the shared features):

```tsx
// Before:
import { CmsWorkflowsEditorPresenterFeature } from "~/presentation/cmsWorkflowsEditor/feature.js";

// After:
import { CmsWorkflowsEditorPresenterFeature } from "~/presentation/cmsWorkflowsEditor/feature.js";
import { CmsReviewTrashFeature } from "~/features/trash/feature.js";
```

```tsx
// Before:
            <RegisterFeature feature={CmsReviewFeature} />

// After:
            <RegisterFeature feature={CmsReviewFeature} />
            <RegisterFeature feature={CmsReviewTrashFeature} />
```

Modify `packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.ts`:

```ts
// Before:
                try {
                    await this.deleteEntryUseCase.execute({
                        model,
                        id: entry.entryId
                    });

                    runInAction(() => {

// After:
                try {
                    const deleted = await this.deleteEntryUseCase.execute({
                        model,
                        id: entry.entryId
                    });

                    if (deleted === false) {
                        return false;
                    }

                    runInAction(() => {
```

Modify `packages/app-headless-cms/src/presentation/contentEntries/revisionsList/RevisionsListPresenter.ts`:

```ts
// Before:
        const confirmed = await this.confirmation.confirm(DELETE_REVISION_DIALOG, { revisionId });

        if (!confirmed) {
            return false;
        }

// After:
        // A real confirm resolves undefined (the dialog passes no data); only a cancel resolves false.
        const confirmed = await this.confirmation.confirm(DELETE_REVISION_DIALOG, { revisionId });

        if (confirmed === false) {
            return false;
        }
```

```ts
// Before:
            await this.deleteEntryRevisionUseCase.execute({
                model: this.model,
                revisionId
            });

            return true;

// After:
            const deleted = await this.deleteEntryRevisionUseCase.execute({
                model: this.model,
                revisionId
            });

            return deleted !== false;
```

Modify `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.ts`:

```ts
// Before:
    private async deleteItem(item: CmsContentEntry, report: Report): Promise<void> {
        const model = this.modelAccessor.getModel();
        const { id } = parseIdentifier(item.id);
        await this.deleteEntryUseCase.execute({ model, id });
        report.success({ title: item.meta.title, message: "Entry successfully moved to trash." });
    }

// After:
    private async deleteItem(item: CmsContentEntry, report: Report): Promise<void> {
        const model = this.modelAccessor.getModel();
        const { id } = parseIdentifier(item.id);
        const deleted = await this.deleteEntryUseCase.execute({ model, id });

        if (deleted === false) {
            report.error({ title: item.meta.title, message: "The entry was not moved to trash." });
            return;
        }

        report.success({ title: item.meta.title, message: "Entry successfully moved to trash." });
    }
```

Modify `packages/app-admin/src/presentation/trashBin/components/BulkActions/DeleteItems.tsx` (the trash bin "Delete" bulk action; it already catches per item, but reported a success for a `false` result):

```tsx
// Before:
                    try {
                        await actions.deleteItem(item.id);
                        report.success({
                            title: `${item.title}`,
                            message: "Item successfully deleted."
                        });
                    } catch (e: any) {

// After:
                    try {
                        const deleted = await actions.deleteItem(item.id);
                        if (deleted === false) {
                            report.error({
                                title: `${item.title}`,
                                message: "The item was not deleted."
                            });
                            return;
                        }

                        report.success({
                            title: `${item.title}`,
                            message: "Item successfully deleted."
                        });
                    } catch (e: any) {
```

Modify `packages/app-admin/src/presentation/trashBin/abstractions.ts` (`ITrashBinActions`):

```ts
// Before:
    deleteItem(id: string): Promise<void>;

// After:
    /**
     * Resolves false when the delete was not carried out (the item stays listed).
     */
    deleteItem(id: string): Promise<boolean>;
```

Modify `packages/app-admin/src/presentation/trashBin/TrashBinPresenter.ts`:

```ts
// Before:
        deleteItem: async (id: string) => {
            await this.deleteGateway.execute(id);
            if (this._dataSource) {
                this._dataSource.removeItem(id);
            }
        },

// After:
        deleteItem: async (id: string) => {
            const deleted = await this.deleteGateway.execute(id);
            if (deleted === false) {
                return false;
            }

            if (this._dataSource) {
                this._dataSource.removeItem(id);
            }

            return true;
        },
```

Modify `packages/app-admin/src/presentation/trashBin/hooks/useDeleteTrashBinItem.tsx`:

```tsx
// Before:
                try {
                    await actions.deleteItem(item.id);
                    toast.showSuccessToast({ title: `${item.title} was deleted successfully!` });
                } catch (ex: any) {

// After:
                try {
                    const deleted = await actions.deleteItem(item.id);
                    if (deleted === false) {
                        return;
                    }

                    toast.showSuccessToast({ title: `${item.title} was deleted successfully!` });
                } catch (ex: any) {
```


- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms/src/presentation/contentEntries/form/ContentEntryFormPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/presentation/contentEntries/revisionsList/RevisionsListPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts 2>&1 | tail -50
yarn test packages/app-admin/src/presentation/trashBin/TrashBinPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-admin/src/presentation/trashBin/hooks/useDeleteTrashBinItem.test.tsx 2>&1 | tail -50
yarn test packages/app-admin/src/presentation/trashBin/components/BulkActions/DeleteItems.test.tsx 2>&1 | tail -50
```

Expected: PASS (11 files). If `feature.test.tsx` cannot import `~/index.js` because a module of the root has an import-time side effect that needs a browser global, add the missing global stub to that test file only (as `ResizeObserver` is stubbed in Task 34) and name it in the commit body.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-headless-cms/src/presentation/contentEntries/list/ContentEntriesPresenter.test.ts 2>&1 | tail -50
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms --no-cache 2>&1 | tail -30
yarn check:test:types -p app-admin --report cli 2>&1 | tail -40
```

Expected: PASS and no type errors. `app-headless-cms-workflows` and `app-headless-cms` have no `__tests__/**/*.test.ts`, so `check:test:types` does not list them and their co-located tests are type-checked by the build (R243); `app-admin` has `__tests__` tests, so it is listed. A type error in an app-admin caller of `actions.deleteItem` (any other consumer that assumed `Promise<void>`) is fixed in the same commit; `git grep -n "actions.deleteItem\|\.deleteItem(" packages/*/src` lists the callers (expected: `useDeleteTrashBinItem` and `DeleteItems.tsx:50`, which this task already fixes).

- [ ] **Step 6: Four commits, in this order (controller ruling: base behaviour changes never share a commit with the `feat`)**

Stage only the listed files for each commit (`git add <paths>`; for `RevisionsListPresenter.ts` and its test the two commits take different hunks, use `git add -p`), run the Global Constraints pre-commit chain (below, with that commit's build lines), commit, then continue. If a chain step fails and you fix anything, rerun the chain for that commit from the start. Before commit 1, `RevisionsListPresenter.test.ts` holds only its first two tests (the confirm ones); the other two are added in commit 2.

Chain (run before every commit; `<build lines>` per commit below; always restore `.gitleaks.toml` after format and build):

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

Commit 1, files: `RevisionsListPresenter.ts` (the `confirmed === false` hunk only) and the first two tests of `RevisionsListPresenter.test.ts`. Build lines: `yarn build -p @webiny/app-headless-cms --no-cache 2>&1 | tail -30`.

```bash
git commit -m "fix(app-headless-cms): run the revision delete after a real confirm" -m "RevisionsListPresenter.deleteRevision treated the undefined result of a real confirm as not confirmed, so deleting a revision from the list never ran; only a cancel resolves false." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

Commit 2, files: `ContentEntryFormPresenter.ts`, `ContentEntryFormPresenter.test.ts`, `RevisionsListPresenter.ts` (the `deleted !== false` hunk) with the remaining two tests, `BulkDeletePresenter.ts`, `BulkDeletePresenter.test.ts` (all in `packages/app-headless-cms`). Build lines: the same single build.

```bash
git commit -m "fix(app-headless-cms): treat a false delete result as not done" -m "The entry form, the revisions list and the bulk trash now check the delete use case result, so a dismissed warning no longer blanks the editor, reports a revision deleted or lists a bulk item as trashed." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

Commit 3, files: `abstractions.ts`, `TrashBinPresenter.ts`, `TrashBinPresenter.test.ts`, `useDeleteTrashBinItem.tsx`, `useDeleteTrashBinItem.test.tsx`, `DeleteItems.tsx`, `DeleteItems.test.tsx` (all in `packages/app-admin/src/presentation/trashBin/`). Build lines: `yarn build -p @webiny/app-admin --no-cache 2>&1 | tail -30`.

```bash
git commit -m "fix(app-admin): treat a false delete result as not done in the trash bin" -m "deleteItem now resolves a boolean; the row stays listed and no success is reported when the delete was not carried out." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

Commit 4, files: everything under `packages/app-headless-cms-workflows/src/features/trash/` and `packages/app-headless-cms-workflows/src/index.tsx`. Build lines: `yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30` then `yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30`. `yarn adio` may list `@webiny/di` and `vitest` for `app-headless-cms-workflows` (Task 11 added them).

```bash
git commit -m "feat(app-headless-cms-workflows): guard the CMS trash and delete with the review warning" -m "Four decorators forward the entry trash, revision delete, permanent delete and bulk trash to the shared guard; the trash-bin delete is covered through PermanentlyDeleteEntryUseCase. " -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

**Contract notes:**
- For Task 38: a bulk retry's results dialog shows only the retried items (Q27, accepted). The first-pass count toast (Q28 copy) is owned by `ActiveReviewGuard.runBulk` (Task 33), so the CMS bulk decorator only forwards.
- The "all selected" background path (`onBulk`) has no pre-warning and no summary (A72).
- The bulk confirmation dialog is a generic `showDialog` dialog, not a named one, so the A71 replace behaviour does not apply to bulk: the warning (named) stacks over the busy bulk dialog. Not covered by an automated test (it needs the bulk dialog host); verify by hand in the admin before the final review.
- verify: `CmsReviewUseCases` path and the file and export of Task 11's token (`~/features/gateway/CmsReviewUseCases.js`); the `CmsReviewFeature` anchor line in `index.tsx`; the CMS package exports deep paths (`@webiny/app-headless-cms/features/...`, `./*` export in its `package.json`).
