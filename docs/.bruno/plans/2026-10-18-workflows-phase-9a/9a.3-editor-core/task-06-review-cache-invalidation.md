### Task 6: Review cache invalidation

A74, R202, R277; D132; Review Focus 8. After a save or a delete the review UI must not keep showing the old workflow. The shared `ReviewUseCases` caches the workflow list (A74) as one promise per instance, and each app has its own instance (R237). `IReviewReadUseCases` gains `invalidateWorkflows(): void`; the editor (Task 10) calls it on the app's review use cases after a successful save and after a delete.

Behaviour:

- **`invalidateWorkflows()` clears the cached promise** (`this.workflows = null`). The next `getBoundWorkflow` loads the list again from the gateway. It never calls the gateway itself, never throws and returns nothing.
- **A pending load is dropped too:** the cached value is the promise, so clearing it also drops a load still in flight. Callers already awaiting that load still get its result (they asked before the change); the next caller starts a new load.
- **A dropped load never overwrites a newer one:** `getBoundWorkflow` already clears the cache on a failure only when `this.workflows` still is the failing promise, and writes nothing on success after the await. A dropped load that settles later, with data or with an error, therefore leaves the newer cache alone. This task adds tests that pin it; it changes no logic there.
- **Per instance:** invalidating the CMS use cases leaves the WB use cases' cache alone (two instances, two caches, R237).
- **Interface and fakes:** `IReviewReadUseCases` gets the method, so `IReviewUseCases` (which extends it) has it; `FakeReviewUseCases` and `createFakeUseCases` in `[AWT]` gain `invalidateWorkflows`. No other test double implements the full interface: every other double in `app-workflows`, `app-headless-cms-workflows` and `app-website-builder-workflows` is a `{ name: "cms" } as unknown as IReviewUseCases` cast (verified by search for `IReviewUseCases` and `IReviewReadUseCases`), so none needs a change.

**Files:**
- Modify: `packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts`
- Modify: `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`
- Modify: `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts`
- Create: `packages/app-workflows/src/editor/testing/createDeferred.ts`
- Modify: `packages/app-workflows/src/review/testing/fakeReviewUseCases.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`

**Interfaces:**
- Consumes: the existing `ReviewUseCases` (`private workflows: Promise<ReviewWorkflow[]> | null`, `getBoundWorkflow`), `createFakeGateway`, `createWorkflowDto` and `errorDto` of `ReviewUseCases.test.ts`, `ReviewEnvelope` and `WorkflowDto` (`~/review/gateway/dto.js`).
- Produces: `IReviewReadUseCases.invalidateWorkflows(): void`, `ReviewUseCases.invalidateWorkflows`, `FakeReviewUseCases.invalidateWorkflows` (a `vi.fn()`), used by Task 10; the pure test helper `createDeferred` / `Deferred<T>` at `[AWET]/createDeferred.ts` (Tasks 9, 9b, 10 and 14 import it).

**Test runner note:** admin packages, `yarn test <path>` only.

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts`. Add one import next to the other `~/review/gateway/dto.js` type imports:

```ts
import type { ReviewEnvelope } from "~/review/gateway/dto.js";
```

Add one more import next to it (the shared pure helper, created below; Tasks 9, 9b, 10 and 14 reuse it):

```ts
import { createDeferred } from "~/editor/testing/createDeferred.js";
```

Create `packages/app-workflows/src/editor/testing/createDeferred.ts` (pure, R243: no vitest, mobx or DI imports):

```ts
export interface Deferred<T> {
    promise: Promise<T>;
    resolve(value: T): void;
    reject(error: unknown): void;
}

