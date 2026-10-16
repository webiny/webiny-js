### Task 22: WB editor shell glue (bar, tooltip, read-only source, `PageEditorConfig`)

Spec 13.1, 13.4 (Website Builder editor); R202 (shared core, thin glue), R211 (gated root, decorator approach), R212 (singleton editor session, `dispose` resets), R217 (`canRequest`), R225 (loading and failure), R226 (lock rules), R227 (WB specifics), A78 (each extension point is decorated once, the old decorator is replaced); Q10; QBZ-1, QBZ-22, QBZ-23, QBZ-61; Review Focus 1, 3, 5, 8, 16, 17. The shared `EditorReviewBar` (Task 19) already renders the bar, the dialogs and the details drawer; this task only mounts it in the Website Builder page editor, gives the editor one place that decides whether the canvas is read-only, and names the reason. Nothing here knows how a review works.

- **Bar:** `PageEditorTopBar` (`Ui.TopBar.Layout.createDecorator`) renders the original top bar and then one `PageReviewBar`: a full-width strip directly under the top bar (UI-7) for **every page status** (the old code initialised and showed it for drafts only). The strip carries `data-affects-preview="height"` so the canvas reserves its height (`useReservedUISpace`). Inside it `EditorReviewBar` renders the shared bar with `reviewsRoute = Routes.Pages.WorkflowStateList`. A page whose namespace has no workflow (`vm.status === "noWorkflow"`) renders nothing at all, not even the strip, so a flag-on page without a workflow looks like a flag-off page (QBZ-1, "no workflow" frame).
- **Session lifecycle:** `PageReviewBar` selects `{ id, title, status }` from the document, and in one effect calls `session.presenter.init({ useCases: session.useCases, target: { namespace: WB_PAGE_APP, targetRevisionId: page.id }, targetTitle: page.title, canRequest, isPublished })` and returns `() => session.presenter.dispose()`. `canRequest` is `!editor.getEditorOptions().isReadOnly`, i.e. the editor's own read-only state **before** the review lock (R217: `getEditorOptions()` returns the options the editor was created with, `readOnly={page.status !== Draft}` in `PageEditor.tsx`; the review lock only changes the editor *state*, never the options). `isPublished` is `page.status === Published`. The effect depends on `[session, editor, page.id, page.status]`; the title is deliberately not a dependency (a title edit must not reload the review), it is the title at load or at the last status change and only prefills the request dialog's editable title field.
- **One source of the canvas read-only flag:** `PageEditorLayout` (`Ui.Layout.createDecorator`) renders the original layout and `PageReadOnlySync`, which sets `editor.isReadOnly = options.isReadOnly === true || !vm.allowsEditing` whenever `vm.allowsEditing` changes. `ToggleEditorMode.tsx` is no longer mounted anywhere (deleted in Task 37), so exactly one component writes the flag. While the status is unknown (`loading`, `failed`) `allowsEditing` is false, so the canvas is read-only until the status is known (R225, QBZ-1).
- **Reason note (QBZ-23):** the pure `getPageReadOnlyReason(vm, pageStatus)` returns the canvas note, rendered by `PageReviewBar` as an admin-ui `Alert` under the bar. Order: status `loading` or `failed` -> "Read-only until the review status loads."; `noWorkflow` -> no note; page `published` -> "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes." (any review state); an active review (`vm.status === "active"`) -> by `vm.reviewKind`: `inProgress` "Read-only while this revision is in review."; `approved` "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review."; `rejected` "Read-only: this revision was rejected. Create a new revision to fix it."; any other non-draft page (`unpublished`) -> the published text; otherwise no note. The WB status tag stays the page status (the top bar is untouched, QBZ-22).
- **Tooltip (R-b):** no standalone tooltip action. The shared `ReviewTooltip` (`{ presenter; children }`) wraps the disabled Publish button; that wrapping is Task 23's `DisabledPublishButton`.
- **Rejected page:** "Create new revision" is the base `buttonNewRevision` (under `Ui.IsReadOnly`, `DefaultPageEditorConfig.tsx:30-34`); the canvas is read-only for a rejected page, so the base button shows (R227, D24). No bar action is added and the base button is not touched. "Back" is the base `BackButton` (Pages list, QBZ-61), untouched.
- **Registration:** `WbPageReview = createAbstraction<IEditorReviewSession>("WebsiteBuilder/Workflows/PageReview")`; a WB subclass `WbPageReviewSessionImpl extends EditorReviewSession` (own file, controller rule: `createImplementation` is never called on the shared class) is registered as `WbPageReview.createImplementation({ implementation: WbPageReviewSessionImpl, dependencies: [TargetReviewPresenter, WbReviewUseCases] })`, singleton (R212), by `WbPageReviewFeature`, which `WebsiteBuilderWorkflows` registers inside the flag gate (R211). Components resolve the session with `useFeature(WbPageReviewFeature)`.
- **`PageEditorConfig`** (kept by name, rewritten, R219) mounts `PageEditorTopBar` and `PageEditorLayout` (Task 23 adds the autosave and publish pieces and the base config). The old `PageFormWorkflowState.tsx`, `PageFormWorkflowStateTooltip.tsx`, `PageFormWorkflowStatePublishButton.tsx` and `ToggleEditorMode.tsx` stop being imported (deleted in Task 37). The autosave and publish pieces are Task 23's; until then the base autosave still refuses to save while the canvas is read-only (it checks the editor state itself) and the base Publish is hidden by `Ui.IsNotReadOnly` whenever the canvas is read-only.

