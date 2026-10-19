### Task 13: The trash guard injects `CancelReviewsForDeleteUseCase`; the trash decorators drop the per-app bundles

R265, R348 (#32, #33), R349, R352, R353, R355; Q69, Q70; Review Focus 5, 8 (`../00-shared.md`). The admin-layers Global Constraints apply unchanged (R342; one class per file; one named import per line; no inline object types; no nested call arguments; namespace types outside the declaring file; targeted tests by path, one command at a time; the pre-commit chain; one commit). Inherited: 8a R204 (the decorated base use cases and presenters), R249, R265 (the bulk pre-check), Q27 (the first-pass summary).

The trash guard and the CMS and Website Builder trash decorators are the last consumers of the per-app review bundles. The guard injects the cancel use case and routes each cancel by the blocked review's namespace (R348 #32); the CMS bulk pre-check injects `ListBlockingReviewsUseCase` (#33). After this task nothing outside the old bundles' own files and tests imports them (Task 14 deletes them).

- **`ActiveReviewGuard`** (R352): dependencies `[CancelReviewsForDeleteUseCase, Confirmation, ActiveReviewBlockCollector, Notifications]`. `run`, `runBulk` and `confirmBlocking` call `cancelReviewsForDeleteUseCase.execute` with the same `{ namespace: target.model, targetId, targetRevisionId, action }` per distinct target as before (Review Focus 5). `ActiveReviewGuardParams`, `ActiveReviewBulkParams` and `ActiveReviewConfirmBlockingParams` lose `useCases` (R353). The guard stays a singleton of `ActiveReviewTrashFeature`; it is first resolved when a decorated base use case or presenter is, never in the plugin pass (R349).
- **CMS decorators.** `BulkDeletePresenterReviewDecorator` deps `[ActiveReviewGuard, ListBlockingReviewsUseCase, Notifications, CmsModelContext]` (the use case takes the bundle's place); the pre-check calls `listBlockingReviewsUseCase.execute({ namespace, targetIds })` in chunks of 200 as before. `DeleteEntryUseCaseReviewDecorator`, `DeleteEntryRevisionUseCaseReviewDecorator`, `PermanentlyDeleteEntryUseCaseReviewDecorator` deps `[ActiveReviewGuard]`.
- **WB decorators.** `BulkDeletePresenterReviewDecorator`, `DeletePageUseCaseReviewDecorator`, `DeletePageRevisionUseCaseReviewDecorator` deps `[ActiveReviewGuard]`. WB `listBlockingReviews` stays the empty stub inside `WbReviewGateway` (no request, R357); no WB code calls it.
- **Tests (R355).** Two vitest fakes in `[AWRT]`: `createTrashUseCaseFakes()` (`cancelReviewsForDelete` and `listBlockingReviews`, each `{ execute }`, both answering `[]`) and `registerTrashUseCaseFakes(container, fakes)`. Every guard and decorator test registers them in place of the bundle; the cancel and pre-check assertions read `useCases.cancelReviewsForDelete.execute` / `useCases.listBlockingReviews.execute` and keep their exact arguments; the assertions that the decorators handed the bundle to the guard become assertions that no `useCases` is handed over. No test imports `IReviewCancelForDeleteUseCases`, a per-app bundle token or a parameter type from the app gateway file any more.

**Files:**
- Create: `packages/app-workflows/src/review/testing/createTrashUseCaseFakes.ts`
- Create: `packages/app-workflows/src/review/testing/registerTrashUseCaseFakes.ts`
- Modify: `packages/app-workflows/src/review/trash/ActiveReviewGuard/{abstractions.ts,ActiveReviewGuard.ts}`
- Modify: `packages/app-headless-cms-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeleteEntryUseCaseReviewDecorator,DeleteEntryRevisionUseCaseReviewDecorator,PermanentlyDeleteEntryUseCaseReviewDecorator}.ts`
- Modify: `packages/app-website-builder-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeletePageUseCaseReviewDecorator,DeletePageRevisionUseCaseReviewDecorator}.ts`
- Modify (tests): `packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts`, `packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx`, `packages/app-headless-cms-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeleteEntryUseCaseReviewDecorator,DeleteEntryRevisionUseCaseReviewDecorator,PermanentlyDeleteEntryUseCaseReviewDecorator}.test.ts`, `packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx`, `packages/app-website-builder-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeletePageUseCaseReviewDecorator,DeletePageRevisionUseCaseReviewDecorator}.test.ts`, `packages/app-website-builder-workflows/src/features/trash/feature.test.tsx`

**Interfaces:**
- Consumes: Task 9 (`CancelReviewsForDeleteUseCase` with `Params = CancelForDeleteParams`, `ListBlockingReviewsUseCase` with `Params = ListBlockingReviewsParams`, both registered by `ReviewServicesFeature`), Task 11 (`UseCaseFake` in `[AWRT]/createReviewUseCaseFakes.ts`). Existing (verified): `ActiveReviewGuard` (`[AWR]/trash/ActiveReviewGuard/`, `Workflows/ActiveReviewGuard`), `ActiveReviewTrashFeature` (`[AWR]/trash/feature.ts`, guard singleton), `distinctReviewTargets`, `mergeBlockingReviews`, `parseActiveReviewOnTrash` (`[AWR]/trash/`), `createAppName` (`[CMS]/utils/appName.ts`), `CmsModelContext` (`@webiny/app-headless-cms/features/contentEntry/abstractions.js`), the base `BulkDeletePresenter`, `DeleteEntryUseCase`, `DeleteEntryRevisionUseCase`, `PermanentlyDeleteEntryUseCase`, `DeletePageUseCase`, `DeletePageRevisionUseCase` abstractions (unchanged).
- Produces (matches the contract): the R352 trash rows; R353: the three guard parameter interfaces without `useCases`; `createTrashUseCaseFakes`, `TrashUseCaseFakes`, `registerTrashUseCaseFakes` (Task 14 keeps them).

**Test runner note:** admin packages, `yarn test <path>` only, one command at a time; `.tsx` tests import `React`. Type check: `yarn build -p @webiny/<package> --no-cache`.

- [ ] **Step 1: Write the failing tests**

**1a. The fakes.** Create `packages/app-workflows/src/review/testing/createTrashUseCaseFakes.ts`:

```ts
import { vi } from "vitest";
import type { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import type { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import type { UseCaseFake } from "./createReviewUseCaseFakes.js";

// One fake per use case the trash guard and the CMS bulk pre-check inject, by use-case name.
export interface TrashUseCaseFakes {
    cancelReviewsForDelete: UseCaseFake<CancelReviewsForDeleteUseCase.Interface["execute"]>;
    listBlockingReviews: UseCaseFake<ListBlockingReviewsUseCase.Interface["execute"]>;
}

/*
 * Fresh fakes (R355): nothing is cancelled and nothing blocks until a test says otherwise with
 * `mockImplementation`, `mockResolvedValue` or `mockRejectedValue`.
 */
export const createTrashUseCaseFakes = (): TrashUseCaseFakes => {
    return {
        cancelReviewsForDelete: {
            execute: vi.fn<CancelReviewsForDeleteUseCase.Interface["execute"]>().mockResolvedValue([])
        },
        listBlockingReviews: {
            execute: vi.fn<ListBlockingReviewsUseCase.Interface["execute"]>().mockResolvedValue([])
        }
    };
};
```

Create `packages/app-workflows/src/review/testing/registerTrashUseCaseFakes.ts`:

```ts
import type { Container } from "@webiny/di";
import { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
import { ListBlockingReviewsUseCase } from "~/review/useCases/listBlockingReviews/abstractions.js";
import type { TrashUseCaseFakes } from "./createTrashUseCaseFakes.js";

// Registers each fake under its use-case token, in place of the review services feature (R355).
export const registerTrashUseCaseFakes = (container: Container, fakes: TrashUseCaseFakes): void => {
    container.registerInstance(CancelReviewsForDeleteUseCase, fakes.cancelReviewsForDelete);
    container.registerInstance(ListBlockingReviewsUseCase, fakes.listBlockingReviews);
};
```

**1b. `ActiveReviewGuard.test.ts`** (`packages/app-workflows/src/review/trash/ActiveReviewGuard/`). The guard now takes the cancel use case from the container; the tests keep a local `useCases` (the trash fakes) per `describe` and stop passing it to the guard. Mechanical part:

```bash
F=packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts
sed -i '' -E \
  -e 's/useCases\.cancelForDelete/useCases.cancelReviewsForDelete.execute/g' \
  -e 's/, useCases, /, /g' \
  -e 's/, useCases \}/ }/g' \
  -e '/^[[:space:]]*useCases,$/d' \
  -e '/^[[:space:]]*useCases$/d' \
  -e '/^[[:space:]]*useCases: cases,$/d' \
  -e '/^[[:space:]]*cases: ReturnType<typeof createUseCases>$/d' \
  -e 's/createRun\(guard, (.+), useCases\)/createRun(guard, \1)/g' \
  -e 's/setup\(confirmation\)/setup(confirmation, useCases)/g' \
  -e 's/ReturnType<typeof createUseCases>/TrashUseCaseFakes/g' \
  -e 's/useCases = createUseCases\(\);/useCases = createTrashUseCaseFakes();/g' \
  "$F"
grep -n "createUseCases\|useCases[,:}]\|blocked: Set<string>,$" "$F"
```

Then by hand. Imports, before:

```ts
import type { CancelForDeleteParams } from "~/review/appGateway/IReviewAppGateway.js";
```

After:

```ts
import { createTrashUseCaseFakes } from "~/review/testing/createTrashUseCaseFakes.js";
import type { TrashUseCaseFakes } from "~/review/testing/createTrashUseCaseFakes.js";
import { registerTrashUseCaseFakes } from "~/review/testing/registerTrashUseCaseFakes.js";
```

Delete the old helper, before:

```ts
function createUseCases() {
    return {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => []),
        listBlockingReviews: vi.fn(async () => [])
    };
}
```

After: (nothing; the helper is gone, `createTrashUseCaseFakes` replaces it). Delete the `import type { Review } from "~/review/domain/types.js";` line if it is now unused.

`setup`, before:

```ts
function setup(confirmation: Confirmation.Interface) {
    const container = new Container();
```

After:

```ts
function setup(confirmation: Confirmation.Interface, useCases: TrashUseCaseFakes) {
    const container = new Container();
    registerTrashUseCaseFakes(container, useCases);
```

`createRun` (in `describe("ActiveReviewGuard.runBulk")`), before (after the `sed`):

```ts
    function createRun(
        guard: GuardAbstraction.Interface,
        blocked: Set<string>,
    ): BulkSetup {
```

After:

```ts
    function createRun(guard: GuardAbstraction.Interface, blocked: Set<string>): BulkSetup {
```

Check: `grep -n "useCases" "$F"` lists only `let useCases: TrashUseCaseFakes;`, `useCases = createTrashUseCaseFakes();`, `setup(confirmation, useCases)` and `useCases.cancelReviewsForDelete.execute...` lines. Every `toHaveBeenCalledWith` / `toHaveBeenNthCalledWith` on the cancel keeps its exact `{ namespace, targetId, targetRevisionId, action }` (Review Focus 5).

Worked example (the first `run` case; the `sed` above already makes this change, so after the `sed` the file reads as the After; no hand edit), before:

```ts
        const result = await guard.run({ action, useCases, revisionId: null });

        expect(result).toBe("trashed");
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        expect(confirm.mock.calls[0][1]).toEqual({ reviews, action: "trash" });
        expect(useCases.cancelForDelete).toHaveBeenCalledTimes(2);
        expect(useCases.cancelForDelete).toHaveBeenNthCalledWith(1, {
```

After:

```ts
        const result = await guard.run({ action, revisionId: null });

        expect(result).toBe("trashed");
        expect(confirm).toHaveBeenCalledTimes(1);
        expect(confirm.mock.calls[0][0]).toBe(ACTIVE_REVIEW_WARNING_DIALOG);
        expect(confirm.mock.calls[0][1]).toEqual({ reviews, action: "trash" });
        expect(useCases.cancelReviewsForDelete.execute).toHaveBeenCalledTimes(2);
        expect(useCases.cancelReviewsForDelete.execute).toHaveBeenNthCalledWith(1, {
```

Add one case at the end of `describe("ActiveReviewGuard.run")` (R352: the guard injects the cancel use case, Review Focus 5):

```ts
    it("cancels through the injected use case, one call per distinct target, routed by each review's namespace", async () => {
        const { confirmation } = createConfirmation("confirm");
        const { guard } = setup(confirmation, useCases);
        const reviews = [
            createReview({ reviewId: "r1", model: "cms.article", targetId: "entry-1" }),
            createReview({ reviewId: "r2", model: "wb.page", targetId: "page-1" })
        ];
        let blocked = true;
        const action = vi.fn(async () => {
            if (blocked) {
                throw createRefusal(reviews, "delete");
            }
            return true;
        });
        useCases.cancelReviewsForDelete.execute.mockImplementation(async () => {
            blocked = false;
            return [];
        });

        await guard.run({ action, revisionId: null });

        const sent = useCases.cancelReviewsForDelete.execute.mock.calls.map(call => call[0]);
        expect(sent).toEqual([
            { namespace: "cms.article", targetId: "entry-1", targetRevisionId: null, action: "delete" },
            { namespace: "wb.page", targetId: "page-1", targetRevisionId: null, action: "delete" }
        ]);
    });
```

**1c. `ActiveReviewTrashFeature.test.tsx`** (`packages/app-workflows/src/review/trash/`). Imports, add:

```ts
import { createTrashUseCaseFakes } from "~/review/testing/createTrashUseCaseFakes.js";
import { registerTrashUseCaseFakes } from "~/review/testing/registerTrashUseCaseFakes.js";
```

In the first two cases of `describe("ActiveReviewTrashFeature")` the guard is resolved, so its use case must be registered. Before (both cases):

```tsx
        ActiveReviewTrashFeature.register(container);
```

After:

```tsx
        const fakes = createTrashUseCaseFakes();
        registerTrashUseCaseFakes(container, fakes);
        ActiveReviewTrashFeature.register(container);
```

In the second case, before:

```tsx
                action: async () => {
                    throw refusal;
                },
                useCases: {
                    cancelForDelete: vi.fn(async () => []),
                    listBlockingReviews: vi.fn(async () => [])
                },
                revisionId: null
```

After:

```tsx
                action: async () => {
                    throw refusal;
                },
                revisionId: null
```

In `renderHost`, before:

```tsx
        ActiveReviewTrashFeature.register(container);
        const useCases = {
            cancelForDelete: vi.fn(async () => []),
            listBlockingReviews: vi.fn(async () => [])
        };
```

After:

```tsx
        const useCases = createTrashUseCaseFakes();
        registerTrashUseCaseFakes(container, useCases);
        ActiveReviewTrashFeature.register(container);
```

Before:

```tsx
        useCases.cancelForDelete.mockImplementation(async () => {
```

After:

```tsx
        useCases.cancelReviewsForDelete.execute.mockImplementation(async () => {
```

Before:

```tsx
                guard.run({ action, useCases, revisionId: null })
```

After:

```tsx
                guard.run({ action, revisionId: null })
```

and the two assertions `expect(useCases.cancelForDelete)` become `expect(useCases.cancelReviewsForDelete.execute)`.

**1d. CMS and WB trash tests (pattern).** Files: `packages/app-headless-cms-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeleteEntryUseCaseReviewDecorator,DeleteEntryRevisionUseCaseReviewDecorator,PermanentlyDeleteEntryUseCaseReviewDecorator}.test.ts`, `packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx`, `packages/app-website-builder-workflows/src/features/trash/{BulkDeletePresenterReviewDecorator,DeletePageUseCaseReviewDecorator,DeletePageRevisionUseCaseReviewDecorator}.test.ts`, `packages/app-website-builder-workflows/src/features/trash/feature.test.tsx`. Each keeps a local `useCases` (now the trash fakes):

```bash
for F in packages/app-headless-cms-workflows/src/features/trash/*.test.ts packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx packages/app-website-builder-workflows/src/features/trash/*.test.ts packages/app-website-builder-workflows/src/features/trash/feature.test.tsx; do
  perl -0pi -e 's/container\.registerInstance\(\s*(CmsReviewUseCases|WbReviewUseCases),\s*useCases as unknown as \1\.Interface\s*\);/registerTrashUseCaseFakes(container, useCases);/g' "$F"
  perl -0pi -e 's/const useCases = \{\s*cancelForDelete:.*?\};/const useCases = createTrashUseCaseFakes();/s' "$F"
  perl -0pi -e 's/function createUseCases\(\) \{\s*return \{.*?\};\s*\}\n\n//s' "$F"
  sed -i '' -E \
    -e 's/createUseCases\(\)/createTrashUseCaseFakes()/g' \
    -e 's/useCases\.cancelForDelete/useCases.cancelReviewsForDelete.execute/g' \
    -e 's/useCases\.listBlockingReviews/useCases.listBlockingReviews.execute/g' \
    -e 's/expect\(params\.useCases\)\.toBe\(useCases\);/expect(params).not.toHaveProperty("useCases");/g' \
    -e 's/call => call\[0\]\.useCases === useCases/call => !("useCases" in call[0])/g' \
    -e '/^import \{ (Cms|Wb)ReviewUseCases \} from "~\/features\/gateway\/(Cms|Wb)ReviewUseCases\/abstractions\.js";$/d' \
    -e '/^import type \{ (CancelForDeleteParams|ListBlockingReviewsParams) \} from "@webiny\/app-workflows\/review\/appGateway\/IReviewAppGateway\.js";$/d' \
    "$F"
done
grep -rn "ReviewUseCases\|cancelForDelete\|IReviewAppGateway\|IReviewCancelForDeleteUseCases" packages/app-headless-cms-workflows/src/features/trash packages/app-website-builder-workflows/src/features/trash
```

Expected from the last `grep`: no hit. The two bulk tests lose their `createUseCases` helper (its calls now read `createTrashUseCaseFakes()`, no wrapper around the fake factory). Then, in every file of the list, add the two imports

```ts
import { createTrashUseCaseFakes } from "@webiny/app-workflows/review/testing/createTrashUseCaseFakes.js";
import { registerTrashUseCaseFakes } from "@webiny/app-workflows/review/testing/registerTrashUseCaseFakes.js";
```

(after the other `@webiny/app-workflows` imports) and delete the type imports `yarn lint` reports unused afterwards (`Review`, `BlockingReview` in the files whose only use was the old fake's signature).

Case titles that named the bundle:

| File | Before | After |
|---|---|---|
| CMS `BulkDeletePresenterReviewDecorator.test.ts` | `hands the items, the entry id, the use cases and a run callback to the guard` | `hands the items, the entry id and a run callback to the guard, and no use cases (R353)` |
| WB `BulkDeletePresenterReviewDecorator.test.ts` | `hands the items, the page id, the use cases and a run callback to the guard` | `hands the items, the page id and a run callback to the guard, and no use cases (R353)` |

(If another case title names "the use cases" handed to the guard, it gets the same rewording.)

Worked example of what the loop above does (no hand edit; after the loop the file reads as the After), CMS `DeleteEntryUseCaseReviewDecorator.test.ts` `setup`, before:

```ts
    const decoratee = { execute: vi.fn() };
    const useCases = {
        cancelForDelete: vi.fn(async (_params: CancelForDeleteParams): Promise<Review[]> => []),
        listBlockingReviews: vi.fn(async () => [])
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
    container.registerInstance(
        CmsReviewUseCases,
        useCases as unknown as CmsReviewUseCases.Interface
    );
    container.registerInstance(DeleteEntryUseCase, decoratee);
```

After:

```ts
    const decoratee = { execute: vi.fn() };
    const useCases = createTrashUseCaseFakes();

    const container = new Container();
    container.registerInstance(Confirmation, { confirm } as unknown as Confirmation.Interface);
    container.registerInstance(Notifications, {
        notify: vi.fn(),
        success: vi.fn(),
        warning: vi.fn()
    } as unknown as Notifications.Interface);
    container.register(ActiveReviewBlockCollector).inSingletonScope();
    container.register(ActiveReviewGuard).inSingletonScope();
    registerTrashUseCaseFakes(container, useCases);
    container.registerInstance(DeleteEntryUseCase, decoratee);
```

and an assertion, before:

```ts
        expect(useCases.cancelForDelete).not.toHaveBeenCalled();
```

After:

```ts
        expect(useCases.cancelReviewsForDelete.execute).not.toHaveBeenCalled();
```

Worked example of what the loop above does (no hand edit), CMS `BulkDeletePresenterReviewDecorator.test.ts` forwarding case, before:

```ts
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        const params = guard.runBulk.mock.calls[0][0];
        expect(params.items).toBe(items);
        expect(params.useCases).toBe(useCases);
        expect(params.getTargetId(items[0])).toBe("e1");
```

After:

```ts
        expect(guard.runBulk).toHaveBeenCalledTimes(1);
        const params = guard.runBulk.mock.calls[0][0];
        expect(params.items).toBe(items);
        expect(params).not.toHaveProperty("useCases");
        expect(params.getTargetId(items[0])).toBe("e1");
```

and a pre-check assertion keeps its exact argument, before:

```ts
        expect(useCases.listBlockingReviews).toHaveBeenCalledWith({
            namespace: "cms.article",
```

After:

```ts
        expect(useCases.listBlockingReviews.execute).toHaveBeenCalledWith({
            namespace: "cms.article",
```

The pre-check case of CMS `feature.test.tsx` (its `expect(useCases.listBlockingReviews.execute).toHaveBeenCalledWith({ namespace: "cms.article", ... })` after the `sed`) already proves the bulk pre-check runs on `ListBlockingReviewsUseCase` (Review Focus 5); it changes only through the `sed` above.

- [ ] **Step 2: Run the tests to see them fail**

```bash
yarn test packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/trash/ActiveReviewTrashFeature.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.test.ts 2>&1 | tail -30
```

Expected: the guard tests fail because the guard reads `params.useCases.cancelForDelete` (`Cannot read properties of undefined (reading 'cancelForDelete')`) and never calls the injected fake; the decorator tests fail resolving the decorators (`No registration found for Cms/Workflows/ReviewUseCases` / `WebsiteBuilder/Workflows/ReviewUseCases`) or on `not.toHaveProperty("useCases")`. Record the RED output.

- [ ] **Step 3: Implement**

**3a. The guard.** `packages/app-workflows/src/review/trash/ActiveReviewGuard/abstractions.ts`, before:

```ts
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
import type { IReviewCancelForDeleteUseCases } from "~/review/useCases/IReviewCancelForDeleteUseCases.js";
```

After:

```ts
import type { ReviewForDeleteAction } from "~/review/domain/types.js";
```

Before:

```ts
export interface ActiveReviewGuardParams<TResult> {
    action: () => Promise<TResult>;
    useCases: IReviewCancelForDeleteUseCases;
    /*
```

After:

```ts
// The guard cancels through its injected use case, routed by each review's namespace (R352, R353).
export interface ActiveReviewGuardParams<TResult> {
    action: () => Promise<TResult>;
    /*
```

Before:

```ts
    run: (batch: TItem[], isRetry: boolean) => Promise<void>;
    useCases: IReviewCancelForDeleteUseCases;
}
```

After:

```ts
    run: (batch: TItem[], isRetry: boolean) => Promise<void>;
}
```

Before:

```ts
    action: ReviewForDeleteAction;
    useCases: IReviewCancelForDeleteUseCases;
    /*
     * Runs inside the dialog's confirm, after every distinct target was cancelled.
```

After:

```ts
    action: ReviewForDeleteAction;
    /*
     * Runs inside the dialog's confirm, after every distinct target was cancelled.
```

`packages/app-workflows/src/review/trash/ActiveReviewGuard/ActiveReviewGuard.ts`, before:

```ts
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
```

After:

```ts
import { REVIEW_TOAST_DURATION } from "~/review/toasts/constants.js";
import { REVIEW_TOAST_POSITION } from "~/review/toasts/constants.js";
import { CancelReviewsForDeleteUseCase } from "~/review/useCases/cancelReviewsForDelete/abstractions.js";
```

Before:

```ts
class ActiveReviewGuardImpl implements Abstraction.Interface {
    constructor(
        private confirmation: Confirmation.Interface,
        private collector: ActiveReviewBlockCollector.Interface,
        private notifications: Notifications.Interface
    ) {}

    async run<TResult>(params: ActiveReviewGuardParams<TResult>): Promise<TResult | false> {
        const { action, useCases, revisionId } = params;
```

After:

```ts
class ActiveReviewGuardImpl implements Abstraction.Interface {
    constructor(
        private cancelReviewsForDeleteUseCase: CancelReviewsForDeleteUseCase.Interface,
        private confirmation: Confirmation.Interface,
        private collector: ActiveReviewBlockCollector.Interface,
        private notifications: Notifications.Interface
    ) {}

    async run<TResult>(params: ActiveReviewGuardParams<TResult>): Promise<TResult | false> {
        const { action, revisionId } = params;
```

Before:

```ts
                    for (const target of targets) {
                        await useCases.cancelForDelete({
                            namespace: target.model,
                            targetId: target.targetId,
                            targetRevisionId: revisionId,
                            action: data.action
                        });
                    }
```

After:

```ts
                    for (const target of targets) {
                        await this.cancelReviewsForDeleteUseCase.execute({
                            namespace: target.model,
                            targetId: target.targetId,
                            targetRevisionId: revisionId,
                            action: data.action
                        });
                    }
```

Before:

```ts
        const { items, getTargetId, run, useCases } = params;
```

After:

```ts
        const { items, getTargetId, run } = params;
```

Before:

```ts
        await this.confirmBlocking({ reviews, action, useCases, afterCancel });
```

After:

```ts
        await this.confirmBlocking({ reviews, action, afterCancel });
```

Before:

```ts
        const { reviews, action, useCases, afterCancel } = params;
```

After:

```ts
        const { reviews, action, afterCancel } = params;
```

Before:

```ts
                for (const target of targets) {
                    await useCases.cancelForDelete({
                        namespace: target.model,
                        targetId: target.targetId,
                        targetRevisionId: null,
                        action
                    });
                }
```

After:

```ts
                for (const target of targets) {
                    await this.cancelReviewsForDeleteUseCase.execute({
                        namespace: target.model,
                        targetId: target.targetId,
                        targetRevisionId: null,
                        action
                    });
                }
```

Before:

```ts
export const ActiveReviewGuard = Abstraction.createImplementation({
    implementation: ActiveReviewGuardImpl,
    dependencies: [Confirmation, ActiveReviewBlockCollector, Notifications]
});
```

After:

```ts
export const ActiveReviewGuard = Abstraction.createImplementation({
    implementation: ActiveReviewGuardImpl,
    dependencies: [
        CancelReviewsForDeleteUseCase,
        Confirmation,
        ActiveReviewBlockCollector,
        Notifications
    ]
});
```

**3b. CMS decorators.** `packages/app-headless-cms-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts`, before:

```ts
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases/abstractions.js";
import { createAppName } from "~/utils/appName.js";
```

After:

```ts
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";
import { ListBlockingReviewsUseCase } from "@webiny/app-workflows/review/useCases/listBlockingReviews/abstractions.js";
import { createAppName } from "~/utils/appName.js";
```

Before:

```ts
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: CmsReviewUseCases.Interface,
        private notifications: Notifications.Interface,
```

After:

```ts
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private listBlockingReviewsUseCase: ListBlockingReviewsUseCase.Interface,
        private notifications: Notifications.Interface,
```

Before:

```ts
                run: async batch => {
                    await this.decoratee.execute(batch, false);
                },
                useCases: this.useCases
            });
```

After:

```ts
                run: async batch => {
                    await this.decoratee.execute(batch, false);
                }
            });
```

Before:

```ts
                const found = await this.useCases.listBlockingReviews({ namespace, targetIds });
```

After:

```ts
                const found = await this.listBlockingReviewsUseCase.execute({
                    namespace,
                    targetIds
                });
```

Before:

```ts
            action: "trash",
            useCases: this.useCases,
            afterCancel: async () => {
```

After:

```ts
            action: "trash",
            afterCancel: async () => {
```

Before:

```ts
    dependencies: [ActiveReviewGuard, CmsReviewUseCases, Notifications, CmsModelContext]
```

After:

```ts
    dependencies: [ActiveReviewGuard, ListBlockingReviewsUseCase, Notifications, CmsModelContext]
```

`DeleteEntryUseCaseReviewDecorator.ts` (whole file after):

```ts
import { DeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import type { IDeleteEntryParams } from "@webiny/app-headless-cms/features/contentEntry/deleteEntry/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";

class DeleteEntryUseCaseReviewDecoratorImpl implements DeleteEntryUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: DeleteEntryUseCase.Interface
    ) {}

    async execute(params: IDeleteEntryParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            revisionId: null
        });
    }
}

export const DeleteEntryUseCaseReviewDecorator = DeleteEntryUseCase.createDecorator({
    decorator: DeleteEntryUseCaseReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard]
});
```

`DeleteEntryRevisionUseCaseReviewDecorator.ts` (whole file after):

```ts
import { DeleteEntryRevisionUseCase } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import type { IDeleteEntryRevisionParams } from "@webiny/app-headless-cms/features/contentEntry/deleteEntryRevision/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";

class DeleteEntryRevisionUseCaseReviewDecoratorImpl
    implements DeleteEntryRevisionUseCase.Interface
{
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: DeleteEntryRevisionUseCase.Interface
    ) {}

    async execute(params: IDeleteEntryRevisionParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            revisionId: params.revisionId
        });
    }
}

export const DeleteEntryRevisionUseCaseReviewDecorator = DeleteEntryRevisionUseCase.createDecorator(
    {
        decorator: DeleteEntryRevisionUseCaseReviewDecoratorImpl,
        dependencies: [ActiveReviewGuard]
    }
);
```

`PermanentlyDeleteEntryUseCaseReviewDecorator.ts` (whole file after):

```ts
import { PermanentlyDeleteEntryUseCase } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import type { IPermanentlyDeleteEntryParams } from "@webiny/app-headless-cms/features/contentEntry/permanentlyDeleteEntry/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";

class PermanentlyDeleteEntryUseCaseReviewDecoratorImpl
    implements PermanentlyDeleteEntryUseCase.Interface
{
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: PermanentlyDeleteEntryUseCase.Interface
    ) {}

    async execute(params: IPermanentlyDeleteEntryParams): Promise<boolean> {
        return this.guard.run({
            action: () => this.decoratee.execute(params),
            revisionId: null
        });
    }
}

export const PermanentlyDeleteEntryUseCaseReviewDecorator =
    PermanentlyDeleteEntryUseCase.createDecorator({
        decorator: PermanentlyDeleteEntryUseCaseReviewDecoratorImpl,
        dependencies: [ActiveReviewGuard]
    });
```

**3c. WB decorators.** `packages/app-website-builder-workflows/src/features/trash/BulkDeletePresenterReviewDecorator.ts` (whole file after):

```ts
import type { Page } from "@webiny/app-website-builder/domain/Page/Page.js";
import { BulkDeletePresenter } from "@webiny/app-website-builder/presentation/pages/bulkActions/abstractions.js";
import { ActiveReviewGuard } from "@webiny/app-workflows/review/trash/ActiveReviewGuard/abstractions.js";

class BulkDeletePresenterReviewDecoratorImpl implements BulkDeletePresenter.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: BulkDeletePresenter.Interface
    ) {}

    get vm() {
        return this.decoratee.vm;
    }

    async execute(items: Page[]): Promise<void> {
        await this.guard.runBulk({
            items,
            getTargetId: row => row.entryId,
            run: batch => this.decoratee.execute(batch)
        });
    }
}

export const BulkDeletePresenterReviewDecorator = BulkDeletePresenter.createDecorator({
    decorator: BulkDeletePresenterReviewDecoratorImpl,
    dependencies: [ActiveReviewGuard]
});
```

`DeletePageUseCaseReviewDecorator.ts` and `DeletePageRevisionUseCaseReviewDecorator.ts`: delete the `WbReviewUseCases` import, the `private useCases: WbReviewUseCases.Interface,` constructor parameter and the `useCases: this.useCases,` line of the `guard.run({...})` call, and set `dependencies: [ActiveReviewGuard]`. Worked example, `DeletePageUseCaseReviewDecorator.ts` before:

```ts
class DeletePageUseCaseReviewDecoratorImpl implements DeletePageUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private useCases: WbReviewUseCases.Interface,
        private decoratee: DeletePageUseCase.Interface
    ) {}
```

After:

```ts
class DeletePageUseCaseReviewDecoratorImpl implements DeletePageUseCase.Interface {
    constructor(
        private guard: ActiveReviewGuard.Interface,
        private decoratee: DeletePageUseCase.Interface
    ) {}
```

(and its `execute` keeps its `action` and `revisionId` lines exactly as today, without `useCases`.)

Check that nothing outside the old bundles' own files and tests still uses them:

```bash
grep -rln "CmsReviewUseCases\|WbReviewUseCases\|IReviewCancelForDeleteUseCases\|IReviewUseCases\|IReviewReadUseCases\|IReviewListUseCases\|IReviewActionUseCases\|createFakeUseCases" packages/app-workflows/src packages/app-headless-cms-workflows/src packages/app-website-builder-workflows/src
```

Expected (the files Task 14 deletes or edits, nothing else): `[AWR]/useCases/{IReviewUseCases,IReviewReadUseCases,IReviewActionUseCases,IReviewListUseCases,IReviewCancelForDeleteUseCases,ReviewUseCases,ReviewUseCases.test}.ts`, `[AWRT]/fakeReviewUseCases.ts`, `[CMS]/features/gateway/CmsReviewUseCases/*`, `[CMS]/features/gateway/feature.ts`, `[CMS]/features/gateway/feature.test.ts`, `[CMS]/index.test.tsx`, the WB mirrors, `[WB]/features/gateway/feature.test.ts` (imports the CMS bundle for its A83 case). If another file is listed, it still passes a bundle at runtime: fix it in this task.

- [ ] **Step 4: Run the tests to see them pass**

Run the seven commands of Step 2 again, one at a time, then:

```bash
yarn test packages/app-headless-cms-workflows/src/features/trash/DeleteEntryRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/trash/PermanentlyDeleteEntryUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/DeletePageRevisionUseCaseReviewDecorator.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/trash/feature.test.tsx 2>&1 | tail -30
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
yarn test packages/app-workflows/src/review/trash/ActiveReviewWarningPresenter/ActiveReviewWarningPresenter.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/review/trash/components/ActiveReviewWarningDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/review/trash/ActiveReviewBlockCollector/ActiveReviewBlockCollector.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/app.test.tsx 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors.

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
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "refactor(app-workflows): inject CancelReviewsForDeleteUseCase into the trash guard" -m "The active review guard cancels through the injected use case, routed by each review's namespace, and its parameters no longer carry a use-case bundle. The CMS bulk pre-check injects ListBlockingReviewsUseCase; the CMS and Website Builder delete and bulk decorators depend only on the guard (app-headless-cms-workflows, app-website-builder-workflows)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Guard dependency order.** R352 names only the use case for `ActiveReviewGuard`; it goes first, before the existing `[Confirmation, ActiveReviewBlockCollector, Notifications]`, as in the presenters of Tasks 10-12. In the CMS bulk decorator the use case takes the bundle's position (`[ActiveReviewGuard, ListBlockingReviewsUseCase, Notifications, CmsModelContext]`), exactly as R352 spells it.
- **Shared trash fakes.** `createTrashUseCaseFakes` / `registerTrashUseCaseFakes` live in `[AWRT]` (R243: fakes other packages import), because the guard test, the trash feature test and the eight CMS and WB trash tests all need the same two fakes; they reuse Task 11's `UseCaseFake`.
- **Root composition tests.** CMS and WB `features/trash/feature.test.tsx` register a fake `ActiveReviewGuard`, so their root cases need no use-case fake; the CMS root case resolves only `DeleteEntryUseCase` (no bulk pre-check).

## Review fixes (sub-phase review)

1. The bulk tests' `createUseCases` helper is deleted and its calls become `createTrashUseCaseFakes()` (the old script kept it as a wrapper whose body only called the fake factory).
2. The WB `BulkDeletePresenterReviewDecorator.test.ts` case title is "hands the items, the page id, the use cases and a run callback to the guard" (not the CMS "entry id" title); the table now gives its exact before and after.