// A promise a test settles by hand, to hold a gateway or use case call open.
export const createDeferred = <T>(): Deferred<T> => {
    let resolve: (value: T) => void = () => undefined;
    let reject: (error: unknown) => void = () => undefined;
    const promise = new Promise<T>((res, rej) => {
        resolve = res;
        reject = rej;
    });
    return { promise, resolve, reject };
};
```

Add a new `describe` block directly after the closing `});` of `describe("getBoundWorkflow", ...)` (before `describe("reads", ...)`):

```ts
    describe("invalidateWorkflows (R277)", () => {
        it("drops the cached list, so the next read loads it again", async () => {
            gateway.listWorkflows.mockResolvedValueOnce({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });
            gateway.listWorkflows.mockResolvedValueOnce({
                data: [createWorkflowDto("workflow-2", ["cms.article"])],
                error: null
            });

            const before = await useCases.getBoundWorkflow("cms.article");
            useCases.invalidateWorkflows();
            const after = await useCases.getBoundWorkflow("cms.article");

            expect(before?.id).toBe("workflow-1");
            expect(after?.id).toBe("workflow-2");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("shows a namespace that lost its workflow as null after the reload", async () => {
            gateway.listWorkflows.mockResolvedValueOnce({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });
            gateway.listWorkflows.mockResolvedValueOnce({ data: [], error: null });

            await useCases.getBoundWorkflow("cms.article");
            useCases.invalidateWorkflows();

            expect(await useCases.getBoundWorkflow("cms.article")).toBeNull();
        });

        it("caches the reloaded list again", async () => {
            gateway.listWorkflows.mockResolvedValue({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });

            await useCases.getBoundWorkflow("cms.article");
            useCases.invalidateWorkflows();
            await useCases.getBoundWorkflow("cms.article");
            await useCases.getBoundWorkflow("cms.article");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does nothing when nothing is cached: no request, no throw, no value", () => {
            const result = useCases.invalidateWorkflows();

            expect(result).toBeUndefined();
            expect(gateway.listWorkflows).not.toHaveBeenCalled();
        });

        it("drops a load that is still in flight: the next read starts a new request", async () => {
            const first = createDeferred<ReviewEnvelope<WorkflowDto[]>>();
            gateway.listWorkflows.mockReturnValueOnce(first.promise);
            gateway.listWorkflows.mockResolvedValueOnce({
                data: [createWorkflowDto("workflow-new", ["cms.article"])],
                error: null
            });

            const pending = useCases.getBoundWorkflow("cms.article");
            useCases.invalidateWorkflows();
            const next = await useCases.getBoundWorkflow("cms.article");

            expect(next?.id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);

            first.resolve({
                data: [createWorkflowDto("workflow-old", ["cms.article"])],
                error: null
            });
            const stale = await pending;

            // The caller that asked before the change still gets what it asked for.
            expect(stale?.id).toBe("workflow-old");
            // The late result did not write itself back into the cache.
            const again = await useCases.getBoundWorkflow("cms.article");
            expect(again?.id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("keeps the newer list when a dropped load fails later", async () => {
            const first = createDeferred<ReviewEnvelope<WorkflowDto[]>>();
            gateway.listWorkflows.mockReturnValueOnce(first.promise);
            gateway.listWorkflows.mockResolvedValueOnce({
                data: [createWorkflowDto("workflow-new", ["cms.article"])],
                error: null
            });

            const pending = useCases.getBoundWorkflow("cms.article");
            useCases.invalidateWorkflows();
            await useCases.getBoundWorkflow("cms.article");
            first.reject(new Error("Network down."));

            await expect(pending).rejects.toThrow("Network down.");
            const again = await useCases.getBoundWorkflow("cms.article");

            expect(again?.id).toBe("workflow-new");
            expect(gateway.listWorkflows).toHaveBeenCalledTimes(2);
        });

        it("does not touch the cache of another instance (R237)", async () => {
            gateway.listWorkflows.mockResolvedValue({
                data: [createWorkflowDto("workflow-1", ["cms.article"])],
                error: null
            });
            const other = new ReviewUseCases(gateway);

            await useCases.getBoundWorkflow("cms.article");
            await other.getBoundWorkflow("cms.article");
            useCases.invalidateWorkflows();
            await other.getBoundWorkflow("cms.article");
            await useCases.getBoundWorkflow("cms.article");

            expect(gateway.listWorkflows).toHaveBeenCalledTimes(3);
        });
    });
```

The last test counts three requests: one per instance at the start, none for `other` after the invalidation of `useCases` (its cache is intact), one for `useCases` after it.

Modify `packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts`. Add after the test `caches the workflow list per instance, so the CMS use cases load it once` (inside the same `describe`, before its closing `});`):

```ts

    it("invalidates the CMS workflow cache, so the next read loads the list again", async () => {
        client.execute.mockResolvedValue({
            cms: { listCmsEntryWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(CmsReviewUseCases);

        await useCases.getBoundWorkflow("cms.article");
        useCases.invalidateWorkflows();
        await useCases.getBoundWorkflow("cms.article");

        expect(client.execute).toHaveBeenCalledTimes(2);
    });
```

Modify `packages/app-website-builder-workflows/src/features/gateway/feature.test.ts`. Add after the test `caches the workflow list per instance, so the WB use cases load it once`:

```ts

    it("invalidates the WB workflow cache, so the next read loads the list again", async () => {
        client.execute.mockResolvedValue({
            websiteBuilder: { listWebsiteBuilderPageWorkflows: { data: [], error: null } }
        });
        const useCases = container.resolve(WbReviewUseCases);

        await useCases.getBoundWorkflow("wb.page");
        useCases.invalidateWorkflows();
        await useCases.getBoundWorkflow("wb.page");

        expect(client.execute).toHaveBeenCalledTimes(2);
    });
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
```

Expected: the seven new `invalidateWorkflows (R277)` cases fail with `useCases.invalidateWorkflows is not a function`; the two feature tests fail the same way. The existing cases in all three files still pass. Record the RED output.

- [ ] **Step 3: Implement**

Modify `packages/app-workflows/src/review/useCases/IReviewReadUseCases.ts`. Add the method to the interface, after `getBoundWorkflow`:

Before:

```ts
export interface IReviewReadUseCases {
    getBoundWorkflow(namespace: string): Promise<ReviewWorkflow | null>;
    getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null>;
```

After:

```ts
export interface IReviewReadUseCases {
    getBoundWorkflow(namespace: string): Promise<ReviewWorkflow | null>;
    /*
     * Drops the cached workflow list, also a load still in flight, so the next `getBoundWorkflow`
     * asks the server again. The workflow editor calls it after a save and a delete (R277).
     */
    invalidateWorkflows(): void;
    getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null>;
```

Modify `packages/app-workflows/src/review/useCases/ReviewUseCases.ts`. Add the method after `getBoundWorkflow` (before `getTargetReview`):

Before:

```ts
            throw error;
        }
    }

    public async getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null> {
```

After:

```ts
            throw error;
        }
    }

    /*
     * The cache is the promise itself, so clearing it drops a pending load as well. Callers that
     * already await that load keep its result; `getBoundWorkflow` clears the cache after a failure
     * only when it still holds the failing promise, so a dropped load that settles later never
     * touches the newer one.
     */
    public invalidateWorkflows(): void {
        this.workflows = null;
    }

    public async getTargetReview(target: ReviewTarget): Promise<ReviewWithFlags | null> {
```

Modify `packages/app-workflows/src/review/testing/fakeReviewUseCases.ts`. In the interface, add after the `getBoundWorkflow` line:

```ts
    invalidateWorkflows: Mock<IReviewUseCases["invalidateWorkflows"]>;
```

In `createFakeUseCases`, add after the `getBoundWorkflow` entry:

```ts
        invalidateWorkflows: vi.fn(),
```

and update the comment above the function: replace `(all seventeen methods of `IReviewUseCases`)` with `(all eighteen methods of `IReviewUseCases`)`.

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/review/useCases/ReviewUseCases.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -30
```

Expected: PASS. Note for the "drops a load that is still in flight" case: the second `getBoundWorkflow` runs while the first gateway call is unresolved, so the gateway's `mockReturnValueOnce` order (first the deferred, then the resolved value) is what makes the two requests distinct.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/review/presentation/targetReview/TargetReviewPresenter.test.ts 2>&1 | tail -40
yarn test packages/app-workflows/src/review/editor/EditorReviewSession.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors in the three packages. The builds prove that no other implementer of `IReviewUseCases` or `IReviewReadUseCases` breaks (the casts compile as before). If a build names a double that is a full object literal of the interface, add `invalidateWorkflows: vi.fn()` to it in this task.

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
git commit -m "feat(app-workflows): let the review use cases drop their cached workflow list" -m "IReviewReadUseCases gets invalidateWorkflows(), which clears the cached workflow promise of the app's ReviewUseCases, so a pending load is dropped too and a dropped load never overwrites a newer one. The workflow editor calls it after a save and a delete so the review UI stops showing the old workflow." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- The contract lists "test doubles in the CMS and WB packages that implement the interface". A search of `app-headless-cms-workflows/src`, `app-website-builder-workflows/src` and `app-workflows/src` finds none that implement the full interface: they are `{ name: "cms" } as unknown as IReviewUseCases` casts or the real `ReviewUseCases` subclasses. The only fake that implements it is `fakeReviewUseCases.ts` (changed here). The per-app coverage is the two `feature.test.ts` cases above, which run the real subclasses.
- `getBoundWorkflow` needs no logic change for R277: its failure branch already compares the cached promise before clearing it. The task pins that with the two "dropped load" tests.
