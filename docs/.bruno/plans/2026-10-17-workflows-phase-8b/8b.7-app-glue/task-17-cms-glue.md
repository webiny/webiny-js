### Task 17: CMS glue (change message handler and content reloader)

R237, R238, R253, R260, R262; D160, D163; Q32, Q35; Review Focus 6 and 10. Global Constraints of 8a and 8b (read: no helper wrappers around dependency calls, the subclass rule R237, DI file conventions R238, no logic duplicated across CMS and WB, desktop only, admin code style, targeted tests, composition-root wiring tests with the flag on and off, the pre-commit chain, the commit format). Two pieces of CMS glue, both thin:

1. **The change message handler.** Task 10 added the shared plain class `ReviewChangeMessageHandler` (`@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js`, a `WebsocketEventHandler` that takes `workflows.reviewChanged` frames of the namespaces its content adapter handles and calls `activity.notify({ namespace, source: "remote", reviewId, targetRevisionId })`; it shows nothing). The CMS subclasses it once in its own file and binds the subclass to `WebsocketEventHandler`, exactly like the sibling `CmsReviewNotificationHandlerImpl.ts`. The shared class is never bound itself (R237).
2. **The content reloader.** Task 13 added `IReviewContentReloader { reload(): Promise<boolean> }` (`@webiny/app-workflows/review/content/IReviewContentReloader.js`) and the required field `contentReloader: IReviewContentReloader | null` of `TargetReviewInitParams`. After a refresh the shared `TargetReviewPresenter` calls `reload()` once when an AI or automation step that was `inReview` is not any more, and on `true` shows "Content updated by {step title}. The editor loaded the latest version." (R262). The CMS reloader is a small class `CmsEntryContentReloader` over the **undecorated** form presenter (`this.original` inside `CmsEntryFormPresenterWithReview`):
   - it never touches the review presenter (no `init`, no `setContext`), so the bar is not re-initialised and nothing loops;
   - it returns `false` without reading when the editor has moved to another revision than the one it was built for, when the entry is not loaded, or when the form is dirty (an unsaved edit must never be overwritten; while a review locks the form it is inert, so this is a guard only);
   - otherwise it calls `original.loadRevision(revisionId)` (the base presenter always reads through the gateway, `GetEntryRepository` only writes its cache, so no cache has to be bypassed, A96) and compares `revisionSavedOn` and `revisionModifiedOn` of the entry before and after: any difference is `true`, no difference is `false`. The base `loadRevision` also sets its `loading` text, so the form's overlay loader shows for the duration of the read (accepted, see Contract notes).
   - `getCmsEntryReviewInitParams` gets the reloader through its input and sets `contentReloader`; both call sites in the decorator (`loadRevision` and the "saving a locked revision created a new revision" branch of `saveRevision`) build `new CmsEntryContentReloader(this.original, entry.id)`.

**Files:**
- Create: `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewChangeMessageHandlerImpl.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/CmsEntryContentReloader.ts`
- Modify: `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.ts`
- Modify: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts`
- Modify: `packages/app-headless-cms-workflows/src/testing/createEntry.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/CmsEntryContentReloader.test.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts`
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx`