**Files:**
- Create: `packages/app-website-builder-workflows/src/features/editorReview/abstractions.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorReview/WbPageReviewSession.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorReview/feature.ts`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/pageEditorDocument.ts`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/getPageReadOnlyReason.ts`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReadOnlySync.tsx`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorConfig.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.tsx`, `packages/app-website-builder-workflows/package.json`
- Create (test support, reused by Tasks 23 and 24; in `__tests__/` because it imports vitest, mobx and `@webiny/di`, imported as `~tests/support/...`): `packages/app-website-builder-workflows/__tests__/support/createFakeVm.ts`, `createFakeSession.ts`, `createPageEditor.ts`, `WbEditorHarness.tsx`
- Create tests: `src/Components/PageEditor/getPageReadOnlyReason.test.ts`, `PageEditorLayout.test.tsx`, `PageEditorTopBar.test.tsx`, `pageReviewMatrix.test.tsx`, `src/editorGlue.wiring.test.tsx` (all under `packages/app-website-builder-workflows/`)

**Interfaces:**
- Consumes (Tasks 8-19, paths per the contract, verify each when writing code): `IEditorReviewSession` (`packages/app-workflows/src/review/editor/abstractions.ts`), `EditorReviewSession` (`.../review/editor/EditorReviewSession.ts`), `EditorReviewBar` (`.../review/editor/components/EditorReviewBar.tsx`, props `{ session; reviewsRoute }`), `TargetReviewPresenter`, `ITargetReviewPresenter`, `ITargetReviewViewModel` with `status` and `reviewKind` (`.../review/presentation/targetReview/abstractions.ts`, `reviewKind: "none" | "inProgress" | "approved" | "rejected"` per R-a), `createViewModel` (`.../review/testing/targetReviewFakes.ts`, Task 14, pure builder per R-c), `IReviewUseCases` (`.../review/useCases/IReviewUseCases.ts`); Task 12 `WbReviewUseCases` (`~/features/gateway/WbReviewUseCases.js`, one token per file), `WB_PAGE_APP` (`~/constants.js`, `"wb.page"`); existing `Routes.Pages.WorkflowStateList` (`~/routes.js`). Existing Website Builder code, deep imports (every admin package exports `"./*": "./*"`): `PageEditorConfig` (`@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js`, `Ui.TopBar.Layout`, `Ui.TopBar.Action`, `Ui.TopBar.Elements`, `Ui.Layout`), `useSelectFromDocument` and the `EditorDocument` type (`@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js`), `useDocumentEditor` (`@webiny/app-website-builder/DocumentEditor/index.js`), `WbPageStatus` and `WbStatus` (`@webiny/app-website-builder/constants.js`), `createReactiveComponent` and `useFeature` (`@webiny/app-admin`, `@webiny/app`), `createFeature`, `createAbstraction` (`@webiny/feature/admin`).
- Produces: `WbPageReview` and `WbPageReviewSession` (`~/features/editorReview/`), `WbPageReviewFeature` (`resolve` -> `{ session }`), `getPageReadOnlyReason(vm, pageStatus)`, the rewritten `PageEditorTopBar`, `PageEditorLayout`, `PageEditorConfig` (Task 23 adds to `PageEditorConfig`; Task 30 reuses `Routes.Pages.WorkflowStateList`), and the test support files (Tasks 23 and 24).

**Test runner note:** `packages/app-website-builder-workflows` is an admin package, so tests run with `yarn test <path>` only; it is not an `-es`/`-os` package and has no storage-specific suite (`yarn test:os` does not apply). Task 12 added `vitest.config.ts` (jsdom) and the `vitest` and `@testing-library/react` devDependencies (verify both exist; if not, copy `packages/app-admin/vitest.config.ts` and add them as in Task 12). The vitest config registers no SVG transform and no global `afterEach`, so tests that render call `cleanup()` in `afterEach` and mock any `.svg` import they render. The classic JSX runtime is used, so every `.tsx` file imports `React`.

- [ ] **Step 1: Write the failing tests and the test support**

Add the devDependencies the tests and helpers use (`yarn adio` in Step 6 confirms the final list). In `packages/app-website-builder-workflows/package.json`, inside `devDependencies`, add these entries in alphabetical order if Task 12 has not already added them:

```json
        "@webiny/di": "^1.1.0",
        "@webiny/react-composition": "0.0.0",
        "mobx": "^7.0.3",
```

Create `packages/app-website-builder-workflows/__tests__/support/createFakeVm.ts` (test support: it builds on Task 14's pure `createViewModel` and sets `status`, `reviewKind` (R-a) and the rules the glue reads; the reasons mirror Task 13's `getEditorRules`, so there is no cast):

```ts
import type { ITargetReviewViewModel } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createViewModel } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";

export type FakeReviewKind =
    | "loading"
    | "failed"
    | "noWorkflow"
    | "none"
    | "inProgress"
    | "approved"
    | "rejected";

type FakeVmFields = Pick<
    ITargetReviewViewModel,
    | "status"
    | "reviewKind"
    | "allowsEditing"
    | "allowsPublishing"
    | "publishDisabledReason"
>;

const NEEDS_APPROVAL = "Publishing needs an approved review.";

const FAKE_VM_FIELDS: Record<FakeReviewKind, FakeVmFields> = {
    loading: {
        status: "loading",
        reviewKind: "none",
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason: "Checking review status…"
    },
    failed: {
        status: "failed",
        reviewKind: "none",
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason:
            "The review status could not be loaded. Try again from the review bar."
    },
    noWorkflow: {
        status: "noWorkflow",
        reviewKind: "none",
        allowsEditing: true,
        allowsPublishing: true,
        publishDisabledReason: null
    },
    none: {
        status: "none",
        reviewKind: "none",
        allowsEditing: true,
        allowsPublishing: false,
        publishDisabledReason: NEEDS_APPROVAL
    },
    inProgress: {
        status: "active",
        reviewKind: "inProgress",
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason: NEEDS_APPROVAL
    },
    approved: {
        status: "active",
        reviewKind: "approved",
        allowsEditing: false,
        allowsPublishing: true,
        publishDisabledReason: null
    },
    rejected: {
        status: "active",
        reviewKind: "rejected",
        allowsEditing: false,
        allowsPublishing: false,
        publishDisabledReason: NEEDS_APPROVAL
    }
};

export const createFakeVm = (kind: FakeReviewKind): ITargetReviewViewModel => {
    const fields = FAKE_VM_FIELDS[kind];

    return createViewModel({ ...fields });
};
```

