### Task 18: WB glue (change message handler and page reloader)

R237, R238, R253, R260, R262; D160, D163; Q32, Q35; Review Focus 6 and 10. Global Constraints of 8a and 8b apply (no helper wrappers around dependency calls, the subclass rule R237, DI file conventions R238, no logic duplicated across CMS and WB, desktop only, admin code style, targeted tests, composition-root wiring tests with the flag on and off, the pre-commit chain, the commit format). The Website Builder twin of Task 17, with the one difference the contract names: the page editor cannot be dirty during a review (autosave is off while the review locks the page), so the reloader needs no dirty guard and Task 18 pins only the timestamp rule (Review Focus 6).

1. **The change message handler.** `WbReviewChangeMessageHandlerImpl.ts` subclasses Task 10's `ReviewChangeMessageHandler` once and binds the subclass to `WebsocketEventHandler`, exactly like `WbReviewNotificationHandlerImpl.ts`; `WbReviewFeature` registers it. It coexists with the CMS subclass in one container (R237), each handling only its own namespace.
2. **The page reloader** `WbPageContentReloader` implements Task 13's `IReviewContentReloader`. A96: the WB `GetPageRepository` returns the `FullPageCache` entry first, so the reloader must evict the page before reading. It runs once per finished non-user step:
   - baseline timestamps: the cached page's `savedOn` and `modifiedOn` when the page is cached (the autosave and publish repositories keep that cache current, so it is the newest state the client knows), otherwise the editor document's own (`modifiedOn` normalised with `?? ""`, the same default `Page.create` applies);
   - it evicts the page from `FullPageCache`, reads it with `GetPageUseCase.execute({ id })` and compares `savedOn` and `modifiedOn` with the baseline: both equal is `false` and the editor is not touched;
   - otherwise it maps the page with `pageToEditorDocument` (`@webiny/app-website-builder/presentation/pages/PageEditor/pageDocument.js`) and applies `properties`, `bindings`, `elements`, `metadata`, `extensions`, `savedOn` and `modifiedOn` with `editor.updateDocument`, and returns `true`. The editor is not re-mounted and the review presenter is never re-initialised.
3. **Mounting.** `PageReviewBar` builds its init params inline. It gets the use case from the existing `GetPageFeature` (`useFeature(GetPageFeature)` resolves `{ useCase }`) and the cache from its owning feature: `SharedPageInfrastructureFeature.resolve()` in `app-website-builder` (currently `resolve() { return {}; }`) returns `{ fullPageCache: container.resolve(FullPageCache) }`, a one-line additive change in the base package that stays in this task (no behaviour changes, so no separate commit; the commit body says so). It constructs `new WbPageContentReloader(editor, pageCache, getPage)` inside the `init` effect and passes it as `contentReloader`. `IPageEditorDocument` gains the optional `savedOn` and `modifiedOn` (the editor document is the loaded `Page` spread, so they are present at run time; `getPageDataFromPage` in `PageEditor.tsx` spreads `...page`).
4. **Test support.** Every test that renders `PageReviewBar` (through `PageEditorTopBar`, or the root with the flag on) now needs `FullPageCache` and `GetPageUseCase` in its container. One helper `~/testing/registerPageContent.ts` registers a `ListCache` and a stub use case; four existing tests call it.

**Files:**
- Create: `packages/app-website-builder-workflows/src/features/gateway/WbReviewChangeMessageHandlerImpl.ts`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/feature.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorReview/WbPageContentReloader.ts`
- Modify: `packages/app-website-builder/src/features/pages/shared/feature.ts`
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/pageEditorDocument.ts`
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`
- Create: `packages/app-website-builder-workflows/src/testing/registerPageContent.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorReview/WbPageContentReloader.test.ts`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts`
- Modify: `packages/app-website-builder-workflows/src/index.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx`
- Modify: `packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx`