**Interfaces:**
- Consumes: Task 10 (`ReviewChangeMessageHandler` from `@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js`: a plain exported class implementing `WebsocketEventHandler.Interface`, constructor `(activity: ReviewActivity.Interface, adapter: IReviewContentAdapter)`; `WORKFLOWS_REVIEW_CHANGED_ACTION` from `@webiny/app-workflows/review/domain/constants.js`; the widened `ReviewActivitySignal { namespace; source; reviewId: string | null; targetRevisionId: string | null }`), Task 13 (`IReviewContentReloader` from `@webiny/app-workflows/review/content/IReviewContentReloader.js`; `contentReloader: IReviewContentReloader | null` on `TargetReviewInitParams`; the fake presenter of `targetReviewFakes.ts` keeps `init` as a `vi.fn`). Existing (verified): `WebsocketEventHandler` (`@webiny/app-websockets/events/abstractions.js`), `WebsocketEvent` (`@webiny/app-websockets/events/WebsocketEvent.js`), `ReviewActivity` (`@webiny/app-workflows/review/activity/abstractions.js`, `IReviewActivity { subscribe; notify }`), `CmsReviewContentAdapter` (`~/features/gateway/CmsReviewContentAdapter.js`), `ContentEntryFormPresenter` (`@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js`: `vm.entry`, `vm.isDirty`, `loadRevision(id)`), `CmsContentEntry.revisionSavedOn: string` and `revisionModifiedOn: string | null` (`@webiny/app-headless-cms-common/types/index.js`).
- Produces: `CmsReviewChangeMessageHandler` (registered in `CmsReviewFeature`), `CmsEntryContentReloader` (`new CmsEntryContentReloader(form: ContentEntryFormPresenter.Interface, revisionId: string)`), `CmsEntryReviewInitInput.contentReloader: IReviewContentReloader`. Nothing is added to a barrel.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. The type check of co-located tests is `yarn build -p @webiny/app-headless-cms-workflows --no-cache` (R243).

- [ ] **Step 1: Write the failing tests**

Modify `packages/app-headless-cms-workflows/src/testing/createEntry.ts` so a test can set the revision timestamps. Replace the whole file:

```ts
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

export const REVISION_SAVED_ON = "2026-10-17T10:00:00.000Z";

export function createEntry(
    overrides: Partial<CmsContentEntry["meta"]> = {},
    fields: Partial<CmsContentEntry> = {}
): CmsContentEntry {
    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        modelId: "article",
        revisionSavedOn: REVISION_SAVED_ON,
        revisionModifiedOn: null,
        meta: {
            title: "Hello",
            status: "draft",
            version: 1,
            locked: false,
            ...overrides
        },
        values: {},
        ...fields
    } as unknown as CmsContentEntry;
}
```

Create `packages/app-headless-cms-workflows/src/presentation/CmsEntryContentReloader.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { createEntry } from "~/testing/createEntry.js";
import { createFormVm } from "~/testing/createFormVm.js";
import { CmsEntryContentReloader } from "./CmsEntryContentReloader.js";

const SAVED_LATER = "2026-10-17T11:00:00.000Z";
const MODIFIED_LATER = "2026-10-17T11:05:00.000Z";

interface FormState {
    vm: ContentEntryFormPresenter.ViewModel;
}

describe("CmsEntryContentReloader", () => {
    let state: FormState;
    let loadRevision: ReturnType<typeof vi.fn>;
    let reloader: CmsEntryContentReloader;

    beforeEach(() => {
        state = { vm: createFormVm({ entry: createEntry(), isDirty: false }) };
        loadRevision = vi.fn(async (_id: string) => undefined);
        const form = {
            get vm() {
                return state.vm;
            },
            loadRevision
        } as unknown as ContentEntryFormPresenter.Interface;
        reloader = new CmsEntryContentReloader(form, "entry-1#0001");
    });

    it("reads the revision again and returns true when revisionSavedOn changed", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({
                entry: createEntry({}, { revisionSavedOn: SAVED_LATER })
            });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(true);
        expect(loadRevision).toHaveBeenCalledTimes(1);
        expect(loadRevision).toHaveBeenCalledWith("entry-1#0001");
    });

    it("returns true when only revisionModifiedOn changed", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({
                entry: createEntry({}, { revisionModifiedOn: MODIFIED_LATER })
            });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(true);
    });

    it("returns false when both timestamps are the same after the read", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({ entry: createEntry() });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).toHaveBeenCalledTimes(1);
    });

    it("does not read while the form is dirty", async () => {
        state.vm = createFormVm({ entry: createEntry(), isDirty: true });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).not.toHaveBeenCalled();
    });

    it("does not read when no entry is loaded", async () => {
        state.vm = createFormVm({ entry: null });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).not.toHaveBeenCalled();
    });

    it("does not read when the editor moved to another revision", async () => {
        state.vm = createFormVm({ entry: createEntry({}, { id: "entry-1#0002" }) });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(loadRevision).not.toHaveBeenCalled();
    });

    it("returns false when the read left no entry or another revision loaded", async () => {
        loadRevision.mockImplementation(async () => {
            state.vm = createFormVm({ entry: null });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
    });

    it("lets a failed read reject so the presenter can ignore it", async () => {
        const failure = new Error("Network down");
        loadRevision.mockRejectedValue(failure);

        const error = await reloader.reload().catch(e => e);

        expect(error).toBe(failure);
    });
});
```