Create `packages/app-website-builder-workflows/__tests__/support/createFakeSession.ts`:

```ts
import { observable } from "mobx";
import { runInAction } from "mobx";
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import type { ITargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { ITargetReviewViewModel } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { WbPageReview } from "~/features/editorReview/abstractions.js";
import type { FakeReviewKind } from "./createFakeVm.js";
import { createFakeVm } from "./createFakeVm.js";

export interface FakePresenter {
    readonly vm: ITargetReviewViewModel;
    init: Mock<ITargetReviewPresenter["init"]>;
    setContext: Mock<ITargetReviewPresenter["setContext"]>;
    refresh: Mock<ITargetReviewPresenter["refresh"]>;
    actionDone: Mock<ITargetReviewPresenter["actionDone"]>;
    openAction: Mock<ITargetReviewPresenter["openAction"]>;
    closeAction: Mock<ITargetReviewPresenter["closeAction"]>;
    dispose: Mock<ITargetReviewPresenter["dispose"]>;
}

export interface FakeSessionHandle {
    session: WbPageReview.Interface;
    presenter: FakePresenter;
    useCases: IReviewUseCases;
    setKind(kind: FakeReviewKind): void;
}

export const createFakeSession = (initialKind: FakeReviewKind = "none"): FakeSessionHandle => {
    const state = observable({ vm: createFakeVm(initialKind) });

    const presenter: FakePresenter = {
        get vm() {
            return state.vm;
        },
        init: vi.fn<ITargetReviewPresenter["init"]>().mockResolvedValue(undefined),
        setContext: vi.fn<ITargetReviewPresenter["setContext"]>(),
        refresh: vi.fn<ITargetReviewPresenter["refresh"]>().mockResolvedValue(undefined),
        actionDone: vi.fn<ITargetReviewPresenter["actionDone"]>().mockResolvedValue(undefined),
        openAction: vi.fn<ITargetReviewPresenter["openAction"]>(),
        closeAction: vi.fn<ITargetReviewPresenter["closeAction"]>(),
        dispose: vi.fn<ITargetReviewPresenter["dispose"]>()
    };

    const useCases: IReviewUseCases = {
        getBoundWorkflow: vi.fn(),
        getTargetReview: vi.fn(),
        getReview: vi.fn(),
        listStepCandidates: vi.fn(),
        listReviewStepCandidates: vi.fn(),
        requestReview: vi.fn(),
        startStep: vi.fn(),
        takeOverStep: vi.fn(),
        reassignStep: vi.fn(),
        approveStep: vi.fn(),
        rejectStep: vi.fn(),
        cancelReview: vi.fn(),
        listReviews: vi.fn(),
        cancelForDelete: vi.fn()
    };

    const session: WbPageReview.Interface = { presenter, useCases };

    const setKind = (kind: FakeReviewKind): void => {
        runInAction(() => {
            state.vm = createFakeVm(kind);
        });
    };

    return { session, presenter, useCases, setKind };
};
```

Create `packages/app-website-builder-workflows/__tests__/support/createPageEditor.ts` (the editor the way `PageEditor.tsx` builds it: read-only options for every page that is not a draft):

```ts
import { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";

export const createPageEditor = (
    pageStatus: WbStatus,
    title: string = "Home"
): Editor<IPageEditorDocument> => {
    const document: IPageEditorDocument = {
        id: "page-1#0001",
        status: pageStatus,
        version: 1,
        state: {},
        properties: { title },
        extensions: {},
        metadata: {},
        bindings: {},
        elements: {}
    };

    return new Editor<IPageEditorDocument>(document, {
        isReadOnly: pageStatus !== WbPageStatus.Draft
    });
};
```

Create `packages/app-website-builder-workflows/__tests__/support/WbEditorHarness.tsx` (the real editor config tree: `DocumentEditorContext`, the editor composition scope and `EditorWithConfig`, exactly how `DocumentEditor` and the base `Editor` component mount them, plus the DI container and the admin-ui provider; `groups` renders the top bar element groups):

