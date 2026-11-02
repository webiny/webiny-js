### Task 22: WB editor shell glue (bar, tooltip, read-only source, `PageEditorConfig`)

Spec 13.1, 13.4 (Website Builder editor); R202 (shared core, thin glue), R211 (gated root, decorator approach), R212 (singleton editor session, `dispose` resets), R217 (`canRequest`), R225 (loading and failure), R226 (lock rules), R227 (WB specifics), A78 (each extension point is decorated once, the old decorator is replaced), A89; Q10, Q17, Q18, Q19; QBZ-1, QBZ-22, QBZ-23, QBZ-61; Review Focus 1, 3, 5, 8, 16, 17. The shared `EditorReviewBar` (Task 19) already renders the bar, the dialogs and the details drawer; this task only mounts it in the Website Builder page editor, gives the editor one place that decides whether the canvas is read-only, and names the reason. Nothing here knows how a review works.

- **Bar:** `PageEditorTopBar` (`Ui.TopBar.Layout.createDecorator`) renders the original top bar and then one `PageReviewBar`: a full-width strip directly under the top bar (UI-7) for **every page status** (the old code initialised and showed it for drafts only). The strip carries `data-affects-preview="height"` so the canvas reserves its height (`useReservedUISpace`). Inside it `EditorReviewBar` renders the shared bar with `reviewsRoute = Routes.Pages.WorkflowStateList`. A page whose namespace has no workflow (`vm.status === "noWorkflow"`) renders nothing at all, not even the strip, so a flag-on page without a workflow looks like a flag-off page (QBZ-1, "no workflow" frame).
- **Session lifecycle:** `PageReviewBar` selects `{ id, title, status }` from the document. One effect on `[session, editor, page.id]` calls `session.presenter.init({ useCases: session.useCases, target: { namespace: WB_PAGE_APP, targetRevisionId: page.id }, targetTitle: page.title, canRequest, isPublished, isUnpublished })` and returns `() => session.presenter.dispose()`. A second effect on `[session, editor, page.status]` calls `session.presenter.setContext({ targetTitle: page.title, canRequest, isPublished, isUnpublished })`, so a page-status change (publish, unpublish) updates the rules without reloading the review (R225); on mount it repeats the `init` values, which is harmless. `canRequest` is `!editor.getEditorOptions().isReadOnly`, i.e. the editor's own read-only state **before** the review lock (R217: `getEditorOptions()` returns the options the editor was created with, `readOnly={page.status !== Draft}` in `PageEditor.tsx`; the review lock only changes the editor *state*, never the options). `isPublished` is `page.status === Published`; `isUnpublished` is `page.status === Unpublished`, a revision that was published before and is not published now (R226, Q19), which lets the shared rules enable Publish for it with no new review (A89 is the server side). The title is deliberately not a dependency of either effect (a title edit must not reload the review): it is the title at load or at the last status change and only prefills the request dialog's editable title field (R227).
- **One source of the canvas read-only flag:** `PageEditorLayout` (`Ui.Layout.createDecorator`) renders the original layout and `PageReadOnlySync`, which sets `editor.isReadOnly = options.isReadOnly === true || !vm.allowsEditing` whenever `vm.allowsEditing` changes. `ToggleEditorMode.tsx` is no longer mounted anywhere (deleted in Task 37), so exactly one component writes the flag. While the status is unknown (`loading`, `failed`) `allowsEditing` is false, so the canvas is read-only until the status is known (R225, QBZ-1).
- **Reason note (QBZ-23):** the pure `getPageReadOnlyReason(vm, pageStatus)` returns the canvas note, rendered by `PageReviewBar` as an admin-ui `Alert` under the bar. Order: status `loading` or `failed` -> "Read-only until the review status loads."; `noWorkflow` -> no note; page `published` -> "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes." (any review state); an active review (`vm.status === "active"`) -> by `vm.reviewKind`: `inProgress` "Read-only while this revision is in review."; `approved` "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review."; `rejected` "Read-only: this revision was rejected. Create a new revision to fix it."; any other non-draft page (`unpublished`) -> the published text; otherwise no note. An unpublished page that was reviewed shows Publish enabled in Task 23 (Q19) next to this note: the note only explains the read-only canvas, the way forward is Publish or "New Revision". The WB status tag stays the page status (the top bar is untouched, QBZ-22).
- **Tooltip (R241):** no standalone tooltip action. The shared `ReviewTooltip` (`{ presenter; children }`) wraps the disabled Publish button; that wrapping is Task 23's `DisabledPublishButton`.
- **New Revision (Q17, Q19, R227):** "New Revision" is the base `buttonNewRevision` (under `Ui.IsReadOnly`, `DefaultPageEditorConfig.tsx:30-34`; it navigates to the new revision; D24's API check found no status restriction); the bar adds no action of its own. `PageNewRevisionDecorator` (a `Ui.TopBar.Action` decorator that acts only on the name `buttonNewRevision`, the one decoration of that point, A78) renders the base element unless `vm.status` is `loading` or `failed` (an unknown state counts as locked, R225) or `vm.reviewKind` is `inProgress` (Q17: hidden while a review is in progress). It stays visible for a rejected page, an approved page and an unpublished page (Q19), and for a namespace without a workflow (`noWorkflow`, base behaviour). The base button is mounted only while the canvas is read-only, so an editable draft shows none, as today. "Back" is the base `BackButton` (Pages list, QBZ-61), untouched.
- **Registration:** `WbPageReview = createAbstraction<IEditorReviewSession>("WebsiteBuilder/Workflows/PageReview")`; a WB subclass `WbPageReviewSessionImpl extends EditorReviewSession` (own file, R237: `createImplementation` is never called on the shared class) is registered as `WbPageReview.createImplementation({ implementation: WbPageReviewSessionImpl, dependencies: [TargetReviewPresenter, WbReviewUseCases] })`, singleton (R212), by `WbPageReviewFeature`, which `WebsiteBuilderWorkflows` registers inside the flag gate (R211). Components resolve the session with `useFeature(WbPageReviewFeature)`.
- **`PageEditorConfig`** (kept by name, rewritten, R219) mounts `PageEditorTopBar`, `PageEditorLayout` and `PageNewRevisionDecorator` (Task 23 adds the autosave and publish pieces and the base config). The old `PageFormWorkflowState.tsx`, `PageFormWorkflowStateTooltip.tsx`, `PageFormWorkflowStatePublishButton.tsx` and `ToggleEditorMode.tsx` stop being imported (deleted in Task 37). The autosave and publish pieces are Task 23's; until then the base autosave still refuses to save while the canvas is read-only (it checks the editor state itself) and the base Publish is hidden by `Ui.IsNotReadOnly` whenever the canvas is read-only.

**Files:**
- Create: `packages/app-website-builder-workflows/src/features/editorReview/WbPageReview.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorReview/WbPageReviewSessionImpl.ts`
- Create: `packages/app-website-builder-workflows/src/features/editorReview/feature.ts`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/pageEditorDocument.ts`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/getPageReadOnlyReason.ts`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReadOnlySync.tsx`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageReviewBar.tsx`
- Create: `packages/app-website-builder-workflows/src/Components/PageEditor/PageNewRevisionDecorator.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorTopBar.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorLayout.tsx`
- Rewrite: `packages/app-website-builder-workflows/src/Components/PageEditor/PageEditorConfig.tsx`
- Modify: `packages/app-website-builder-workflows/src/index.tsx`, `packages/app-website-builder-workflows/package.json`, `packages/app-website-builder-workflows/vitest.config.ts` (Task 12 created it without a DOM setup or SVG alias; this is the first WB task that renders real admin components, R222)
- Create: `packages/app-website-builder-workflows/__tests__/setup/setupDom.ts`, `packages/app-website-builder-workflows/__tests__/setup/svgStub.tsx`
- Create (test support, reused by Tasks 23 and 24; in `src/testing/` because co-located `src` tests import it and a `~tests/...` import from `src` fails the build with TS6059 (`rootDir: ./src`); imported as `~/testing/...`; no non-test source imports it): `packages/app-website-builder-workflows/src/testing/createFakeVm.ts`, `createFakeSession.ts`, `createPageEditor.ts`, `WbEditorHarness.tsx`
- Create tests: `src/Components/PageEditor/getPageReadOnlyReason.test.ts`, `PageEditorLayout.test.tsx`, `PageEditorTopBar.test.tsx`, `pageReviewMatrix.test.tsx`, `PageNewRevisionDecorator.test.tsx`, `src/editorGlue.wiring.test.tsx` (all under `packages/app-website-builder-workflows/`)

**Interfaces:**
- Consumes (Tasks 8-19, paths per the contract, verify each when writing code): `IEditorReviewSession` (`packages/app-workflows/src/review/editor/abstractions.ts`), `EditorReviewSession` (`.../review/editor/EditorReviewSession.ts`), `EditorReviewBar` (`.../review/editor/components/EditorReviewBar.tsx`, props `{ session; reviewsRoute }`), `TargetReviewPresenter` (`.../review/presentation/targetReview/abstractions.ts`; the namespace types `TargetReviewPresenter.Interface` and `TargetReviewPresenter.ViewModel`, whose `status` and `reviewKind` (`"none" | "inProgress" | "approved" | "rejected"`, R240) the glue switches on), `getEditorRules` (`.../review/presentation/targetReview/getEditorRules.ts`, `getEditorRules({ status, reviewKind, isUnpublished })`, R226; the test fixture builds its view model from it), `createViewModel` (`.../review/testing/targetReviewFakes.ts`, Task 14, R243), `IReviewUseCases` (`.../review/useCases/IReviewUseCases.ts`); Task 12 `WbReviewUseCases` (`~/features/gateway/WbReviewUseCases.js`, one token per file), `WB_PAGE_APP` (`~/constants.js`, `"wb.page"`); existing `Routes.Pages.WorkflowStateList` (`~/routes.js`). Existing Website Builder code, deep imports (every admin package exports `"./*": "./*"`): `PageEditorConfig` (`@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js`, `Ui.TopBar.Layout`, `Ui.TopBar.Action`, `Ui.TopBar.Elements`, `Ui.Layout`), `useSelectFromDocument` and the `EditorDocument` type (`@webiny/app-website-builder/BaseEditor/hooks/useSelectFromDocument.js`), `useDocumentEditor` (`@webiny/app-website-builder/DocumentEditor/index.js`), `WbPageStatus` and `WbStatus` (`@webiny/app-website-builder/constants.js`), `createReactiveComponent` and `useFeature` (`@webiny/app-admin`, `@webiny/app`), `createFeature`, `createAbstraction` (`@webiny/feature/admin`).
- Produces: the token `WbPageReview` (`~/features/editorReview/WbPageReview.ts`) and its implementation, exported under the same name from `WbPageReviewSessionImpl.ts`, `WbPageReviewFeature` (`resolve` -> `{ session }`), `getPageReadOnlyReason(vm, pageStatus)`, `PageNewRevisionDecorator`, the rewritten `PageEditorTopBar`, `PageEditorLayout`, `PageEditorConfig` (Task 23 adds to `PageEditorConfig`; Task 30 reuses `Routes.Pages.WorkflowStateList`), and the test support files (Tasks 23 and 24).

**Test runner note:** `packages/app-website-builder-workflows` is an admin package, so tests run with `yarn test <path>` only; it is not an `-es`/`-os` package and has no storage-specific suite (`yarn test:os` does not apply). Task 12 added `vitest.config.ts` (jsdom) and the `vitest` and `@testing-library/react` devDependencies (verify both exist; if not, copy `packages/app-admin/vitest.config.ts` and add them as in Task 12). The vitest config registers no SVG transform and no global `afterEach`, so tests that render call `cleanup()` in `afterEach` and mock any `.svg` import they render. The classic JSX runtime is used, so every `.tsx` file imports `React`.

- [ ] **Step 1: Write the failing tests and the test support**

Add the devDependencies the tests and helpers use (`yarn adio` in Step 6 confirms the final list). In `packages/app-website-builder-workflows/package.json`, inside `devDependencies`, add these entries in alphabetical order if Task 12 has not already added them (Task 12 already added `@webiny/app-headless-cms-workflows`, which the coexistence case of `editorGlue.wiring.test.tsx` imports):

```json
        "@webiny/di": "^1.1.0",
        "@webiny/react-composition": "0.0.0",
        "mobx": "^7.0.3",
```

Replace `packages/app-website-builder-workflows/vitest.config.ts` (the file Task 12 created; the vitest config registers no SVG transform, so any module that imports `@webiny/icons/*.svg` fails to load, and jsdom has no `ResizeObserver`, which Radix tooltips need; the same change Task 14 made in `app-workflows` and Task 20 in `app-headless-cms-workflows`). Tasks 23, 24, 30, 36 and 37 rely on it:

```ts
import { createTestConfig } from "../../testing";

export default async () => {
    return createTestConfig({
        path: import.meta.dirname,
        presets: [{ setupFiles: [`${import.meta.dirname}/__tests__/setup/setupDom.ts`] }],
        vitestConfig: {
            environment: "jsdom",
            fileParallelism: true,
            alias: [
                {
                    find: /^@webiny\/icons\/.+\.svg$/,
                    replacement: `${import.meta.dirname}/__tests__/setup/svgStub.tsx`
                }
            ]
        }
    });
};
```

Create `packages/app-website-builder-workflows/__tests__/setup/setupDom.ts`:

```ts
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

class ResizeObserverStub {
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

// jsdom has no ResizeObserver; Radix tooltips and popovers need one.
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
    cleanup();
});
```

Create `packages/app-website-builder-workflows/__tests__/setup/svgStub.tsx`:

```tsx
import React from "react";

export const ReactComponent = (props: React.SVGProps<SVGSVGElement>) => {
    return <svg data-testid="svg-icon" {...props} />;
};

export default "svg-stub";
```

The per-file `vi.mock("@webiny/icons/....svg", ...)` stubs in this and the following tasks stay valid (they replace the aliased module).

Create `packages/app-website-builder-workflows/src/testing/createFakeVm.ts` (test support: it builds on Task 14's pure `createViewModel`, and the rules, reasons and `reviewKind` come from the real `getEditorRules` of Task 13, so a change to the rules changes these fixtures with no copy to keep in step; `isUnpublished` is the Q19 input):

```ts
import type { TargetReviewKind } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { TargetReviewStatus } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { getEditorRules } from "@webiny/app-workflows/review/presentation/targetReview/getEditorRules.js";
import { createViewModel } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";

export type FakeReviewKind =
    | "loading"
    | "failed"
    | "noWorkflow"
    | "none"
    | "inProgress"
    | "approved"
    | "rejected";

interface FakeReviewState {
    status: TargetReviewStatus;
    reviewKind: TargetReviewKind;
}

const FAKE_REVIEW_STATES: Record<FakeReviewKind, FakeReviewState> = {
    loading: { status: "loading", reviewKind: "none" },
    failed: { status: "failed", reviewKind: "none" },
    noWorkflow: { status: "noWorkflow", reviewKind: "none" },
    none: { status: "none", reviewKind: "none" },
    inProgress: { status: "active", reviewKind: "inProgress" },
    approved: { status: "active", reviewKind: "approved" },
    rejected: { status: "active", reviewKind: "rejected" }
};

export const createFakeVm = (
    kind: FakeReviewKind,
    isUnpublished: boolean = false
): TargetReviewPresenter.ViewModel => {
    const { status, reviewKind } = FAKE_REVIEW_STATES[kind];
    const rules = getEditorRules({ status, reviewKind, isUnpublished });

    return createViewModel({
        status,
        reviewKind,
        allowsEditing: rules.allowsEditing,
        allowsPublishing: rules.allowsPublishing,
        publishDisabledReason: rules.publishDisabledReason,
        moveDisabledReason: rules.moveDisabledReason
    });
};
```

Create `packages/app-website-builder-workflows/src/testing/createFakeSession.ts`:

```ts
import { observable } from "mobx";
import { runInAction } from "mobx";
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import type { FakeReviewKind } from "./createFakeVm.js";
import { createFakeVm } from "./createFakeVm.js";

export interface FakePresenter {
    readonly vm: TargetReviewPresenter.ViewModel;
    init: Mock<TargetReviewPresenter.Interface["init"]>;
    setContext: Mock<TargetReviewPresenter.Interface["setContext"]>;
    refresh: Mock<TargetReviewPresenter.Interface["refresh"]>;
    actionDone: Mock<TargetReviewPresenter.Interface["actionDone"]>;
    openAction: Mock<TargetReviewPresenter.Interface["openAction"]>;
    closeAction: Mock<TargetReviewPresenter.Interface["closeAction"]>;
    dispose: Mock<TargetReviewPresenter.Interface["dispose"]>;
}

export interface FakeSessionHandle {
    session: WbPageReview.Interface;
    presenter: FakePresenter;
    useCases: IReviewUseCases;
    setKind(kind: FakeReviewKind): void;
}

export const createFakeSession = (
    initialKind: FakeReviewKind = "none",
    isUnpublished: boolean = false
): FakeSessionHandle => {
    const state = observable({ vm: createFakeVm(initialKind, isUnpublished) });

    const presenter: FakePresenter = {
        get vm() {
            return state.vm;
        },
        init: vi.fn<TargetReviewPresenter.Interface["init"]>().mockResolvedValue(undefined),
        setContext: vi.fn<TargetReviewPresenter.Interface["setContext"]>(),
        refresh: vi.fn<TargetReviewPresenter.Interface["refresh"]>().mockResolvedValue(undefined),
        actionDone: vi
            .fn<TargetReviewPresenter.Interface["actionDone"]>()
            .mockResolvedValue(undefined),
        openAction: vi.fn<TargetReviewPresenter.Interface["openAction"]>(),
        closeAction: vi.fn<TargetReviewPresenter.Interface["closeAction"]>(),
        dispose: vi.fn<TargetReviewPresenter.Interface["dispose"]>()
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
            state.vm = createFakeVm(kind, isUnpublished);
        });
    };

    return { session, presenter, useCases, setKind };
};
```

Create `packages/app-website-builder-workflows/src/testing/createPageEditor.ts` (the editor the way `PageEditor.tsx` builds it: read-only options for every page that is not a draft):

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

Create `packages/app-website-builder-workflows/src/testing/WbEditorHarness.tsx` (the real editor config tree: `DocumentEditorContext`, the editor composition scope and `EditorWithConfig`, exactly how `DocumentEditor` and the base `Editor` component mount them, plus the DI container and the admin-ui provider; `groups` renders the top bar element groups):

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
import { createFakeVm } from "~/testing/createFakeVm.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
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
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
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
import type { Route } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageStatus } from "@webiny/app-website-builder/constants.js";
import type { WbStatus } from "@webiny/app-website-builder/constants.js";
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
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
        reviewsRoute: Route<any>;
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
            isPublished: false,
            isUnpublished: false
        });
    });

    it("cannot request a review on a published page and marks it published", () => {
        const { presenter, useCases } = mountTopBar("published", "none");

        expect(presenter.init).toHaveBeenCalledWith({
            useCases,
            target: { namespace: "wb.page", targetRevisionId: "page-1#0001" },
            targetTitle: "Home",
            canRequest: false,
            isPublished: true,
            isUnpublished: false
        });
    });

    it("cannot request a review on an unpublished page, which was published before (Q19)", () => {
        const { presenter } = mountTopBar("unpublished", "none");

        const params = presenter.init.mock.calls[0][0];
        expect(params.canRequest).toBe(false);
        expect(params.isPublished).toBe(false);
        expect(params.isUnpublished).toBe(true);
    });

    it("disposes the session presenter when the editor closes", () => {
        const { presenter, view } = mountTopBar("draft", "none");
        expect(presenter.dispose).not.toHaveBeenCalled();

        view.unmount();

        expect(presenter.dispose).toHaveBeenCalledTimes(1);
    });

    it("updates the context without a reload when the page is published", async () => {
        const { presenter, editor } = mountTopBar("draft", "none");

        act(() => {
            editor.updateDocument(state => {
                state.status = WbPageStatus.Published;
            });
        });

        await waitFor(() => {
            expect(presenter.setContext).toHaveBeenLastCalledWith({
                targetTitle: "Home",
                canRequest: true,
                isPublished: true,
                isUnpublished: false
            });
        });
        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(presenter.dispose).not.toHaveBeenCalled();
    });

    it("updates the context without a reload when the page is unpublished (Q19)", async () => {
        const { presenter, editor } = mountTopBar("published", "approved");

        act(() => {
            editor.updateDocument(state => {
                state.status = WbPageStatus.Unpublished;
            });
        });

        await waitFor(() => {
            expect(presenter.setContext).toHaveBeenLastCalledWith({
                targetTitle: "Home",
                canRequest: false,
                isPublished: false,
                isUnpublished: true
            });
        });
        expect(presenter.init).toHaveBeenCalledTimes(1);
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
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
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

describe("review status x page status (bar, note and canvas)", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(MATRIX)("$kind review on a $page page", ({ kind, page, bar, note, readOnly }) => {
        const handle = createFakeSession(kind, page === "unpublished");
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

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageNewRevisionDecorator.test.tsx` (the New Revision rule, Q17 and Q19; the base `buttonNewRevision` is stood in for by a marker element registered under the same name):

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
import { Container } from "@webiny/di";
import { InternalPageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
import type { FakeReviewKind } from "~/testing/createFakeVm.js";
import { PageNewRevisionDecorator } from "./PageNewRevisionDecorator.js";

const { Ui } = PageEditorConfig;

const mountNewRevision = (kind: FakeReviewKind, isUnpublished: boolean = false) => {
    const handle = createFakeSession(kind, isUnpublished);
    const container = new Container();
    container.registerInstance(WbPageReview, handle.session);
    const editor = createPageEditor(isUnpublished ? "unpublished" : "published");

    render(
        <WbEditorHarness container={container} editor={editor} groups={["actions"]}>
            <PageNewRevisionDecorator />
            <InternalPageEditorConfig>
                <Ui.TopBar.Action name={"sentinel"} element={<span data-testid={"sentinel"} />} />
                <Ui.TopBar.Action
                    name={"buttonNewRevision"}
                    element={<span data-testid={"new-revision"} />}
                />
                <Ui.TopBar.Action
                    name={"buttonSettings"}
                    element={<span data-testid={"other-action"} />}
                />
            </InternalPageEditorConfig>
        </WbEditorHarness>
    );

    return handle;
};

interface NewRevisionCase {
    kind: FakeReviewKind;
    shown: boolean;
}

const CASES: NewRevisionCase[] = [
    { kind: "loading", shown: false },
    { kind: "failed", shown: false },
    { kind: "noWorkflow", shown: true },
    { kind: "none", shown: true },
    { kind: "inProgress", shown: false },
    { kind: "approved", shown: true },
    { kind: "rejected", shown: true }
];

describe("PageNewRevisionDecorator", () => {
    afterEach(() => {
        cleanup();
    });

    it.each(CASES)("$kind review: New Revision shown is $shown", async ({ kind, shown }) => {
        mountNewRevision(kind);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("new-revision")).toHaveLength(shown ? 1 : 0);
        });
    });

    it("an unpublished page with no review shows New Revision (Q19)", async () => {
        mountNewRevision("none", true);
        await screen.findByTestId("sentinel");

        await waitFor(() => {
            expect(screen.queryAllByTestId("new-revision")).toHaveLength(1);
        });
    });

    it("leaves every other top bar action alone", async () => {
        mountNewRevision("inProgress");
        await screen.findByTestId("sentinel");

        expect(screen.queryAllByTestId("other-action")).toHaveLength(1);
    });

    it("follows the review while the editor is open: hidden in progress, shown once rejected (Q17)", async () => {
        const { setKind } = mountNewRevision("inProgress");
        await screen.findByTestId("sentinel");
        expect(screen.queryAllByTestId("new-revision")).toHaveLength(0);

        act(() => {
            setKind("rejected");
        });

        await waitFor(() => {
            expect(screen.queryAllByTestId("new-revision")).toHaveLength(1);
        });
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
import { CmsEntryReview } from "@webiny/app-headless-cms-workflows/features/editorReview/CmsEntryReview.js";
import { CmsEntryReviewFeature } from "@webiny/app-headless-cms-workflows/features/editorReview/feature.js";
import { CmsReviewUseCases } from "@webiny/app-headless-cms-workflows/features/gateway/CmsReviewUseCases.js";
import { CmsReviewFeature } from "@webiny/app-headless-cms-workflows/features/gateway/feature.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbPageReview } from "~/features/editorReview/WbPageReview.js";
import { WbEditorHarness } from "~/testing/WbEditorHarness.js";
import { createFakeSession } from "~/testing/createFakeSession.js";
import { createPageEditor } from "~/testing/createPageEditor.js";
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

    it("flag on: this app's session and the CMS editor session coexist in one container (R237)", () => {
        const { container } = mountRoot(true);
        CmsReviewFeature.register(container);
        CmsEntryReviewFeature.register(container);

        const wbSession = container.resolve(WbPageReview);
        const cmsSession = container.resolve(CmsEntryReview);

        expect(cmsSession).not.toBe(wbSession);
        expect(wbSession.useCases).toBe(container.resolve(WbReviewUseCases));
        expect(cmsSession.useCases).toBe(container.resolve(CmsReviewUseCases));
        expect(cmsSession.useCases).not.toBe(wbSession.useCases);
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
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageNewRevisionDecorator.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -50
```

Expected: every file FAILS to load: `Failed to resolve import "./getPageReadOnlyReason.js"` (first file), `Failed to resolve import "./PageNewRevisionDecorator.js"` (its test) and `Failed to resolve import "~/features/editorReview/WbPageReview.js"` (the others; `~/Components/PageEditor/pageEditorDocument.js` is missing for the test support too). Record this RED before writing any source. If a failure names a symbol of Tasks 8-19 instead (`EditorReviewBar`, `ReviewTooltip`, `TargetReviewPresenter`, `WbReviewUseCases`), that task is not merged on this branch: stop and report it.

- [ ] **Step 3: Implement**

Create `packages/app-website-builder-workflows/src/features/editorReview/WbPageReview.ts`:

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

Create `packages/app-website-builder-workflows/src/features/editorReview/WbPageReviewSessionImpl.ts` (named after its class; exported under the token name `WbPageReview`, as Task 12's `WbReviewUseCasesImpl.ts` and Task 21's `CmsReviewCacheWriterImpl.ts` do; there is no `abstractions.ts` in this folder):

The shared `EditorReviewSession` is never passed to `createImplementation` (it would store this app's token on the shared class and collide with the CMS binding); the app subclasses it once, in its own file:

```ts
import { EditorReviewSession } from "@webiny/app-workflows/review/editor/EditorReviewSession.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { WbReviewUseCases } from "~/features/gateway/WbReviewUseCases.js";
import { WbPageReview as Abstraction } from "./WbPageReview.js";

class WbPageReviewSessionImpl extends EditorReviewSession implements Abstraction.Interface {}

export const WbPageReview = Abstraction.createImplementation({
    implementation: WbPageReviewSessionImpl,
    dependencies: [TargetReviewPresenter, WbReviewUseCases]
});
```

Create `packages/app-website-builder-workflows/src/features/editorReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { WbPageReview as Abstraction } from "./WbPageReview.js";
import { WbPageReview } from "./WbPageReviewSessionImpl.js";

export const WbPageReviewFeature = createFeature({
    name: "WebsiteBuilder/Workflows/PageReviewSession",
    register(container) {
        container.register(WbPageReview).inSingletonScope();
    },
    resolve(container) {
        return {
            session: container.resolve(Abstraction)
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
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export type PageReadOnlyReasonVm = Pick<TargetReviewPresenter.ViewModel, "status" | "reviewKind">;

const NOT_LOADED = "Read-only until the review status loads.";
const PUBLISHED =
    "Read-only. The Website Builder only edits draft revisions. Create a new revision to make changes.";
const IN_REVIEW = "Read-only while this revision is in review.";
const APPROVED =
    "Read-only: this revision has an approved review. Create a new revision to make changes; it needs a new review.";
const REJECTED = "Read-only: this revision was rejected. Create a new revision to fix it.";

/**
 * The canvas note of the Website Builder design frames (QBZ-23), switched on `vm.status` and
 * `vm.reviewKind` (R240), never on label text.
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
            isPublished: page.status === WbPageStatus.Published,
            isUnpublished: page.status === WbPageStatus.Unpublished
        });
        return () => {
            session.presenter.dispose();
        };
    }, [session, editor, page.id]);

    useEffect(() => {
        const options = editor.getEditorOptions();
        session.presenter.setContext({
            targetTitle: page.title,
            canRequest: options.isReadOnly !== true,
            isPublished: page.status === WbPageStatus.Published,
            isUnpublished: page.status === WbPageStatus.Unpublished
        });
    }, [session, editor, page.status]);

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

Create `packages/app-website-builder-workflows/src/Components/PageEditor/PageNewRevisionDecorator.tsx`:

```tsx
import React from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { PageEditorConfig } from "@webiny/app-website-builder/presentation/pages/PageEditor/PageEditorConfig.js";
import { WbPageReviewFeature } from "~/features/editorReview/feature.js";

const { Ui } = PageEditorConfig;

interface NewRevisionGateProps {
    element?: React.ReactElement | null;
}

const NewRevisionGate = createReactiveComponent((props: NewRevisionGateProps) => {
    const { session } = useFeature(WbPageReviewFeature);
    const { vm } = session.presenter;

    /**
     * Hidden while the status is unknown (R225) and while a review is in progress (Q17). Shown for a
     * rejected, an approved and an unpublished page (Q19) and where there is no workflow.
     */
    if (vm.status === "loading" || vm.status === "failed" || vm.reviewKind === "inProgress") {
        return null;
    }

    return props.element ?? null;
});

/**
 * The one decoration of the base `buttonNewRevision` (A78); every other action passes through.
 */
export const PageNewRevisionDecorator = Ui.TopBar.Action.createDecorator(Original => {
    return function PageNewRevisionDecoratorAction(props) {
        if (props.name === "buttonNewRevision") {
            return <Original {...props} element={<NewRevisionGate element={props.element} />} />;
        }
        return <Original {...props} />;
    };
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
import { PageNewRevisionDecorator } from "./PageNewRevisionDecorator.js";

export const PageEditorConfig = () => {
    return (
        <>
            {/* The review bar under the top bar, for every page status. */}
            <PageEditorTopBar />
            {/* The one source of the canvas read-only flag. */}
            <PageEditorLayout />
            {/* New Revision hidden while a review is in progress or its state is unknown. */}
            <PageNewRevisionDecorator />
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
yarn test packages/app-website-builder-workflows/src/Components/PageEditor/PageNewRevisionDecorator.test.tsx 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/editorGlue.wiring.test.tsx 2>&1 | tail -50
```

Expected: all PASS. If a mock fails to apply (the real top bar or layout renders), check the mocked path is the exact file the base editor imports (`BaseEditor/config/Layout.js`, `BaseEditor/config/TopBar/Layout.js`).

- [ ] **Step 5: Run the existing tests covering the changed code, and type-check**

Task 12's tests (gateway, content adapter, feature with the A83 coexistence case, and the root composition test), one command per file:

```bash
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewGatewayImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/WbReviewContentAdapterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-website-builder-workflows/src/index.test.tsx 2>&1 | tail -50
```

Then the type check. `check:test:types` lists only packages that have a `__tests__/**/*.test.ts` file (this package has none), so the check of the co-located tests and the support files is the package build (R243):

```bash
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
```

Expected: the Task 12 tests still pass (they mount `WebsiteBuilderWorkflows`, which now also registers `WbPageReviewFeature`), and the build prints no type errors. Type errors that name `TargetReviewPresenter.ViewModel` fields or `IEditorReviewSession` members mean the contract and Task 13/19's real types differ: fix the glue to the real type and add a line under "Contract notes".

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full (it stages everything with `git add .`; `.gitleaks.toml`, `docs/.reports` and `.superpowers` are never committed) and restore `.gitleaks.toml` after format and after build:

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
yarn build -p @webiny/app-website-builder-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
```

If any step fails and you fix anything, rerun the chain from the start. Then:

```bash
git commit -m "feat(app-website-builder-workflows): review bar, canvas read-only source and tooltip in the page editor" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

**Contract notes:**
- `Workflows/NotAuthorized` (Q18, R211, R225): a review read the viewer may not make is `failed`/`noAccess`, so the canvas is read-only with the "status not loaded" note. Workflows follow the content permissions (the WB GraphQL carries them), so this only happens for a viewer without access to the page; the lock cannot hit a user who can edit it.
- The unpublished page (Q19): `isUnpublished` reaches the shared rules through `init` and `setContext`, so Publish is enabled with no new review (Task 23) and "New Revision" stays visible; a revision that was published before the workflow was bound has no review and the server refuses it with `Workflows/Review/PublishBlocked` (A89), which the admin error toast shows.
- Files beyond the contract's Interfaces list: `PageNewRevisionDecorator.tsx` and its test hold the Q17 rule (the contract only says `PageEditorConfig` decorates `buttonNewRevision`), one file per decorator like Task 23's `PageBasePublishDecorator.tsx`.
- Verify at implementation time: (1) the deep import paths of Tasks 8-19 listed under Consumes, and the Task 20 paths the coexistence case imports (`features/editorReview/CmsEntryReview.js`, `.../feature.js`, `features/gateway/{CmsReviewUseCases,feature}.js`); (2) that `EditorWithConfig` flushes the config for `findBy...` in jsdom (the harness copies the real `Editor` component's mount); (3) that `useFeatureFlags` is the only thing the root needs mocked (the root imports it from `@webiny/app-admin`).