Create `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { createEntry } from "~/testing/createEntry.js";
import { MODEL } from "~/testing/models.js";
import { getCmsEntryReviewInitParams } from "./getCmsEntryReviewInitParams.js";

describe("getCmsEntryReviewInitParams", () => {
    it("builds the target, the context and carries the use cases and the reloader", () => {
        const useCases = createFakeUseCases();
        const contentReloader: IReviewContentReloader = { reload: vi.fn() };

        const params = getCmsEntryReviewInitParams({
            model: MODEL,
            entry: createEntry({ status: "published" }),
            useCases,
            canRequest: true,
            contentReloader
        });

        expect(params.useCases).toBe(useCases);
        expect(params.contentReloader).toBe(contentReloader);
        expect(params.target).toEqual({
            namespace: "cms.article",
            targetRevisionId: "entry-1#0001"
        });
        expect(params.targetTitle).toBe("Article: Hello");
        expect(params.canRequest).toBe(true);
        expect(params.isPublished).toBe(true);
        expect(params.isUnpublished).toBe(false);
    });
});
```

Modify `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`. First, the one exact-object expectation of `init` gains the reloader. Before:

```ts
        expect(fake.presenter.init).toHaveBeenCalledWith({
            useCases: fake.useCases,
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            contentReloader: null,
            targetTitle: "Article: Hello",
```

After:

```ts
        expect(fake.presenter.init).toHaveBeenCalledWith({
            useCases: fake.useCases,
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            contentReloader: expect.any(CmsEntryContentReloader),
            targetTitle: "Article: Hello",
```

Add the imports next to the other `~/` imports (one per line):

```ts
import { CmsEntryContentReloader } from "~/presentation/CmsEntryContentReloader.js";
import { REVISION_SAVED_ON } from "~/testing/createEntry.js";
```

Then insert these tests before `it("does not publish while the review forbids it"` (that line is unique in the file):