```tsx
import React from "react";
import type { Container } from "@webiny/di";
import { AdminUiProvider } from "@webiny/admin-ui";
import { DiContainerProvider } from "@webiny/app";
import { CompositionProvider } from "@webiny/react-composition";
import { CompositionScope } from "@webiny/react-composition";
import { DocumentEditorContext } from "@webiny/app-website-builder/DocumentEditor/DocumentEditor.js";
import { EditorWithConfig } from "@webiny/app-website-builder/BaseEditor/config/EditorConfig.js";
import { EDITOR_NAME } from "@webiny/app-website-builder/presentation/pages/PageEditor/constants.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import type { Editor } from "@webiny/app-website-builder/editorSdk/Editor.js";
import type { IPageEditorDocument } from "~/Components/PageEditor/pageEditorDocument.js";

const { Ui } = PageEditorConfig;

export interface WbEditorHarnessProps {
    container: Container;
    editor: Editor<IPageEditorDocument>;
    groups?: string[];
    children?: React.ReactNode;
}

export const WbEditorHarness = ({
    container,
    editor,
    groups = [],
    children
}: WbEditorHarnessProps) => {
    return (
        <DiContainerProvider container={container}>
            <AdminUiProvider>
                <CompositionProvider>
                    <DocumentEditorContext.Provider value={editor}>
                        {children}
                        <CompositionScope name={EDITOR_NAME}>
                            <EditorWithConfig>
                                {groups.map(group => (
                                    <Ui.TopBar.Elements key={group} group={group} />
                                ))}
                            </EditorWithConfig>
                        </CompositionScope>
                    </DocumentEditorContext.Provider>
                </CompositionProvider>
            </AdminUiProvider>
        </DiContainerProvider>
    );
};
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/getPageReadOnlyReason.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { createFakeVm } from "~tests/support/createFakeVm.js";
import type { FakeReviewKind } from "~tests/support/createFakeVm.js";
import { getPageReadOnlyReason } from "./getPageReadOnlyReason.js";

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";
const IN_REVIEW = "Read-only while this revision is in review.";
const APPROVED =
    "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review.";
const REJECTED = "Read-only: this revision was rejected. Create a new revision to fix it.";

interface ReasonCase {
    kind: FakeReviewKind;
    page: WbStatus;
    reason: string | null;
}

const CASES: ReasonCase[] = [
    { kind: "loading", page: "draft", reason: NOT_LOADED },
    { kind: "loading", page: "published", reason: NOT_LOADED },
    { kind: "loading", page: "unpublished", reason: NOT_LOADED },
    { kind: "failed", page: "draft", reason: NOT_LOADED },
    { kind: "failed", page: "published", reason: NOT_LOADED },
    { kind: "failed", page: "unpublished", reason: NOT_LOADED },
    { kind: "noWorkflow", page: "draft", reason: null },
    { kind: "noWorkflow", page: "published", reason: null },
    { kind: "noWorkflow", page: "unpublished", reason: null },
    { kind: "none", page: "draft", reason: null },
    { kind: "none", page: "published", reason: PUBLISHED },
    { kind: "none", page: "unpublished", reason: PUBLISHED },
    { kind: "inProgress", page: "draft", reason: IN_REVIEW },
    { kind: "inProgress", page: "published", reason: PUBLISHED },
    { kind: "inProgress", page: "unpublished", reason: IN_REVIEW },
    { kind: "approved", page: "draft", reason: APPROVED },
    { kind: "approved", page: "published", reason: PUBLISHED },
    { kind: "approved", page: "unpublished", reason: APPROVED },
    { kind: "rejected", page: "draft", reason: REJECTED },
    { kind: "rejected", page: "published", reason: PUBLISHED },
    { kind: "rejected", page: "unpublished", reason: REJECTED }
];

describe("getPageReadOnlyReason", () => {
    it.each(CASES)("$kind review on a $page page", ({ kind, page, reason }) => {
        const vm = createFakeVm(kind);

        expect(getPageReadOnlyReason(vm, page)).toBe(reason);
    });
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.test.tsx`:

```tsx
import React from "react";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~tests/support/WbEditorHarness.js";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { createPageEditor } from "~tests/support/createPageEditor.js";
import type { FakeReviewKind } from "~tests/support/createFakeVm.js";
import { PageEditorLayout } from "./PageEditorLayout.js";

vi.mock("@webiny/app-website-builder/BaseEditor/config/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("EditorLayout", () => {
        return React.createElement("div", { "data-testid": "base-layout" });
    });
    return { Layout };
});

const { Ui } = PageEditorConfig;

const mountLayout = (pageStatus: WbStatus, kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor(pageStatus);

    render(
        <WbEditorHarness container={container} editor={editor}>
            <PageEditorLayout />
            <Ui.Layout />
        </WbEditorHarness>
    );

    return { ...handle, editor };
};

interface ReadOnlyCase {
    kind: FakeReviewKind;
    page: WbStatus;
    readOnly: boolean;
}

const CASES: ReadOnlyCase[] = [
    { kind: "loading", page: "draft", readOnly: true },
    { kind: "failed", page: "draft", readOnly: true },
    { kind: "noWorkflow", page: "draft", readOnly: false },
    { kind: "none", page: "draft", readOnly: false },
    { kind: "inProgress", page: "draft", readOnly: true },
    { kind: "approved", page: "draft", readOnly: true },
    { kind: "rejected", page: "draft", readOnly: true },
    { kind: "noWorkflow", page: "published", readOnly: true },
    { kind: "none", page: "published", readOnly: true },
    { kind: "none", page: "unpublished", readOnly: true }
];

describe("PageEditorLayout", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the original layout", () => {
        mountLayout("draft", "none");

        expect(screen.getAllByTestId("base-layout")).toHaveLength(1);
    });

    it.each(CASES)("$kind review on a $page page: canvas read-only is $readOnly", ({
        kind,
        page,
        readOnly
    }) => {
        const { editor } = mountLayout(page, kind);

        expect(editor.getEditorState().read().isReadOnly).toBe(readOnly);
    });

    it("follows the review state while the editor is open (the one source of the flag)", () => {
        const { editor, setKind } = mountLayout("draft", "none");
        expect(editor.getEditorState().read().isReadOnly).toBe(false);

        act(() => {
            setKind("inProgress");
        });
        expect(editor.getEditorState().read().isReadOnly).toBe(true);

        act(() => {
            setKind("none");
        });
        expect(editor.getEditorState().read().isReadOnly).toBe(false);
    });

    it("never opens a canvas the editor was created read-only", () => {
        const { editor, setKind } = mountLayout("published", "none");

        act(() => {
            setKind("noWorkflow");
        });

        expect(editor.getEditorState().read().isReadOnly).toBe(true);
    });
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx`:

```tsx
import React from "react";
import { act } from "@testing-library/react";
import { cleanup } from "@testing-library/react";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { Container } from "@webiny/di";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~tests/support/WbEditorHarness.js";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { createPageEditor } from "~tests/support/createPageEditor.js";
import type { FakeReviewKind } from "~tests/support/createFakeVm.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/TopBar/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("TopBarLayout", () => {
        return React.createElement("div", { "data-testid": "base-top-bar" });
    });
    return { Layout, TopBarOptionsMenu: () => null };
});

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");
    interface StubProps {
        reviewsRoute: { name: string };
    }
    const EditorReviewBar = (props: StubProps) => {
        return React.createElement("div", {
            "data-testid": "review-bar",
            "data-route": props.reviewsRoute.name
        });
    };
    return { EditorReviewBar };
});

const { Ui } = PageEditorConfig;

const mountTopBar = (pageStatus: WbStatus, kind: FakeReviewKind) => {
    const handle = createFakeSession(kind);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor(pageStatus);

    const view = render(
        <WbEditorHarness container={container} editor={editor}>
            <PageEditorTopBar />
            <Ui.TopBar.Layout />
        </WbEditorHarness>
    );

    return { ...handle, editor, view };
};

describe("PageEditorTopBar", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the original top bar and exactly one review bar in a strip that reserves its height", () => {
        mountTopBar("draft", "none");

        expect(screen.getAllByTestId("base-top-bar")).toHaveLength(1);
        const bars = screen.getAllByTestId("review-bar");
        expect(bars).toHaveLength(1);
        expect(bars[0].getAttribute("data-route")).toBe("WebsiteBuilder/Pages/WorkflowStateList");
        const strip = bars[0].parentElement;
        expect(strip?.getAttribute("data-affects-preview")).toBe("height");
    });

    it.each(["draft", "published", "unpublished"] as const)(
        "shows the bar on a %s page",
        pageStatus => {
            mountTopBar(pageStatus, "none");

            expect(screen.getAllByTestId("review-bar")).toHaveLength(1);
        }
    );

    it("renders nothing, not even the strip, when the namespace has no workflow", () => {
        mountTopBar("draft", "noWorkflow");

        expect(screen.queryByTestId("review-bar")).toBeNull();
        expect(document.querySelector("[data-affects-preview]")).toBeNull();
        expect(screen.getAllByTestId("base-top-bar")).toHaveLength(1);
    });

    it("initialises the session for the draft revision with the editor's own read-only state", () => {
        const { presenter, useCases } = mountTopBar("draft", "none");

        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(presenter.init).toHaveBeenCalledWith({
            useCases,
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            targetTitle: "Home",
            canRequest: true,
            isPublished: false
        });
    });

    it("cannot request a review on a published page and marks it published", () => {
        const { presenter, useCases } = mountTopBar("published", "none");

        expect(presenter.init).toHaveBeenCalledWith({
            useCases,
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            targetTitle: "Home",
            canRequest: false,
            isPublished: true
        });
    });

    it("cannot request a review on an unpublished page and does not mark it published", () => {
        const { presenter } = mountTopBar("unpublished", "none");

        const params = presenter.init.mock.calls[0][0];
        expect(params.canRequest).toBe(false);
        expect(params.isPublished).toBe(false);
    });

    it("disposes the session presenter when the editor closes", () => {
        const { presenter, view } = mountTopBar("draft", "none");
        expect(presenter.dispose).not.toHaveBeenCalled();

        view.unmount();

        expect(presenter.dispose).toHaveBeenCalledTimes(1);
    });

    it("loads again when the page status changes", async () => {
        const { presenter, editor } = mountTopBar("draft", "none");

        act(() => {
            editor.updateDocument(state => {
                state.status = WbPageStatus.Published;
            });
        });

        await waitFor(() => {
            expect(presenter.init).toHaveBeenCalledTimes(2);
        });
        expect(presenter.dispose).toHaveBeenCalledTimes(1);
        const second = presenter.init.mock.calls[1][0];
        expect(second.isPublished).toBe(true);
    });

    it("names the reason under the bar when the canvas is read-only", () => {
        mountTopBar("draft", "inProgress");

        const note = screen.getByRole("alert");
        expect(note.textContent).toBe("Read-only while this revision is in review.");
    });

    it("shows no note for an editable draft", () => {
        mountTopBar("draft", "none");

        expect(screen.queryByRole("alert")).toBeNull();
    });
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx` (the (review status x page status) table: bar, note and canvas flag with both decorators mounted together):

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
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~tests/support/WbEditorHarness.js";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { createPageEditor } from "~tests/support/createPageEditor.js";
import type { FakeReviewKind } from "~tests/support/createFakeVm.js";
import { PageEditorLayout } from "./PageEditorLayout.js";
import { PageEditorTopBar } from "./PageEditorTopBar.js";

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("EditorLayout", () => {
        return React.createElement("div", { "data-testid": "base-layout" });
    });
    return { Layout };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/TopBar/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("TopBarLayout", () => {
        return React.createElement("div", { "data-testid": "base-top-bar" });
    });
    return { Layout, TopBarOptionsMenu: () => null };
});

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");
    const EditorReviewBar = () => {
        return React.createElement("div", { "data-testid": "review-bar" });
    };
    return { EditorReviewBar };
});

const { Ui } = PageEditorConfig;

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";
const IN_REVIEW = "Read-only while this revision is in review.";
const APPROVED =
    "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review.";
const REJECTED = "Read-only: this revision was rejected. Create a new revision to fix it.";

interface MatrixCase {
    kind: FakeReviewKind;
    page: WbStatus;
    bar: boolean;
    note: string | null;
    readOnly: boolean;
}

