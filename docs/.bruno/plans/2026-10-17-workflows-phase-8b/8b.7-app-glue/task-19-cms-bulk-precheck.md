### Task 19: CMS bulk trash pre-check

R265, R220, R237; D157, D164; Q38; Review Focus 9. Global Constraints of 8a and 8b apply (no helper wrappers around dependency calls: the decorator calls the use case and the guard inline, with an inline `try`/`catch`; no logic duplicated across CMS and WB; the shared guard is shared logic and lives in `app-workflows`; admin code style; targeted tests; the pre-commit chain; the commit format). Closes the D157 gap for the CMS: the CMS bulk trash of **all loaded rows** (`allSelected`, the background-task path of `BulkDeletePresenter`) swallows the workflows refusal inside the server task, so 8a showed no warning. 8b asks first.

- **The shared guard gains `confirmBlocking`** (`@webiny/app-workflows/review/trash/ActiveReviewGuard.js`). `confirmBlocking(params: ConfirmBlockingParams): Promise<boolean>` with `ConfirmBlockingParams { reviews: BlockingReview[]; action: ReviewForDeleteAction; useCases: IReviewCancelForDeleteUseCases; afterCancel: () => Promise<void> }` opens the 8a warning dialog (`ACTIVE_REVIEW_WARNING_DIALOG`, params `{ reviews, action }`). **Inside the dialog's confirm** it runs cancel-for-delete once per distinct target (`distinctReviewTargets`, `targetRevisionId: null`, the given `action`) and then `afterCancel`. It resolves `true` when confirmed and done, `false` when the dialog is dismissed (nothing cancelled, `afterCancel` not called). An error from the cancel loop or from `afterCancel` is rethrown after the dialog closed (the 8a `RetryOutcome` plumbing: `Confirmation.confirm` resolves only after its callback returns, so the callback never throws and reports the failure in its result).
- **`runBulk` is rebuilt on it.** After its first-pass summary toast, `runBulk` calls `confirmBlocking` with its blocked reviews, the action of the first refusal and an `afterCancel` that is the old retry (`collector.begin(retryTargetIds)`, `run(retryItems, true)`, `collector.end`, `collector.drain` in `finally`). Behaviour is unchanged, so **every existing `runBulk` and `run` test stays as it is**.
- **Part A, base fix first (user decision Q39, R228).** `BulkDeletePresenter.execute` reports whether the work started: `Promise<boolean>`, `true` once the series ran or the background task was started, `false` when nothing was started. `ActionDelete` shows "Entries will be trashed in the background" and clears the selection only on `true` (and shows the results dialog only then). The base presenter always returns `true`. It is its own `fix(app-headless-cms)` commit, **before** the workflows commit (Part B).
- **The CMS decorator** (Part B) returns that result for every branch. `BulkDeletePresenterReviewDecorator.execute(items, allSelected): Promise<boolean>`:
  - `allSelected` false: `guard.runBulk` exactly as 8a, then `true` (the per-item results dialog shows even when the warning was dismissed, as in 8a); the `run` callback is now `batch => decoratee.execute(batch, false)` (it was `isRetry ? false : allSelected`, and `allSelected` is false on this branch);
  - nothing selected (`items` empty): returns `decoratee.execute(items, allSelected)`, no pre-check;
  - `allSelected` true: it takes the distinct entry ids (`item.entryId`) and calls `useCases.listBlockingReviews({ namespace, targetIds })` for each chunk of 200 ids (`PRECHECK_CHUNK_SIZE`, the server's `BLOCKING_REVIEWS_MAX_IDS`), **sequentially**, collecting the reviews; `namespace` is `createAppName(this.modelAccessor.getModel())` (`cms.<modelId>`); the namespace comes from `CmsModelContext`, the model the list shows, because the loaded rows carry **no** `modelId` at run time (`EntryGraphQLFields` does not select it, so `items[0].modelId` would be `undefined` and the pre-check would silently find nothing). A failed call (any chunk) shows the error toast (below), runs nothing, not even the later chunks, and returns `false`;
  - no blocking review: returns `decoratee.execute(items, true)` (the background task, as before);
  - blocking reviews: `guard.confirmBlocking({ reviews, action: "trash", useCases, afterCancel: () => this.decoratee.execute(items, true) })`; the result is `true` only when the warning was confirmed and the bulk task started; dismissed means nothing runs and the result is `false`; an error from the cancel loop or the bulk task propagates out of `execute` (the bulk dialog of `ActionDelete` shows it).
  - **Error toast.** 8a has no toast for a failed call outside a dialog (R214/R220: errors live in dialogs). Here there is no dialog, so the failed pre-check uses `Notifications.error({ title, position: REVIEW_TOAST_POSITION, duration: REVIEW_TOAST_DURATION, dismissible: true })` with `title` = `getActionErrorMessage(classifyReviewActionError(error), error)`: the 8a texts (`NO_ACCESS_MESSAGE` for `Workflows/NotAuthorized`, the server message for other server errors, "The server did not respond, so nothing was changed. Try again." for a transport failure). No new copy.
  - The WB decorator is not touched (the WB bulk delete is per item and fully covered; the WB gateway's `listBlockingReviews` returns `[]`).

**Files, Part A (base fix):**
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/abstractions.ts`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.ts`
- Modify: `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts`
- Modify: `packages/app-headless-cms/src/admin/components/ContentEntries/BulkActions/ActionDelete.tsx`
- Create: `packages/app-headless-cms/src/admin/components/ContentEntries/BulkActions/ActionDelete.test.tsx`
- Modify: `packages/app-headless-cms/package.json` (devDependency `@testing-library/react` `^16.3.2`, R222; the package has no component test yet)

**Files, Part B (workflows):**
- Modify: `packages/app-workflows/src/review/trash/ActiveReviewGuard.ts`
- Modify: `packages/app-workflows/src/review/trash/ActiveReviewGuardImpl.ts`
- Modify: `packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx`

**Interfaces:**
- Consumes: Task 8 (`IReviewCancelForDeleteUseCases.listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]>`, `ListBlockingReviewsParams { namespace: string; targetIds: string[] }` from `@webiny/app-workflows/review/gateway/IReviewGateway.js`), Task 9 (the CMS gateway sends `listCmsEntryBlockingReviews(modelId, entryIds)`, `namespace` minus the `cms.` prefix, so `CmsReviewUseCases` already has the method), Task 7 (the server query and its limit of 200 ids and the order of `BlockingReview` fields). Existing (verified): `ActiveReviewGuard` and its params types, `ACTIVE_REVIEW_WARNING_DIALOG` (`./constants.js`), `distinctReviewTargets`, `Confirmation`, `Notifications.error(INotificationInput)` (`@webiny/app-admin/features/notifications/abstractions.js`), `classifyReviewActionError` and `getActionErrorMessage` (`@webiny/app-workflows/review/presentation/actionDialog/`), `REVIEW_TOAST_POSITION` and `REVIEW_TOAST_DURATION` (`@webiny/app-workflows/review/toasts/constants.js`), `createAppName` (`~/utils/appName.js`), `CmsModelContext`.
- Produces: `ActiveReviewGuard.Interface.confirmBlocking`, `ActiveReviewGuard.ConfirmBlockingParams` (the interface is declared as `ActiveReviewConfirmBlockingParams`, beside `ActiveReviewBulkParams`, and aliased in the namespace), the pre-check in the CMS decorator. The decorator gains the dependencies `Notifications` and `CmsModelContext` (`@webiny/app-headless-cms/features/contentEntry/abstractions.js`, `getModel(): CmsModel`).

**Test runner note:** admin packages, `yarn test <path>` only. Task 19 changes `app-workflows`, which `app-headless-cms-workflows` imports from its build output, so build `app-workflows` before the CMS tests and type check (Step 5).

## Part A: base fix, `ActionDelete` reports whether the bulk trash started (its own commit)

- [ ] **Step A1: Write the failing tests**

Modify `packages/app-headless-cms/package.json`: add `"@testing-library/react": "^16.3.2"` to `devDependencies` (alphabetical), then run `yarn > /dev/null 2>&1`.

Modify `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts`. Add these tests at the end of the `describe`:

```ts
    it("reports true after the per-item series ran", async () => {
        const { presenter } = setup();

        const started = await presenter.execute([entry("e1")], false);

        expect(started).toBe(true);
    });

    it("reports true once the background bulk action was started", async () => {
        const { presenter } = setup();

        const started = await presenter.execute([entry("e1")], true);

        expect(started).toBe(true);
    });
```

Create `packages/app-headless-cms/src/admin/components/ContentEntries/BulkActions/ActionDelete.test.tsx`:

```tsx
/**
 * @vitest-environment jsdom
 */
import React from "react";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { render } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { ActionDelete } from "./ActionDelete.js";

interface Hoisted {
    showSuccessToast: ReturnType<typeof vi.fn>;
    showResultsDialog: ReturnType<typeof vi.fn>;
    deselectAll: ReturnType<typeof vi.fn>;
    execute: ReturnType<typeof vi.fn>;
    allSelected: boolean;
}

const hoisted = vi.hoisted((): Hoisted => {
    return {
        showSuccessToast: vi.fn(),
        showResultsDialog: vi.fn(),
        deselectAll: vi.fn(),
        execute: vi.fn(),
        allSelected: false
    };
});

vi.mock("@webiny/icons/delete.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/admin-ui", () => {
    return { useToast: () => ({ showSuccessToast: hoisted.showSuccessToast }) };
});

vi.mock("@webiny/app", () => {
    return {
        useFeature: () => ({ presenter: { execute: hoisted.execute, vm: { results: [] } } })
    };
});

vi.mock("~/presentation/contentEntries/bulkActions/feature.js", () => {
    return { BulkDeleteFeature: {} };
});

vi.mock("@webiny/app-admin/components/BulkActions/index.js", () => {
    return {
        BulkActionButton: (props: { text: string; onClick: () => void }) => {
            return <button onClick={props.onClick}>{props.text}</button>;
        },
        useBulkActionDialog: () => {
            return {
                showConfirmationDialog: (params: { execute: () => Promise<void> }) => {
                    return params.execute();
                },
                showResultsDialog: hoisted.showResultsDialog
            };
        }
    };
});

vi.mock("~/presentation/contentEntries/list/useContentEntriesPresenter.js", () => {
    return {
        useContentEntriesPresenter: () => {
            return {
                list: {
                    vm: {
                        rows: [{ id: "e1#0001" }],
                        selection: {
                            selectedIds: new Set(["e1#0001"]),
                            allSelected: hoisted.allSelected,
                            label: "1 entry"
                        }
                    },
                    actions: { selection: { deselectAll: hoisted.deselectAll } }
                }
            };
        }
    };
});

const click = async () => {
    const view = render(<ActionDelete />);
    fireEvent.click(view.getByText("Trash"));
    await waitFor(() => expect(hoisted.execute).toHaveBeenCalledTimes(1));
};

describe("ActionDelete", () => {
    beforeEach(() => {
        hoisted.showSuccessToast.mockReset();
        hoisted.showResultsDialog.mockReset();
        hoisted.deselectAll.mockReset();
        hoisted.execute.mockReset();
    });

    afterEach(() => {
        cleanup();
    });

    it("shows the background toast and clears the selection when the bulk task started", async () => {
        hoisted.allSelected = true;
        hoisted.execute.mockResolvedValue(true);

        await click();

        await waitFor(() => expect(hoisted.showSuccessToast).toHaveBeenCalledTimes(1));
        expect(hoisted.showSuccessToast.mock.calls[0][0].title).toBe(
            "Entries will be trashed in the background"
        );
        expect(hoisted.deselectAll).toHaveBeenCalledTimes(1);
        expect(hoisted.showResultsDialog).not.toHaveBeenCalled();
    });

    it("shows no toast and keeps the selection when the bulk task did not start", async () => {
        hoisted.allSelected = true;
        hoisted.execute.mockResolvedValue(false);

        await click();

        await Promise.resolve();
        expect(hoisted.showSuccessToast).not.toHaveBeenCalled();
        expect(hoisted.deselectAll).not.toHaveBeenCalled();
        expect(hoisted.showResultsDialog).not.toHaveBeenCalled();
    });

    it("shows the results dialog and clears the selection after a per-item run", async () => {
        hoisted.allSelected = false;
        hoisted.execute.mockResolvedValue(true);

        await click();

        await waitFor(() => expect(hoisted.showResultsDialog).toHaveBeenCalledTimes(1));
        expect(hoisted.deselectAll).toHaveBeenCalledTimes(1);
        expect(hoisted.showSuccessToast).not.toHaveBeenCalled();
    });

    it("passes the selected rows and allSelected to the presenter", async () => {
        hoisted.allSelected = true;
        hoisted.execute.mockResolvedValue(true);

        await click();

        expect(hoisted.execute).toHaveBeenCalledWith([{ id: "e1#0001" }], true);
    });
});
```

- [ ] **Step A2: Run the tests, expect failure**

```bash
yarn test packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms/src/admin/components/ContentEntries/BulkActions/ActionDelete.test.tsx 2>&1 | tail -40
```

Expected: FAIL. The presenter tests receive `undefined` instead of `true`; "shows no toast ... did not start" fails because the toast and the deselect still run.

- [ ] **Step A3: Implement**

Modify `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/abstractions.ts`. Before:

```ts
export interface IBulkDeletePresenter {
    vm: BulkActionViewModel;
    execute(items: CmsContentEntry[], allSelected: boolean): Promise<void>;
}
```

After:

```ts
export interface IBulkDeletePresenter {
    vm: BulkActionViewModel;
    // `true` once the per-item series ran or the background task was started, `false` when
    // nothing was started (a decorator that asks first and was declined).
    execute(items: CmsContentEntry[], allSelected: boolean): Promise<boolean>;
}
```

Modify `packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.ts`. Before:

```ts
    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<void> {
        await this.runner.run(items, allSelected, {
            onItem: (item, report) => this.deleteItem(item, report),
            onBulk: bulkItems => this.deleteBulk(bulkItems)
        });
    }
```

After:

```ts
    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<boolean> {
        await this.runner.run(items, allSelected, {
            onItem: (item, report) => this.deleteItem(item, report),
            onBulk: bulkItems => this.deleteBulk(bulkItems)
        });

        return true;
    }
```

Modify `packages/app-headless-cms/src/admin/components/ContentEntries/BulkActions/ActionDelete.tsx`. Before:

```tsx
                await bulkDelete.execute(selectedItems, selection.allSelected);
                presenter.list.actions.selection.deselectAll();
```

After:

```tsx
                const started = await bulkDelete.execute(selectedItems, selection.allSelected);

                if (!started) {
                    return;
                }

                presenter.list.actions.selection.deselectAll();
```

- [ ] **Step A4: Run the tests, type-check and commit**

```bash
yarn test packages/app-headless-cms/src/presentation/contentEntries/bulkActions/BulkDeletePresenter.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms/src/admin/components/ContentEntries/BulkActions/ActionDelete.test.tsx 2>&1 | tail -40
yarn build -p @webiny/app-headless-cms --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors. Then the pre-commit chain with `yarn build -p @webiny/app-headless-cms --no-cache` and the commit:

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-headless-cms --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "fix(app-headless-cms): show the bulk trash toast only when the trash started" -m "BulkDeletePresenter.execute now reports whether the per-item series ran or the background task was started. ActionDelete shows the background toast, the results dialog and clears the selection only then, so a decorator that asks first and is declined no longer ends in a success toast." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

Other `BulkDeletePresenter` decorators or callers in the repo: only the CMS workflows decorator (Part B) wraps it, and `ActionDelete` is the only caller (grep before the commit; any other caller keeps compiling because it ignores the result).

## Part B: workflows (the guard and the decorator)

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts`. Append a new `describe` at the end of the file (the existing helpers `createReview`, `createUseCases`, `createConfirmation`, `createDeferredConfirmation` and `setup` are reused; nothing existing changes):

```ts
describe("ActiveReviewGuard.confirmBlocking", () => {
    let useCases: ReturnType<typeof createUseCases>;

    const reviews = [
        createReview({ reviewId: "r1", targetId: "entry-1" }),
        createReview({ reviewId: "r2", targetId: "entry-1", targetRevisionId: "entry-1#0002" }),
        createReview({ reviewId: "r3", targetId: "entry-2", model: "cms.page" })
    ];

    beforeEach(() => {
        useCases = createUseCases();
    });

    it("opens the warning with the reviews and the action", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);

        await guard.confirmBlocking({
            reviews,
            action: "trash",
            useCases,
            afterCancel: async () => undefined
        });

        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams).toEqual({ reviews, action: "trash" });
    });

    it("on confirm cancels each distinct target once with no revision, then runs afterCancel, and resolves true", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const order: string[] = [];
        useCases.cancelForDelete.mockImplementation(async params => {
            order.push(`cancel:${params.targetId}`);
            return [];
        });
        const afterCancel = vi.fn(async () => {
            order.push("after");
        });

        const confirmed = await guard.confirmBlocking({
            reviews,
            action: "trash",
            useCases,
            afterCancel
        });

        expect(confirmed).toBe(true);
        expect(useCases.cancelForDelete.mock.calls.map(call => call[0])).toEqual([
            {
                namespace: "cms.article",
                targetId: "entry-1",
                targetRevisionId: null,
                action: "trash"
            },
            {
                namespace: "cms.page",
                targetId: "entry-2",
                targetRevisionId: null,
                action: "trash"
            }
        ]);
        expect(afterCancel).toHaveBeenCalledTimes(1);
        expect(order).toEqual(["cancel:entry-1", "cancel:entry-2", "after"]);
    });

    it("passes the delete action to the dialog and the cancel", async () => {
        const { confirm, confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);

        await guard.confirmBlocking({
            reviews: [reviews[0]],
            action: "delete",
            useCases,
            afterCancel: async () => undefined
        });

        const dialogParams = confirm.mock.calls[0][1] as ActiveReviewWarningDialogParams;
        expect(dialogParams.action).toBe("delete");
        expect(useCases.cancelForDelete.mock.calls[0][0].action).toBe("delete");
    });

    it("resolves false on dismiss without cancelling or running afterCancel", async () => {
        const { confirmation } = createConfirmation("dismiss");
        const { guard } = setup(confirmation);
        const afterCancel = vi.fn(async () => undefined);

        const confirmed = await guard.confirmBlocking({
            reviews,
            action: "trash",
            useCases,
            afterCancel
        });

        expect(confirmed).toBe(false);
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(afterCancel).not.toHaveBeenCalled();
    });

    it("resolves only after afterCancel has finished", async () => {
        const { confirm, release, confirmation } = createDeferredConfirmation();
        const { guard } = setup(confirmation);
        let afterCancelDone = false;
        const settled = vi.fn();

        const promise = guard
            .confirmBlocking({
                reviews,
                action: "trash",
                useCases,
                afterCancel: async () => {
                    afterCancelDone = true;
                }
            })
            .then(settled);

        await vi.waitFor(() => expect(confirm).toHaveBeenCalled());
        expect(settled).not.toHaveBeenCalled();
        release();
        await promise;
        expect(afterCancelDone).toBe(true);
        expect(settled).toHaveBeenCalledWith(true);
    });

    it("rethrows a failing cancel after the dialog and does not run afterCancel", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const failure = new Error("Could not cancel");
        useCases.cancelForDelete.mockRejectedValue(failure);
        const afterCancel = vi.fn(async () => undefined);

        const error = await guard
            .confirmBlocking({ reviews, action: "trash", useCases, afterCancel })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(afterCancel).not.toHaveBeenCalled();
    });

    it("rethrows a failing afterCancel after the dialog", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation);
        const failure = new Error("The bulk task could not start");

        const error = await guard
            .confirmBlocking({
                reviews,
                action: "trash",
                useCases,
                afterCancel: async () => {
                    throw failure;
                }
            })
            .catch(e => e);

        expect(error).toBe(failure);
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
    });
});
```

Modify `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts`.

Imports. Add after the existing `CancelForDeleteParams` import (one per line):

```ts
import type { ListBlockingReviewsParams } from "@webiny/app-workflows/review/gateway/IReviewGateway.js";
import type { BlockingReview } from "@webiny/app-workflows/review/domain/types.js";
import { createBlockingReview } from "@webiny/app-workflows/review/testing/reviewFixtures.js";
import { NO_ACCESS_MESSAGE } from "@webiny/app-workflows/review/presentation/noAccessMessage.js";
import { GENERIC_ERROR } from "@webiny/app-workflows/review/presentation/actionDialog/reviewErrorMessages.js";
import { REVIEW_TOAST_DURATION } from "@webiny/app-workflows/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "@webiny/app-workflows/review/toasts/constants.js";
```

The decorator reads the model from `CmsModelContext` (the rows carry no `modelId`), so the `entry()` helper stays as it is. The blocking reviews come from Task 8's fixture `createBlockingReview` (no local copy). Add after it:

```ts
function createModelContext(model: CmsModel = MODEL) {
    return { getModel: vi.fn(() => model), setModel: vi.fn() };
}
```

Add the import `import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";` with the other `@webiny/app-headless-cms` imports.

The helpers gain the pre-check method and the error toast. Before (as Task 9's hunk H leaves the file: it added the untyped `listBlockingReviews` line):

```ts
function createUseCases() {
    return {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => []),
        listBlockingReviews: vi.fn(async () => [])
    };
}

function createNotifications() {
    return { notify: vi.fn(), success: vi.fn(), warning: vi.fn() };
}
```

After:

```ts
function createUseCases() {
    return {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => []),
        listBlockingReviews: vi.fn(
            async (_params: ListBlockingReviewsParams): Promise<BlockingReview[]> => []
        )
    };
}

function createNotifications() {
    return { notify: vi.fn(), success: vi.fn(), warning: vi.fn(), error: vi.fn() };
}
```

Because `execute` now returns a boolean, the two existing doubles of the file return `true`. In `setupForwarding`, before:

```ts
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => undefined)
        };
        const useCases = createUseCases();
        const guard = {
```

After:

```ts
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        const useCases = createUseCases();
        const guard = {
```

In `setupIntegrated`, before (the `decoratee.execute` double ends with the `decoratee.vm.results.push` loop):

```ts
                        decoratee.vm.results.push({ title: item.entryId, status: "success" });
                    }
                }
            })
        };
```

After:

```ts
                        decoratee.vm.results.push({ title: item.entryId, status: "success" });
                    }
                }
                return true;
            })
        };
```

The forwarding setup resolves the decorator, which now needs `Notifications`, and the fake guard needs the new method. In `setupForwarding`, before:

```ts
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(async <TItem>(params: GuardAbstraction.BulkParams<TItem>) => {
                await params.run(params.items, false);
                await params.run(params.items, true);
            })
        };

        const container = new Container();
        container.registerInstance(
            GuardAbstraction,
            guard as unknown as GuardAbstraction.Interface
        );
```

After:

```ts
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(async <TItem>(params: GuardAbstraction.BulkParams<TItem>) => {
                await params.run(params.items, false);
                await params.run(params.items, true);
            }),
            confirmBlocking: vi.fn()
        };

        const container = new Container();
        container.registerInstance(
            Notifications,
            createNotifications() as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
        container.registerInstance(
            GuardAbstraction,
            guard as unknown as GuardAbstraction.Interface
        );
```

The 8a integrated setup (`setupIntegrated`) resolves the same decorator, so it registers the model too. Before:

```ts
        container.registerInstance(
            Notifications,
            notifications as unknown as Notifications.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            release,
```

After:

```ts
        container.registerInstance(
            Notifications,
            notifications as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            release,
```

The 8a test that forwarded `allSelected` changes (its premise is gone: the first run and the retry both run per item now, and `allSelected` takes the other branch). Before:

```ts
    it("forwards allSelected on the first run and always false on the retry", async () => {
        const { decoratee, presenter } = setupForwarding();
        const items = [entry("e1")];

        await presenter.execute(items, true);

        expect(decoratee.execute).toHaveBeenNthCalledWith(1, items, true);
        expect(decoratee.execute).toHaveBeenNthCalledWith(2, items, false);
    });
```

After:

```ts
    it("runs the series per item on the first run and on the retry when not all rows are selected", async () => {
        const { decoratee, guard, useCases, presenter } = setupForwarding();
        const items = [entry("e1")];

        await presenter.execute(items, false);

        expect(decoratee.execute).toHaveBeenNthCalledWith(1, items, false);
        expect(decoratee.execute).toHaveBeenNthCalledWith(2, items, false);
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        expect(useCases.listBlockingReviews).not.toHaveBeenCalled();
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
    });
```

Append these `describe` blocks at the end of the file.

```ts
describe("BulkDeletePresenterReviewDecorator (all selected: pre-check by ids)", () => {
    function setupPrecheck(model: CmsModel = MODEL) {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        const useCases = createUseCases();
        const notifications = createNotifications();
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(),
            confirmBlocking: vi.fn(async (params: GuardAbstraction.ConfirmBlockingParams) => {
                await params.afterCancel();
                return true;
            })
        };

        const container = new Container();
        container.registerInstance(
            Notifications,
            notifications as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext(model));
        container.registerInstance(
            GuardAbstraction,
            guard as unknown as GuardAbstraction.Interface
        );
        container.registerInstance(
            CmsReviewUseCases,
            useCases as unknown as CmsReviewUseCases.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            decoratee,
            useCases,
            notifications,
            guard,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [entry("e1"), entry("e2"), entry("e3")];

    it("asks for the blocking reviews of the entry ids and runs the bulk task when none block", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();

        await presenter.execute(items, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(1);
        expect(useCases.listBlockingReviews).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetIds: ["e1", "e2", "e3"]
        });
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith(items, true);
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(guard.runBulk).not.toHaveBeenCalled();
    });

    it("takes the namespace from the model context, not from the rows", async () => {
        const pageModel = { modelId: "page", singularApiName: "Page" } as CmsModel;
        const { useCases, presenter } = setupPrecheck(pageModel);

        await presenter.execute(items, true);

        expect(useCases.listBlockingReviews.mock.calls[0][0].namespace).toBe("cms.page");
    });

    it("opens the warning with the blocking reviews and runs the bulk task after the cancel", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();
        const reviews = [createBlockingReview({ reviewId: "review-e1", targetId: "e1" }), createBlockingReview({ reviewId: "review-e3", targetId: "e3" })];
        useCases.listBlockingReviews.mockResolvedValue(reviews);

        await presenter.execute(items, true);

        expect(guard.confirmBlocking).toHaveBeenCalledTimes(1);
        const params = guard.confirmBlocking.mock.calls[0][0];
        expect(params.reviews).toEqual(reviews);
        expect(params.action).toBe("trash");
        expect(params.useCases).toBe(useCases);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith(items, true);
    });

    it("does not start the bulk task before the warning is confirmed", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockResolvedValue([createBlockingReview({ reviewId: "review-e1", targetId: "e1" })]);
        guard.confirmBlocking.mockImplementation(async () => {
            expect(decoratee.execute).not.toHaveBeenCalled();
            return false;
        });

        await presenter.execute(items, true);

        expect(guard.confirmBlocking).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("runs nothing when the warning is dismissed", async () => {
        const { decoratee, useCases, notifications, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockResolvedValue([createBlockingReview({ reviewId: "review-e1", targetId: "e1" })]);
        guard.confirmBlocking.mockResolvedValue(false);

        await presenter.execute(items, true);

        expect(decoratee.execute).not.toHaveBeenCalled();
        expect(notifications.error).not.toHaveBeenCalled();
    });

    it("lets a failing cancel propagate and does not start the bulk task", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockResolvedValue([createBlockingReview({ reviewId: "review-e1", targetId: "e1" })]);
        const failure = new Error("Could not cancel");
        guard.confirmBlocking.mockRejectedValue(failure);

        const error = await presenter.execute(items, true).catch(e => e);

        expect(error).toBe(failure);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("checks 450 ids in three sequential calls of 200, 200 and 50", async () => {
        const { useCases, presenter } = setupPrecheck();
        const many: CmsContentEntry[] = [];
        for (let index = 1; index <= 450; index++) {
            many.push(entry(`e${index}`));
        }
        let inFlight = 0;
        let maxInFlight = 0;
        useCases.listBlockingReviews.mockImplementation(async () => {
            inFlight++;
            maxInFlight = Math.max(maxInFlight, inFlight);
            await Promise.resolve();
            inFlight--;
            return [];
        });

        await presenter.execute(many, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(3);
        const sizes = useCases.listBlockingReviews.mock.calls.map(call => {
            return call[0].targetIds.length;
        });
        expect(sizes).toEqual([200, 200, 50]);
        expect(useCases.listBlockingReviews.mock.calls[0][0].targetIds[0]).toBe("e1");
        expect(useCases.listBlockingReviews.mock.calls[1][0].targetIds[0]).toBe("e201");
        expect(useCases.listBlockingReviews.mock.calls[2][0].targetIds[0]).toBe("e401");
        expect(maxInFlight).toBe(1);
    });

    it("sends exactly 200 ids in one call", async () => {
        const { useCases, presenter } = setupPrecheck();
        const exact: CmsContentEntry[] = [];
        for (let index = 1; index <= 200; index++) {
            exact.push(entry(`e${index}`));
        }

        await presenter.execute(exact, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(1);
        expect(useCases.listBlockingReviews.mock.calls[0][0].targetIds).toHaveLength(200);
    });

    it("sends each entry id once when several revisions of an entry are loaded", async () => {
        const { useCases, presenter } = setupPrecheck();
        const rows = [entry("e1"), { ...entry("e1"), id: "e1#0002" } as CmsContentEntry, entry("e2")];

        await presenter.execute(rows, true);

        expect(useCases.listBlockingReviews.mock.calls[0][0].targetIds).toEqual(["e1", "e2"]);
    });

    it("collects the reviews of every chunk into one warning", async () => {
        const { useCases, guard, presenter } = setupPrecheck();
        const many: CmsContentEntry[] = [];
        for (let index = 1; index <= 250; index++) {
            many.push(entry(`e${index}`));
        }
        useCases.listBlockingReviews
            .mockResolvedValueOnce([createBlockingReview({ reviewId: "review-e5", targetId: "e5" })])
            .mockResolvedValueOnce([createBlockingReview({ reviewId: "review-e230", targetId: "e230" })]);

        await presenter.execute(many, true);

        expect(guard.confirmBlocking).toHaveBeenCalledTimes(1);
        const params = guard.confirmBlocking.mock.calls[0][0];
        expect(params.reviews.map(review => review.targetId)).toEqual(["e5", "e230"]);
    });

    it("shows the generic error toast and runs nothing when the pre-check fails", async () => {
        const { decoratee, useCases, notifications, guard, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockRejectedValue(new Error("Network down"));

        await presenter.execute(items, true);

        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(notifications.error).toHaveBeenCalledWith({
            title: GENERIC_ERROR,
            position: REVIEW_TOAST_POSITION,
            duration: REVIEW_TOAST_DURATION,
            dismissible: true
        });
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("shows the no-access text for a not authorized error", async () => {
        const { decoratee, useCases, notifications, presenter } = setupPrecheck();
        useCases.listBlockingReviews.mockRejectedValue(
            new GraphQLOperationError({
                message: "Not authorized.",
                code: ReviewErrorCode.NotAuthorized,
                data: null
            })
        );

        await presenter.execute(items, true);

        expect(notifications.error.mock.calls[0][0].title).toBe(NO_ACCESS_MESSAGE);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("stops at the first failing chunk and runs nothing", async () => {
        const { decoratee, useCases, notifications, guard, presenter } = setupPrecheck();
        const many: CmsContentEntry[] = [];
        for (let index = 1; index <= 450; index++) {
            many.push(entry(`e${index}`));
        }
        useCases.listBlockingReviews
            .mockResolvedValueOnce([createBlockingReview({ reviewId: "review-e5", targetId: "e5" })])
            .mockRejectedValueOnce(new Error("Network down"));

        await presenter.execute(many, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledTimes(2);
        expect(notifications.error).toHaveBeenCalledTimes(1);
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("does not check anything when no row is selected", async () => {
        const { decoratee, useCases, guard, presenter } = setupPrecheck();

        await presenter.execute([], true);

        expect(useCases.listBlockingReviews).not.toHaveBeenCalled();
        expect(guard.confirmBlocking).not.toHaveBeenCalled();
        expect(decoratee.execute).toHaveBeenCalledWith([], true);
    });
});

describe("BulkDeletePresenterReviewDecorator (result: did the bulk trash start)", () => {
    function setupResult() {
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        const useCases = createUseCases();
        const guard = {
            run: vi.fn(),
            runBulk: vi.fn(async <TItem>(params: GuardAbstraction.BulkParams<TItem>) => {
                await params.run(params.items, false);
            }),
            confirmBlocking: vi.fn(async (params: GuardAbstraction.ConfirmBlockingParams) => {
                await params.afterCancel();
                return true;
            })
        };

        const container = new Container();
        container.registerInstance(
            Notifications,
            createNotifications() as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
        container.registerInstance(
            GuardAbstraction,
            guard as unknown as GuardAbstraction.Interface
        );
        container.registerInstance(
            CmsReviewUseCases,
            useCases as unknown as CmsReviewUseCases.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return { decoratee, useCases, guard, presenter: container.resolve(BulkDeletePresenter) };
    }

    const items = [entry("e1"), entry("e2")];

    it("is true after a per-item run", async () => {
        const { presenter } = setupResult();

        const started = await presenter.execute(items, false);

        expect(started).toBe(true);
    });

    it("is true when nothing blocks and the bulk task started", async () => {
        const { presenter } = setupResult();

        const started = await presenter.execute(items, true);

        expect(started).toBe(true);
    });

    it("is the result of the bulk task when nothing blocks", async () => {
        const { decoratee, presenter } = setupResult();
        decoratee.execute.mockResolvedValue(false);

        const started = await presenter.execute(items, true);

        expect(started).toBe(false);
    });

    it("is true when the warning was confirmed and the bulk task started", async () => {
        const { useCases, presenter } = setupResult();
        useCases.listBlockingReviews.mockResolvedValue([createBlockingReview({ reviewId: "review-e1", targetId: "e1" })]);

        const started = await presenter.execute(items, true);

        expect(started).toBe(true);
    });

    it("is false when the warning was dismissed", async () => {
        const { useCases, guard, presenter } = setupResult();
        useCases.listBlockingReviews.mockResolvedValue([createBlockingReview({ reviewId: "review-e1", targetId: "e1" })]);
        guard.confirmBlocking.mockResolvedValue(false);

        const started = await presenter.execute(items, true);

        expect(started).toBe(false);
    });

    it("is false when the pre-check failed", async () => {
        const { useCases, presenter } = setupResult();
        useCases.listBlockingReviews.mockRejectedValue(new Error("Network down"));

        const started = await presenter.execute(items, true);

        expect(started).toBe(false);
    });
});

describe("BulkDeletePresenterReviewDecorator (all selected, with the real guard)", () => {
    function setupReal(decision: "confirm" | "dismiss") {
        const confirm = vi.fn(
            async (
                _name: string,
                _params: unknown,
                execute?: (data: unknown) => Promise<unknown>
            ) => {
                if (decision === "dismiss") {
                    return false;
                }
                return execute ? execute(undefined) : undefined;
            }
        );
        const order: string[] = [];
        const useCases = createUseCases();
        useCases.listBlockingReviews.mockResolvedValue([
            createBlockingReview({ reviewId: "review-e1", targetId: "e1" }),
            createBlockingReview({ reviewId: "review-e3", targetId: "e3" })
        ]);
        useCases.cancelForDelete.mockImplementation(async params => {
            order.push(`cancel:${params.targetId}`);
            return [];
        });
        const decoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => {
                order.push("bulk");
                return true;
            })
        };

        const container = new Container();
        container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
        container.registerInstance(
            Notifications,
            createNotifications() as unknown as Notifications.Interface
        );
        container.registerInstance(CmsModelContext, createModelContext());
        container.register(ActiveReviewBlockCollector).inSingletonScope();
        container.register(ActiveReviewGuard).inSingletonScope();
        container.registerInstance(
            CmsReviewUseCases,
            useCases as unknown as CmsReviewUseCases.Interface
        );
        container.registerInstance(BulkDeletePresenter, decoratee);
        container.registerDecorator(BulkDeletePresenterReviewDecorator);

        return {
            confirm,
            order,
            useCases,
            decoratee,
            presenter: container.resolve(BulkDeletePresenter)
        };
    }

    const items = [entry("e1"), entry("e2"), entry("e3")];

    it("warns, cancels each blocked entry without a revision, then starts the bulk task for every row", async () => {
        const { confirm, order, useCases, decoratee, presenter } = setupReal("confirm");

        await presenter.execute(items, true);

        expect(confirm).toHaveBeenCalledTimes(1);
        const dialogParams = confirm.mock.calls[0][1] as GuardAbstraction.DialogParams;
        expect(dialogParams.action).toBe("trash");
        expect(dialogParams.reviews.map(review => review.reviewId)).toEqual([
            "review-e1",
            "review-e3"
        ]);
        expect(useCases.cancelForDelete.mock.calls.map(call => call[0])).toEqual([
            { namespace: "cms.article", targetId: "e1", targetRevisionId: null, action: "trash" },
            { namespace: "cms.article", targetId: "e3", targetRevisionId: null, action: "trash" }
        ]);
        expect(decoratee.execute).toHaveBeenCalledTimes(1);
        expect(decoratee.execute).toHaveBeenCalledWith(items, true);
        expect(order).toEqual(["cancel:e1", "cancel:e3", "bulk"]);
    });

    it("cancels nothing and starts nothing when the warning is dismissed", async () => {
        const { useCases, decoratee, presenter } = setupReal("dismiss");

        await presenter.execute(items, true);

        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
        expect(decoratee.execute).not.toHaveBeenCalled();
    });

    it("rejects and starts no bulk task when a cancel fails", async () => {
        const { useCases, decoratee, presenter } = setupReal("confirm");
        const failure = new Error("Could not cancel");
        useCases.cancelForDelete.mockRejectedValue(failure);

        const error = await presenter.execute(items, true).catch(e => e);

        expect(error).toBe(failure);
        expect(decoratee.execute).not.toHaveBeenCalled();
    });
});
```

Modify `packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx`. The decorator resolves `Notifications`, and the fake guard declares the new method. Add the imports after the `ActiveReviewGuard` import:

```ts
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
```

In `describe("CmsReviewTrashFeature")`, `setup()`, before (as Task 9's hunk H leaves the file: it changed the `useCases` line):

```ts
            runBulk: vi.fn(async <TItem,>(params: ActiveReviewGuard.BulkParams<TItem>) =>
                params.run(params.items, false)
            )
        };
        const useCases = { cancelForDelete: vi.fn(), listBlockingReviews: vi.fn() };
        const container = new Container();
```

After:

```ts
            runBulk: vi.fn(async <TItem,>(params: ActiveReviewGuard.BulkParams<TItem>) =>
                params.run(params.items, false)
            ),
            confirmBlocking: vi.fn()
        };
        const useCases = { cancelForDelete: vi.fn(), listBlockingReviews: vi.fn(async () => []) };
        const container = new Container();
        container.registerInstance(Notifications, {
            error: vi.fn()
        } as unknown as Notifications.Interface);
        container.registerInstance(CmsModelContext, { getModel: () => MODEL, setModel: vi.fn() });
```

Before:

```ts
        container.registerInstance(BulkDeletePresenter, {
            vm: { processing: false, results: [] },
            execute: vi.fn(async () => undefined)
        });
        CmsReviewTrashFeature.register(container);
        return { container, guard, useCases };
    }
```

After:

```ts
        const bulkDecoratee = {
            vm: { processing: false, results: [] },
            execute: vi.fn(async (_items: CmsContentEntry[], _allSelected: boolean) => true)
        };
        container.registerInstance(BulkDeletePresenter, bulkDecoratee);
        CmsReviewTrashFeature.register(container);
        return { container, guard, useCases, bulkDecoratee };
    }
```

Append inside the same `describe`, after the last `it`:

```ts
    it("checks the loaded rows for reviews in progress before the bulk task, through the decorated presenter", async () => {
        const { container, guard, useCases, bulkDecoratee } = setup();
        const rows = [{ id: "e1#0001", entryId: "e1" } as CmsContentEntry];

        await container.resolve(BulkDeletePresenter).execute(rows, true);

        expect(useCases.listBlockingReviews).toHaveBeenCalledWith({
            namespace: "cms.article",
            targetIds: ["e1"]
        });
        expect(guard.runBulk).not.toHaveBeenCalled();
        expect(bulkDecoratee.execute).toHaveBeenCalledWith(rows, true);
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -40
```

Expected: FAIL. The guard test fails with `guard.confirmBlocking is not a function`; the decorator tests fail because `listBlockingReviews` is never called (the decorator still hands `allSelected` to `runBulk`) and the pre-check cases find neither the listing call nor `confirmBlocking`.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/review/trash/ActiveReviewGuard.ts`. Add the import after the `ActiveReviewOnTrashData` import:

```ts
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
```

Before:

```ts
export interface IActiveReviewGuard {
```

After:

```ts
export interface ActiveReviewConfirmBlockingParams {
    reviews: BlockingReview[];
    action: ReviewForDeleteAction;
    useCases: IReviewCancelForDeleteUseCases;
    /*
     * Runs inside the dialog's confirm, after every distinct target was cancelled.
     */
    afterCancel: () => Promise<void>;
}

export interface IActiveReviewGuard {
```

Before:

```ts
    runBulk<TItem>(params: ActiveReviewBulkParams<TItem>): Promise<void>;
}
```

After:

```ts
    runBulk<TItem>(params: ActiveReviewBulkParams<TItem>): Promise<void>;
    /*
     * Opens the warning for reviews that are already known to block (a pre-check). On confirm it
     * cancels each distinct target (no revision) and runs `afterCancel`; it resolves `true` when
     * confirmed and done, `false` when the dialog is dismissed. An error of the cancel loop or of
     * `afterCancel` is rethrown after the dialog has closed.
     */
    confirmBlocking(params: ActiveReviewConfirmBlockingParams): Promise<boolean>;
}
```

Before:

```ts
    export type BulkParams<TItem> = ActiveReviewBulkParams<TItem>;
```

After:

```ts
    export type BulkParams<TItem> = ActiveReviewBulkParams<TItem>;
    export type ConfirmBlockingParams = ActiveReviewConfirmBlockingParams;
```

Modify `packages/app-workflows/src/review/trash/ActiveReviewGuardImpl.ts`. Add the import after the `ActiveReviewBulkParams` import:

```ts
import type { ActiveReviewConfirmBlockingParams } from "./ActiveReviewGuard.js";
```

Replace the tail of `runBulk` and add the new method. Before (from the `const targets` line to the end of the class):

```ts
        const targets = distinctReviewTargets(reviews);
        const dialogParams: ActiveReviewWarningDialogParams = { reviews, action };

        const outcome = await this.confirmation.confirm<
            void,
            ActiveReviewWarningDialogParams,
            RetryOutcome<void>
        >(ACTIVE_REVIEW_WARNING_DIALOG, dialogParams, async () => {
            try {
                for (const target of targets) {
                    await useCases.cancelForDelete({
                        namespace: target.model,
                        targetId: target.targetId,
                        targetRevisionId: null,
                        action
                    });
                }

                const retryRunId = this.collector.begin(retryTargetIds);
                try {
                    await run(retryItems, true);
                } finally {
                    this.collector.end(retryRunId);
                    this.collector.drain(retryRunId);
                }

                return { failed: false, value: undefined };
            } catch (retryError) {
                return { failed: true, error: retryError };
            }
        });

        if (outcome === false) {
            return;
        }
        if (outcome.failed) {
            throw outcome.error;
        }
    }
}
```

After:

```ts
        const afterCancel = async (): Promise<void> => {
            const retryRunId = this.collector.begin(retryTargetIds);
            try {
                await run(retryItems, true);
            } finally {
                this.collector.end(retryRunId);
                this.collector.drain(retryRunId);
            }
        };

        await this.confirmBlocking({ reviews, action, useCases, afterCancel });
    }

    async confirmBlocking(params: ActiveReviewConfirmBlockingParams): Promise<boolean> {
        const { reviews, action, useCases, afterCancel } = params;

        const targets = distinctReviewTargets(reviews);
        const dialogParams: ActiveReviewWarningDialogParams = { reviews, action };

        const outcome = await this.confirmation.confirm<
            void,
            ActiveReviewWarningDialogParams,
            RetryOutcome<void>
        >(ACTIVE_REVIEW_WARNING_DIALOG, dialogParams, async () => {
            try {
                for (const target of targets) {
                    await useCases.cancelForDelete({
                        namespace: target.model,
                        targetId: target.targetId,
                        targetRevisionId: null,
                        action
                    });
                }

                await afterCancel();

                return { failed: false, value: undefined };
            } catch (retryError) {
                return { failed: true, error: retryError };
            }
        });

        if (outcome === false) {
            return false;
        }
        if (outcome.failed) {
            throw outcome.error;
        }

        return true;
    }
}
```

Modify `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts`. Replace the whole file:

```ts
import { Notifications } from "@webiny/app-admin/features/notifications/abstractions.js";
import { CmsModelContext } from "@webiny/app-headless-cms/features/contentEntry/abstractions.js";
import { BulkDeletePresenter } from "@webiny/app-headless-cms/presentation/contentEntries/bulkActions/abstractions.js";
import type { CmsContentEntry } from "@webiny/app-headless-cms/types.js";
import type { BlockingReview } from "@webiny/app-workflows/review/domain/types.js";
import { classifyReviewActionError } from "@webiny/app-workflows/review/presentation/actionDialog/classifyReviewActionError.js";
import { getActionErrorMessage } from "@webiny/app-workflows/review/presentation/actionDialog/getActionErrorMessage.js";
import { REVIEW_TOAST_DURATION } from "@webiny/app-workflows/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "@webiny/app-workflows/review/toasts/constants.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { createAppName } from "~/utils/appName.js";