**Interfaces:**
- Consumes: Task 10 (`ReviewChangeMessageHandler`, `WORKFLOWS_REVIEW_CHANGED_ACTION`, the widened signal; see Task 17), Task 13 (`IReviewContentReloader` from `@webiny/app-workflows/review/content/IReviewContentReloader.js`, `contentReloader: IReviewContentReloader | null` on `TargetReviewInitParams`). Existing (verified): `Editor` (`@webiny/app-website-builder/editorSdk/Editor.js`: `getDocumentState().read()`, `updateDocument(cb)`, `getEditorOptions()`; `State.read()` returns the pending state, so a test reads the update at once), `GetPageUseCase` (`@webiny/app-website-builder/features/pages/getPage/abstractions.js`, `execute({ id }): Promise<Page>`, resolved from the container with the loading decorator in the real app), `FullPageCache` (`@webiny/app-website-builder/features/pages/shared/abstractions.js`, `IListCache<Page>`: `getItem(predicate)`, `removeItems(predicate)`), `ListCache` (`@webiny/app-admin/features/listCache/index.js`), `Page` (`@webiny/app-website-builder/domain/Page/index.js`, `Page.create`, `savedOn`/`modifiedOn` default `""`), `pageToEditorDocument` (`@webiny/app-website-builder/presentation/pages/PageEditor/pageDocument.js`), `WbReviewContentAdapter` (`~/features/gateway/WbReviewContentAdapter.js`, handles `wb.page`), `WbPageReview` (`~/features/editorReview/WbPageReview.js`).
- Produces: `WbReviewChangeMessageHandler` (registered in `WbReviewFeature`), `WbPageContentReloader` (`new WbPageContentReloader(editor: Editor<IPageEditorDocument>, cache: FullPageCache.Interface, getPage: GetPageUseCase.Interface)`), `SharedPageInfrastructureFeature.resolve()` returning `{ fullPageCache }` (`app-website-builder`), `registerPageContent(container)` for tests.

**Test runner note:** this task also changes `app-website-builder` (one additive line), which the workflows package imports from its build output, so build it first (Steps 4-6). Admin package, `yarn test <path>` only; `.tsx` tests import `React`. The type check of co-located tests is `yarn build -p @webiny/app-website-builder-workflows --no-cache` (R243).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-website-builder-workflows/src/testing/registerPageContent.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { Container } from "@webiny/di";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { GetPageUseCase } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import type { GetPageParams } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";

export interface PageContentHandles {
    cache: ListCache<Page>;
    getPage: { execute: Mock<(params: GetPageParams) => Promise<Page>> };
}