const MATRIX: MatrixCase[] = [
    { kind: "loading", page: "draft", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "loading", page: "published", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "loading", page: "unpublished", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "failed", page: "draft", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "failed", page: "published", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "failed", page: "unpublished", bar: true, note: NOT_LOADED, readOnly: true },
    { kind: "noWorkflow", page: "draft", bar: false, note: null, readOnly: false },
    { kind: "noWorkflow", page: "published", bar: false, note: null, readOnly: true },
    { kind: "noWorkflow", page: "unpublished", bar: false, note: null, readOnly: true },
    { kind: "none", page: "draft", bar: true, note: null, readOnly: false },
    { kind: "none", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "none", page: "unpublished", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "inProgress", page: "draft", bar: true, note: IN_REVIEW, readOnly: true },
    { kind: "inProgress", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "inProgress", page: "unpublished", bar: true, note: IN_REVIEW, readOnly: true },
    { kind: "approved", page: "draft", bar: true, note: APPROVED, readOnly: true },
    { kind: "approved", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "approved", page: "unpublished", bar: true, note: APPROVED, readOnly: true },
    { kind: "rejected", page: "draft", bar: true, note: REJECTED, readOnly: true },
    { kind: "rejected", page: "published", bar: true, note: PUBLISHED, readOnly: true },
    { kind: "rejected", page: "unpublished", bar: true, note: REJECTED, readOnly: true }
];

describe("review status x page status", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(MATRIX)("$kind review on a $page page", ({ kind, page, bar, note, readOnly }) => {
        const handle = createFakeSession(kind);
        const container = new Container();
        container.registerInstance(WbPageReview, handle.session);
        const editor = createPageEditor(page);

        render(
            <WbEditorHarness container={container} editor={editor}>
                <PageEditorTopBar />
                <PageEditorLayout />
                <Ui.Layout />
                <Ui.TopBar.Layout />
            </WbEditorHarness>
        );

        const bars = screen.queryAllByTestId("review-bar");
        expect(bars).toHaveLength(bar ? 1 : 0);
        const alert = screen.queryByRole("alert");
        expect(alert?.textContent ?? null).toBe(note);
        expect(editor.getEditorState().read().isReadOnly).toBe(readOnly);
    });
});
```

Create `packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx` (composition root, flag on and off, R211):

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
import { MainGraphQLClient } from "@webiny/app/features/mainGraphQLClient/abstractions.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbPageReview } from "~/features/editorReview/abstractions.js";
import { WbEditorHarness } from "~tests/support/WbEditorHarness.js";
import { createFakeSession } from "~tests/support/createFakeSession.js";
import { createPageEditor } from "~tests/support/createPageEditor.js";
import { WebsiteBuilderWorkflows } from "~/index.js";

const flags = vi.hoisted(() => {
    return { enabled: true };
});

vi.mock("@webiny/icons/info.svg", () => {
    return { ReactComponent: () => null };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useFeatureFlags: () => ({ isEnabled: () => flags.enabled }) };
});

vi.mock("~/Routes/index.js", () => {
    return { WebsiteBuilderWorkflowsMenu: () => null };
});

vi.mock("~/Components/PagesList/index.js", () => {
    return { PagesList: () => null };
});

vi.mock("~/Components/OptionItem/index.js", () => {
    return { ListOpenInNewWindow: () => null };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("EditorLayout", () => {
        return React.createElement("div", { "data-testid": "base-layout" });
    });
    return { Layout };
});

vi.mock("@webiny/app-website-builder/BaseEditor/config/TopBar/Layout.js", async () => {
    const React = await import("react");
    const { makeDecoratable } = await import("@webiny/react-composition");
    const Layout = makeDecoratable("TopBarLayout", () => {
        return React.createElement("div", { "data-testid": "base-top-bar" });
    });
    return { Layout, TopBarOptionsMenu: () => null };
});

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");
    const EditorReviewBar = () => {
        return React.createElement("div", { "data-testid": "review-bar" });
    };
    return { EditorReviewBar };
});

const { Ui } = PageEditorConfig;

const mountRoot = (enabled: boolean) => {
    flags.enabled = enabled;
    const handle = createFakeSession("inProgress");
    const container = new Container();
    container.registerInstance(TargetReviewPresenter, handle.presenter);
    container.registerInstance(MainGraphQLClient, { execute: vi.fn() });
    const editor = createPageEditor("draft");

    render(
        <WbEditorHarness container={container} editor={editor}>
            <WebsiteBuilderWorkflows />
            <Ui.Layout />
            <Ui.TopBar.Layout />
        </WbEditorHarness>
    );

    return { ...handle, container, editor };
};

describe("Website Builder editor glue from the composition root", () => {
    afterEach(() => {
        cleanup();
    });

    it("flag on: the session is registered over the shared presenter and this app's use cases", () => {
        const { container, presenter } = mountRoot(true);

        const session = container.resolve(WbPageReview);
        expect(session.presenter).toBe(presenter);
        expect(session.useCases).toBe(container.resolve(WbReviewUseCases));
    });

    it("flag on: the bar is mounted under the top bar and the canvas follows the review", () => {
        const { presenter, editor } = mountRoot(true);

        expect(screen.getAllByTestId("review-bar")).toHaveLength(1);
        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(editor.getEditorState().read().isReadOnly).toBe(true);
    });

    it("flag off: nothing is registered or mounted", () => {
        const { container, presenter, editor } = mountRoot(false);

        expect(() => container.resolve(WbPageReview)).toThrow();
        expect(screen.queryByTestId("review-bar")).toBeNull();
        expect(presenter.init).not.toHaveBeenCalled();
        expect(editor.getEditorState().read().isReadOnly).toBe(false);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

Each file in its own command (admin package: `yarn test` only, no `test:os`):

```bash
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/getPageReadOnlyReason.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -50
```

Expected: every file FAILS to load: `Failed to resolve import "./getPageReadOnlyReason.js"` (first file) and `Failed to resolve import "~/features/editorReview/abstractions.js"` (the other four; `~/Components/PageEditor/pageEditorDocument.js` is missing for the test support too). Record this RED before writing any source. If a failure names a symbol of Tasks 8-19 instead (`EditorReviewBar`, `ReviewTooltip`, `TargetReviewPresenter`, `WbReviewUseCases`), that task is not merged on this branch: stop and report it.

- [ ] **Step 3: Implement**

Create `packages/app-website-builder-workflows/src/features/editorReview/abstractions.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";