// The server refuses more ids per call (BLOCKING_REVIEWS_MAX_IDS, R265).
const PRECHECK_CHUNK_SIZE = 200;

class BulkDeletePresenterReviewDecoratorImpl implements BulkDeletePresenter.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private notifications: Notifications.Interface,
        private modelAccessor: CmsModelContext.Interface,
        private decoratee: BulkDeletePresenter.Interface
    ) {}

    get vm() {
        return this.decoratee.vm;
    }

    async execute(items: CmsContentEntry[], allSelected: boolean): Promise<boolean> {
        if (items.length === 0) {
            return this.decoratee.execute(items, allSelected);
        }

        if (!allSelected) {
            await this.guard.runBulk({
                items,
                getTargetId: item => item.entryId,
                run: async batch => {
                    await this.decoratee.execute(batch, false);
                },
                useCases: this.useCases
            });
            // The per-item results are shown even when the warning was dismissed (8a).
            return true;
        }

        // All loaded rows go to one background task that swallows the workflows refusal (R265),
        // so the reviews in progress are asked for first, by entry id, in chunks of 200.
        const allIds = items.map(item => item.entryId);
        const entryIds = Array.from(new Set(allIds));
        const model = this.modelAccessor.getModel();
        const namespace = createAppName(model);
        const reviews: BlockingReview[] = [];

        try {
            for (let start = 0; start < entryIds.length; start += PRECHECK_CHUNK_SIZE) {
                const targetIds = entryIds.slice(start, start + PRECHECK_CHUNK_SIZE);
                const found = await this.useCases.listBlockingReviews({ namespace, targetIds });
                reviews.push(...found);
            }
        } catch (error) {
            const errorKind = classifyReviewActionError(error);
            const title = getActionErrorMessage(errorKind, error);
            this.notifications.error({
                title,
                position: REVIEW_TOAST_POSITION,
                duration: REVIEW_TOAST_DURATION,
                dismissible: true
            });
            return false;
        }

        if (reviews.length === 0) {
            return this.decoratee.execute(items, true);
        }

        let started = false;
        const confirmed = await this.guard.confirmBlocking({
            reviews,
            action: "trash",
            useCases: this.useCases,
            afterCancel: async () => {
                started = await this.decoratee.execute(items, true);
            }
        });

        return confirmed && started;
    }
}

