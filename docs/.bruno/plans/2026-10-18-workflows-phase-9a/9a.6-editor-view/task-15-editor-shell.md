### Task 15: Editor shell and model panel

R234, R279 (the model switch is the presenter's), R280; D92, D116, D162; QBZ-20; design README 3 and 4 (layout, model panel, header, the loading, load-error, no-permission and no-workflow states); `research-spec.md` 4.1 and 4.3; Review Focus 6 and 10. The shared editor view: `WorkflowEditorView` (the mounting component; it resolves the presenter, calls `presenter.init` with the per-app `useCases`, `reviewUseCases` and `app` adapter as props, and disposes it) over `WorkflowEditorLayout` (presentational, on a narrow presenter type), the model panel, the sticky header, and the page states. Tasks 16-19 add the flow, the type picker, the dialogs and the banners to the layout; this task leaves the flow area as an empty `div` and the layout's last child as the right column, and Tasks 16, 17, 18 and 19 insert into those exact lines.

- **Layout (README 3):** a grid `272px | 1fr`. Left: the model panel. Right: the header, then the content. `vm.status` decides the page: `loading` shows the static skeleton (`EditorLoading`), `failed` the empty state `Could not load workflows` with the error text and `Try again` (`presenter.retry()`), `noAccess` the empty state `You don't have access to workflows` / `Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role.` Only `ready` shows the panel and the editor.
- **Right side by `vm.detail` (Task 9):** `loading` (a model's workflow is loading) shows a static skeleton of cards (`EditorDetailLoading`, README 4 "static skeleton rows and cards"); `workflow` shows the header and the content; `empty` shows the no-workflow state; `none` shows nothing.
- **Model panel (R280, QBZ-20):**
  - Label `panel.label` (the app adapter's `panelLabel`; uppercase by CSS only, the text is the adapter's).
  - Search input (placeholder `Search models`) only when `panel.showSearch` (WB: no search). The input is controlled by `panel.search` and calls `presenter.setSearch(value)` on every change; the 250 ms debounce and the restart at the first page live in the presenter (Task 9).
  - Rows: the model icon from `app.renderModelIcon(modelId)` (the app renders it, `app-workflows` has no icon library), the name (600 weight when active), the sub line (`rows[].subLine`, computed by the presenter: `{n} steps`, the bound workflow's name, or `No workflow`), the bound indicator (`account_tree`, label `Has a workflow`) and the 8px orange unsaved dot (label `Unsaved changes`) for the open model. A row click calls `presenter.selectModel(modelId)`; the presenter asks before discarding a dirty draft (R279).
  - `Load more` button while `panel.hasMore` (disabled while `loadingMore`), no counts. `panel.emptyText` (`No models match “{q}”.`, built by the presenter) replaces the rows. `panel.loading` shows skeleton rows. `panel.error` (`Could not load workflows`, a failed search or page) shows under the rows with `Try again` (`presenter.retryModels()`); the rows that did load stay.
- **Header (README 3):** sticky; the workflow name as an input (the name error under it with the red border when `header.nameError` is set), the `Unsaved changes` warning tag while dirty, under it `header.appliesTo` (`Applies to {Model} · Headless CMS model`, composed by the presenter), on the right a `⋯` menu with `Delete workflow` (destructive, disabled when `canDelete` is false: a new unsaved draft has nothing to delete) and the primary `Save` (`Saving…` while saving; disabled unless `canSave`), and under them `Changes apply to new review requests; reviews already running are not affected.`
- **No workflow (README 3):** `vm.empty` (`{Model} has no workflow` / `Add a workflow to require a review before {Model} content can be published.`, composed by the presenter) with the primary `Create workflow` (`presenter.createWorkflow()`).

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorViewPresenter.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/EditorLoading.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/EditorDetailLoading.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/EditorLoadError.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/EditorNoPermission.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/NoWorkflowState.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/ModelPanel.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx`
- Create: `packages/app-workflows/src/editor/testing/createEditorViewModel.ts` (also `createWorkflowHeaderVm`, shared by the layout tests of Tasks 15, 16 and 19)
- Create: `packages/app-workflows/src/editor/testing/fakeViewApp.tsx`
- Create: `packages/app-workflows/src/editor/testing/fakeEditorViewPresenter.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/ModelPanel.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/EditorStates.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`

**Interfaces:**
- Consumes: Tasks 9 and 10 (`WorkflowEditorPresenter` token with `WorkflowEditorPresenter.Interface` and `.ViewModel`, `WorkflowEditorInitParams { useCases; reviewUseCases; app }`, the view-model types `ModelPanelVm`, `WorkflowHeaderVm`, `EmptyWorkflowVm` in `[AWE]/presentation/editor/abstractions.ts`; `WorkflowEditorPresenterFeature` in `[AWE]/presentation/editor/feature.ts`, whose `resolve` returns `{ presenter }`; `WorkflowEditorAppAdapter` in `[AWE]/WorkflowEditorAppAdapter.ts` with `renderModelIcon(modelId: string): React.ReactNode`; the commands `retry`, `retryModels`, `setSearch`, `loadMore`, `selectModel`, `createWorkflow`, `setName` (Task 9) and `save`, `requestDelete` (Task 10)), Task 5 (`IWorkflowEditorUseCases`). Existing (verified): `renderWithAdminUi` and `renderWithContainer` (`~/review/testing/`), `createReactiveComponent` (`@webiny/app-admin`), `useFeature` (`@webiny/app`), admin-ui `Button`, `DropdownMenu`, `EmptyState`, `Icon`, `IconButton`, `Input`, `Skeleton`, `Tag`, `Text`, `cn`, icons `@webiny/icons/{account_tree,more_horiz}.svg`.
- Produces: `WorkflowEditorViewPresenter` (the view's narrow presenter type, the subset of the editor presenter that Tasks 15-19 read and call, below), `WorkflowEditorView` and `WorkflowEditorLayout` (Tasks 16-19 modify the layout; Tasks 20 and 21 mount the view), `ModelPanel`, `EditorHeader`, `createEditorViewModel` (a full `WorkflowEditorPresenter.ViewModel`), `createFakeEditorViewPresenter` (a presenter with a mock for every command Tasks 15-19 call).

**The narrow presenter type.** `WorkflowEditorViewPresenter` is `Pick<WorkflowEditorPresenter.Interface, ...>` of every member the layout reads or calls across Tasks 15-19 (Tasks 9, 9b and 10, R284: `openStep`, `closeStep` and `vm.openStepId` are on the presenter). `WorkflowEditorView` passes the resolved `WorkflowEditorPresenter.Interface` to the layout, so a missing or renamed member is one type error on that line. The layout tests build fakes against the narrow type, so they need no DI container for the presenter.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. The svg stub (`__tests__/setup/svgStub.tsx`) renders every icon as `<svg data-testid="svg-icon">`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/createEditorViewModel.ts` (a pure builder, no vitest, mobx or DI imports, R243):

```ts
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowHeaderVm } from "~/editor/presentation/editor/abstractions.js";

// The header of an open workflow: clean, savable, deletable; a test overrides what it asserts on.
export const createWorkflowHeaderVm = (overrides: Partial<WorkflowHeaderVm> = {}): WorkflowHeaderVm => {
    return {
        name: "Article review",
        nameError: null,
        appliesTo: "Applies to Article · Headless CMS model",
        dirty: false,
        saving: false,
        canSave: true,
        canDelete: true,
        ...overrides
    };
};

// The view model of a ready editor with one model row and no open model.
export const createEditorViewModel = (
    overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}
): WorkflowEditorPresenter.ViewModel => {
    return {
        status: "ready",
        error: null,
        panel: {
            label: "Content models",
            showSearch: true,
            search: "",
            rows: [
                {
                    modelId: "article",
                    name: "Article",
                    subLine: "No workflow",
                    bound: false,
                    unsaved: false,
                    active: false
                }
            ],
            loading: false,
            loadingMore: false,
            hasMore: false,
            emptyText: null,
            error: null
        },
        detail: "none",
        header: null,
        empty: null,
        flow: { steps: [], stepsError: null },
        typePicker: null,
        optionsBanner: null,
        saveBanner: null,
        dialog: null,
        scrollRequest: null,
        openStepId: null,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/editor/testing/fakeViewApp.tsx` (the `app` prop of the layout tests: only `renderModelIcon`; one stub for the tests of Tasks 15, 16 and 19):

```tsx
import React from "react";

export const fakeViewApp = {
    renderModelIcon: (modelId: string) => <span data-testid={`icon-${modelId}`} />
};
```

Create `packages/app-workflows/src/editor/testing/fakeEditorViewPresenter.ts` (a vitest fake, a separate file from the builders, R243):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorViewPresenter } from "~/editor/presentation/editor/components/WorkflowEditorViewPresenter.js";
import { createEditorViewModel } from "./createEditorViewModel.js";

export interface FakeEditorViewPresenter extends WorkflowEditorViewPresenter {
    vm: WorkflowEditorPresenter.ViewModel;
    retry: Mock<WorkflowEditorViewPresenter["retry"]>;
    retryModels: Mock<WorkflowEditorViewPresenter["retryModels"]>;
    retryOptions: Mock<WorkflowEditorViewPresenter["retryOptions"]>;
    setSearch: Mock<WorkflowEditorViewPresenter["setSearch"]>;
    loadMore: Mock<WorkflowEditorViewPresenter["loadMore"]>;
    selectModel: Mock<WorkflowEditorViewPresenter["selectModel"]>;
    createWorkflow: Mock<WorkflowEditorViewPresenter["createWorkflow"]>;
    setName: Mock<WorkflowEditorViewPresenter["setName"]>;
    save: Mock<WorkflowEditorViewPresenter["save"]>;
    retrySave: Mock<WorkflowEditorViewPresenter["retrySave"]>;
    dismissBanner: Mock<WorkflowEditorViewPresenter["dismissBanner"]>;
    reloadDuplicate: Mock<WorkflowEditorViewPresenter["reloadDuplicate"]>;
    requestDelete: Mock<WorkflowEditorViewPresenter["requestDelete"]>;
    openTypePicker: Mock<WorkflowEditorViewPresenter["openTypePicker"]>;
    closeTypePicker: Mock<WorkflowEditorViewPresenter["closeTypePicker"]>;
    addStep: Mock<WorkflowEditorViewPresenter["addStep"]>;
    moveStep: Mock<WorkflowEditorViewPresenter["moveStep"]>;
    requestDeleteStep: Mock<WorkflowEditorViewPresenter["requestDeleteStep"]>;
    openStep: Mock<WorkflowEditorViewPresenter["openStep"]>;
    closeStep: Mock<WorkflowEditorViewPresenter["closeStep"]>;
    confirmDialog: Mock<WorkflowEditorViewPresenter["confirmDialog"]>;
    cancelDialog: Mock<WorkflowEditorViewPresenter["cancelDialog"]>;
}

// A narrow presenter that records every command; `addStep` adds nothing (null) unless a test says so.
export const createFakeEditorViewPresenter = (
    vm: WorkflowEditorPresenter.ViewModel = createEditorViewModel()
): FakeEditorViewPresenter => {
    const addStep = vi.fn<WorkflowEditorViewPresenter["addStep"]>();
    addStep.mockReturnValue(null);

    return {
        vm,
        retry: vi.fn(),
        retryModels: vi.fn(),
        retryOptions: vi.fn(),
        setSearch: vi.fn(),
        loadMore: vi.fn(),
        selectModel: vi.fn(),
        createWorkflow: vi.fn(),
        setName: vi.fn(),
        save: vi.fn(),
        retrySave: vi.fn(),
        dismissBanner: vi.fn(),
        reloadDuplicate: vi.fn(),
        requestDelete: vi.fn(),
        openTypePicker: vi.fn(),
        closeTypePicker: vi.fn(),
        addStep,
        moveStep: vi.fn(),
        requestDeleteStep: vi.fn(),
        openStep: vi.fn(),
        closeStep: vi.fn(),
        confirmDialog: vi.fn(),
        cancelDialog: vi.fn()
    };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/ModelPanel.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { within } from "@testing-library/react";
import type { ModelPanelVm } from "~/editor/presentation/editor/abstractions.js";
import type { ModelRowVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { ModelPanel } from "./ModelPanel.js";
import type { ModelPanelProps } from "./ModelPanel.js";

const ARTICLE: ModelRowVm = {
    modelId: "article",
    name: "Article",
    subLine: "3 steps",
    bound: true,
    unsaved: true,
    active: true
};

const AUTHOR: ModelRowVm = {
    modelId: "author",
    name: "Author",
    subLine: "No workflow",
    bound: false,
    unsaved: false,
    active: false
};

const createPanel = (overrides: Partial<ModelPanelVm> = {}): ModelPanelVm => {
    return {
        label: "Content models",
        showSearch: true,
        search: "",
        rows: [ARTICLE, AUTHOR],
        loading: false,
        loadingMore: false,
        hasMore: false,
        emptyText: null,
        error: null,
        ...overrides
    };
};

const createProps = (overrides: Partial<ModelPanelProps> = {}): ModelPanelProps => {
    return {
        panel: createPanel(),
        renderIcon: modelId => <span data-testid={`icon-${modelId}`} />,
        onSearch: vi.fn(),
        onSelect: vi.fn(),
        onLoadMore: vi.fn(),
        onRetry: vi.fn(),
        ...overrides
    };
};

const rowOf = (name: string): HTMLElement => {
    return screen.getByText(name).closest("button") as HTMLElement;
};

describe("ModelPanel", () => {
    it("renders the label, the rows, their sub lines and the app's icons", () => {
        renderWithAdminUi(<ModelPanel {...createProps()} />);

        expect(screen.getByText("Content models")).toBeTruthy();
        expect(within(rowOf("Article")).getByText("3 steps")).toBeTruthy();
        expect(within(rowOf("Author")).getByText("No workflow")).toBeTruthy();
        expect(within(rowOf("Article")).getByTestId("icon-article")).toBeTruthy();
        expect(within(rowOf("Author")).getByTestId("icon-author")).toBeTruthy();
    });

    it("marks the open row, the bound indicator and the unsaved dot", () => {
        renderWithAdminUi(<ModelPanel {...createProps()} />);

        const article = rowOf("Article");
        expect(article.getAttribute("aria-current")).toBe("true");
        expect(within(article).getByText("Has a workflow")).toBeTruthy();
        expect(within(article).getByLabelText("Unsaved changes")).toBeTruthy();

        const author = rowOf("Author");
        expect(author.getAttribute("aria-current")).toBeNull();
        expect(within(author).queryByText("Has a workflow")).toBeNull();
        expect(within(author).queryByLabelText("Unsaved changes")).toBeNull();
    });

    it("selects a model on a row click", () => {
        const props = createProps();
        renderWithAdminUi(<ModelPanel {...props} />);

        fireEvent.click(rowOf("Author"));

        expect(props.onSelect).toHaveBeenCalledTimes(1);
        expect(props.onSelect).toHaveBeenCalledWith("author");
    });

    it("reports every change of the search input", () => {
        const props = createProps();
        renderWithAdminUi(<ModelPanel {...props} />);

        fireEvent.change(screen.getByPlaceholderText("Search models"), {
            target: { value: "art" }
        });

        expect(props.onSearch).toHaveBeenCalledWith("art");
    });

    it("shows the current search text", () => {
        renderWithAdminUi(<ModelPanel {...createProps({ panel: createPanel({ search: "auth" }) })} />);

        expect(screen.getByDisplayValue("auth")).toBeTruthy();
    });

    it("has no search input when the app shows none (Website Builder)", () => {
        renderWithAdminUi(
            <ModelPanel {...createProps({ panel: createPanel({ showSearch: false }) })} />
        );

        expect(screen.queryByPlaceholderText("Search models")).toBeNull();
    });

    it("shows Load more only while there are more models and calls it", () => {
        const { unmount } = renderWithAdminUi(<ModelPanel {...createProps()} />);
        expect(screen.queryByRole("button", { name: "Load more" })).toBeNull();
        unmount();

        const shown = createProps({ panel: createPanel({ hasMore: true }) });
        renderWithAdminUi(<ModelPanel {...shown} />);
        fireEvent.click(screen.getByRole("button", { name: "Load more" }));

        expect(shown.onLoadMore).toHaveBeenCalledTimes(1);
    });

    it("disables Load more while the next page loads", () => {
        const panel = createPanel({ hasMore: true, loadingMore: true });
        renderWithAdminUi(<ModelPanel {...createProps({ panel })} />);

        const button = screen.getByRole("button", { name: "Load more" });
        expect(button.getAttribute("aria-disabled")).toBe("true");
    });

    it("shows the empty text instead of the rows", () => {
        const panel = createPanel({ rows: [], emptyText: "No models match “zzz”." });
        renderWithAdminUi(<ModelPanel {...createProps({ panel })} />);

        expect(screen.getByText("No models match “zzz”.")).toBeTruthy();
        expect(screen.queryByText("Article")).toBeNull();
    });

    it("shows skeleton rows while loading", () => {
        const panel = createPanel({ rows: [], loading: true });
        renderWithAdminUi(<ModelPanel {...createProps({ panel })} />);

        expect(screen.getByTestId("model-panel-loading")).toBeTruthy();
        expect(screen.queryByText("Article")).toBeNull();
    });

    it("shows a failed search or page under the rows with Try again", () => {
        const props = createProps({ panel: createPanel({ error: "Could not load workflows" }) });
        renderWithAdminUi(<ModelPanel {...props} />);

        expect(screen.getByText("Could not load workflows")).toBeTruthy();
        expect(screen.getByText("Article")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(props.onRetry).toHaveBeenCalledTimes(1);
    });

    it("shows no error block while nothing failed", () => {
        renderWithAdminUi(<ModelPanel {...createProps()} />);

        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { WorkflowHeaderVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createWorkflowHeaderVm } from "~/editor/testing/createEditorViewModel.js";
import { EditorHeader } from "./EditorHeader.js";
import type { EditorHeaderProps } from "./EditorHeader.js";

const createProps = (overrides: Partial<WorkflowHeaderVm> = {}): EditorHeaderProps => {
    return {
        header: createWorkflowHeaderVm(overrides),
        onNameChange: vi.fn(),
        onSave: vi.fn(),
        onDelete: vi.fn()
    };
};

describe("EditorHeader", () => {
    it("shows the name, the applies-to line and the note under Save", () => {
        renderWithAdminUi(<EditorHeader {...createProps()} />);

        expect(screen.getByDisplayValue("Article review")).toBeTruthy();
        expect(screen.getByText("Applies to Article · Headless CMS model")).toBeTruthy();
        expect(
            screen.getByText(
                "Changes apply to new review requests; reviews already running are not affected."
            )
        ).toBeTruthy();
    });

    it("shows the Unsaved changes tag only while dirty", () => {
        const { unmount } = renderWithAdminUi(<EditorHeader {...createProps({ dirty: false })} />);
        expect(screen.queryByText("Unsaved changes")).toBeNull();
        unmount();

        renderWithAdminUi(<EditorHeader {...createProps({ dirty: true })} />);
        expect(screen.getByText("Unsaved changes")).toBeTruthy();
    });

    it("reports a changed name", () => {
        const props = createProps();
        renderWithAdminUi(<EditorHeader {...props} />);

        fireEvent.change(screen.getByDisplayValue("Article review"), {
            target: { value: "Article sign-off" }
        });

        expect(props.onNameChange).toHaveBeenCalledWith("Article sign-off");
    });

    it("shows the name error under the input", () => {
        const props = createProps({ name: "", nameError: "Enter a workflow name." });
        renderWithAdminUi(<EditorHeader {...props} />);

        expect(screen.getByText("Enter a workflow name.")).toBeTruthy();
    });

    it("saves on click when Save is enabled", () => {
        const props = createProps();
        renderWithAdminUi(<EditorHeader {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Save" }));

        expect(props.onSave).toHaveBeenCalledTimes(1);
    });

    it("disables Save when nothing can be saved", () => {
        const props = createProps({ canSave: false });
        renderWithAdminUi(<EditorHeader {...props} />);

        const save = screen.getByRole("button", { name: "Save" });
        expect(save.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(save);
        expect(props.onSave).not.toHaveBeenCalled();
    });

    it("shows Saving… and disables Save while saving", () => {
        renderWithAdminUi(<EditorHeader {...createProps({ saving: true, canSave: true })} />);

        const saving = screen.getByRole("button", { name: "Saving…" });
        expect(saving.getAttribute("aria-disabled")).toBe("true");
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("deletes through the menu", async () => {
        const props = createProps();
        renderWithAdminUi(<EditorHeader {...props} />);

        fireEvent.keyDown(screen.getByRole("button", { name: "More actions" }), { key: "Enter" });
        await screen.findByRole("menuitem", { name: "Delete workflow" });
        // The item's onClick sits on its inner element, so click the label.
        fireEvent.click(screen.getByText("Delete workflow"));

        expect(props.onDelete).toHaveBeenCalledTimes(1);
    });

    it("disables Delete workflow for a draft that was never saved", async () => {
        const props = createProps({ canDelete: false });
        renderWithAdminUi(<EditorHeader {...props} />);

        fireEvent.keyDown(screen.getByRole("button", { name: "More actions" }), { key: "Enter" });
        const item = await screen.findByRole("menuitem", { name: "Delete workflow" });

        expect(item.getAttribute("data-disabled")).not.toBeNull();
        fireEvent.click(screen.getByText("Delete workflow"));
        expect(props.onDelete).not.toHaveBeenCalled();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/components/EditorStates.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { EditorDetailLoading } from "./EditorDetailLoading.js";
import { EditorLoadError } from "./EditorLoadError.js";
import { EditorLoading } from "./EditorLoading.js";
import { EditorNoPermission } from "./EditorNoPermission.js";
import { NoWorkflowState } from "./NoWorkflowState.js";

describe("EditorLoading", () => {
    it("renders the static skeleton", () => {
        renderWithAdminUi(<EditorLoading />);

        expect(screen.getByTestId("editor-loading")).toBeTruthy();
        expect(screen.getAllByTestId("editor-skeleton-card")).toHaveLength(3);
    });
});

describe("EditorDetailLoading", () => {
    it("renders the skeleton cards of a loading workflow", () => {
        renderWithAdminUi(<EditorDetailLoading />);

        expect(screen.getByTestId("editor-detail-loading")).toBeTruthy();
        expect(screen.getAllByTestId("editor-skeleton-card")).toHaveLength(3);
    });
});

describe("EditorLoadError", () => {
    it("shows the title, the error and Try again", () => {
        const onRetry = vi.fn();
        renderWithAdminUi(<EditorLoadError description="Network down." onRetry={onRetry} />);

        expect(screen.getByText("Could not load workflows")).toBeTruthy();
        expect(screen.getByText("Network down.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });
});

describe("EditorNoPermission", () => {
    it("explains the missing permission", () => {
        renderWithAdminUi(<EditorNoPermission />);

        expect(screen.getByText("You don't have access to workflows")).toBeTruthy();
        expect(
            screen.getByText(
                "Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role."
            )
        ).toBeTruthy();
    });
});

describe("NoWorkflowState", () => {
    it("shows the title, the description and Create workflow", () => {
        const onCreate = vi.fn();
        renderWithAdminUi(
            <NoWorkflowState
                title="Article has no workflow"
                description="Add a workflow to require a review before Article content can be published."
                onCreate={onCreate}
            />
        );

        expect(screen.getByText("Article has no workflow")).toBeTruthy();
        expect(
            screen.getByText(
                "Add a workflow to require a review before Article content can be published."
            )
        ).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Create workflow" }));
        expect(onCreate).toHaveBeenCalledTimes(1);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createWorkflowHeaderVm } from "~/editor/testing/createEditorViewModel.js";
import { fakeViewApp } from "~/editor/testing/fakeViewApp.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

const app = fakeViewApp;

const HEADER = createWorkflowHeaderVm({ dirty: true, canSave: true });

const renderLayout = (overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}) => {
    const presenter = createFakeEditorViewPresenter(createEditorViewModel(overrides));
    renderWithAdminUi(<WorkflowEditorLayout presenter={presenter} app={app} />);
    return presenter;
};

describe("WorkflowEditorLayout", () => {
    it("shows the skeleton while loading, without the model panel", () => {
        renderLayout({ status: "loading" });

        expect(screen.getByTestId("editor-loading")).toBeTruthy();
        expect(screen.queryByTestId("model-panel")).toBeNull();
    });

    it("shows the load error with Try again", () => {
        const presenter = renderLayout({ status: "failed", error: "Network down." });

        expect(screen.getByText("Could not load workflows")).toBeTruthy();
        expect(screen.getByText("Network down.")).toBeTruthy();
        expect(screen.queryByTestId("model-panel")).toBeNull();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retry).toHaveBeenCalledTimes(1);
    });

    it("shows the no-permission state", () => {
        renderLayout({ status: "noAccess" });

        expect(screen.getByText("You don't have access to workflows")).toBeTruthy();
        expect(screen.queryByTestId("model-panel")).toBeNull();
    });

    it("shows only the panel when no model is open", () => {
        renderLayout();

        expect(screen.getByTestId("model-panel")).toBeTruthy();
        expect(screen.getByTestId("icon-article")).toBeTruthy();
        expect(screen.queryByText("Create workflow")).toBeNull();
        expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    });

    it("shows a skeleton on the right while a model's workflow loads", () => {
        renderLayout({ detail: "loading" });

        expect(screen.getByTestId("editor-detail-loading")).toBeTruthy();
        expect(screen.getByTestId("model-panel")).toBeTruthy();
    });

    it("shows the no-workflow state and creates a workflow", () => {
        const presenter = renderLayout({
            detail: "empty",
            empty: {
                title: "Article has no workflow",
                description:
                    "Add a workflow to require a review before Article content can be published."
            }
        });

        expect(screen.getByText("Article has no workflow")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Create workflow" }));
        expect(presenter.createWorkflow).toHaveBeenCalledTimes(1);
    });

    it("wires the header to the presenter", async () => {
        const presenter = renderLayout({ detail: "workflow", header: HEADER });

        expect(screen.getByText("Unsaved changes", { selector: "span" })).toBeTruthy();

        fireEvent.change(screen.getByDisplayValue("Article review"), {
            target: { value: "Article sign-off" }
        });
        expect(presenter.setName).toHaveBeenCalledWith("Article sign-off");

        fireEvent.click(screen.getByRole("button", { name: "Save" }));
        expect(presenter.save).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(screen.getByRole("button", { name: "More actions" }), { key: "Enter" });
        await screen.findByRole("menuitem", { name: "Delete workflow" });
        fireEvent.click(screen.getByText("Delete workflow"));
        expect(presenter.requestDelete).toHaveBeenCalledTimes(1);
    });

    it("wires the model panel to the presenter", () => {
        const base = createEditorViewModel();
        const presenter = renderLayout({
            panel: { ...base.panel, hasMore: true, error: "Could not load workflows" }
        });

        fireEvent.change(screen.getByPlaceholderText("Search models"), {
            target: { value: "art" }
        });
        expect(presenter.setSearch).toHaveBeenCalledWith("art");

        fireEvent.click(screen.getByText("Article").closest("button") as HTMLElement);
        expect(presenter.selectModel).toHaveBeenCalledWith("article");

        fireEvent.click(screen.getByRole("button", { name: "Load more" }));
        expect(presenter.loadMore).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retryModels).toHaveBeenCalledTimes(1);
    });

    it("shows the panel with the app's label and no search for the Website Builder", () => {
        const base = createEditorViewModel();
        renderLayout({ panel: { ...base.panel, label: "Website Builder", showSearch: false } });

        expect(screen.getByText("Website Builder")).toBeTruthy();
        expect(screen.queryByPlaceholderText("Search models")).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { WorkflowEditorView } from "./WorkflowEditorView.js";

const useCases = { name: "editor use cases" } as unknown as IWorkflowEditorUseCases;
const reviewUseCases = { name: "review use cases" } as unknown as IReviewReadUseCases;
const app = {
    appKind: "cms",
    panelLabel: "Content models",
    appliesToLabel: "Headless CMS model",
    init: vi.fn(),
    renderModelIcon: (modelId: string) => <span data-testid={`icon-${modelId}`} />
} as unknown as WorkflowEditorAppAdapter;

const createSetup = (status: "loading" | "ready") => {
    const fake = createFakeEditorViewPresenter(createEditorViewModel({ status }));
    const init = vi.fn();
    const dispose = vi.fn();
    const presenter = { ...fake, init, dispose };
    const container = new Container();
    container.registerInstance(
        WorkflowEditorPresenter,
        presenter as unknown as WorkflowEditorPresenter.Interface
    );
    return { container, init, dispose };
};

describe("WorkflowEditorView", () => {
    it("initialises the presenter with the per-app props and disposes it on unmount", () => {
        const { container, init, dispose } = createSetup("ready");

        const { unmount } = renderWithContainer(
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
            container
        );

        expect(init).toHaveBeenCalledTimes(1);
        expect(init).toHaveBeenCalledWith({ useCases, reviewUseCases, app });
        expect(dispose).not.toHaveBeenCalled();

        unmount();
        expect(dispose).toHaveBeenCalledTimes(1);
    });

    it("renders the layout from the presenter's view model", () => {
        const { container } = createSetup("loading");

        renderWithContainer(
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
            container
        );

        expect(screen.getByTestId("editor-loading")).toBeTruthy();
    });

    it("renders the app's model icons through the adapter", () => {
        const { container } = createSetup("ready");

        renderWithContainer(
            <WorkflowEditorView useCases={useCases} reviewUseCases={reviewUseCases} app={app} />,
            container
        );

        expect(screen.getByTestId("icon-article")).toBeTruthy();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/ModelPanel.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorStates.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
```

Expected: every file fails with `Failed to resolve import` for the component it tests (`./ModelPanel.js`, `./EditorHeader.js`, the five state files, `./WorkflowEditorLayout.js`, `./WorkflowEditorView.js`) and for `WorkflowEditorViewPresenter.js`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorViewPresenter.ts`:

```ts
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";

/*
 * The part of the editor presenter the layout reads and calls (Tasks 15-19). `WorkflowEditorView`
 * passes the resolved `WorkflowEditorPresenter.Interface` here, so a missing or renamed member is
 * a type error on that line. Tests build fakes against this type.
 */
export type WorkflowEditorViewPresenter = Pick<
    WorkflowEditorPresenter.Interface,
    | "vm"
    | "retry"
    | "retryModels"
    | "retryOptions"
    | "setSearch"
    | "loadMore"
    | "selectModel"
    | "createWorkflow"
    | "setName"
    | "save"
    | "retrySave"
    | "dismissBanner"
    | "reloadDuplicate"
    | "requestDelete"
    | "openTypePicker"
    | "closeTypePicker"
    | "addStep"
    | "moveStep"
    | "requestDeleteStep"
    | "confirmDialog"
    | "openStep"
    | "closeStep"
    | "cancelDialog"
>;
```

Create `packages/app-workflows/src/editor/presentation/editor/components/EditorLoading.tsx`:

```tsx
import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const PANEL_ROWS = [0, 1, 2, 3, 4, 5];
const FLOW_CARDS = [0, 1, 2];

// The static skeleton of the model panel and the flow (design README 4, loading state).
export const EditorLoading = () => {
    return (
        <div data-testid="editor-loading" className="grid grid-cols-[272px_1fr] h-main-content">
            <div className="flex flex-col gap-md p-md border-r border-neutral-dimmed">
                {PANEL_ROWS.map(row => (
                    <Skeleton key={row} type="text" />
                ))}
            </div>
            <div className="flex flex-col items-center gap-md p-lg">
                {FLOW_CARDS.map(card => (
                    <div
                        key={card}
                        data-testid="editor-skeleton-card"
                        className="w-full max-w-[680px] h-xxl"
                    >
                        <Skeleton type="area" />
                    </div>
                ))}
            </div>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/EditorDetailLoading.tsx`:

```tsx
import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const FLOW_CARDS = [0, 1, 2];

// The skeleton cards shown on the right while a model's workflow loads (design README 4).
export const EditorDetailLoading = () => {
    return (
        <div
            data-testid="editor-detail-loading"
            className="flex flex-col items-center gap-md p-lg"
        >
            {FLOW_CARDS.map(card => (
                <div
                    key={card}
                    data-testid="editor-skeleton-card"
                    className="w-full max-w-[680px] h-xxl"
                >
                    <Skeleton type="area" />
                </div>
            ))}
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/EditorLoadError.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";

export interface EditorLoadErrorProps {
    description: string;
    onRetry(): void;
}

// The load-error state: an empty state with the error and Try again (design README 4).
export const EditorLoadError = ({ description, onRetry }: EditorLoadErrorProps) => {
    return (
        <EmptyState
            illustration={false}
            title="Could not load workflows"
            description={description}
            actions={<Button variant="tertiary" text="Try again" onClick={onRetry} />}
        />
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/EditorNoPermission.tsx`:

```tsx
import React from "react";
import { EmptyState } from "@webiny/admin-ui";

// The no-permission state (design README 4).
export const EditorNoPermission = () => {
    return (
        <EmptyState
            illustration={false}
            title="You don't have access to workflows"
            description="Building workflows needs the Manage workflows permission. Ask an administrator to add it to your role."
        />
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/NoWorkflowState.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";

export interface NoWorkflowStateProps {
    title: string;
    description: string;
    onCreate(): void;
}

// The open model has no workflow: the title and description come from the presenter (design README 3).
export const NoWorkflowState = ({ title, description, onCreate }: NoWorkflowStateProps) => {
    return (
        <EmptyState
            illustration={false}
            title={title}
            description={description}
            actions={<Button variant="primary" text="Create workflow" onClick={onCreate} />}
        />
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/ModelPanel.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Skeleton } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as AccountTreeIcon } from "@webiny/icons/account_tree.svg";
import type { ModelPanelVm } from "~/editor/presentation/editor/abstractions.js";
import type { ModelRowVm } from "~/editor/presentation/editor/abstractions.js";

export interface ModelPanelProps {
    panel: ModelPanelVm;
    renderIcon(modelId: string): React.ReactNode;
    onSearch(search: string): void;
    onSelect(modelId: string): void;
    onLoadMore(): void;
    onRetry(): void;
}

interface ModelRowProps {
    row: ModelRowVm;
    icon: React.ReactNode;
    onSelect(modelId: string): void;
}

const SKELETON_ROWS = [0, 1, 2, 3];

const ModelRow = ({ row, icon, onSelect }: ModelRowProps) => {
    const rowClass = cn(
        "flex w-full items-center gap-sm px-sm py-xs rounded-md text-left",
        row.active && "bg-neutral-dimmed",
        !row.active && "hover:bg-neutral-light"
    );
    const nameClass = cn("text-md truncate", row.active && "font-semibold");
    let ariaCurrent: "true" | undefined = undefined;
    if (row.active) {
        ariaCurrent = "true";
    }

    let boundIndicator: React.ReactNode = null;
    if (row.bound) {
        boundIndicator = (
            <Icon
                icon={<AccountTreeIcon />}
                label="Has a workflow"
                size="sm"
                className="fill-success"
            />
        );
    }

    let unsavedDot: React.ReactNode = null;
    if (row.unsaved) {
        unsavedDot = (
            <span
                role="img"
                aria-label="Unsaved changes"
                className="shrink-0 size-sm rounded-full bg-primary"
            />
        );
    }

    return (
        <button
            type="button"
            aria-current={ariaCurrent}
            className={rowClass}
            onClick={() => onSelect(row.modelId)}
        >
            <span className="shrink-0 flex items-center justify-center size-lg">{icon}</span>
            <span className="flex flex-col min-w-0 grow">
                <span className={nameClass}>{row.name}</span>
                <span className="text-sm text-neutral-strong truncate">{row.subLine}</span>
            </span>
            {boundIndicator}
            {unsavedDot}
        </button>
    );
};

// The model panel: label, optional search, rows with icon, name, sub line and indicators, Load more.
export const ModelPanel = (props: ModelPanelProps) => {
    const { panel } = props;

    let searchInput: React.ReactNode = null;
    if (panel.showSearch) {
        searchInput = (
            <Input value={panel.search} onChange={props.onSearch} placeholder="Search models" />
        );
    }

    let list: React.ReactNode = null;
    if (panel.loading) {
        list = (
            <div data-testid="model-panel-loading" className="flex flex-col gap-sm">
                {SKELETON_ROWS.map(row => (
                    <Skeleton key={row} type="text" />
                ))}
            </div>
        );
    } else if (panel.emptyText !== null) {
        list = (
            <Text size="md" className="px-sm text-neutral-strong">
                {panel.emptyText}
            </Text>
        );
    } else {
        list = (
            <div className="flex flex-col gap-xxs">
                {panel.rows.map(row => (
                    <ModelRow
                        key={row.modelId}
                        row={row}
                        icon={props.renderIcon(row.modelId)}
                        onSelect={props.onSelect}
                    />
                ))}
            </div>
        );
    }

    let error: React.ReactNode = null;
    if (panel.error !== null) {
        error = (
            <div className="flex flex-col items-start gap-xs px-sm">
                <Text size="sm" className="text-destructive-primary">
                    {panel.error}
                </Text>
                <Button variant="tertiary" size="sm" text="Try again" onClick={props.onRetry} />
            </div>
        );
    }

    let loadMore: React.ReactNode = null;
    if (panel.hasMore && !panel.loading) {
        loadMore = (
            <Button
                variant="tertiary"
                size="sm"
                text="Load more"
                disabled={panel.loadingMore}
                onClick={props.onLoadMore}
            />
        );
    }

    return (
        <div
            data-testid="model-panel"
            className="flex flex-col gap-sm p-md overflow-y-auto border-r border-neutral-dimmed"
        >
            <Text
                as="div"
                size="sm"
                className="px-sm uppercase tracking-[0.04em] font-semibold text-neutral-strong"
            >
                {panel.label}
            </Text>
            {searchInput}
            {list}
            {error}
            {loadMore}
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { DropdownMenu } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as MoreHorizIcon } from "@webiny/icons/more_horiz.svg";
import type { WorkflowHeaderVm } from "~/editor/presentation/editor/abstractions.js";

export interface EditorHeaderProps {
    header: WorkflowHeaderVm;
    onNameChange(name: string): void;
    onSave(): void;
    onDelete(): void;
}

// The sticky header: name, Unsaved changes tag, applies-to line, the menu and Save (design README 3).
export const EditorHeader = ({ header, onNameChange, onSave, onDelete }: EditorHeaderProps) => {
    const validation = { isValid: header.nameError === null, message: header.nameError ?? undefined };

    let saveText = "Save";
    if (header.saving) {
        saveText = "Saving…";
    }
    const saveDisabled = !header.canSave || header.saving;

    let unsavedTag: React.ReactNode = null;
    if (header.dirty) {
        unsavedTag = <Tag variant="warning" content="Unsaved changes" />;
    }

    return (
        <div className="sticky top-0 z-10 flex items-start justify-between gap-md px-lg py-md bg-neutral-base border-b border-neutral-dimmed">
            <div className="flex flex-col gap-xs grow min-w-0 max-w-[560px]">
                <div className="flex items-center gap-sm">
                    <div className="grow">
                        <Input
                            aria-label="Workflow name"
                            value={header.name}
                            onChange={onNameChange}
                            validation={validation}
                        />
                    </div>
                    {unsavedTag}
                </div>
                <Text size="sm" className="text-neutral-strong">
                    {header.appliesTo}
                </Text>
            </div>
            <div className="flex flex-col items-end gap-xs shrink-0">
                <div className="flex items-center gap-xs">
                    <DropdownMenu
                        align="end"
                        side="bottom"
                        trigger={
                            <IconButton
                                aria-label="More actions"
                                title="More actions"
                                icon={<MoreHorizIcon />}
                            />
                        }
                    >
                        <DropdownMenu.Item
                            variant="destructive"
                            text="Delete workflow"
                            disabled={!header.canDelete}
                            onClick={onDelete}
                        />
                    </DropdownMenu>
                    <Button
                        variant="primary"
                        text={saveText}
                        disabled={saveDisabled}
                        onClick={onSave}
                    />
                </div>
                <Text size="sm" className="text-neutral-strong">
                    Changes apply to new review requests; reviews already running are not affected.
                </Text>
            </div>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`:

```tsx
import React from "react";
import { createReactiveComponent } from "@webiny/app-admin";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { EditorDetailLoading } from "./EditorDetailLoading.js";
import { EditorHeader } from "./EditorHeader.js";
import { EditorLoadError } from "./EditorLoadError.js";
import { EditorLoading } from "./EditorLoading.js";
import { EditorNoPermission } from "./EditorNoPermission.js";
import { ModelPanel } from "./ModelPanel.js";
import { NoWorkflowState } from "./NoWorkflowState.js";
import type { WorkflowEditorViewPresenter } from "./WorkflowEditorViewPresenter.js";

export interface WorkflowEditorLayoutProps {
    presenter: WorkflowEditorViewPresenter;
    app: Pick<WorkflowEditorAppAdapter, "renderModelIcon">;
}

/*
 * The presentational editor: the page states, the model panel and the open workflow's header. It
 * reads the presenter's render-ready view model and calls its commands (R234).
 */
export const WorkflowEditorLayout = createReactiveComponent(function WorkflowEditorLayout(
    props: WorkflowEditorLayoutProps
) {
    const { presenter, app } = props;
    const vm = presenter.vm;

    if (vm.status === "loading") {
        return <EditorLoading />;
    }
    if (vm.status === "failed") {
        return <EditorLoadError description={vm.error ?? ""} onRetry={() => presenter.retry()} />;
    }
    if (vm.status === "noAccess") {
        return <EditorNoPermission />;
    }

    const header = vm.header;
    let content: React.ReactNode = null;
    if (vm.detail === "loading") {
        content = <EditorDetailLoading />;
    } else if (vm.detail === "workflow" && header !== null) {
        content = (
            <div className="flex flex-col min-h-0 grow">
                <EditorHeader
                    header={header}
                    onNameChange={name => presenter.setName(name)}
                    onSave={() => presenter.save()}
                    onDelete={() => presenter.requestDelete()}
                />
                <div className="grow overflow-y-auto p-lg" />
            </div>
        );
    } else if (vm.detail === "empty" && vm.empty !== null) {
        content = (
            <NoWorkflowState
                title={vm.empty.title}
                description={vm.empty.description}
                onCreate={() => presenter.createWorkflow()}
            />
        );
    }

    return (
        <div data-testid="workflow-editor" className="grid grid-cols-[272px_1fr] h-main-content">
            <ModelPanel
                panel={vm.panel}
                renderIcon={modelId => app.renderModelIcon(modelId)}
                onSearch={search => presenter.setSearch(search)}
                onSelect={modelId => presenter.selectModel(modelId)}
                onLoadMore={() => presenter.loadMore()}
                onRetry={() => presenter.retryModels()}
            />
            <div className="flex flex-col min-w-0 overflow-hidden">{content}</div>
        </div>
    );
});
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import type { IReviewReadUseCases } from "~/review/useCases/IReviewReadUseCases.js";
import type { IWorkflowEditorUseCases } from "~/editor/useCases/IWorkflowEditorUseCases.js";
import type { WorkflowEditorAppAdapter } from "~/editor/WorkflowEditorAppAdapter.js";
import { WorkflowEditorPresenterFeature } from "~/editor/presentation/editor/feature.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";

export interface WorkflowEditorViewProps {
    useCases: IWorkflowEditorUseCases;
    reviewUseCases: IReviewReadUseCases;
    app: WorkflowEditorAppAdapter;
}

/*
 * The shared editor view the CMS and WB packages mount (Tasks 20 and 21). The per-app use cases,
 * the app's review use cases and the app adapter arrive as props and go to `presenter.init`
 * (the 8a mounting pattern).
 */
export const WorkflowEditorView = createReactiveComponent(function WorkflowEditorView(
    props: WorkflowEditorViewProps
) {
    const { useCases, reviewUseCases, app } = props;
    const { presenter } = useFeature(WorkflowEditorPresenterFeature);

    // The per-app mounting components pass singletons: a new identity would re-run `init` and drop the draft.
    useEffect(() => {
        void presenter.init({ useCases, reviewUseCases, app });
        return () => {
            presenter.dispose();
        };
    }, [presenter, useCases, reviewUseCases, app]);

    return <WorkflowEditorLayout presenter={presenter} app={app} />;
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/ModelPanel.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorStates.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: (a) the name input is found by its display value, which does not depend on whether `Input` forwards `aria-label`; (b) a Radix menu item is found after `fireEvent.keyDown(trigger, { key: "Enter" })`, the call the 8a list tests use; (c) `getByText("Unsaved changes", { selector: "span" })` in the layout test picks the header tag, which is a `span`, over the row dot, which has an `aria-label` but no text; (d) in the panel-wiring layout test there is one `Try again` button (the panel error), because the page-level error state is not shown while `status` is `ready`.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/ModelPanel.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorHeader.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/EditorStates.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; no TypeScript errors. The build is the type check of the co-located tests (R243). A type error on `presenter={presenter}` in `WorkflowEditorView.tsx` names the presenter member that is missing or differs (for `openStep` see the Contract notes; the others belong to Tasks 9 and 10): fix it in the presenter task, or rename in `WorkflowEditorViewPresenter.ts` and the layout, the single mapping point.

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
git add .
git checkout -- .gitleaks.toml
git commit -m "feat(app-workflows): add the workflow editor shell, model panel and header" -m "The shared editor view resolves the presenter, initialises it with the per-app use cases and adapter and renders the loading, load-error, no-permission and no-workflow states, the model panel (search, Load more, indicators, app icons, a failed page with Try again) and the sticky header (name, unsaved tag, Save, Delete workflow)." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No new DI feature, nothing to register.** The task adds components and test support only; `WorkflowEditorPresenterFeature` is Task 9's and `[AW]/app.tsx` registers it there. The view is mounted by Tasks 20 and 21 (`WorkflowEditorView` props `useCases`, `reviewUseCases`, `app`).
- **Drawer wiring is R284's** (Task 16): the editor presenter owns `openStep`, `closeStep`, `vm.openStepId` and `getNamespace`; the view renders `<StepDrawer source={presenter} stepId={vm.openStepId} />` and the drawer opens and closes itself and calls `source.closeStep()`. The view holds no drawer logic.
- **The narrow type is a `Pick`, not a copy.** `WorkflowEditorViewPresenter` lists member names of `WorkflowEditorPresenter.Interface` (Tasks 9, 9b and 10); the view-model types are the presenters' own, so nothing is declared twice.
- **`vm.detail` drives the right side** (Task 9): a skeleton for `loading` (Task 9 accepted having none, a small static one costs nothing and matches README 4), the header and content for `workflow`, the no-workflow state for `empty`.
- **Delete for a draft.** `header.canDelete` is false for a draft that was never saved; the menu item stays visible and disabled.
- **Accessible labels without a design source** (not visible text; the user accepted them, Q48): `Workflow name` (the input's `aria-label`), `More actions`, `Has a workflow`, `Unsaved changes` (the row dot; the header tag text is the design's).
- **`Retry` vs `Try again`:** the design lists both for the load error; README 4 says `Try again`, so that is used everywhere (page error, panel error).