```ts
    it("gives the new revision a reloader after a save created it", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(NO_WORKFLOW);
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({}, { id: "entry-1#0002" }) });
            return true;
        });

        await presenter.saveRevision();

        const first = fake.presenter.init.mock.calls[0][0].contentReloader;
        const second = fake.presenter.init.mock.calls[1][0].contentReloader;
        expect(second).toBeInstanceOf(CmsEntryContentReloader);
        expect(second).not.toBe(first);
    });

    describe("content reloader", () => {
        const SAVED_LATER = "2026-10-17T11:00:00.000Z";

        async function loadAndGetReloader() {
            await presenter.loadRevision("entry-1#0001");
            const params = fake.presenter.init.mock.calls[0][0];
            const reloader = params.contentReloader;
            if (!reloader) {
                throw new Error("The init params carry no reloader.");
            }
            return reloader;
        }

        it("returns true when the revision timestamps changed and reads the revision again", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionSavedOn: SAVED_LATER })
                });
            });

            const changed = await reloader.reload();

            expect(changed).toBe(true);
            expect(base.loadRevision).toHaveBeenCalledTimes(2);
            expect(base.loadRevision).toHaveBeenLastCalledWith("entry-1#0001");
        });

        it("returns true when only revisionModifiedOn changed", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionModifiedOn: "2026-10-17T11:05:00.000Z" })
                });
            });

            const changed = await reloader.reload();

            expect(changed).toBe(true);
        });

        it("returns false when the timestamps are the same", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionSavedOn: REVISION_SAVED_ON })
                });
            });

            const changed = await reloader.reload();

            expect(changed).toBe(false);
        });

        it("does not reload while the form is dirty", async () => {
            const reloader = await loadAndGetReloader();
            base.vm = loadedVm({ isDirty: true });

            const changed = await reloader.reload();

            expect(changed).toBe(false);
            expect(base.loadRevision).toHaveBeenCalledTimes(1);
        });

        it("never initialises the review presenter again", async () => {
            const reloader = await loadAndGetReloader();
            base.loadRevision.mockImplementation(async () => {
                base.vm = loadedVm({
                    entry: createEntry({}, { revisionSavedOn: SAVED_LATER })
                });
            });

            await reloader.reload();

            expect(fake.presenter.init).toHaveBeenCalledTimes(1);
            expect(fake.presenter.setContext).not.toHaveBeenCalled();
            expect(fake.presenter.dispose).not.toHaveBeenCalled();
        });
    });

```

Modify `packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts`. The `createContainer` registers the activity the change handler needs (the existing tests resolve every `WebsocketEventHandler`, which now includes it). Add the imports (one per line) after the `ReviewNotificationService` import:

```ts
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { WORKFLOWS_REVIEW_CHANGED_ACTION } from "@webiny/app-workflows/review/domain/constants.js";
```

Before:

```ts
const handle = vi.fn();
```

After:

```ts
const handle = vi.fn();
const notify = vi.fn();
```

Before:

```ts
    container.registerInstance(ReviewNotificationService, { handle });
    return container;
};
```

After:

```ts
    container.registerInstance(ReviewNotificationService, { handle });
    container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify });
    return container;
};
```

Before:

```ts
describe("CmsReviewFeature Content Reviews registrations", () => {
    beforeEach(() => {
        handle.mockReset();
    });
```

After:

```ts
const changeMessage = (namespace: string) => {
    return new WebsocketEvent({
        action: WORKFLOWS_REVIEW_CHANGED_ACTION,
        data: {
            kind: "stepStarted",
            reviewId: "review-1",
            stepId: "step-1",
            namespace,
            targetId: "entry-1",
            targetRevisionId: "entry-1#0001"
        }
    });
};

describe("CmsReviewFeature Content Reviews registrations", () => {
    beforeEach(() => {
        handle.mockReset();
        notify.mockReset();
    });
```

Append these tests inside the same `describe`, after the last existing `it`:

```ts
    it("registers a change message handler that signals cms frames and ignores wb frames (R260)", async () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const own = handlers.filter(handler => handler instanceof ReviewChangeMessageHandler);
        expect(own).toHaveLength(1);

        await own[0].handle(changeMessage("cms.article"));
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith({
            namespace: "cms.article",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "entry-1#0001"
        });

        await own[0].handle(changeMessage("wb.page"));
        expect(notify).toHaveBeenCalledTimes(1);
    });

    it("shows no toast for a change message and signals nothing for a notification (R253)", async () => {
        const container = createContainer();
        CmsReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const changeHandler = handlers.find(handler => handler instanceof ReviewChangeMessageHandler);
        const notificationHandler = handlers.find(handler => {
            return handler instanceof ReviewNotificationHandler;
        });
        if (!changeHandler || !notificationHandler) {
            throw new Error("Both handlers must be registered.");
        }

        await changeHandler.handle(changeMessage("cms.article"));
        expect(handle).not.toHaveBeenCalled();

        await notificationHandler.handle(changeMessage("cms.article"));
        await changeHandler.handle(message("cms.article"));
        expect(handle).not.toHaveBeenCalled();
        expect(notify).toHaveBeenCalledTimes(1);
    });
```