export const BulkDeletePresenterReviewDecorator = BulkDeletePresenter.createDecorator({
    decorator: BulkDeletePresenterReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard, CmsReviewUseCases, Notifications, CmsModelContext]
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts 2>&1 | tail -40
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -40
```

Expected: PASS. The `ActiveReviewGuard.test.ts` run includes every existing `run` and `runBulk` test, unchanged.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard.test.ts packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter.test.ts packages/app-workflows/src/review/trash/distinctReviewTargets.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts packages/app-website-builder-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors (the WB trash tests mock the guard with `as unknown as`, so the new method needs no change there; the build proves it).

- [ ] **Step 6: Pre-commit chain and commit**

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-headless-cms-workflows): warn before the bulk trash of all loaded rows" -m "The bulk trash of all loaded rows runs as one background task that swallows the workflows refusal, so 8a showed no warning. The decorator now asks for the reviews in progress of those entries by id, in chunks of 200, and opens the 8a warning through the new ActiveReviewGuard.confirmBlocking before it starts the task. runBulk is rebuilt on confirmBlocking with unchanged behaviour. A failed pre-check shows the 8a error text in a toast and runs nothing." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **The false success toast is fixed in base (user decision Q39).** Part A is a first `fix(app-headless-cms)` commit: `BulkDeletePresenter.execute` returns `Promise<boolean>` and `ActionDelete` acts only on `true`. The decorator returns `false` for a dismissed warning and a failed pre-check. Note for the user: the per-item path (`allSelected` false) still returns `true` after a dismissed warning, because 8a shows the per-item results dialog there.
- **"The 8a action error toast" does not exist.** 8a shows action errors only inside dialogs (R214, R220). The decorator has no dialog, so it uses `Notifications.error` with the existing 8a error texts (`getActionErrorMessage` over `classifyReviewActionError`) and the 8a toast position, duration and `dismissible` (`REVIEW_TOAST_*`). No new copy.
- **The namespace comes from `CmsModelContext`, not from the rows (contract gap, R265).** The contract does not say where `namespace` comes from. The loaded list rows carry no `modelId` at run time, so the decorator injects `CmsModelContext` (the token the base `BulkDeletePresenter` also uses) and takes `createAppName(getModel())`. R265 should say so. The decorator gains `Notifications` and `CmsModelContext`.
- **`ConfirmBlockingParams` is declared as `ActiveReviewConfirmBlockingParams`** beside `ActiveReviewBulkParams` and aliased as `ActiveReviewGuard.ConfirmBlockingParams` in the namespace (R238: outside the declaring file the namespace name is the name).
- **Existing expectation changed:** `BulkDeletePresenterReviewDecorator.test.ts` "forwards allSelected on the first run and always false on the retry" is replaced (the `run` callback is `batch => decoratee.execute(batch, false)`; `allSelected` true no longer reaches `runBulk`). The `ActiveReviewGuard.test.ts` `run` and `runBulk` tests, and the three-case WB decorator tests, stay unchanged.
- **Task 8 names match** (checked in the consistency pass): `listBlockingReviews(params: ListBlockingReviewsParams): Promise<BlockingReview[]>` on `IReviewCancelForDeleteUseCases`, `ListBlockingReviewsParams` in `IReviewGateway.ts`, `BlockingReview` in `domain/types.ts`, the fixture `createBlockingReview` in `testing/reviewFixtures.ts`. `app-workflows` is consumed through its build output by the CMS package, hence the build before the CMS tests.
