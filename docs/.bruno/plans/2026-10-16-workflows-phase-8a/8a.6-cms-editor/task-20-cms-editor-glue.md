### Task 20: CMS editor glue (bar, blocked actions and editor-rule decorators)

Spec 13.1, 13.3; R202, R211, R212, R217, R225, R226; Review Focus 1, 3, 4, 5, 8, 16, 17; A78 (each extension point is decorated once, the old decorator is replaced), QBZ-1, QBZ-36, QBZ-58, QBZ-96. This task mounts the shared review bar and the shared editor rules at the CMS entry editor's extension points. Everything app-neutral (presenter, bar, tooltip, dialogs, rules, message tables) exists in `app-workflows` (Tasks 13-19); this package adds a session subclass and thin glue. No review logic is written here. Imports from `app-workflows` use deep paths (`@webiny/app-workflows/<path>.js`), never the barrel (R238). Test support that several tasks share (Tasks 20, 21, 35) lives in `packages/app-headless-cms-workflows/src/testing/` and is imported as `~/testing/<file>.js`, because a co-located `src` test importing from `__tests__/` fails `yarn build` with TS6059 (`tsconfig.build.json` has `rootDir: ./src`, R243); only the vitest setup files stay in `__tests__/setup/`.

- **Session:** `CmsEntryReview` (`"Cms/Workflows/EntryReview"`, token in `features/editorReview/CmsEntryReview.ts`) is the `IEditorReviewSession` of the CMS editor. Per the subclass rule the shared class is never registered: `class CmsEntryReviewSessionImpl extends EditorReviewSession implements CmsEntryReview.Interface {}` in `CmsEntryReviewImpl.ts`, registered with dependencies `[TargetReviewPresenter, CmsReviewUseCases]`, singleton (R212). It lives in its own `CmsEntryReviewFeature` (`register` + `resolve -> { session }`) because components reach it through `useFeature`.
- **Bar:** `ContentEntryFormContent` decorator rendering `EditorReviewBar` (`reviewsRoute = Routes.ContentEntries.ContentReviews`) above the original, only for a loaded entry of a non-singleton model and while the status is not `noWorkflow`.
- **No standalone tooltip action.** `ReviewTooltip` (Task 14) is `{ presenter, children }`: it wraps a disabled control and gives it the reason on hover and focus and through `aria-describedby`. It is used by `CmsEntryReviewBlockedActions` around the disabled Save and Publish. The old `workflowStateTooltip` action is not registered (the old `CmsEntryFormTooltipButton` is deleted in Task 37).
- **Schedule:** `MenuItemAction` decorator hiding `schedule` unless `vm.allowsPublishing` (R226; note that "a workflow is bound but no review exists" also hides it, the real `getEditorRules` returns `allowsPublishing: false` for `none`, except for an unpublished revision, which was reviewed before it was published and is publishable and schedulable again, Q19).
- **New revision:** the `createNewRevision` options-menu item (kept by name, under `IsModelPublishable`) stays usable in every locked state (rejected, approved, in review) and is disabled only while the status is unknown. For a rejected revision it is the way to a new revision: it is available in the Options menu and the bar's lock text already names it ("... create a new revision ..."); the Task 13 view model has no rejected discriminator, so no extra button is added.
- **Form presenter decorator** `CmsEntryFormPresenterReviewDecorator` (dependencies `[CmsEntryReview]`): `loadRevision(id)` -> original, then `session.presenter.init({ useCases, target: { namespace: createAppName(model), targetRevisionId }, targetTitle, canRequest: <original canSave>, isPublished, isUnpublished })` (`isUnpublished` is true when the revision's status is `unpublished`, a revision published before and not published now, R226, Q19); after a successful publish, unpublish or save of the same revision `session.presenter.setContext({ targetTitle, canRequest, isPublished, isUnpublished })` (no reload); `init` again only when a save created a different revision id; `reset` -> `dispose()`. `canSave` = original && `allowsEditing`; `canCreateNewRevision` = original && `allowsEditing` (the base "New Revision" button reads only this flag and saves through `saveRevision`, which the rule refuses); `canPublish` = original && `allowsPublishing`; all three false from the moment a revision starts loading until the status is known. Singleton models and new entries pass through. `saveRevision` and `publishRevision` refuse when the rule says no; the one exception is a clean, unlocked approved draft, where `saveRevision` reports success without saving so "Save & Publish" goes on to publish.
- **Two additions the base editor forces** (Contract notes 1, 2): `CmsEntryReviewBlockedActions` (the base Save and Publish buttons render nothing when `canSave` or `canPublish` is false, so the `aria-disabled` Publish, never removed per R226, has to be registered by us) and `CmsEntryReviewFormLock` (the CMS form has no read-only mode while R225 asks for one until the status is known).

**Files:**
- Modify: `packages/app-headless-cms-workflows/package.json` (devDependencies)
- Modify: `packages/app-headless-cms-workflows/vitest.config.ts` (Task 11 created it; DOM setup file and SVG alias, as Task 14 did in `app-workflows`)
- Create: `packages/app-headless-cms-workflows/__tests__/setup/setupDom.ts`, `packages/app-headless-cms-workflows/__tests__/setup/svgStub.tsx`
- Create: `packages/app-headless-cms-workflows/src/features/editorReview/CmsEntryReview.ts` (token, one abstraction per file)
- Create: `packages/app-headless-cms-workflows/src/features/editorReview/CmsEntryReviewImpl.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorReview/feature.ts`
- Create: `packages/app-headless-cms-workflows/src/features/editorReview/useCmsEntryReview.ts`
- Create: `packages/app-headless-cms-workflows/src/utils/isReviewableModel.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewContext.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts`
- Create: `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.ts`
- Create: `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/{CmsEntryReviewBar,CmsEntryReviewScheduleMenuItem,CmsEntryReviewNewRevision,CmsEntryReviewFormLock,CmsEntryReviewBlockedActions}.tsx`
- Modify: `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/index.ts` (new components replace the old exports)
- Modify: `packages/app-headless-cms-workflows/src/presentation/feature.ts` (the new decorator replaces the old one)
- Modify: `packages/app-headless-cms-workflows/src/index.tsx` (mounts the new components in place of the old ones, registers `CmsEntryReviewFeature`)
- Modify: `packages/app-headless-cms-workflows/src/index.test.tsx` (**Task 11's file**, edited only in the `vi.mock` factory for `~/Components/ContentEntryForm/index.js`, which must export the new names, and the obsolete `CmsEntryFormCreateNewRevisionButton.js` mock is removed; no case changes)
- Create tests: shared test support `src/testing/{createEntrySession,createEntry,createFormVm,renderEditorTree}.ts(x)`, `src/testing/{models,reviewStates}.ts` (R243); `src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`, `src/features/editorReview/feature.test.ts`, `src/Components/ContentEntryForm/{CmsEntryReviewBar,CmsEntryReviewFormLock,CmsEntryReviewScheduleMenuItem,CmsEntryReviewBlockedActions,CmsEntryReviewNewRevision}.test.tsx`, `src/index.editor.test.tsx` (the Task 20 composition cases; Task 11's `index.test.tsx` keeps its own)
- Not touched, deleted in Task 37: `Components/ContentEntryForm/{ContentEntryFormWorkflow,CmsEntryFormTooltipButton,CmsEntryFormScheduleMenuItemAction,CmsEntryFormCreateNewRevisionButton}.tsx`, `presentation/ContentEntryFormPresenterWorkflowDecorator.ts`.
- Existing, must stay green unchanged: every other test file Task 11 added under `packages/app-headless-cms-workflows` (list with `git ls-files 'packages/app-headless-cms-workflows/**/*.test.ts*'`).

**Interfaces:**
- Consumes: Task 19 (`EditorReviewSession` `.../review/editor/EditorReviewSession.js`, `IEditorReviewSession` `.../review/editor/abstractions.js`, `EditorReviewBar` `.../review/editor/components/EditorReviewBar.js`), Task 14 (`ReviewTooltip` `.../review/presentation/targetReview/components/ReviewTooltip.js`, props `{ presenter, children }`; test helpers `createViewModel`, `createFakePresenter` in `.../review/testing/targetReviewFakes.js`), Task 13 (`TargetReviewPresenter`, `ITargetReviewPresenter`, `TargetReviewPresenter.ViewModel`, `TargetReviewContext`, `TargetReviewInitParams` from `.../review/presentation/targetReview/abstractions.js`; `setContext`; the vitest fake `createFakeUseCases` and the type `FakeReviewUseCases` in `.../review/testing/fakeReviewUseCases.js`), Task 8 (`IReviewUseCases`), Task 11 (`CmsReviewUseCases` token `~/features/gateway/CmsReviewUseCases.js`, `CmsReviewFeature` `~/features/gateway/feature.js`, `resolve -> { useCases, contentAdapter }`; `vitest.config.ts`, devDependencies, `src/index.test.tsx`). Existing, verified in code for this plan: `ContentEntryFormPresenter` / `ContentEntryFormPresenter.Interface` / `ContentEntryFormPresenter.ViewModel` (`packages/app-headless-cms/src/presentation/contentEntries/form/abstractions.ts`; `canCreateNewRevision` is read by the base `CreateNewRevisionButton` alone), `useContentEntryFormPresenter`, `ContentEntryFormContent` and `ContentEntryForm` (`.../views/layout/index.ts`, both `makeDecoratable`), `InternalContentEntryEditorConfig`, `ContentEntryEditorConfig`, `ContentEntryEditorWithConfig`, `useContentEntryEditorConfig` (`packages/app-headless-cms/src/admin/config/contentEntries/editor/ContentEntryEditorConfig.tsx`), `Actions.ButtonAction` (with `useButtons()` giving `ButtonPrimary`/`ButtonSecondary` with `onAction`, spread `...other` onto the admin-ui `Button`) and `Actions.MenuItemAction`, `Buttons` and `OptionsMenuItem` (`@webiny/app-admin`), `IsModelPublishable`, `usePermission` (`packages/app-headless-cms/src/admin/hooks/usePermission.ts`), `RevisionsListFeature` (`createRevision(revisionId)`), `CMS_MODEL_SINGLETON_TAG`, `createAppName`, `Routes.ContentEntries.ContentReviews`, `AdminUiProvider` (`@webiny/admin-ui`), `FeatureFlagsService` (`@webiny/app-admin/features/featureFlags/abstractions.js`), `Container` (`@webiny/di`: instance registrations win over class registrations; decorators apply to both).
- Produces: `CmsEntryReview` (token), `CmsEntryReviewFeature` (`resolve -> { session }`), `useCmsEntryReview()`, `isReviewableModel(model)`, `getCmsEntryReviewContext`, `getCmsEntryReviewInitParams`, the decorators `CmsEntryFormPresenterReviewDecorator`, `CmsEntryReviewBar`, `CmsEntryReviewScheduleMenuItem`, `CmsEntryReviewFormLock`, the registrations `CmsEntryReviewNewRevision`, `CmsEntryReviewBlockedActions`, and the shared test support (`src/testing/`, reused by Task 21 and 35).

- [ ] **Step 1: Write the failing tests**

Test support. In `packages/app-headless-cms-workflows/package.json`, `devDependencies`, add next to what Task 11 added (`@testing-library/react`, `@webiny/di`, `@webiny/feature-flags`, `vitest`):

```json
    "@webiny/react-composition": "0.0.0",
```

Replace `packages/app-headless-cms-workflows/vitest.config.ts` (the file Task 11 created; the vitest config registers no SVG transform and jsdom has no `ResizeObserver`, which Radix tooltips need; same change Task 14 made in `app-workflows`):

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

Create `packages/app-headless-cms-workflows/__tests__/setup/setupDom.ts`:

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

Create `packages/app-headless-cms-workflows/__tests__/setup/svgStub.tsx`:

```tsx
import React from "react";

export const ReactComponent = (props: React.SVGProps<SVGSVGElement>) => {
    return <svg data-testid="svg-icon" {...props} />;
};

export default "svg-stub";
```

Create `packages/app-headless-cms-workflows/src/testing/models.ts`:

```ts
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

export const MODEL = {
    modelId: "article",
    name: "Article",
    tags: []
} as unknown as CmsModel;

export const SINGLETON_MODEL = {
    modelId: "settings",
    name: "Settings",
    tags: [CMS_MODEL_SINGLETON_TAG]
} as unknown as CmsModel;

export const NO_PUBLISHING_MODEL = {
    modelId: "snippet",
    name: "Snippet",
    tags: ["$publishing:false"]
} as unknown as CmsModel;
```

Create `packages/app-headless-cms-workflows/src/testing/reviewStates.ts` (the editor-rule fields of the view model per status; they mirror Task 13's `getEditorRules` exactly, R226 included, so a change there needs a change here):

```ts
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export const CHECKING = "Checking review status…";
export const FAILED_REASON = "The review status could not be loaded. Try again from the review bar.";
export const NEEDS_REVIEW = "Publishing needs an approved review. Request a review first.";
export const REJECTED_REASON =
    "This revision was rejected. Create a new revision, then request a new review.";
export const IN_REVIEW_REASON =
    "This revision is in review. Publishing is allowed once every step approves.";
export const NO_MOVE = "Can’t move while this revision is in review.";

type Rules = Partial<TargetReviewPresenter.ViewModel>;

/** A model without a workflow: nothing is shown and nothing is gated. */
export const NO_WORKFLOW: Rules = {
    status: "noWorkflow",
    allowsEditing: true,
    allowsPublishing: true,
    publishDisabledReason: null,
    moveDisabledReason: null
};

/** A workflow is bound but there is no active review: editing is free, publishing needs a review. */
export const BOUND_NO_REVIEW: Rules = {
    status: "none",
    allowsEditing: true,
    allowsPublishing: false,
    publishDisabledReason: NEEDS_REVIEW,
    moveDisabledReason: null
};

/** An unpublished revision with no review: it was reviewed before it was published, so it can be published again (R226, Q19). */
export const BOUND_UNPUBLISHED: Rules = {
    status: "none",
    allowsEditing: true,
    allowsPublishing: true,
    publishDisabledReason: null,
    moveDisabledReason: null
};

export const LOADING: Rules = {
    status: "loading",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: CHECKING,
    moveDisabledReason: CHECKING
};

export const FAILED: Rules = {
    status: "failed",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: FAILED_REASON,
    moveDisabledReason: FAILED_REASON
};

export const IN_REVIEW: Rules = {
    status: "active",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: IN_REVIEW_REASON,
    moveDisabledReason: NO_MOVE
};

export const REJECTED: Rules = {
    status: "active",
    allowsEditing: false,
    allowsPublishing: false,
    publishDisabledReason: REJECTED_REASON,
    moveDisabledReason: null
};

export const APPROVED: Rules = {
    status: "active",
    allowsEditing: false,
    allowsPublishing: true,
    publishDisabledReason: null,
    moveDisabledReason: null
};
```

Create `packages/app-headless-cms-workflows/src/testing/createEntrySession.ts` (reuses Task 14's fakes; the fake presenter is wrapped so its view model can change during a test and components re-render):

```ts
import { action } from "mobx";
import { observable } from "mobx";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createViewModel } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import type { FakeTargetReviewPresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import type { FakeReviewUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";

export interface EntrySession {
    session: IEditorReviewSession;
    presenter: FakeTargetReviewPresenter;
    useCases: FakeReviewUseCases;
    setVm(overrides: Partial<TargetReviewPresenter.ViewModel>): void;
}

export function createEntrySession(initial: Partial<TargetReviewPresenter.ViewModel> = {}): EntrySession {
    const state = observable({ vm: createViewModel(initial) }, { vm: observable.ref });
    const base = createFakePresenter();
    const presenter: FakeTargetReviewPresenter = {
        ...base,
        get vm() {
            return state.vm;
        }
    };
    const useCases = createFakeUseCases();
    const session: IEditorReviewSession = { presenter, useCases };
    const setVm = action((overrides: Partial<TargetReviewPresenter.ViewModel>) => {
        state.vm = createViewModel(overrides);
    });

    return { session, presenter, useCases, setVm };
}
```

Create `packages/app-headless-cms-workflows/src/testing/createEntry.ts`:

```ts
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";

export function createEntry(overrides: Partial<CmsContentEntry["meta"]> = {}): CmsContentEntry {
    return {
        id: "entry-1#0001",
        entryId: "entry-1",
        modelId: "article",
        meta: {
            title: "Hello",
            status: "draft",
            version: 1,
            locked: false,
            ...overrides
        },
        values: {}
    } as unknown as CmsContentEntry;
}
```

Create `packages/app-headless-cms-workflows/src/testing/createFormVm.ts`:

```ts
import type { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { createEntry } from "./createEntry.js";
import { MODEL } from "./models.js";

export function createFormVm(
    overrides: Partial<ContentEntryFormPresenter.ViewModel> = {}
): ContentEntryFormPresenter.ViewModel {
    return {
        loading: null,
        entry: createEntry(),
        canCreateNewRevision: false,
        model: MODEL,
        form: null,
        status: "draft",
        canSave: true,
        canPublish: true,
        canUnpublish: false,
        canDelete: true,
        isNewEntry: false,
        isDirty: false,
        ...overrides
    };
}
```

Create `packages/app-headless-cms-workflows/src/testing/renderEditorTree.tsx`:

```tsx
import React from "react";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/react-composition";
import { DiContainerProvider } from "@webiny/app";
import { Buttons } from "@webiny/app-admin";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { ContentEntryEditorWithConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { useContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { RevisionsListPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/abstractions.js";
import type { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/CmsEntryReview.js";
import { createEntrySession } from "./createEntrySession.js";
import type { EntrySession } from "./createEntrySession.js";
import { createFormVm } from "./createFormVm.js";

function createFakeFormPresenter(vm: ContentEntryFormPresenter.ViewModel): ContentEntryFormPresenter.Interface {
    return {
        vm,
        loadRevision: vi.fn(),
        saveRevision: vi.fn(),
        publishRevision: vi.fn(),
        unpublishRevision: vi.fn(),
        deleteEntry: vi.fn(),
        setFolderId: vi.fn(),
        newEntry: vi.fn(),
        reset: vi.fn()
    };
}

function createFakeRevisionsPresenter(): RevisionsListPresenter.Interface {
    return {
        vm: { loading: false, revisions: [], visible: false },
        init: vi.fn(),
        show: vi.fn(),
        hide: vi.fn(),
        createRevision: vi.fn(),
        deleteRevision: vi.fn(),
        dispose: vi.fn()
    };
}

/*
 * Renders what the editor renders: the header buttons through `Buttons` (so `useButtons()` works),
 * and every registered action's element for the options menu. The names list shows what is
 * registered, whatever it renders.
 */
const ActionsProbe = () => {
    const { buttonActions, menuItemActions } = useContentEntryEditorConfig();
    const buttonNames = buttonActions.map(action => action.name).join(",");
    const menuNames = menuItemActions.map(action => action.name).join(",");

    return (
        <>
            <div data-testid="button-action-names">{buttonNames}</div>
            <div data-testid="menu-action-names">{menuNames}</div>
            <div data-testid="button-actions">
                <Buttons actions={buttonActions} />
            </div>
            <div data-testid="menu-actions">
                {menuItemActions.map(action => (
                    <span key={action.name} data-action={action.name}>
                        {action.element}
                    </span>
                ))}
            </div>
        </>
    );
};

export interface RenderEditorTreeParams {
    children?: React.ReactNode;
    formVm?: Partial<ContentEntryFormPresenter.ViewModel>;
    reviewVm?: Partial<TargetReviewPresenter.ViewModel>;
}

export interface RenderedEditorTree extends EntrySession {
    container: Container;
    formPresenter: ContentEntryFormPresenter.Interface;
    revisions: RevisionsListPresenter.Interface;
}

export function renderEditorTree(params: RenderEditorTreeParams): RenderedEditorTree {
    const container = new Container();
    const entrySession = createEntrySession(params.reviewVm);
    const formVm = createFormVm(params.formVm);
    const formPresenter = createFakeFormPresenter(formVm);
    const revisions = createFakeRevisionsPresenter();

    container.registerInstance(CmsEntryReview, entrySession.session);
    container.registerInstance(ContentEntryFormPresenter, formPresenter);
    container.registerInstance(RevisionsListPresenter, revisions);

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={formVm.model}>
                        <ContentEntryEditorWithConfig>
                            {params.children}
                            <ActionsProbe />
                        </ContentEntryEditorWithConfig>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return { ...entrySession, container, formPresenter, revisions };
}
```

Create `packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts`:

```ts
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import type { Mock } from "vitest";
import { Container } from "@webiny/di";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/CmsEntryReview.js";
import { CmsEntryFormPresenterReviewDecorator } from "~/presentation/CmsEntryFormPresenterReviewDecorator.js";
import type { EntrySession } from "~/testing/createEntrySession.js";
import { createEntrySession } from "~/testing/createEntrySession.js";
import { createEntry } from "~/testing/createEntry.js";
import { createFormVm } from "~/testing/createFormVm.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { BOUND_UNPUBLISHED } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";
import { REJECTED } from "~/testing/reviewStates.js";

interface SaveRevisionOptions {
    skipValidation?: boolean;
}

interface BaseState {
    vm: ContentEntryFormPresenter.ViewModel;
    loadRevision: Mock<(id: string) => Promise<void>>;
    saveRevision: Mock<(options?: SaveRevisionOptions) => Promise<boolean>>;
    publishRevision: Mock<() => Promise<boolean>>;
    unpublishRevision: Mock<() => Promise<boolean>>;
    reset: Mock<() => void>;
}

let base: BaseState;

class FakeBasePresenter implements ContentEntryFormPresenter.Interface {
    get vm(): ContentEntryFormPresenter.ViewModel {
        return base.vm;
    }

    loadRevision(id: string): Promise<void> {
        return base.loadRevision(id);
    }

    saveRevision(options?: SaveRevisionOptions): Promise<boolean> {
        return base.saveRevision(options);
    }

    publishRevision(): Promise<boolean> {
        return base.publishRevision();
    }

    unpublishRevision(): Promise<boolean> {
        return base.unpublishRevision();
    }

    deleteEntry(): Promise<boolean> {
        return Promise.resolve(true);
    }

    setFolderId(): void {}

    newEntry(): void {}

    reset(): void {
        base.reset();
    }
}

const BasePresenter = ContentEntryFormPresenter.createImplementation({
    implementation: FakeBasePresenter,
    dependencies: []
});

let fake: EntrySession;
let presenter: ContentEntryFormPresenter.Interface;

function loadedVm(overrides: Partial<ContentEntryFormPresenter.ViewModel> = {}): ContentEntryFormPresenter.ViewModel {
    return createFormVm({ entry: createEntry(), canSave: true, canPublish: true, ...overrides });
}

function createBase(vm: ContentEntryFormPresenter.ViewModel): BaseState {
    return {
        vm,
        loadRevision: vi.fn<(id: string) => Promise<void>>(),
        saveRevision: vi.fn<(options?: SaveRevisionOptions) => Promise<boolean>>(),
        publishRevision: vi.fn<() => Promise<boolean>>(),
        unpublishRevision: vi.fn<() => Promise<boolean>>(),
        reset: vi.fn<() => void>()
    };
}

function resolvePresenter(): ContentEntryFormPresenter.Interface {
    fake = createEntrySession();
    const container = new Container();
    container.registerInstance(CmsEntryReview, fake.session);
    container.register(BasePresenter);
    container.registerDecorator(CmsEntryFormPresenterReviewDecorator);
    return container.resolve(ContentEntryFormPresenter);
}

describe("CmsEntryFormPresenterReviewDecorator", () => {
    beforeEach(() => {
        base = createBase(createFormVm({ entry: null, canSave: false, canPublish: false }));
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm();
        });
        base.saveRevision.mockResolvedValue(true);
        base.publishRevision.mockResolvedValue(true);
        base.unpublishRevision.mockResolvedValue(true);
        presenter = resolvePresenter();
    });

    it("initialises the shared presenter with the revision that was loaded", async () => {
        await presenter.loadRevision("entry-1#0001");

        expect(base.loadRevision).toHaveBeenCalledWith("entry-1#0001");
        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.init).toHaveBeenCalledWith({
            useCases: fake.useCases,
            target: { namespace: "cms.article", targetRevisionId: "entry-1#0001" },
            targetTitle: "Article: Hello",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
    });

    it("passes the original canSave as canRequest and the published flag", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ canSave: false, entry: createEntry({ status: "published" }) });
        });

        await presenter.loadRevision("entry-1#0001");

        const params = fake.presenter.init.mock.calls[0][0];
        expect(params.canRequest).toBe(false);
        expect(params.isPublished).toBe(true);
        expect(params.isUnpublished).toBe(false);
    });

    it("passes isUnpublished for a revision that was published before and is unpublished now (R226, Q19)", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "unpublished" }) });
        });

        await presenter.loadRevision("entry-1#0001");

        const params = fake.presenter.init.mock.calls[0][0];
        expect(params.isPublished).toBe(false);
        expect(params.isUnpublished).toBe(true);
    });

    it("leaves a singleton model alone", async () => {
        base.vm = createFormVm({ entry: null, canSave: false, model: SINGLETON_MODEL });
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ model: SINGLETON_MODEL });
        });
        fake.setVm(LOADING);

        await presenter.loadRevision("settings#0001");

        expect(fake.presenter.init).not.toHaveBeenCalled();
        expect(presenter.vm.canSave).toBe(true);
        expect(presenter.vm.canPublish).toBe(true);
    });

    it("blocks saving, new revisions and publishing while the revision is loading", async () => {
        let finishLoading = (): void => {};
        base.vm = loadedVm({ canCreateNewRevision: true });
        base.loadRevision.mockImplementation(() => {
            return new Promise<void>(resolve => {
                finishLoading = resolve;
            });
        });

        const loading = presenter.loadRevision("entry-1#0001");

        expect(presenter.vm.canSave).toBe(false);
        expect(presenter.vm.canCreateNewRevision).toBe(false);
        expect(presenter.vm.canPublish).toBe(false);

        finishLoading();
        await loading;
    });

    it.each([
        ["no workflow", NO_WORKFLOW, true, true],
        ["a bound workflow and no review", BOUND_NO_REVIEW, true, false],
        ["an unpublished revision with no review (Q19)", BOUND_UNPUBLISHED, true, true],
        ["loading", LOADING, false, false],
        ["failed", FAILED, false, false],
        ["in review", IN_REVIEW, false, false],
        ["rejected", REJECTED, false, false],
        ["approved", APPROVED, false, true]
    ])("applies the rule for %s", async (_name, review, canSave, canPublish) => {
        base.vm = loadedVm({ canCreateNewRevision: true });
        base.loadRevision.mockResolvedValue(undefined);
        await presenter.loadRevision("entry-1#0001");

        fake.setVm(review);

        expect(presenter.vm.canSave).toBe(canSave);
        expect(presenter.vm.canCreateNewRevision).toBe(canSave);
        expect(presenter.vm.canPublish).toBe(canPublish);
    });

    it("never grants what the original presenter denies", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ canSave: false, canPublish: false });
        });

        await presenter.loadRevision("entry-1#0001");
        fake.setVm(NO_WORKFLOW);

        expect(presenter.vm.canSave).toBe(false);
        expect(presenter.vm.canPublish).toBe(false);
    });

    it("disposes the shared presenter on reset and stops gating", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(LOADING);

        presenter.reset();

        expect(base.reset).toHaveBeenCalledTimes(1);
        expect(fake.presenter.dispose).toHaveBeenCalledTimes(1);
        expect(presenter.vm.canSave).toBe(true);
    });

    it("ignores a load that finished after the editor was reset", async () => {
        let finishLoading = (): void => {};
        base.loadRevision.mockImplementation(() => {
            return new Promise<void>(resolve => {
                finishLoading = resolve;
            });
        });

        const loading = presenter.loadRevision("entry-1#0001");
        presenter.reset();
        base.vm = loadedVm();
        finishLoading();
        await loading;

        expect(fake.presenter.init).not.toHaveBeenCalled();
    });

    it("passes a new entry through untouched", () => {
        base.vm = createFormVm({ entry: null, isNewEntry: true, canSave: true, canPublish: false });
        fake.setVm(LOADING);

        presenter.newEntry();

        expect(presenter.vm.canSave).toBe(true);
    });

    it("does not save while the review forbids editing", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(IN_REVIEW);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(false);
        expect(base.saveRevision).not.toHaveBeenCalled();
    });

    it("lets Save & Publish go on for a clean, unlocked approved draft", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(true);
        expect(base.saveRevision).not.toHaveBeenCalled();
    });

    it("does not report a save for a dirty approved draft", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ isDirty: true });
        });
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(false);
        expect(base.saveRevision).not.toHaveBeenCalled();
    });

    it("does not save, and does not offer a new revision, for an approved locked entry", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({
                entry: createEntry({ status: "published", locked: true }),
                canCreateNewRevision: true
            });
        });
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);

        const saved = await presenter.saveRevision();

        expect(saved).toBe(false);
        expect(base.saveRevision).not.toHaveBeenCalled();
        expect(presenter.vm.canCreateNewRevision).toBe(false);
    });

    it("saves normally when editing is allowed and updates the context", async () => {
        await presenter.loadRevision("entry-1#0001");

        const saved = await presenter.saveRevision({ skipValidation: false });

        expect(saved).toBe(true);
        expect(base.saveRevision).toHaveBeenCalledWith({ skipValidation: false });
        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.setContext).toHaveBeenCalledWith({
            targetTitle: "Article: Hello",
            canRequest: true,
            isPublished: false,
            isUnpublished: false
        });
    });

    it("re-initialises for the new revision a save created", async () => {
        await presenter.loadRevision("entry-1#0001");
        base.saveRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: { ...createEntry(), id: "entry-1#0002" } });
            return true;
        });

        await presenter.saveRevision();

        expect(fake.presenter.init).toHaveBeenCalledTimes(2);
        const params = fake.presenter.init.mock.calls[1][0];
        expect(params.target).toEqual({ namespace: "cms.article", targetRevisionId: "entry-1#0002" });
        expect(fake.presenter.setContext).not.toHaveBeenCalled();
    });

    it("does not publish while the review forbids it", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(IN_REVIEW);

        const published = await presenter.publishRevision();

        expect(published).toBe(false);
        expect(base.publishRevision).not.toHaveBeenCalled();
    });

    it("sets the published flag without reloading after a publish", async () => {
        await presenter.loadRevision("entry-1#0001");
        fake.setVm(APPROVED);
        base.publishRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "published" }) });
            return true;
        });

        const published = await presenter.publishRevision();

        expect(published).toBe(true);
        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        expect(fake.presenter.setContext).toHaveBeenCalledWith({
            targetTitle: "Article: Hello",
            canRequest: true,
            isPublished: true,
            isUnpublished: false
        });
    });

    it("clears the published flag without reloading after an unpublish", async () => {
        base.loadRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "published" }) });
        });
        await presenter.loadRevision("entry-1#0001");
        base.unpublishRevision.mockImplementation(async () => {
            base.vm = loadedVm({ entry: createEntry({ status: "unpublished" }) });
            return true;
        });

        await presenter.unpublishRevision();

        expect(fake.presenter.init).toHaveBeenCalledTimes(1);
        const context = fake.presenter.setContext.mock.calls[0][0];
        expect(context.isPublished).toBe(false);
        expect(context.isUnpublished).toBe(true);
    });
});
```

Create `packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { Container } from "@webiny/di";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsEntryReviewFeature } from "~/features/editorReview/feature.js";

function createContainer() {
    const container = new Container();
    const presenter = createFakePresenter();
    const useCases = createFakeUseCases();
    container.registerInstance(TargetReviewPresenter, presenter);
    container.registerInstance(CmsReviewUseCases, useCases);
    CmsEntryReviewFeature.register(container);

    return { container, presenter, useCases };
}

describe("CmsEntryReviewFeature", () => {
    it("builds the session from the shared presenter and the CMS use cases", () => {
        const { container, presenter, useCases } = createContainer();

        const { session } = CmsEntryReviewFeature.resolve(container);

        expect(session.presenter).toBe(presenter);
        expect(session.useCases).toBe(useCases);
    });

    it("registers a subclass of the shared session, not the shared class itself", () => {
        const { container } = createContainer();

        const { session } = CmsEntryReviewFeature.resolve(container);

        expect(session.constructor.name).toBe("CmsEntryReviewSessionImpl");
    });

    it("keeps one session per container (one editor is open at a time)", () => {
        const { container } = createContainer();

        const first = CmsEntryReviewFeature.resolve(container).session;
        const second = CmsEntryReviewFeature.resolve(container).session;

        expect(first).toBe(second);
    });

    it("gives two containers two independent sessions", () => {
        const one = createContainer();
        const two = createContainer();

        const first = CmsEntryReviewFeature.resolve(one.container).session;
        const second = CmsEntryReviewFeature.resolve(two.container).session;

        expect(first.presenter).toBe(one.presenter);
        expect(second.presenter).toBe(two.presenter);
    });
});
```

Create `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import type { Route } from "@webiny/app-admin";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { CmsEntryReviewBar } from "./CmsEntryReviewBar.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";

interface FakeBarProps {
    reviewsRoute: Route<any>;
}

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");

    return {
        EditorReviewBar: (props: FakeBarProps) => {
            return React.createElement("div", {
                "data-testid": "editor-review-bar",
                "data-reviews-path": props.reviewsRoute.path
            });
        }
    };
});

function renderContent(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({
        ...params,
        children: (
            <>
                <CmsEntryReviewBar />
                <ContentEntryFormContent>
                    <div data-testid="original" />
                </ContentEntryFormContent>
            </>
        )
    });
}

describe("CmsEntryReviewBar", () => {
    it("renders one bar above the original content of a loaded entry", async () => {
        renderContent({ reviewVm: BOUND_NO_REVIEW });

        const bars = await screen.findAllByTestId("editor-review-bar");
        const original = screen.getByTestId("original");

        expect(bars).toHaveLength(1);
        expect(bars[0].getAttribute("data-reviews-path")).toBe("/cms/content-reviews");
        const position = bars[0].compareDocumentPosition(original);
        expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it.each([
        ["loading", LOADING],
        ["in review", IN_REVIEW]
    ])("shows the bar while the status is %s", async (_name, reviewVm) => {
        renderContent({ reviewVm });

        expect(await screen.findAllByTestId("editor-review-bar")).toHaveLength(1);
    });

    it("shows nothing when no workflow is bound", async () => {
        renderContent({ reviewVm: NO_WORKFLOW });

        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());
        expect(screen.getByTestId("original")).toBeTruthy();
    });

    it("shows nothing for a new entry", async () => {
        renderContent({ formVm: { entry: null, isNewEntry: true }, reviewVm: BOUND_NO_REVIEW });

        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());
        expect(screen.getByTestId("original")).toBeTruthy();
    });

    it("shows nothing for a singleton model", async () => {
        renderContent({ formVm: { model: SINGLETON_MODEL }, reviewVm: BOUND_NO_REVIEW });

        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());
        expect(screen.getByTestId("original")).toBeTruthy();
    });

    it("appears when the status becomes known", async () => {
        const view = renderContent({ reviewVm: NO_WORKFLOW });
        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());

        act(() => {
            view.setVm(BOUND_NO_REVIEW);
        });

        expect(await screen.findAllByTestId("editor-review-bar")).toHaveLength(1);
    });
});
```

Create `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewFormLock.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { act } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { ContentEntryForm } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { CmsEntryReviewFormLock } from "./CmsEntryReviewFormLock.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";

function renderForm(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({
        ...params,
        children: (
            <>
                <CmsEntryReviewFormLock />
                <ContentEntryForm />
            </>
        )
    });
}

async function findWrapper(): Promise<HTMLFieldSetElement> {
    await waitFor(() => expect(document.querySelector("fieldset")).not.toBeNull());
    return document.querySelector("fieldset") as HTMLFieldSetElement;
}

describe("CmsEntryReviewFormLock", () => {
    it.each([
        ["loading", LOADING],
        ["failed", FAILED],
        ["in review", IN_REVIEW]
    ])("makes the form read-only while the status is %s", async (_name, reviewVm) => {
        renderForm({ reviewVm });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(true);
        expect(wrapper.inert).toBe(true);
    });

    it.each([
        ["no workflow", NO_WORKFLOW],
        ["a bound workflow and no review", BOUND_NO_REVIEW]
    ])("leaves the form editable for %s", async (_name, reviewVm) => {
        renderForm({ reviewVm });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(false);
        expect(wrapper.inert).toBe(false);
    });

    it("keeps the same wrapper element when the lock toggles, so the form does not remount", async () => {
        const view = renderForm({ reviewVm: LOADING });
        const before = await findWrapper();

        act(() => {
            view.setVm(BOUND_NO_REVIEW);
        });

        const after = await findWrapper();
        expect(after).toBe(before);
        expect(after.disabled).toBe(false);
        expect(after.inert).toBe(false);
    });

    it("leaves a new entry editable while nothing is known", async () => {
        renderForm({ formVm: { entry: null, isNewEntry: true }, reviewVm: LOADING });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(false);
    });

    it("leaves a singleton model editable", async () => {
        renderForm({ formVm: { model: SINGLETON_MODEL }, reviewVm: LOADING });

        const wrapper = await findWrapper();

        expect(wrapper.disabled).toBe(false);
    });
});
```

Create `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewScheduleMenuItem.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { CmsEntryReviewScheduleMenuItem } from "./CmsEntryReviewScheduleMenuItem.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { BOUND_UNPUBLISHED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";

const { Actions } = ContentEntryEditorConfig;

function renderMenu(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({
        ...params,
        children: (
            <>
                <CmsEntryReviewScheduleMenuItem />
                <ContentEntryEditorConfig>
                    <Actions.MenuItemAction
                        name="schedule"
                        element={<span data-testid="schedule-item" />}
                    />
                    <Actions.MenuItemAction
                        name="delete"
                        element={<span data-testid="delete-item" />}
                    />
                </ContentEntryEditorConfig>
            </>
        )
    });
}

describe("CmsEntryReviewScheduleMenuItem", () => {
    it.each([
        ["no workflow", NO_WORKFLOW],
        ["an approved review", APPROVED],
        ["an unpublished revision with no review (Q19)", BOUND_UNPUBLISHED]
    ])("keeps schedule for %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        expect(await screen.findByTestId("schedule-item")).toBeTruthy();
        expect(screen.getByTestId("delete-item")).toBeTruthy();
    });

    it.each([
        ["a bound workflow and no review", BOUND_NO_REVIEW],
        ["a review in progress", IN_REVIEW],
        ["an unknown status", LOADING]
    ])("hides schedule, and only schedule, for %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        expect(await screen.findByTestId("delete-item")).toBeTruthy();
        await waitFor(() => expect(screen.queryByTestId("schedule-item")).toBeNull());
    });

    it("keeps schedule for a new entry", async () => {
        renderMenu({ formVm: { entry: null, isNewEntry: true }, reviewVm: LOADING });

        expect(await screen.findByTestId("schedule-item")).toBeTruthy();
    });
});
```

Create `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBlockedActions.test.tsx`:

```tsx
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { CmsEntryReviewBlockedActions } from "./CmsEntryReviewBlockedActions.js";
import { MODEL } from "~/testing/models.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { createEntry } from "~/testing/createEntry.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { BOUND_UNPUBLISHED } from "~/testing/reviewStates.js";
import { CHECKING } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { FAILED_REASON } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { IN_REVIEW_REASON } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NEEDS_REVIEW } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";
import { REJECTED } from "~/testing/reviewStates.js";
import { REJECTED_REASON } from "~/testing/reviewStates.js";

const permission = vi.hoisted(() => {
    return { canPublish: true };
});

vi.mock("@webiny/app-headless-cms/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => {
            return { canPublish: () => permission.canPublish, canEdit: () => true };
        }
    };
});

const BLOCKED = { canSave: false, canPublish: false };

function renderBlocked(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({ ...params, children: <CmsEntryReviewBlockedActions /> });
}

function getDescription(button: HTMLElement): string | undefined {
    const describedBy = button.closest("[aria-describedby]")?.getAttribute("aria-describedby");
    return document.getElementById(describedBy ?? "")?.textContent ?? undefined;
}

describe("CmsEntryReviewBlockedActions", () => {
    beforeEach(() => {
        permission.canPublish = true;
    });

    it("is registered as the workflowBlockedActions action and not as a standalone tooltip", async () => {
        renderBlocked({ reviewVm: NO_WORKFLOW });

        const names = await screen.findByTestId("button-action-names");

        expect(names.textContent).toContain("workflowBlockedActions");
        expect(names.textContent).not.toContain("workflowStateTooltip");
    });

    it("shows focusable, aria-disabled Save and Publish with the reason while loading", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: LOADING });

        const publish = await screen.findByRole("button", { name: "Publish" });
        const save = screen.getByRole("button", { name: "Save" });

        expect(save.getAttribute("aria-disabled")).toBe("true");
        expect(publish.getAttribute("aria-disabled")).toBe("true");
        expect(publish.hasAttribute("disabled")).toBe(false);
        expect(getDescription(publish)).toBe(CHECKING);
        expect(getDescription(save)).toBe(CHECKING);
    });

    it("shows the failed reason", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: FAILED });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(FAILED_REASON);
        expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
    });

    it("shows only Publish while a review is in progress", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: IN_REVIEW });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(IN_REVIEW_REASON);
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows only Publish for a rejected review", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: REJECTED });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(REJECTED_REASON);
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows Publish disabled, and no Save, when a workflow is bound but no review exists", async () => {
        renderBlocked({ formVm: { canSave: true, canPublish: false }, reviewVm: BOUND_NO_REVIEW });

        const publish = await screen.findByRole("button", { name: "Publish" });

        expect(getDescription(publish)).toBe(NEEDS_REVIEW);
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("never shows more than two buttons while the status is unknown", async () => {
        renderBlocked({ formVm: BLOCKED, reviewVm: LOADING });

        await screen.findByRole("button", { name: "Publish" });

        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it.each([
        ["publishing is allowed (the base Publish button is shown)", { canSave: false, canPublish: true }, APPROVED, MODEL],
        ["an unpublished revision may be published again (Q19)", { canSave: true, canPublish: true }, BOUND_UNPUBLISHED, MODEL],
        ["no workflow is bound", BLOCKED, NO_WORKFLOW, MODEL],
        ["the model is a singleton", BLOCKED, LOADING, SINGLETON_MODEL]
    ])("shows nothing when %s", async (_name, formVm, reviewVm, model) => {
        renderBlocked({ formVm: { ...formVm, model }, reviewVm });

        await screen.findByTestId("button-actions");
        await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
    });

    it("shows nothing for a published entry", async () => {
        renderBlocked({
            formVm: { ...BLOCKED, entry: createEntry({ status: "published" }) },
            reviewVm: LOADING
        });

        await screen.findByTestId("button-actions");
        await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
    });

    it("shows nothing for a new entry", async () => {
        renderBlocked({
            formVm: { ...BLOCKED, entry: null, isNewEntry: true },
            reviewVm: LOADING
        });

        await screen.findByTestId("button-actions");
        await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
    });

    it("shows nothing without the publish permission", async () => {
        permission.canPublish = false;
        renderBlocked({ formVm: BLOCKED, reviewVm: LOADING });

        await screen.findByTestId("button-actions");
        await waitFor(() => expect(screen.queryByRole("button", { name: "Publish" })).toBeNull());
    });
});
```

Create `packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewNewRevision.test.tsx`:

```tsx
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { CmsEntryReviewNewRevision } from "./CmsEntryReviewNewRevision.js";
import { NO_PUBLISHING_MODEL } from "~/testing/models.js";
import { SINGLETON_MODEL } from "~/testing/models.js";
import { createEntry } from "~/testing/createEntry.js";
import { renderEditorTree } from "~/testing/renderEditorTree.js";
import { APPROVED } from "~/testing/reviewStates.js";
import { BOUND_NO_REVIEW } from "~/testing/reviewStates.js";
import { FAILED } from "~/testing/reviewStates.js";
import { IN_REVIEW } from "~/testing/reviewStates.js";
import { LOADING } from "~/testing/reviewStates.js";
import { NO_WORKFLOW } from "~/testing/reviewStates.js";
import { REJECTED } from "~/testing/reviewStates.js";

interface FakeMenuItemProps {
    label: string;
    disabled?: boolean;
    onAction: () => void;
}

const mocks = vi.hoisted(() => {
    return { canEdit: true, setRouteParams: vi.fn() };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    const React = await import("react");

    return {
        ...actual,
        OptionsMenuItem: (props: FakeMenuItemProps) => {
            return React.createElement(
                "button",
                {
                    "data-testid": "menu-item",
                    disabled: props.disabled ?? false,
                    onClick: props.onAction
                },
                props.label
            );
        }
    };
});

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();

    return {
        ...actual,
        useRoute: () => {
            return { setRouteParams: mocks.setRouteParams };
        }
    };
});

vi.mock("@webiny/app-headless-cms/admin/hooks/usePermission.js", () => {
    return {
        usePermission: () => {
            return { canEdit: () => mocks.canEdit, canPublish: () => true };
        }
    };
});

function renderMenu(params: Parameters<typeof renderEditorTree>[0]) {
    return renderEditorTree({ ...params, children: <CmsEntryReviewNewRevision /> });
}

describe("CmsEntryReviewNewRevision", () => {
    beforeEach(() => {
        mocks.canEdit = true;
        mocks.setRouteParams.mockReset();
    });

    it("is registered as the createNewRevision menu item", async () => {
        renderMenu({ reviewVm: NO_WORKFLOW });

        const item = await screen.findByTestId("menu-item");

        expect(item.textContent).toBe("Create New Revision");
        expect(item.closest("[data-action]")?.getAttribute("data-action")).toBe(
            "createNewRevision"
        );
    });

    it.each([
        ["no workflow", NO_WORKFLOW],
        ["no active review", BOUND_NO_REVIEW],
        ["a review in progress", IN_REVIEW],
        ["a rejected review", REJECTED],
        ["an approved review", APPROVED]
    ])("is enabled for %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        const item = await screen.findByTestId("menu-item");

        expect(item.hasAttribute("disabled")).toBe(false);
    });

    it.each([
        ["loading", LOADING],
        ["failed", FAILED]
    ])("is disabled while the status is %s", async (_name, reviewVm) => {
        renderMenu({ reviewVm });

        const item = await screen.findByTestId("menu-item");

        expect(item.hasAttribute("disabled")).toBe(true);
    });

    it("stays enabled for a singleton model whatever the shared presenter holds", async () => {
        renderMenu({ formVm: { model: SINGLETON_MODEL }, reviewVm: LOADING });

        const item = await screen.findByTestId("menu-item");

        expect(item.hasAttribute("disabled")).toBe(false);
    });

    it("renders nothing without an entry", async () => {
        renderMenu({ formVm: { entry: null, isNewEntry: true }, reviewVm: NO_WORKFLOW });

        await screen.findByTestId("menu-actions");
        await waitFor(() => expect(screen.queryByTestId("menu-item")).toBeNull());
    });

    it("renders nothing without edit permission", async () => {
        mocks.canEdit = false;
        renderMenu({ reviewVm: NO_WORKFLOW });

        await screen.findByTestId("menu-actions");
        await waitFor(() => expect(screen.queryByTestId("menu-item")).toBeNull());
    });

    it("renders nothing for a model that cannot publish", async () => {
        renderMenu({ formVm: { model: NO_PUBLISHING_MODEL }, reviewVm: NO_WORKFLOW });

        await screen.findByTestId("menu-actions");
        await waitFor(() => expect(screen.queryByTestId("menu-item")).toBeNull());
    });

    it("creates the revision and moves the route to it", async () => {
        const view = renderMenu({ reviewVm: REJECTED });
        const created = createEntry();
        created.id = "entry-1#0002";
        vi.mocked(view.revisions.createRevision).mockResolvedValue(created);

        fireEvent.click(await screen.findByTestId("menu-item"));

        await waitFor(() => expect(mocks.setRouteParams).toHaveBeenCalledTimes(1));
        expect(view.revisions.createRevision).toHaveBeenCalledWith("entry-1#0001");
        const update = mocks.setRouteParams.mock.calls[0][0];
        expect(update({ modelId: "article", id: "entry-1#0001" })).toEqual({
            modelId: "article",
            id: "entry-1#0002"
        });
    });
});
```

Create `packages/app-headless-cms-workflows/src/index.editor.test.tsx` (the Task 20 composition cases; Task 11's `index.test.tsx` keeps pinning the gateway registration; both follow Task 11's flag setup through a `FeatureFlagsService` instance):

```tsx
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { render } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { Container } from "@webiny/di";
import { CompositionProvider } from "@webiny/react-composition";
import { DiContainerProvider } from "@webiny/app/shared/di/DiContainerProvider.js";
import { FeatureFlagsService } from "@webiny/app-admin/features/featureFlags/abstractions.js";
import { FeatureFlags } from "@webiny/feature-flags";
import { AdminUiProvider } from "@webiny/admin-ui";
import { ModelContext } from "@webiny/app-headless-cms/admin/components/ModelProvider/index.js";
import { ContentEntryEditorWithConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { useContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { createFakePresenter } from "@webiny/app-workflows/review/testing/targetReviewFakes.js";
import { createFakeUseCases } from "@webiny/app-workflows/review/testing/fakeReviewUseCases.js";
import { CmsEntryReview } from "~/features/editorReview/CmsEntryReview.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsWorkflows } from "./index.js";
import { createEntry } from "~/testing/createEntry.js";
import { createFormVm } from "~/testing/createFormVm.js";
import { MODEL } from "~/testing/models.js";

vi.mock("@webiny/app-workflows/review/editor/components/EditorReviewBar.js", async () => {
    const React = await import("react");

    return {
        EditorReviewBar: () => React.createElement("div", { "data-testid": "editor-review-bar" })
    };
});

/*
 * The editor route, the Content Reviews footer menu, the "open in new window" option and the old
 * editor presenter need routing and menu providers and are not what this test asserts (Task 11's
 * composition test stubs the same modules).
 */
vi.mock("~/Routes/index.js", () => {
    return { CmsWorkflowsEditor: () => null };
});

vi.mock("~/Components/CmsEntriesWorkflowStateList/index.js", () => {
    return { CmsEntriesWorkflowStateListFooterMenu: () => null };
});

vi.mock("~/Components/OptionItem/OpenInNewWindow.js", () => {
    return { ListOpenInNewWindow: () => null };
});

vi.mock("~/presentation/cmsWorkflowsEditor/feature.js", () => {
    return {
        CmsWorkflowsEditorPresenterFeature: {
            name: "Mock",
            register: () => undefined,
            resolve: () => undefined
        }
    };
});

class FakeBasePresenter implements ContentEntryFormPresenter.Interface {
    get vm(): ContentEntryFormPresenter.ViewModel {
        return createFormVm({ entry: createEntry(), model: MODEL });
    }

    async loadRevision(): Promise<void> {}

    async saveRevision(): Promise<boolean> {
        return true;
    }

    async publishRevision(): Promise<boolean> {
        return true;
    }

    async unpublishRevision(): Promise<boolean> {
        return true;
    }

    async deleteEntry(): Promise<boolean> {
        return true;
    }

    setFolderId(): void {}

    newEntry(): void {}

    reset(): void {}
}

const BasePresenter = ContentEntryFormPresenter.createImplementation({
    implementation: FakeBasePresenter,
    dependencies: []
});

const ActionsProbe = () => {
    const { buttonActions, menuItemActions } = useContentEntryEditorConfig();
    const names = [...buttonActions, ...menuItemActions].map(action => action.name);

    return <div data-testid="action-names">{names.join(",")}</div>;
};

function mountRoot(isEnabled: boolean) {
    const flagsService: FeatureFlagsService.Interface = {
        getFlags: () => new FeatureFlags({ advancedPublishingWorkflow: isEnabled }),
        isLoaded: () => true,
        loadFlags: async () => undefined
    };
    const container = new Container();
    const presenter = createFakePresenter();
    container.registerInstance(FeatureFlagsService, flagsService);
    container.registerInstance(TargetReviewPresenter, presenter);
    container.registerInstance(CmsReviewUseCases, createFakeUseCases());
    container.register(BasePresenter).inSingletonScope();

    render(
        <AdminUiProvider>
            <CompositionProvider>
                <DiContainerProvider container={container}>
                    <ModelContext.Provider value={MODEL}>
                        <ContentEntryEditorWithConfig>
                            <CmsWorkflows />
                            <ActionsProbe />
                            <ContentEntryFormContent>
                                <div data-testid="original" />
                            </ContentEntryFormContent>
                        </ContentEntryEditorWithConfig>
                    </ModelContext.Provider>
                </DiContainerProvider>
            </CompositionProvider>
        </AdminUiProvider>
    );

    return { container, presenter };
}

describe("CmsWorkflows editor wiring", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("registers the session, the bar, the actions and the presenter decorator with the flag on", async () => {
        const { container, presenter } = mountRoot(true);

        const session = container.resolve(CmsEntryReview);
        expect(session.presenter).toBe(presenter);
        expect(await screen.findAllByTestId("editor-review-bar")).toHaveLength(1);

        const names = (await screen.findByTestId("action-names")).textContent ?? "";
        expect(names).toContain("workflowBlockedActions");
        expect(names).toContain("createNewRevision");
        expect(names).not.toContain("workflowStateTooltip");

        const form = container.resolve(ContentEntryFormPresenter);
        await form.loadRevision("entry-1#0001");
        expect(presenter.init).toHaveBeenCalledTimes(1);
    });

    it("registers nothing with the flag off", async () => {
        const { container, presenter } = mountRoot(false);

        expect(() => container.resolve(CmsEntryReview)).toThrow("No registration found");
        expect(screen.getByTestId("original")).toBeTruthy();
        await waitFor(() => expect(screen.queryByTestId("editor-review-bar")).toBeNull());

        const names = (await screen.findByTestId("action-names")).textContent ?? "";
        expect(names).not.toContain("workflowBlockedActions");
        expect(names).not.toContain("createNewRevision");

        const form = container.resolve(ContentEntryFormPresenter);
        await form.loadRevision("entry-1#0001");
        expect(presenter.init).not.toHaveBeenCalled();
    });
});
```

- [ ] **Step 2: Run the new tests, expect failure**

Admin packages run `yarn test <path>` only (no storage or OpenSearch is involved in `app-*` packages). One file per command:

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewFormLock.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewScheduleMenuItem.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBlockedActions.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewNewRevision.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -50
```

Expected: every file FAILS to load with `Failed to resolve import "~/features/editorReview/CmsEntryReview.js"` (or `"./CmsEntryReviewBar.js"`, `"~/presentation/CmsEntryFormPresenterReviewDecorator.js"`, `"~/features/editorReview/feature.js"`), because none of the source files exist yet. If a failure names an `@webiny/app-workflows/review/...` path instead, Tasks 8-19 are not applied: stop, this task depends on them (8a.4 and 8a.5).

- [ ] **Step 3: Implement**

`packages/app-headless-cms-workflows/src/features/editorReview/CmsEntryReview.ts`:

```ts
import { createAbstraction } from "@webiny/feature/admin";
import type { IEditorReviewSession } from "@webiny/app-workflows/review/editor/abstractions.js";

export const CmsEntryReview = createAbstraction<IEditorReviewSession>("Cms/Workflows/EntryReview");

export namespace CmsEntryReview {
    export type Interface = IEditorReviewSession;
}
```

`packages/app-headless-cms-workflows/src/features/editorReview/CmsEntryReviewImpl.ts`:

```ts
import { EditorReviewSession } from "@webiny/app-workflows/review/editor/EditorReviewSession.js";
import { TargetReviewPresenter } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import { CmsReviewUseCases } from "~/features/gateway/CmsReviewUseCases.js";
import { CmsEntryReview as Abstraction } from "./CmsEntryReview.js";

/*
 * The shared session class is never registered itself: `createImplementation` stores the
 * abstraction and dependencies on the class, so each app subclasses it once (R237).
 */
class CmsEntryReviewSessionImpl extends EditorReviewSession implements Abstraction.Interface {}

export const CmsEntryReview = Abstraction.createImplementation({
    implementation: CmsEntryReviewSessionImpl,
    dependencies: [TargetReviewPresenter, CmsReviewUseCases]
});
```

`packages/app-headless-cms-workflows/src/features/editorReview/feature.ts`:

```ts
import { createFeature } from "@webiny/feature/admin";
import { CmsEntryReview as Abstraction } from "./CmsEntryReview.js";
import { CmsEntryReview } from "./CmsEntryReviewImpl.js";

export const CmsEntryReviewFeature = createFeature({
    name: "CmsWorkflows/EntryReview",
    register(container) {
        container.register(CmsEntryReview).inSingletonScope();
    },
    resolve(container) {
        return {
            session: container.resolve(Abstraction)
        };
    }
});
```

`packages/app-headless-cms-workflows/src/features/editorReview/useCmsEntryReview.ts`:

```ts
import { useFeature } from "@webiny/app";
import type { CmsEntryReview } from "./CmsEntryReview.js";
import { CmsEntryReviewFeature } from "./feature.js";

export function useCmsEntryReview(): CmsEntryReview.Interface {
    return useFeature(CmsEntryReviewFeature).session;
}
```

`packages/app-headless-cms-workflows/src/utils/isReviewableModel.ts`:

```ts
import { CMS_MODEL_SINGLETON_TAG } from "@webiny/app-headless-cms-common";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";

/*
 * Singleton models have one entry that is edited in place and are never bound to a workflow (the
 * old editor skipped them the same way).
 */
export function isReviewableModel(model: Pick<CmsModel, "tags">): boolean {
    return !model.tags.includes(CMS_MODEL_SINGLETON_TAG);
}
```

`packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewContext.ts`:

```ts
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { TargetReviewContext } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";

export function getCmsEntryReviewContext(
    model: CmsModel,
    entry: CmsContentEntry,
    canRequest: boolean
): TargetReviewContext {
    const entryTitle = entry.meta?.title || "unknown";

    return {
        targetTitle: `${model.name}: ${entryTitle}`,
        canRequest,
        isPublished: entry.meta?.status === "published",
        // A revision published before and not published now (R226): it was reviewed before it was published.
        isUnpublished: entry.meta?.status === "unpublished"
    };
}
```

`packages/app-headless-cms-workflows/src/presentation/getCmsEntryReviewInitParams.ts`:

```ts
import type { CmsContentEntry } from "@webiny/app-headless-cms-common/types/index.js";
import type { CmsModel } from "@webiny/app-headless-cms-common/types/index.js";
import type { TargetReviewInitParams } from "@webiny/app-workflows/review/presentation/targetReview/abstractions.js";
import type { IReviewUseCases } from "@webiny/app-workflows/review/useCases/IReviewUseCases.js";
import { createAppName } from "~/utils/appName.js";
import { getCmsEntryReviewContext } from "./getCmsEntryReviewContext.js";

export interface CmsEntryReviewInitInput {
    model: CmsModel;
    entry: CmsContentEntry;
    useCases: IReviewUseCases;
    canRequest: boolean;
}

export function getCmsEntryReviewInitParams(input: CmsEntryReviewInitInput): TargetReviewInitParams {
    const { model, entry, useCases, canRequest } = input;
    const context = getCmsEntryReviewContext(model, entry, canRequest);

    return {
        ...context,
        useCases,
        target: { namespace: createAppName(model), targetRevisionId: entry.id }
    };
}
```

`packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.ts`:

```ts
import { computed } from "mobx";
import { makeAutoObservable } from "mobx";
import { ContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/abstractions.js";
import { CmsEntryReview } from "~/features/editorReview/CmsEntryReview.js";
import { getCmsEntryReviewContext } from "~/presentation/getCmsEntryReviewContext.js";
import { getCmsEntryReviewInitParams } from "~/presentation/getCmsEntryReviewInitParams.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

/*
 * idle: the form is not tied to a review (new entry, singleton model, nothing loaded).
 * loading: a revision is being loaded, the review status is not asked yet.
 * tracking: the shared presenter was initialised for the loaded revision.
 */
type ReviewPhase = "idle" | "loading" | "tracking";

interface SaveRevisionOptions {
    skipValidation?: boolean;
}

class CmsEntryFormPresenterWithReview implements ContentEntryFormPresenter.Interface {
    private phase: ReviewPhase = "idle";
    private revisionId: string | null = null;

    constructor(
        private readonly session: CmsEntryReview.Interface,
        private readonly original: ContentEntryFormPresenter.Interface
    ) {
        makeAutoObservable<CmsEntryFormPresenterWithReview, "session" | "original">(this, {
            session: false,
            original: false,
            vm: computed
        });
    }

    get vm(): ContentEntryFormPresenter.ViewModel {
        const base = this.original.vm;

        if (this.phase === "idle") {
            return base;
        }

        if (this.phase === "loading") {
            return { ...base, canSave: false, canCreateNewRevision: false, canPublish: false };
        }

        const review = this.session.presenter.vm;

        return {
            ...base,
            canSave: base.canSave && review.allowsEditing,
            // The base "New Revision" button reads only this flag and saves through `saveRevision`.
            canCreateNewRevision: base.canCreateNewRevision && review.allowsEditing,
            canPublish: base.canPublish && review.allowsPublishing
        };
    }

    async loadRevision(id: string): Promise<void> {
        const model = this.original.vm.model;

        if (!isReviewableModel(model)) {
            this.setPhase("idle", null);
            await this.original.loadRevision(id);
            return;
        }

        this.setPhase("loading", id);

        try {
            await this.original.loadRevision(id);
        } catch (error) {
            this.setPhase("idle", null);
            throw error;
        }

        // The editor was reset or moved to another revision while this one was loading.
        if (this.phase !== "loading" || this.revisionId !== id) {
            return;
        }

        const entry = this.original.vm.entry;

        if (!entry) {
            this.setPhase("idle", null);
            return;
        }

        this.setPhase("tracking", entry.id);

        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest: this.original.vm.canSave
        });

        await this.session.presenter.init(params);
    }

    async saveRevision(options?: SaveRevisionOptions): Promise<boolean> {
        if (this.phase === "idle") {
            return this.original.saveRevision(options);
        }

        if (this.phase === "loading") {
            return false;
        }

        const review = this.session.presenter.vm;

        if (!review.allowsEditing) {
            // Nothing can be saved while the status is unknown or a review locks the content. A clean,
            // unlocked approved draft still reports success, so that "Save & Publish" goes on to
            // publish. A locked entry never does: saving it would create a new revision.
            const entry = this.original.vm.entry;
            const isCleanDraft = entry !== null && !entry.meta.locked && !this.original.vm.isDirty;

            return review.allowsPublishing && isCleanDraft;
        }

        const saved = await this.original.saveRevision(options);
        const entry = this.original.vm.entry;

        if (!saved || !entry) {
            return saved;
        }

        const model = this.original.vm.model;
        const canRequest = this.original.vm.canSave;

        if (entry.id === this.revisionId) {
            const context = getCmsEntryReviewContext(model, entry, canRequest);
            this.session.presenter.setContext(context);
            return saved;
        }

        // Saving a locked revision creates a new revision, which has no review yet.
        this.setPhase("tracking", entry.id);

        const params = getCmsEntryReviewInitParams({
            model,
            entry,
            useCases: this.session.useCases,
            canRequest
        });

        await this.session.presenter.init(params);

        return saved;
    }

    async publishRevision(): Promise<boolean> {
        if (this.phase === "idle") {
            return this.original.publishRevision();
        }

        if (this.phase === "loading" || !this.session.presenter.vm.allowsPublishing) {
            return false;
        }

        const published = await this.original.publishRevision();
        const entry = this.original.vm.entry;

        if (published && entry) {
            const context = getCmsEntryReviewContext(
                this.original.vm.model,
                entry,
                this.original.vm.canSave
            );
            this.session.presenter.setContext(context);
        }

        return published;
    }

    async unpublishRevision(): Promise<boolean> {
        const unpublished = await this.original.unpublishRevision();
        const entry = this.original.vm.entry;

        if (unpublished && entry && this.phase === "tracking") {
            const context = getCmsEntryReviewContext(
                this.original.vm.model,
                entry,
                this.original.vm.canSave
            );
            this.session.presenter.setContext(context);
        }

        return unpublished;
    }

    deleteEntry(): Promise<boolean> {
        return this.original.deleteEntry();
    }

    setFolderId(folderId: string | null): void {
        this.original.setFolderId(folderId);
    }

    newEntry(initialValues?: Record<string, unknown>): void {
        this.setPhase("idle", null);
        this.original.newEntry(initialValues);
    }

    reset(): void {
        this.original.reset();
        this.session.presenter.dispose();
        this.setPhase("idle", null);
    }

    private setPhase(phase: ReviewPhase, revisionId: string | null): void {
        this.phase = phase;
        this.revisionId = revisionId;
    }
}

export const CmsEntryFormPresenterReviewDecorator = ContentEntryFormPresenter.createDecorator({
    decorator: CmsEntryFormPresenterWithReview,
    dependencies: [CmsEntryReview]
});
```

`packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { EditorReviewBar } from "@webiny/app-workflows/review/editor/components/EditorReviewBar.js";
import { ContentEntryFormContent } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { Routes } from "~/routes.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

export const CmsEntryReviewBar = ContentEntryFormContent.createDecorator(Original => {
    return createReactiveComponent(function CmsEntryReviewBarDecorator(props) {
        const formPresenter = useContentEntryFormPresenter();
        const session = useCmsEntryReview();
        const { entry, model } = formPresenter.vm;
        const hasEntry = entry !== null && isReviewableModel(model);
        const showsBar = hasEntry && session.presenter.vm.status !== "noWorkflow";

        if (!showsBar) {
            return <Original {...props} />;
        }

        return (
            <>
                <div
                    className={
                        "max-w-screen bg-white p-sm border-solid border-b-sm border-neutral-dimmed"
                    }
                >
                    <EditorReviewBar
                        session={session}
                        reviewsRoute={Routes.ContentEntries.ContentReviews}
                    />
                </div>
                <Original {...props} />
            </>
        );
    });
});
```

`packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewScheduleMenuItem.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

const { Actions } = ContentEntryEditorConfig;
const { MenuItemAction } = Actions;

interface ReviewGatedMenuItemProps {
    children: React.ReactElement;
}

const ReviewGatedMenuItem = createReactiveComponent((props: ReviewGatedMenuItemProps) => {
    const formPresenter = useContentEntryFormPresenter();
    const session = useCmsEntryReview();
    const { entry, model } = formPresenter.vm;
    const isReviewed = entry !== null && isReviewableModel(model);

    if (isReviewed && !session.presenter.vm.allowsPublishing) {
        return null;
    }

    return props.children;
});

/*
 * There is a possibility that this decorator will not do anything, because the scheduler is not
 * turned on.
 */
export const CmsEntryReviewScheduleMenuItem = MenuItemAction.createDecorator(Original => {
    return function CmsEntryReviewScheduleMenuItemDecorator(props) {
        if (props.name !== "schedule") {
            return <Original {...props} />;
        }

        return (
            <Original
                {...props}
                element={<ReviewGatedMenuItem>{props.element}</ReviewGatedMenuItem>}
            />
        );
    };
});
```

`packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewNewRevision.tsx`:

```tsx
import React, { useCallback } from "react";
import { useFeature } from "@webiny/app";
import { useRoute } from "@webiny/app";
import { useToast } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { OptionsMenuItem } from "@webiny/app-admin";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/admin/components/IsModelPublishable.js";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { RevisionsListFeature } from "@webiny/app-headless-cms/presentation/contentEntries/revisionsList/feature.js";
import { ReactComponent as NewReleaseIcon } from "@webiny/icons/new_releases.svg";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

const { Actions } = InternalContentEntryEditorConfig;

const CreateNewRevisionMenuItem = createReactiveComponent(() => {
    const toast = useToast();
    const { setRouteParams } = useRoute();
    const { canEdit } = usePermission();
    const formPresenter = useContentEntryFormPresenter();
    const session = useCmsEntryReview();
    const { presenter: revisionsPresenter } = useFeature(RevisionsListFeature);

    const { entry, model } = formPresenter.vm;
    const status = session.presenter.vm.status;
    const isStatusUnknown = status === "loading" || status === "failed";
    const isBlocked = isReviewableModel(model) && isStatusUnknown;

    const onClick = useCallback(async () => {
        if (!entry) {
            return;
        }

        const newEntry = await revisionsPresenter.createRevision(entry.id);

        if (!newEntry) {
            toast.showWarningToast({
                title: "Could not create a new revision."
            });
            return;
        }

        setRouteParams(params => {
            return { ...params, id: newEntry.id };
        });
    }, [entry, revisionsPresenter]);

    if (!entry || !canEdit(entry, "cms.contentEntry")) {
        return null;
    }

    return (
        <OptionsMenuItem
            icon={<NewReleaseIcon />}
            disabled={!entry.id || isBlocked}
            label={`Create New Revision`}
            onAction={onClick}
            data-testid={"cms.content-form.header.createNewRevision"}
        />
    );
});

/*
 * The base "New Revision" button needs `canCreateNewRevision`, which the review rules turn off for
 * rejected, approved and in-review revisions. This menu item does not depend on it, so a new
 * revision can always be started once the review status is known (for a rejected revision this is
 * the way, and the bar's lock text names it).
 */
export const CmsEntryReviewNewRevision = () => {
    return (
        <InternalContentEntryEditorConfig>
            <IsModelPublishable>
                <Actions.MenuItemAction
                    name={"createNewRevision"}
                    element={<CreateNewRevisionMenuItem />}
                />
            </IsModelPublishable>
        </InternalContentEntryEditorConfig>
    );
};
```

`packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewFormLock.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useRef } from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { ContentEntryForm } from "@webiny/app-headless-cms/presentation/contentEntries/views/layout/index.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

interface FormLockProps {
    isLocked: boolean;
    children: React.ReactNode;
}

/*
 * One stable wrapper, always rendered, so toggling the lock never remounts the form. A disabled
 * fieldset stops native inputs; `inert` stops everything else (rich text editors, custom field
 * renderers). Trade-off: `inert` also blocks text selection and copy inside the form while it is
 * locked; nothing else can stop contenteditable editors from being edited, and the server stays
 * authoritative (`TargetLocked`).
 */
const FormLock = ({ isLocked, children }: FormLockProps) => {
    const wrapper = useRef<HTMLFieldSetElement>(null);

    useEffect(() => {
        if (wrapper.current) {
            wrapper.current.inert = isLocked;
        }
    }, [isLocked]);

    return (
        <fieldset ref={wrapper} disabled={isLocked} className={"m-0 min-w-0 border-0 p-0"}>
            {children}
        </fieldset>
    );
};

export const CmsEntryReviewFormLock = ContentEntryForm.createDecorator(Original => {
    return createReactiveComponent(function CmsEntryReviewFormLockDecorator(props) {
        const formPresenter = useContentEntryFormPresenter();
        const session = useCmsEntryReview();
        const { entry, model } = formPresenter.vm;
        const isReviewed = entry !== null && isReviewableModel(model);
        const isLocked = isReviewed && !session.presenter.vm.allowsEditing;

        return (
            <FormLock isLocked={isLocked}>
                <Original {...props} />
            </FormLock>
        );
    });
});
```

`packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBlockedActions.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import { InternalContentEntryEditorConfig } from "@webiny/app-headless-cms/admin/config/contentEntries/index.js";
import { IsModelPublishable } from "@webiny/app-headless-cms/admin/components/IsModelPublishable.js";
import { usePermission } from "@webiny/app-headless-cms/admin/hooks/usePermission.js";
import { useContentEntryFormPresenter } from "@webiny/app-headless-cms/presentation/contentEntries/form/useContentEntryFormPresenter.js";
import { ReviewTooltip } from "@webiny/app-workflows/review/presentation/targetReview/components/ReviewTooltip.js";
import { useCmsEntryReview } from "~/features/editorReview/useCmsEntryReview.js";
import { isReviewableModel } from "~/utils/isReviewableModel.js";

const { Actions } = InternalContentEntryEditorConfig;

function ignoreAction(): void {}

const BlockedActions = createReactiveComponent(() => {
    const { ButtonPrimary, ButtonSecondary } = Actions.ButtonAction.useButtons();
    const formPresenter = useContentEntryFormPresenter();
    const session = useCmsEntryReview();
    const { canPublish } = usePermission();
    const { entry, model, canSave, canPublish: canPublishNow } = formPresenter.vm;
    const review = session.presenter.vm;

    if (entry === null || !isReviewableModel(model) || review.publishDisabledReason === null) {
        return null;
    }

    const isStatusUnknown = review.status === "loading" || review.status === "failed";
    const showSave = isStatusUnknown && !canSave;
    const isPublishable = entry.meta.status !== "published" && canPublish("cms.contentEntry");
    const showPublish = isPublishable && !canPublishNow;

    if (!showSave && !showPublish) {
        return null;
    }

    return (
        <ReviewTooltip presenter={session.presenter}>
            {describedBy => (
                <span className={"flex items-center gap-sm"}>
                    {showSave && (
                        <ButtonSecondary
                            aria-disabled={true}
                            aria-describedby={describedBy}
                            onAction={ignoreAction}
                        >
                            {"Save"}
                        </ButtonSecondary>
                    )}
                    {showPublish && (
                        <ButtonPrimary
                            aria-disabled={true}
                            aria-describedby={describedBy}
                            onAction={ignoreAction}
                        >
                            {"Publish"}
                        </ButtonPrimary>
                    )}
                </span>
            )}
        </ReviewTooltip>
    );
});

/*
 * The base Save and Publish buttons render nothing when `canSave` or `canPublish` is false. While
 * the review status is unknown, or a review does not allow publishing yet, this shows them
 * `aria-disabled` and focusable (never removed, R226), with the reason from the shared review rules
 * given by `ReviewTooltip` (its render function hands each button the `aria-describedby`, R241). At most two buttons show (Save only while the status is unknown); the
 * base Save & Publish stays hidden because `canPublish` is false.
 */
export const CmsEntryReviewBlockedActions = () => {
    return (
        <InternalContentEntryEditorConfig>
            <IsModelPublishable>
                <Actions.ButtonAction
                    after={"publishOnly"}
                    name={"workflowBlockedActions"}
                    element={<BlockedActions />}
                />
            </IsModelPublishable>
        </InternalContentEntryEditorConfig>
    );
};
```

`packages/app-headless-cms-workflows/src/Components/ContentEntryForm/index.ts` (replace the whole file):

```ts
export { CmsEntryReviewBar } from "./CmsEntryReviewBar.js";
export { CmsEntryReviewBlockedActions } from "./CmsEntryReviewBlockedActions.js";
export { CmsEntryReviewFormLock } from "./CmsEntryReviewFormLock.js";
export { CmsEntryReviewNewRevision } from "./CmsEntryReviewNewRevision.js";
export { CmsEntryReviewScheduleMenuItem } from "./CmsEntryReviewScheduleMenuItem.js";
```

`packages/app-headless-cms-workflows/src/presentation/feature.ts`, change the import and the registration (the rest stays; Task 21 changes the other lines later):

```ts
// before
import { ContentEntryFormPresenterWorkflowDecorator } from "./ContentEntryFormPresenterWorkflowDecorator.js";
// after
import { CmsEntryFormPresenterReviewDecorator } from "./CmsEntryFormPresenterReviewDecorator.js";
```

```ts
// before
        container.registerDecorator(ContentEntryFormPresenterWorkflowDecorator);
// after
        container.registerDecorator(CmsEntryFormPresenterReviewDecorator);
```

`packages/app-headless-cms-workflows/src/index.tsx`. Task 11 already added its `CmsReviewFeature` registration; keep it and apply only these hunks:

```tsx
// before
import {
    CmsEntryFormScheduleMenuItemAction,
    CmsEntryFormTooltipButton,
    ContentEntryFormWorkflow
} from "~/Components/ContentEntryForm/index.js";
// after
import { CmsEntryReviewBar } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewBlockedActions } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewFormLock } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewNewRevision } from "~/Components/ContentEntryForm/index.js";
import { CmsEntryReviewScheduleMenuItem } from "~/Components/ContentEntryForm/index.js";
```

```tsx
// before
import { CmsEntryFormCreateNewRevisionButton } from "~/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.js";
// after
import { CmsEntryReviewFeature } from "~/features/editorReview/feature.js";
```

```tsx
// before
            <RegisterFeature feature={CmsWorkflowsEditorPresenterFeature} />