Modify `packages/app-headless-cms-workflows/src/index.test.tsx` (the composition root). Add the imports after the `ReviewNotificationService` import:

```ts
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
```

In `createContainer`, before:

```ts
        container.registerInstance(ReviewNotificationService, { handle: vi.fn() });
```

After:

```ts
        container.registerInstance(ReviewNotificationService, { handle: vi.fn() });
        container.registerInstance(ReviewActivity, { subscribe: vi.fn(), notify: vi.fn() });
```

Insert before `it("mounts the Content Reviews route and sidebar item and registers the presenter with the flag on"` (unique):

```ts
    it("registers the change message handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(true);
    });

    it("registers no change message handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <CmsWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(false);
    });

```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryContentReloader.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -40
```

Expected: FAIL. The first fails to resolve `./CmsEntryContentReloader.js`; the second and third fail on the missing `contentReloader` and the missing import; the fourth and fifth fail because `CmsReviewChangeMessageHandler` is not registered (no `ReviewChangeMessageHandler` instance among the handlers).

- [ ] **Step 3: Implement**

Create `packages/app-headless-cms-workflows/src/presentation/CmsEntryContentReloader.ts`:

```ts
import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";

/*
 * Reloads the revision a review is tracking after an AI or automation step may have changed it
 * (R262). It works on the undecorated form presenter and never touches the review presenter, so
 * the review bar is not re-initialised. `true` means the reloaded revision differs from the loaded
 * one.
 */
export class CmsEntryContentReloader implements IReviewContentReloader {
    constructor(
        private readonly form: ContentEntryFormPresenter.Interface,
        private readonly revisionId: string
    ) {}

    async reload(): Promise<boolean> {
        const before = this.form.vm.entry;

        // The editor moved to another revision, or has none loaded: there is nothing to reload.
        if (!before || before.id !== this.revisionId) {
            return false;
        }

        // An unsaved edit is never overwritten. While a review locks the form it cannot be dirty.
        if (this.form.vm.isDirty) {
            return false;
        }

        await this.form.loadRevision(this.revisionId);

        const after = this.form.vm.entry;

        if (!after || after.id !== this.revisionId) {
            return false;
        }

        const sameSavedOn = after.revisionSavedOn === before.revisionSavedOn;
        const sameModifiedOn = after.revisionModifiedOn === before.revisionModifiedOn;

        return !sameSavedOn || !sameModifiedOn;
    }
}
```

Modify `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts`. Add the import after the `TargetReviewInitParams` import:

```ts
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
```

Before:

```ts
    useCases: IReviewUseCases;
    canRequest: boolean;
}
```

After:

```ts
    useCases: IReviewUseCases;
    canRequest: boolean;
    contentReloader: IReviewContentReloader;
}
```

Before:

```ts
    const { model, entry, useCases, canRequest } = input;
    const context = getCmsEntryReviewContext(model, entry, canRequest);

    return {
        ...context,
        useCases,
        target: { namespace: createAppName(model), targetRevisionId: entry.id },
        // Task 17 replaces this with the CMS content reloader.
        contentReloader: null
    };
```

After:

```ts
    const { model, entry, useCases, canRequest, contentReloader } = input;
    const context = getCmsEntryReviewContext(model, entry, canRequest);

    return {
        ...context,
        useCases,
        target: { namespace: createAppName(model), targetRevisionId: entry.id },
        contentReloader
    };
```

Modify `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.ts`. Add the import after the `getCmsEntryReviewInitParams` import:

```ts
import { CmsEntryContentReloader } from "~/presentation/CmsEntryContentReloader.js";
```

In `loadRevision`, before:

```ts
        this.setPhase("tracking", entry.id);

        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest: this.original.vm.canSave
        });

        await this.session.presenter.init(params);
    }