// What `PageReviewBar` needs from `app-website-builder`: the full page cache and the get use case.
export const registerPageContent = (container: Container): PageContentHandles => {
    const cache = new ListCache<Page>("id");
    const getPage = {
        execute: vi.fn(async (params: GetPageParams) => {
            return Page.create({ id: params.id });
        })
    };

    container.registerInstance(FullPageCache, cache);
    container.registerInstance(GetPageUseCase, getPage);

    return { cache, getPage };
};
```

Create `packages/app-website-builder-workflows/src/features/editorReview/WbPageContentReloader.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { ListCache } from "@webiny/app-admin/features/listCache/index.js";
import { Page } from "@webiny/app-website-builder/domain/Page/index.js";
import { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { GetPageUseCase } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import type { DocumentElement } from "@webiny/website-builder-sdk";
import type { ElementMap } from "@webiny/website-builder-sdk";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";
import { WbPageContentReloader } from "./WbPageContentReloader.js";

const PAGE_ID = "page-1#0001";
const SAVED = "2026-10-17T10:00:00.000Z";
const SAVED_LATER = "2026-10-17T11:00:00.000Z";
const MODIFIED = "2026-10-17T10:30:00.000Z";
const MODIFIED_LATER = "2026-10-17T11:30:00.000Z";

const ROOT: DocumentElement = {
    type: "Webiny/Element",
    id: "root",
    component: { name: "Webiny/Box" }
};
const HERO: DocumentElement = {
    type: "Webiny/Element",
    id: "hero",
    component: { name: "Webiny/Heading" },
    parent: { id: "root", slot: "children" }
};
const OLD_ELEMENTS: ElementMap = { root: ROOT };
const NEW_ELEMENTS: ElementMap = { root: ROOT, hero: HERO };

interface FakeGetPage {
    execute: ReturnType<typeof vi.fn>;
}

function createPage(overrides: Partial<Parameters<typeof Page.create>[0]> = {}): Page {
    return Page.create({
        id: PAGE_ID,
        entryId: "page-1",
        status: WbPageStatus.Draft,
        properties: { title: "Home" },
        elements: OLD_ELEMENTS,
        savedOn: SAVED,
        modifiedOn: MODIFIED,
        ...overrides
    });
}

function createEditor(overrides: Partial<IPageEditorDocument> = {}): Editor<IPageEditorDocument> {
    const document: IPageEditorDocument = {
        id: PAGE_ID,
        status: WbPageStatus.Draft,
        version: 1,
        state: {},
        properties: { title: "Home" },
        extensions: {},
        metadata: {},
        bindings: {},
        elements: OLD_ELEMENTS,
        savedOn: SAVED,
        modifiedOn: MODIFIED,
        ...overrides
    };

    return new Editor<IPageEditorDocument>(document, { isReadOnly: true });
}

describe("WbPageContentReloader", () => {
    let cache: ListCache<Page>;
    let editor: Editor<IPageEditorDocument>;
    let getPage: FakeGetPage;
    let reloader: WbPageContentReloader;
    let cachedWhenRead: Page | undefined;

    beforeEach(() => {
        cache = new ListCache<Page>("id");
        cache.addItems([createPage(), createPage({ id: "page-2#0001", entryId: "page-2" })]);
        editor = createEditor();
        cachedWhenRead = undefined;
        getPage = {
            execute: vi.fn(async (_params: GetPageUseCase.Params) => {
                cachedWhenRead = cache.getItem(page => page.id === PAGE_ID);
                return createPage({ savedOn: SAVED_LATER, elements: NEW_ELEMENTS });
            })
        };
        reloader = new WbPageContentReloader(
            editor,
            cache,
            getPage as unknown as GetPageUseCase.Interface
        );
    });

    it("evicts the page from the full page cache before it reads it (A96)", async () => {
        await reloader.reload();

        expect(getPage.execute).toHaveBeenCalledTimes(1);
        expect(getPage.execute).toHaveBeenCalledWith({ id: PAGE_ID });
        expect(cachedWhenRead).toBeUndefined();
    });

    it("keeps the other cached pages", async () => {
        await reloader.reload();

        const other = cache.getItem(page => page.id === "page-2#0001");
        expect(other).toBeDefined();
    });

    it("applies the reloaded content with updateDocument and returns true when savedOn changed", async () => {
        const changed = await reloader.reload();

        expect(changed).toBe(true);
        const document = editor.getDocumentState().read();
        expect(document.elements).toEqual(NEW_ELEMENTS);
        expect(document.savedOn).toBe(SAVED_LATER);
        expect(document.modifiedOn).toBe(MODIFIED);
        expect(document.id).toBe(PAGE_ID);
        expect(document.status).toBe(WbPageStatus.Draft);
    });

    it("returns true when only modifiedOn changed", async () => {
        getPage.execute.mockImplementation(async () => {
            return createPage({ modifiedOn: MODIFIED_LATER, elements: NEW_ELEMENTS });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(true);
        expect(editor.getDocumentState().read().modifiedOn).toBe(MODIFIED_LATER);
    });

    it("returns false and leaves the editor alone when the timestamps are the same", async () => {
        getPage.execute.mockImplementation(async () => {
            return createPage({ elements: NEW_ELEMENTS });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(editor.getDocumentState().read().elements).toEqual(OLD_ELEMENTS);
    });

    it("compares with the cached page when it is cached, not with the stale document", async () => {
        cache.removeItems(page => page.id === PAGE_ID);
        cache.addItems([createPage({ savedOn: SAVED_LATER })]);
        getPage.execute.mockImplementation(async () => {
            return createPage({ savedOn: SAVED_LATER, elements: NEW_ELEMENTS });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
        expect(editor.getDocumentState().read().elements).toEqual(OLD_ELEMENTS);
    });

    it("compares with the editor document when the page is not cached", async () => {
        cache.clear();

        const changed = await reloader.reload();

        expect(changed).toBe(true);
    });

    it("treats a missing modifiedOn of the document like the empty string Page.create uses", async () => {
        cache.clear();
        editor = createEditor({ modifiedOn: null });
        reloader = new WbPageContentReloader(
            editor,
            cache,
            getPage as unknown as GetPageUseCase.Interface
        );
        getPage.execute.mockImplementation(async () => {
            return createPage({ modifiedOn: "" });
        });

        const changed = await reloader.reload();

        expect(changed).toBe(false);
    });

    it("lets a failed read reject and leaves the editor alone", async () => {
        const failure = new Error("Network down");
        getPage.execute.mockRejectedValue(failure);

        const error = await reloader.reload().catch(e => e);

        expect(error).toBe(failure);
        expect(editor.getDocumentState().read().elements).toEqual(OLD_ELEMENTS);
    });
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx`:

```tsx
import React from "react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { WbPageContentReloader } from "~/features/editorReview/WbPageContentReloader.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import { registerPageContent } from "~/testing/registerPageContent.js";
import { PageReviewBar } from "./PageReviewBar.js";

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");
    const EditorReviewBar = () => {
        return React.createElement("div", { "data-testid": "review-bar" });
    };
    return { EditorReviewBar };
});

const mountBar = () => {
    const handle = createFakeSession("inProgress");
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const content = registerPageContent(container);
    const editor = createPageEditor("draft");

    const view = render(
        <WbEditorHarness container={container} editor={editor}>
            <PageReviewBar />
        </WbEditorHarness>
    );

    return { ...handle, ...content, editor, view };
};

describe("PageReviewBar", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the review bar", () => {
        mountBar();

        expect(screen.queryAllByTestId("review-bar")).toHaveLength(1);
    });

    it("initialises the presenter with the target, the context and a page content reloader (R262)", () => {
        const { presenter, useCases } = mountBar();

        expect(presenter.init).toHaveBeenCalledTimes(1);
        const params = presenter.init.mock.calls[0][0];
        expect(params.useCases).toBe(useCases);
        expect(params.target).toEqual({ namespace: "wb.page", targetRevisionId: "page-1#0001" });
        expect(params.targetTitle).toBe("Home");
        expect(params.contentReloader).toBeInstanceOf(WbPageContentReloader);
    });

    it("builds a reloader over the editor, the full page cache and the get use case", async () => {
        const { presenter, getPage, cache } = mountBar();
        const reloader = presenter.init.mock.calls[0][0].contentReloader;
        if (!reloader) {
            throw new Error("The init params carry no reloader.");
        }

        await reloader.reload();

        expect(getPage.execute).toHaveBeenCalledTimes(1);
        expect(getPage.execute).toHaveBeenCalledWith({ id: "page-1#0001" });
        expect(cache.getItems()).toEqual([]);
    });

    it("disposes the presenter on unmount", () => {
        const { presenter, view } = mountBar();

        view.unmount();

        expect(presenter.dispose).toHaveBeenCalledTimes(1);
    });
});
```

Modify `Components/PageEditor/PageEditorTopBar.test.tsx` twice more: its two exact `init` expectations (the draft case and the published case) gain the reloader. In both objects, before (as Task 13 leaves them):

```ts
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            contentReloader: null,
            targetTitle: "Home",
```

After:

```ts
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            contentReloader: expect.any(WbPageContentReloader),
            targetTitle: "Home",
```

and add `import { WbPageContentReloader } from "~/features/editorReview/WbPageContentReloader.js";` next to its other `~/features` import. Then modify the four tests that render `PageReviewBar`, one line each, plus the import `import { registerPageContent } from "~/testing/registerPageContent.js";` (after the other `~/testing/...` import).

`Components/PageEditor/PageEditorTopBar.test.tsx`, before:

```ts
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor(pageStatus);
```

After:

```ts
    container.registerInstance(WbPageReview, handle.session);
    registerPageContent(container);
    const editor = createPageEditor(pageStatus);
```

`Components/PageEditor/pageReviewMatrix.test.tsx`, before:

```ts
        container.registerInstance(WbPageReview, handle.session);
        const editor = createPageEditor(page);
```

After:

```ts
        container.registerInstance(WbPageReview, handle.session);
        registerPageContent(container);
        const editor = createPageEditor(page);
```

`editorGlue.wiring.test.tsx` and `publishAutosave.wiring.test.tsx`, before:

```ts
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
```

After:

```ts
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    registerPageContent(container);
```

(In both files the line occurs once inside the mount helper; the import uses the `~/testing/` alias like the neighbouring imports.)

Modify `packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts`. Add the imports (one per line) after the `ReviewNotificationService` import:

```ts
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { WORKFLOWS_REVIEW_CHANGED_ACTION } from "@webiny/app-workflows/review/domain/constants.js";
import { CmsReviewChangeMessageHandler } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewChangeMessageHandlerImpl.js";
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
describe("WbReviewFeature Content Reviews registrations", () => {
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
            targetId: "page-1",
            targetRevisionId: "page-1#0001"
        }
    });
};

describe("WbReviewFeature Content Reviews registrations", () => {
    beforeEach(() => {
        handle.mockReset();
        notify.mockReset();
    });
```

Append inside the same `describe`, after the last existing `it`:

```ts
    it("registers a change message handler that signals page frames and ignores cms frames (R260)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);

        const handlers = container.resolveAll(WebsocketEventHandler);
        const own = handlers.filter(handler => handler instanceof ReviewChangeMessageHandler);
        expect(own).toHaveLength(1);

        await own[0].handle(changeMessage("wb.page"));
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify).toHaveBeenCalledWith({
            namespace: "wb.page",
            source: "remote",
            reviewId: "review-1",
            targetRevisionId: "page-1#0001"
        });

        await own[0].handle(changeMessage("cms.article"));
        expect(notify).toHaveBeenCalledTimes(1);
        expect(handle).not.toHaveBeenCalled();
    });

    it("coexists with the CMS change message handler, each signalling only its own namespace (R237)", async () => {
        const container = createContainer();
        WbReviewFeature.register(container);
        const cmsAdapter: IReviewContentAdapter = {
            canHandle: namespace => namespace.startsWith("cms."),
            getContentUrl: () => "/cms/content-entries/article?id=entry-1%230001",
            getContentTypeLabel: () => null
        };
        container.registerInstance(CmsReviewContentAdapter, cmsAdapter);
        container.register(CmsReviewChangeMessageHandler);

        const handlers = container
            .resolveAll(WebsocketEventHandler)
            .filter(handler => handler instanceof ReviewChangeMessageHandler);
        expect(handlers).toHaveLength(2);

        for (const handler of handlers) {
            await handler.handle(changeMessage("wb.page"));
        }
        expect(notify).toHaveBeenCalledTimes(1);
        expect(notify.mock.calls[0][0].namespace).toBe("wb.page");

        for (const handler of handlers) {
            await handler.handle(changeMessage("cms.article"));
        }
        expect(notify).toHaveBeenCalledTimes(2);
        expect(notify.mock.calls[1][0].namespace).toBe("cms.article");
    });
```

Modify `packages/app-website-builder-workflows/src/index.test.tsx`. Add the imports after the `ReviewNotificationService` import:

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

Insert before `it("mounts the Content Reviews route glue with the flag on"` (unique):

```ts
    it("registers the change message handler with the flag on", () => {
        const container = createContainer(true);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(true);
    });

    it("registers no change message handler with the flag off", () => {
        const container = createContainer(false);

        render(
            <DiContainerProvider container={container}>
                <WebsiteBuilderWorkflows />
            </DiContainerProvider>
        );

        const handlers = container.resolveAll(WebsocketEventHandler);
        expect(handlers.some(handler => handler instanceof ReviewChangeMessageHandler)).toBe(false);
    });

```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-website-builder-workflows/src/features/editorReview/WbPageContentReloader.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -40
```

Expected: FAIL. The first fails to resolve `./WbPageContentReloader.js`; the second fails on the same import; the third and fourth fail because `WbReviewChangeMessageHandler` is not registered. (`PageEditorTopBar.test.tsx` fails on its exact `init` expectations once `contentReloader` is added, see Step 1; the other modified tests only add a registration.)

- [ ] **Step 3: Implement**

Modify `packages/app-website-builder-workflows/src/Components/PageEditor/pageEditorDocument.ts`. Before:

```ts
export interface IPageEditorDocument extends EditorDocument {
    status: WbStatus;
}
```

After:

```ts
export interface IPageEditorDocument extends EditorDocument {
    status: WbStatus;
    // The editor document is the loaded page spread, so the revision timestamps are on it.
    savedOn?: string;
    modifiedOn?: string | null;
}
```

Create `packages/app-website-builder-workflows/src/features/editorReview/WbPageContentReloader.ts`:

```ts
import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import type { GetPageUseCase } from "@webiny/app-website-builder/features/pages/getPage/abstractions.js";
import type { FullPageCache } from "@webiny/app-website-builder/features/pages/shared/abstractions.js";
import { pageToEditorDocument } from "@webiny/app-website-builder/presentation/pages/PageEditor/pageDocument.js";
import type { IReviewContentReloader } from "@webiny/app-workflows/review/content/IReviewContentReloader.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";

/*
 * Reloads the page a review is tracking after an AI or automation step may have changed it
 * (R262). The page editor cannot be dirty during a review (autosave is off), so only the revision
 * timestamps decide. `GetPageRepository` returns the `FullPageCache` entry first (A96), so the
 * page is evicted before it is read. The editor is updated in place; the review presenter is never
 * initialised again. `true` means the reloaded page differs from the loaded one.
 */
export class WbPageContentReloader implements IReviewContentReloader {
    constructor(
        private readonly editor: Editor<IPageEditorDocument>,
        private readonly cache: FullPageCache.Interface,
        private readonly getPage: GetPageUseCase.Interface
    ) {}

    async reload(): Promise<boolean> {
        const document = this.editor.getDocumentState().read();
        const pageId = document.id;

        // The cached page is the newest state the client knows (autosave and publish keep it
        // current); the document is the fallback.
        let loadedSavedOn = document.savedOn;
        let loadedModifiedOn = document.modifiedOn ?? "";
        const cached = this.cache.getItem(item => item.id === pageId);

        if (cached) {
            loadedSavedOn = cached.savedOn;
            loadedModifiedOn = cached.modifiedOn;
        }

        this.cache.removeItems(item => item.id === pageId);

        const page = await this.getPage.execute({ id: pageId });

        const sameSavedOn = page.savedOn === loadedSavedOn;
        const sameModifiedOn = page.modifiedOn === loadedModifiedOn;

        if (sameSavedOn && sameModifiedOn) {
            return false;
        }

        const next = pageToEditorDocument(page);

        this.editor.updateDocument(state => {
            state.properties = next.properties;
            state.bindings = next.bindings;
            state.elements = next.elements;
            state.metadata = next.metadata;
            state.extensions = next.extensions;
            state.savedOn = page.savedOn;
            state.modifiedOn = page.modifiedOn;
        });

        return true;
    }
}
```

Modify `packages/app-website-builder/src/features/pages/shared/feature.ts` (the owning feature hands out its cache). Before:

```ts
    resolve() {
        return {};
    }
```

After:

```ts
    resolve(container) {
        return {
            fullPageCache: container.resolve(FullPageCache)
        };
    }
```

Modify `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`. Add the imports after the `WbPageReviewFeature` import:

```tsx
import { GetPageFeature } from "@webiny/app-website-builder/features/pages/getPage/index.js";
import { SharedPageInfrastructureFeature } from "@webiny/app-website-builder/features/pages/shared/feature.js";
import { WbPageContentReloader } from "~/features/editorReview/WbPageContentReloader.js";
```

Before:

```tsx
    const { session } = useFeature(WbPageReviewFeature);
    const editor = useDocumentEditor();
    const page = useSelectFromDocument<ISelectedPage, IPageEditorDocument>(selectPage);

    useEffect(() => {
        const context = getPageReviewContext(editor, page);
        void session.presenter.init({
            useCases: session.useCases,
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
            // Task 18 replaces this with the WB page content reloader.
            contentReloader: null,
            ...context
        });
        return () => {
            session.presenter.dispose();
        };
    }, [session, editor, page.id]);
```

After:

```tsx
    const { session } = useFeature(WbPageReviewFeature);
    const { fullPageCache } = useFeature(SharedPageInfrastructureFeature);
    const { useCase: getPage } = useFeature(GetPageFeature);
    const editor = useDocumentEditor<IPageEditorDocument>();
    const page = useSelectFromDocument<ISelectedPage, IPageEditorDocument>(selectPage);

    useEffect(() => {
        const context = getPageReviewContext(editor, page);
        const contentReloader = new WbPageContentReloader(editor, fullPageCache, getPage);
        void session.presenter.init({
            useCases: session.useCases,
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
            contentReloader,
            ...context
        });
        return () => {
            session.presenter.dispose();
        };
    }, [session, editor, page.id, fullPageCache, getPage]);
```

Create `packages/app-website-builder-workflows/src/features/gateway/WbReviewChangeMessageHandlerImpl.ts`:

```ts
import { WebsocketEventHandler } from "@webiny/app-websockets/events/abstractions.js";
import { ReviewActivity } from "@webiny/app-workflows/review/activity/abstractions.js";
import { ReviewChangeMessageHandler } from "@webiny/app-workflows/review/mounting/ReviewChangeMessageHandler.js";
import { WbReviewContentAdapter } from "./WbReviewContentAdapter.js";

// A subclass of its own (see WbReviewNotificationHandlerImpl): the CMS binds its own.
class WbReviewChangeMessageHandlerImpl
    extends ReviewChangeMessageHandler
    implements WebsocketEventHandler.Interface {}

export const WbReviewChangeMessageHandler = WebsocketEventHandler.createImplementation({
    implementation: WbReviewChangeMessageHandlerImpl,
    dependencies: [ReviewActivity, WbReviewContentAdapter]
});
```

Modify `packages/app-website-builder-workflows/src/features/gateway/feature.ts`. Add after the `WbReviewNotificationHandler` import:

```ts
import { WbReviewChangeMessageHandler } from "./WbReviewChangeMessageHandlerImpl.js";
```

Before:

```ts
        container.register(WbReviewNotificationHandler);
    },
```

After:

```ts
        container.register(WbReviewNotificationHandler);
        container.register(WbReviewChangeMessageHandler);
    },
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn build -p @webiny/app-website-builder --no-cache 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/editorReview/WbPageContentReloader.test.ts 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.test.tsx 2>&1 | tail -30
yarn test packages/app-website-builder-workflows/src/features/gateway/contentReviewsBindings.test.ts 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -40
```

Expected: PASS.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx packages/app-website-builder-workflows/src/publishAutosave.wiring.test.tsx 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.test.tsx packages/app-website-builder-workflows/src/Components/PageEditor/publishMatrix.test.tsx packages/app-website-builder-workflows/src/Components/PageEditor/PageNewRevisionDecorator.test.tsx packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorAutoSave.test.tsx 2>&1 | tail -40
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts packages/app-website-builder-workflows/src/index.cleanup.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-website-builder --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass, no TypeScript errors. The four modified tests are exactly the ones that render `PageReviewBar` (grep of `PageEditorTopBar` and `WbEditorHarness` users).

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
yarn build -p @webiny/app-website-builder --no-cache 2>&1 | tail -30
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-website-builder-workflows): refetch on review changes and reload the page after an automated step" -m "The Website Builder binds a subclass of ReviewChangeMessageHandler so workflows.reviewChanged frames of the page namespace signal the activity bus. WbPageContentReloader evicts the page from the full page cache, reads it again and applies it with editor.updateDocument when savedOn or modifiedOn changed; PageReviewBar passes it as contentReloader." -m "The one-line change to SharedPageInfrastructureFeature.resolve() in app-website-builder is additive: it exposes the full page cache the feature registers." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Cache and use case reach the bar through their owning features.** The contract says `PageReviewBar` "constructs the reloader with the editor, the cache and `getPage`". `getPage` is `GetPageFeature`'s `useCase`; the cache has no hook, so `SharedPageInfrastructureFeature.resolve()` (the feature that registers `FullPageCache`) now returns `{ fullPageCache }`. This is a one-line additive change in `app-website-builder` kept inside this task (`resolve()` returned `{}`; nothing reads it). Tests that mount the bar register both tokens through `registerPageContent` (four existing tests changed).
- **Baseline.** The contract compares `savedOn`/`modifiedOn` with "the loaded" page. The editor document may be older than the cache (autosave and publish update the cache), which would report a change that is only the earlier save, so the cached page is the baseline when present and the document otherwise.
- **`IPageEditorDocument` gains optional `savedOn` and `modifiedOn`.** They exist on the document at run time (`PageEditor.tsx` spreads the loaded `Page`); the type did not declare them.
- **Verify when executing:** `GetPageUseCaseWithLoading` marks the page loading state while the reload reads; `PageEditor` keeps its own local loading, so the editor does not show an overlay, but confirm in the app that no list or drawer flashes. `updateDocument` adds a history entry; the editor is read-only during a review, so undo is not reachable until the review ends (accepted). Autosave: `updateDocument` fires the document listeners, and `PageEditorAutoSave` is gated on `allowsEditing`; if the automated step was the last one and the review is already approved, `allowsEditing` can be true and autosave writes the freshly loaded content back (a user-less save that bumps `modifiedOn`). It cannot loop (the reload runs only on a step transition); check in the app and gate the reload if it shows.
- **Existing expectations changed:** the two exact `init` expectations of `PageEditorTopBar.test.tsx` gain `contentReloader: expect.any(WbPageContentReloader)`.
- **Handler dependencies:** as Task 17 (`[ReviewActivity, WbReviewContentAdapter]`, mirrors Task 10's constructor).