// after
            <RegisterFeature feature={CmsWorkflowsEditorPresenterFeature} />
            <RegisterFeature feature={CmsEntryReviewFeature} />
```

```tsx
// before
            <ContentEntryFormWorkflow />
            <CmsEntryFormTooltipButton />
            <CmsEntryFormScheduleMenuItemAction />
            <CmsEntryFormCreateNewRevisionButton />
// after
            <CmsEntryReviewBar />
            <CmsEntryReviewFormLock />
            <CmsEntryReviewBlockedActions />
            <CmsEntryReviewScheduleMenuItem />
            <CmsEntryReviewNewRevision />
```

`packages/app-headless-cms-workflows/src/index.test.tsx` (Task 11's file): only the two `vi.mock` blocks below change. Replace

```tsx
vi.mock("~/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryFormScheduleMenuItemAction: () => null,
        CmsEntryFormTooltipButton: () => null,
        ContentEntryFormWorkflow: () => null
    };
});
```

with

```tsx
vi.mock("~/Components/ContentEntryForm/index.js", () => {
    return {
        CmsEntryReviewBar: () => null,
        CmsEntryReviewBlockedActions: () => null,
        CmsEntryReviewFormLock: () => null,
        CmsEntryReviewNewRevision: () => null,
        CmsEntryReviewScheduleMenuItem: () => null
    };
});
```

and delete this block (the root no longer imports that file):

```tsx
vi.mock("~/Components/ContentEntryForm/CmsEntryFormCreateNewRevisionButton.js", () => {
    return { CmsEntryFormCreateNewRevisionButton: () => null };
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-headless-cms-workflows/src/presentation/CmsEntryFormPresenterReviewDecorator.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/editorReview/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBar.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewFormLock.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewScheduleMenuItem.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewBlockedActions.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/Components/ContentEntryForm/CmsEntryReviewNewRevision.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.editor.test.tsx 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/index.test.tsx 2>&1 | tail -50
```

Expected: PASS. If a component test fails only because a config property or decorator is not applied when the assertion runs, wrap that assertion in `waitFor` (config properties register in effects); do not weaken it.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
git ls-files 'packages/app-headless-cms-workflows/**/*.test.ts*'
```

Run each Task 11 test file the listing shows (outside this task's files) by path, for example:

```bash
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewGatewayImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/CmsReviewContentAdapterImpl.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms-workflows/src/features/gateway/feature.test.ts 2>&1 | tail -50
yarn test packages/app-headless-cms/src/presentation/contentEntries/list/ContentEntriesPresenter.test.ts 2>&1 | tail -50
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
```

Expected: all PASS, no type errors. The package has no `__tests__/**/*.test.ts`, so `check:test:types` does not list it; the build type-checks the co-located tests and `src/testing/` (R243, R-e). Old files left on disk still type-check against the old `app-workflows` code; do not delete them (Task 37).

- [ ] **Step 6: Pre-commit chain and commit**

Run the Global Constraints pre-commit chain from `../00-shared.md` in full, building the changed package with `--no-cache`, and restore `.gitleaks.toml`:

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
yarn build -p @webiny/app-headless-cms-workflows --no-cache 2>&1 | tail -30
git checkout -- .gitleaks.toml
git add .
git commit -m "feat(app-headless-cms-workflows): mount the shared review bar and editor rules in the CMS entry editor" -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If a pre-commit step fails and you fix anything, rerun the chain from the start. `yarn adio` may name `@webiny/di`, `@webiny/react-composition` or `@webiny/feature-flags` as missing or unused; make `package.json` match what it reports.

## Contract notes

1. **Base Save and Publish buttons render nothing instead of being disabled.** `SaveContentButton`, `SaveAndPublishButton` and `PublishOnlyButton` return `null` when `canSave` or `canPublish` is false and there is no aria hook, so `CmsEntryReviewBlockedActions` (`workflowBlockedActions`) registers the `aria-disabled` Publish (and Save while the status is unknown) inside the shared `ReviewTooltip` render function (R241). The reason is `publishDisabledReason`, used for both buttons.
2. **No read-only form in the CMS editor.** Field `disabled` is copied into each `Field` at build time, so `CmsEntryReviewFormLock` wraps the form in one stable fieldset that is `disabled` and `inert` while the rules forbid editing. Trade-off recorded in the code: `inert` also blocks text selection and copy while locked. Save is also refused by the presenter decorator.
3. **"Create new revision" for a rejected revision** is the existing options-menu item (always usable once the status is known) plus the bar lock text that names it; the view model has no rejected discriminator, so no extra button.
4. **`saveRevision` shortcut** reports success without saving only for a clean, unlocked approved draft (so "Save & Publish" publishes); an approved locked entry returns `false` and `canCreateNewRevision` is gated by `allowsEditing` too (the base "New Revision" button reads only that flag).
5. **`isUnpublished` (R226, Q19)** is the CMS entry status `unpublished`; `getEditorRules` then lets an unpublished revision with no review publish and schedule again. A revision published before the workflow was bound has no review and the server refuses it (A89); the admin error toast shows.
6. **`phase` in the decorator.** Task 13 does not specify the shared presenter state before `init`, so the decorator keeps `idle | loading | tracking` itself.
7. **`src/testing/reviewStates.ts` mirrors `getEditorRules` strings** (R226 texts); a change in Task 13's rules needs a change here.
8. **Unrun harness:** the editor harness (`ContentEntryEditorWithConfig` with `Property` registration, `Buttons`, `AdminUiProvider`, the `vi.mock` of `@webiny/app-admin` `OptionsMenuItem` and of `@webiny/app` `useRoute`) has not been run when the plan is written. Tooltip opening on hover is not asserted (Radix, jsdom); the wrapper, `aria-disabled`, `aria-describedby` and reason text are. If a component test fails only because a config property is not applied yet, wrap the assertion in `waitFor`.
9. **Size.** One task, eight test files, small components. If the reviewer wants a split, cut after the presenter decorator and its test (the components and the root wiring second).