export const WbPageReview = createAbstraction<IEditorReviewSession>(
    "WebsiteBuilder/Workflows/PageReview"
);

export namespace WbPageReview {
    export type Interface = IEditorReviewSession;
}
```

Create `packages/app-website-builder-workflows/src/features/editorReview/WbPageReviewSession.ts`:

The shared `EditorReviewSession` is never passed to `createImplementation` (it would store this app's token on the shared class and collide with the CMS binding); the app subclasses it once, in its own file:

```ts
import { EditorReviewSession } from "@webiny/app-workflows/review/editor/EditorReviewSession.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbPageReview } from "./abstractions.js";

class WbPageReviewSessionImpl extends EditorReviewSession implements WbPageReview.Interface {}

export const WbPageReviewSession = WbPageReview.createImplementation({
    implementation: WbPageReviewSessionImpl,
    dependencies: [TargetReviewPresenter, WbReviewUseCases]
});
```

Create `packages/app-website-builder-workflows/src/features/editorReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbPageReview } from "./abstractions.js";
import { WbPageReviewSession } from "./WbPageReviewSession.js";

export const WbPageReviewFeature = createFeature({
    name: "WebsiteBuilder/Workflows/PageReviewSession",
    register(container) {
        container.register(WbPageReviewSession).inSingletonScope();
    },
    resolve(container) {
        return {
            session: container.resolve(WbPageReview)
        };
    }
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/pageEditorDocument.ts`:

```ts
import type { EditorDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";

export interface IPageEditorDocument extends EditorDocument {
    status: WbStatus;
}

export interface ISelectedPage {
    id: string;
    title: string;
    status: WbStatus;
}
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/getPageReadOnlyReason.ts`:

```ts
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import type { ITargetReviewViewModel } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export type PageReadOnlyReasonVm = Pick<ITargetReviewViewModel, "status" | "reviewKind">;

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";
const IN_REVIEW = "Read-only while this revision is in review.";
const APPROVED =
    "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review.";
const REJECTED = "Read-only: this revision was rejected. Create a new revision to fix it.";

/**
 * The canvas note of the Website Builder design frames (QBZ-23), switched on `vm.status` and
 * `vm.reviewKind` (R-a), never on label text.
 */
export function getPageReadOnlyReason(
    vm: PageReadOnlyReasonVm,
    pageStatus: WbStatus
): string | null {
    if (vm.status === "loading" || vm.status === "failed") {
        return NOT_LOADED;
    }

    if (vm.status === "noWorkflow") {
        return null;
    }

    if (pageStatus === WbPageStatus.Published) {
        return PUBLISHED;
    }

    if (vm.status === "active") {
        if (vm.reviewKind === "approved") {
            return APPROVED;
        }
        if (vm.reviewKind === "rejected") {
            return REJECTED;
        }
        return IN_REVIEW;
    }

    if (pageStatus !== WbPageStatus.Draft) {
        return PUBLISHED;
    }

    return null;
}
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageReadOnlySync.tsx`:

```tsx
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

/**
 * The one place that decides whether the canvas is read-only: the editor's own options (a page
 * that is not a draft) or a review state that does not allow editing, including an unknown one.
 */
export const PageReadOnlySync = createReactiveComponent(() => {
    const { session } = useFeature(WbPageReviewFeature);
    const editor = useDocumentEditor();
    const allowsEditing = session.presenter.vm.allowsEditing;

    useEffect(() => {
        const options = editor.getEditorOptions();
        editor.updateEditor(state => {
            state.isReadOnly = options.isReadOnly === true || !allowsEditing;
        });
    }, [editor, allowsEditing]);

    return null;
});
```

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { Alert } from "@webiny/admin-ui";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useSelectFromDocument } from "@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import { useDocumentEditor } from "@webiny/app-website-builder/DocumentEditor/index.js";
import { EditorReviewBar } from "@webiny/app-workflows/review/editor/components/EditorReviewBar.js";
import { WB_PAGE_APP } from "~/constants.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
import { Routes } from "~/routes.js";
import { getPageReadOnlyReason } from "./getPageReadOnlyReason.js";
import type { IPageEditorDocument } from "./pageEditorDocument.js";
import type { ISelectedPage } from "./pageEditorDocument.js";

const selectPage = (doc: IPageEditorDocument): ISelectedPage => {
    return {
        id: doc.id,
        title: doc.properties.title || "",
        status: doc.status || WbPageStatus.Draft
    };
};

export const PageReviewBar = createReactiveComponent(() => {
    const { session } = useFeature(WbPageReviewFeature);
    const editor = useDocumentEditor();
    const page = useSelectFromDocument<ISelectedPage, IPageEditorDocument>(selectPage);

    useEffect(() => {
        const options = editor.getEditorOptions();
        session.presenter.init({
            useCases: session.useCases,
            target: { namespace: WB_PAGE_APP, targetRevisionId: page.id },
            targetTitle: page.title,
            canRequest: options.isReadOnly !== true,
            isPublished: page.status === WbPageStatus.Published
        });
        return () => {
            session.presenter.dispose();
        };
    }, [session, editor, page.id, page.status]);

    const { vm } = session.presenter;
    if (vm.status === "noWorkflow") {
        return null;
    }

    const reason = getPageReadOnlyReason(vm, page.status);
    let note: React.ReactElement | null = null;
    if (reason) {
        note = (
            <Alert type={"info"} variant={"subtle"} className={"mt-sm"}>
                {reason}
            </Alert>
        );
    }

    return (
        <div
            className={"max-w-screen bg-white p-sm border-solid border-b-sm border-neutral-dimmed"}
            data-affects-preview={"height"}
        >
            <EditorReviewBar session={session} reviewsRoute={Routes.Pages.WorkflowStateList} />
            {note}
        </div>
    );
});
```

Rewrite `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.tsx` (the whole file):

```tsx
import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageReviewBar } from "./PageReviewBar.js";

const { Ui } = PageEditorConfig;

export const PageEditorTopBar = Ui.TopBar.Layout.createDecorator(Original => {
    return function PageEditorTopBarReview() {
        return (
            <>
                <Original />
                <PageReviewBar />
            </>
        );
    };
});
```

Rewrite `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.tsx` (the whole file):

```tsx
import React from "react";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageReadOnlySync } from "./PageReadOnlySync.js";

const { Ui } = PageEditorConfig;

export const PageEditorLayout = Ui.Layout.createDecorator(Original => {
    return function PageEditorLayoutReview() {
        return (
            <>
                <Original />
                <PageReadOnlySync />
            </>
        );
    };
});
```

Rewrite `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorConfig.tsx` (the whole file; Task 23 adds the autosave, the Publish and the base config):

```tsx
import React from "react";
import { PageEditorTopBar } from "./PageEditorTopBar.js";
import { PageEditorLayout } from "./PageEditorLayout.js";

export const PageEditorConfig = () => {
    return (
        <>
            {/* The review bar under the top bar, for every page status. */}
            <PageEditorTopBar />
            {/* The one source of the canvas read-only flag. */}
            <PageEditorLayout />
        </>
    );
};
```

Modify `packages/app-website-builder-workflows/src/index.tsx`. Imports, insert after the `PageGetWorkflowsFeature` import (if Task 12 added lines there, insert after them):

```tsx
import { PageGetWorkflowsFeature } from "~/presentation/page/PageGet/feature.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";
```

and inside the gate, insert after the `PageGetWorkflowsFeature` registration:

```tsx
            <RegisterFeature feature={PageGetWorkflowsFeature} />
            <RegisterFeature feature={WbPageReviewFeature} />
            <WebsiteBuilderWorkflowsMenu />
```

- [ ] **Step 4: Run the tests, expect pass**

```bash
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/getPageReadOnlyReason.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/pageReviewMatrix.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -50
```

Expected: all PASS. If a mock fails to apply (the real top bar or layout renders), check the mocked path is the exact file the base editor imports (`BaseEditor/config/Layout.js`, `BaseEditor/config/TopBar/Layout.js`).

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

```bash
ls packages/app-website-builder-workflows/src/features/gateway/*.test.ts* 
```

Run each file the listing prints (Task 12's tests: gateway, content adapter, feature, A83), one command per file:

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/<file> 2>&1 | tail -50
```

Then the type check:

```bash
yarn check:test:types -p app-website-builder-workflows --report cli 2>&1 | tail -40
```

Expected: the Task 12 tests still pass (they mount `WebsiteBuilderWorkflows`, which now also registers `WbPageReviewFeature`), and the type check prints no errors. Type errors that name `ITargetReviewViewModel` fields or `IEditorReviewSession` members mean the contract and Task 13/19's real types differ: fix the glue to the real type and add a line under "Contract notes".

- [ ] **Step 6: Pre-commit chain and commit**

Run `git status --short` first and stage only the files this task touches.

```bash
git add .
yarn > /dev/null 2>&1
node scripts/generateTsConfigsInPackages.js
yarn adio
yarn check-ts-configs
yarn format:fix > /dev/null 2>&1
yarn lint:fix
yarn webiny sync-dependencies
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git add .
git checkout -- .gitleaks.toml
```

If any step fails and you fix anything, rerun the chain from the start. Then:

```bash
git commit -m "feat(app-website-builder-workflows): review bar, canvas read-only source and tooltip in the page editor" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01EWvjsBXWqViJPTrgbzhYr4"
```

**Contract notes:**
- The contract says the session is registered in `[WBW]/features/gateway/feature.ts` (Task 12). Task 12's file is not visible while this plan is written, so an exact hunk is impossible; the session is registered by its own `WbPageReviewFeature` (`features/editorReview/feature.ts`) which `WebsiteBuilderWorkflows` registers inside the gate right after `PageGetWorkflowsFeature`. The effect is the same (singleton token `WbPageReview`, resolved lazily after `WbReviewFeature`, A77).
- The contract says `PageEditorLayout` sets the flag "with the reason". `PageEditorLayout` sets the flag (`PageReadOnlySync`); the reason note is rendered by `PageReviewBar` inside the top-bar strip, because the base layout container is a fixed-height, overflow-hidden box whose only height-reserving slot is the `data-affects-preview="height"` strip under the top bar. Same text source (`getPageReadOnlyReason`).
- Pending user decision (left as written): "Create new revision" for a rejected page is the base `buttonNewRevision` ("New Revision"); the bar adds no action. The base button shows whenever the canvas is read-only, including while a review is in progress. Whether to hide it while in progress is a product question pending with the user.
- Pending user decision (left as written): a `Workflows/NotAuthorized` review read is `failed`/`noAccess` (R225), so such a viewer's canvas is read-only with the "status not loaded" note.
- The standalone `PageReviewTooltip` action of the contract is dropped (R-b): the shared `ReviewTooltip` wraps the disabled Publish in Task 23. `WbPageReviewSessionImpl` is not exported (controller rule).
- `targetTitle` is the page title at load and at the last page-status change, not live (a live title would reload the review on every title edit). The request dialog's title field is editable, so a stale prefill is harmless.
- Test support lives in `__tests__/support/` (R-c: only pure builders may live in `src`; `createViewModel` is Task 14's). The `~tests/*` alias exists in the package tsconfig and `rootDirs` already include `__tests__`.
- Size: five test files plus four support files; the matrix and the harness are the bulk. Verify at implementation time: (1) the deep import paths of Tasks 8-19 listed under Consumes; (2) that `EditorWithConfig` flushes the config for `findBy...` in jsdom (the harness copies the real `Editor` component's mount); (3) that `useFeatureFlags` is the only thing the root needs mocked (the root imports it from `@webiny/app-admin`).