```

After:

```ts
        this.setPhase("tracking", entry.id);

        const contentReloader = new CmsEntryContentReloader(this.original, entry.id);
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest: this.original.vm.canSave,
            contentReloader
        });

        await this.session.presenter.init(params);
    }
```

In `saveRevision`, before:

```ts
        // Saving a locked revision creates a new revision, which has no review yet.
        this.setPhase("tracking", entry.id);

        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest
        });
```

After:

```ts
        // Saving a locked revision creates a new revision, which has no review yet.
        this.setPhase("tracking", entry.id);

        const contentReloader = new CmsEntryContentReloader(this.original, entry.id);
        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest,
            contentReloader
        });
```

Create `packages/app-headless-cms-workflows/src/features/gateway/CmsReviewChangeMessageHandlerImpl.ts`:

```ts
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { CmsReviewContentAdapter } from "./CmsReviewContentAdapter.js";

// A subclass of its own (see CmsReviewNotificationHandlerImpl): the Website Builder binds its own.
class CmsReviewChangeMessageHandlerImpl
    extends ReviewChangeMessageHandler
    implements WebsocketEventHandler.Interface {}

export const CmsReviewChangeMessageHandler = WebsocketEventHandler.createImplementation({
    implementation: CmsReviewChangeMessageHandlerImpl,
    dependencies: [ReviewActivity, CmsReviewContentAdapter]
});
```

Modify `packages/app-headless-cms-workflows/src/features/gateway/feature.ts`. Add after the `CmsReviewNotificationHandler` import:

```ts
import { CmsReviewChangeMessageHandler } from "./CmsReviewChangeMessageHandlerImpl.js";
```

Before:

```ts
        container.register(CmsReviewNotificationHandler);
    },
```

After:

```ts
        container.register(CmsReviewNotificationHandler);
        container.register(CmsReviewChangeMessageHandler);
    },
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryContentReloader.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.test.ts 2>&1 | tail -30
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -40
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -40
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts packages/app-headless-cms-workflows/src/index.editor.test.tsx packages/app-headless-cms-workflows/src/index.lists.test.tsx packages/app-headless-cms-workflows/src/index.cleanup.test.tsx 2>&1 | tail -40
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors.

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-headless-cms-workflows): refetch on review changes and reload the entry after an automated step" -m "The CMS binds a subclass of ReviewChangeMessageHandler so workflows.reviewChanged frames of cms namespaces signal the activity bus. CmsEntryContentReloader reloads the tracked revision through the undecorated form presenter, skips a dirty form and reports whether the revision timestamps changed; the init params builder and both call sites of the decorator pass it." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Handler dependencies.** The contract says Task 10's handler "takes frames whose namespace the app's content adapter handles and calls `activity.notify`". This task assumes the constructor `(activity: ReviewActivity.Interface, adapter: IReviewContentAdapter)` and binds `dependencies: [ReviewActivity, CmsReviewContentAdapter]`, mirroring the sibling `CmsReviewNotificationHandlerImpl.ts`. Task 10 ships exactly this constructor, `(activity: ReviewActivity.Interface, adapter: IReviewContentAdapter)` (checked in the consistency pass).
- **Loader overlay (accepted, Q40).** The base `ContentEntryFormPresenter.loadRevision` sets `loading = "Loading entry..."`, and `ContentEntryFormView.tsx:95` renders an `OverlayLoader` over the form for the duration of the read. The user accepted this flash; no mask is built.
- **Reloader per init.** The contract says the decorator "builds the R262 CMS reloader over `this.original.loadRevision`"; the reloader is built per `init` call with the revision id it belongs to, so a reload that arrives after the editor moved to another revision does nothing (tested).
- **Existing expectation changed:** the exact-object `init` expectation in `CmsEntryFormPresenterReviewDecorator.test.ts` gains `contentReloader: expect.any(CmsEntryContentReloader)`.
