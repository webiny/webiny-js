### Task 19: Banners, toasts and the leave guard

R234, R276 (duplicate, transport failure, server validation banners), R279 (leaving), R281 (options failure banner); D92, D125; QBZ-10, QBZ-17, QBZ-18, Q43; design README 3 (duplicate banner under the header), `research-spec.md` 4.2 (QBZ-10, QBZ-17, QBZ-18); Review Focus 6 (leaving or switching never loses unsaved work silently) and 10. The banners under the editor header, and the guard that protects a dirty draft when the admin leaves the page. A banner is a destructive `Alert` under the header with an optional title, a message, an optional action button and an optional dismiss button. Two view-model banners exist (Tasks 9 and 10): `vm.saveBanner` after a failed save (`message`, `duplicate` or `transport`, with `canReload`, `canRetry` and `dismissible`) and `vm.optionsBanner` when a step option list failed to load. The banner buttons call `presenter.reloadDuplicate()`, `presenter.retrySave()`, `presenter.retryOptions()` and `presenter.dismissBanner()`. `useLeaveGuard(dirty, name)` registers a router transition guard that asks `Discard unsaved changes?` through `useDialogs` (the `ContentModelEditor.tsx` pattern) and, while dirty, a `beforeunload` listener so the browser raises its own prompt.

- **Banners (R276, R281, QBZ-10, QBZ-18)** (the texts are assembled by the presenters; the tests use them as literals):
  - `duplicate` (save banner): `Could not save the workflow — {Model} already has a workflow: “{name}”. A model can have one workflow.` (WB: `Could not save the workflow — Pages already have a workflow: “{name}”. Pages can have one workflow.`), action `Reload` when `canReload` (opens the `Reload workflow?` dialog, Task 18).
  - `message` (save banner; any other validation or server error, or an error on `name` or `steps`): `Could not save the workflow — {server message}`, no action.
  - `transport` (save banner, QBZ-10): title `Could not save the workflow`, message `The server did not respond, so nothing was saved. Your changes are kept.`, action `Try again` when `canRetry` (the presenter reruns Save and toasts `Retrying…`), dismiss button when `dismissible`.
  - options banner (Q43, R281): `Could not load the step options.`, action `Try again` (`retryOptions()`), no dismiss button.
  - Placement: under the header of the open workflow (the save banner, then the options banner); with no workflow open an options failure sits at the top of the right column above the no-workflow state.
- **Leave guard (R279, QBZ-17):**
  - `useLeaveGuard(dirty, name)` registers one router guard for the lifetime of the editor (`useRouter().addTransitionGuard`); the guard blocks while the latest `dirty` is true (read through a ref, so the guard is registered once).
  - A blocked navigation opens `useDialogs().showDialog`: title `Discard unsaved changes?`, content `You have unsaved changes to “{name}”. If you leave this workflow now, they are lost.` (`this workflow` when the name is empty), `acceptLabel` `Discard changes`, `cancelLabel` `Keep editing`. Accept calls `router.confirmTransition()`; closing without accepting calls `router.cancelTransition()`. The admin dialogs call `onClose` after `onAccept` too, so an `accepted` flag stops the cancel after a confirm.
  - While `dirty`, a `beforeunload` listener calls `event.preventDefault()` and sets `event.returnValue = ""` (the browser's own prompt; its text cannot be customised); it is removed when the draft is clean and on unmount.
  - Switching the model with a dirty draft is not a route change: the presenter asks (the `discardChanges` dialog, Task 18).
- **Toasts (D125):** the contract's Task 19 line listed the toasts, but contract review 2 moved them: `IWorkflowEditorToasts` (`success`, `error`, `info`; the D125 options) ships with Task 5 and the presenters of Tasks 9, 10 and 14 call it (`Workflow saved`, `Saved as a new workflow`, `Workflow deleted`, `Loaded the latest version`, `Fix the highlighted steps before saving.`, `Fix the highlighted fields before saving.`, `Could not save. Check the highlighted step.`, `Retrying…`). This task adds no toast code; the 8a `ReviewToasts` stays review-only.

**Files:**
- Create: `packages/app-workflows/src/editor/presentation/editor/components/banners/EditorBanner.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/banners/OptionsFailureBanner.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/banners/SaveBanner.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/useLeaveGuard.ts`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`
- Create: `packages/app-workflows/src/editor/testing/createBannerVm.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/banners/EditorBanners.test.tsx`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/useLeaveGuard.test.ts`
- Create: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutBanners.test.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`
- Modify: `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`

**Interfaces:**
- Consumes: Tasks 15-18 (`WorkflowEditorLayout`, `WorkflowEditorViewPresenter`, `createEditorViewModel`, `createFakeEditorViewPresenter`, `renderWithContainer`, `createFakeSortable`), Tasks 9 and 10 (`SaveBannerVm { kind: "message" | "duplicate" | "transport", title, message, canReload, canRetry, dismissible }`, `vm.saveBanner`, `reloadDuplicate()`, `retrySave()`, `dismissBanner()` (Task 10); `OptionsBannerVm { message }`, `vm.optionsBanner`, `retryOptions()` (Task 9)). Existing (verified): `useRouter` (`@webiny/app`; `addTransitionGuard({ guard, onBlocked })` returns a disposer, `confirmTransition`, `cancelTransition`), `useDialogs` (`@webiny/app-admin`; `showDialog({ title, content, acceptLabel, cancelLabel, onAccept, onClose })`), admin-ui `Alert` (props `type`, `variant`, `showCloseButton`, `onClose`, `actions`; `Alert.Action`; the close button is labelled `Close`).
- Produces: `EditorBanner`, `SaveBanner`, `OptionsFailureBanner`, `useLeaveGuard`, `createSaveBannerVm`, `createOptionsBannerVm`.

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. The router and the dialogs host are not mounted in component tests: the layout and view tests mock `./useLeaveGuard.js`, the guard's own test mocks `useRouter` and `useDialogs`.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/editor/testing/createBannerVm.ts` (a pure builder, R243; the texts are the presenters' copy):

```ts
import type { OptionsBannerVm } from "~/editor/presentation/editor/abstractions.js";
import type { SaveBannerKind } from "~/editor/presentation/editor/abstractions.js";
import type { SaveBannerVm } from "~/editor/presentation/editor/abstractions.js";

const SAVE_BANNERS: Record<SaveBannerKind, SaveBannerVm> = {
    duplicate: {
        kind: "duplicate",
        title: null,
        message:
            "Could not save the workflow — Article already has a workflow: “Article approval”. A model can have one workflow.",
        canReload: true,
        canRetry: false,
        dismissible: false
    },
    message: {
        kind: "message",
        title: null,
        message: "Could not save the workflow — Add at least one step.",
        canReload: false,
        canRetry: false,
        dismissible: false
    },
    transport: {
        kind: "transport",
        title: "Could not save the workflow",
        message: "The server did not respond, so nothing was saved. Your changes are kept.",
        canReload: false,
        canRetry: true,
        dismissible: true
    }
};

// The save banner of a kind with the design's copy; `overrides` changes single fields.
export const createSaveBannerVm = (
    kind: SaveBannerKind,
    overrides: Partial<SaveBannerVm> = {}
): SaveBannerVm => {
    return { ...SAVE_BANNERS[kind], ...overrides };
};

export const createOptionsBannerVm = (): OptionsBannerVm => {
    return { message: "Could not load the step options." };
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/banners/EditorBanners.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { SaveBannerKind } from "~/editor/presentation/editor/abstractions.js";
import type { SaveBannerVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createOptionsBannerVm } from "~/editor/testing/createBannerVm.js";
import { createSaveBannerVm } from "~/editor/testing/createBannerVm.js";
import { OptionsFailureBanner } from "./OptionsFailureBanner.js";
import { SaveBanner } from "./SaveBanner.js";

const renderSaveBanner = (banner: SaveBannerVm) => {
    const onReload = vi.fn();
    const onRetry = vi.fn();
    const onDismiss = vi.fn();
    renderWithAdminUi(
        <SaveBanner banner={banner} onReload={onReload} onRetry={onRetry} onDismiss={onDismiss} />
    );
    return { onReload, onRetry, onDismiss };
};

interface KindCase {
    kind: SaveBannerKind;
    testId: string;
}

const KINDS: KindCase[] = [
    { kind: "duplicate", testId: "duplicate-banner" },
    { kind: "message", testId: "message-banner" },
    { kind: "transport", testId: "transport-banner" }
];

describe("SaveBanner", () => {
    for (const { kind, testId } of KINDS) {
        it(`renders the ${kind} banner with its message`, () => {
            const banner = createSaveBannerVm(kind);
            renderSaveBanner(banner);

            expect(screen.getByTestId(testId)).toBeTruthy();
            expect(screen.getByText(banner.message)).toBeTruthy();
        });
    }

    it("shows the transport banner's title above its message (QBZ-10)", () => {
        renderSaveBanner(createSaveBannerVm("transport"));

        expect(screen.getByText("Could not save the workflow")).toBeTruthy();
        expect(
            screen.getByText("The server did not respond, so nothing was saved. Your changes are kept.")
        ).toBeTruthy();
    });

    it("shows no title for a banner without one", () => {
        renderSaveBanner(createSaveBannerVm("message"));

        expect(screen.queryByText("Could not save the workflow")).toBeNull();
    });

    it("runs Reload on the duplicate banner", () => {
        const { onReload, onRetry } = renderSaveBanner(createSaveBannerVm("duplicate"));

        fireEvent.click(screen.getByRole("button", { name: "Reload" }));

        expect(onReload).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
    });

    it("runs Try again on the transport banner", () => {
        const { onRetry, onReload } = renderSaveBanner(createSaveBannerVm("transport"));

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(onRetry).toHaveBeenCalledTimes(1);
        expect(onReload).not.toHaveBeenCalled();
    });

    it("has no Reload button when the duplicate banner cannot reload", () => {
        renderSaveBanner(createSaveBannerVm("duplicate", { canReload: false }));

        expect(screen.queryByRole("button", { name: "Reload" })).toBeNull();
    });

    it("has no action button on a plain message banner", () => {
        renderSaveBanner(createSaveBannerVm("message"));

        expect(screen.queryByRole("button", { name: "Try again" })).toBeNull();
        expect(screen.queryByRole("button", { name: "Reload" })).toBeNull();
    });

    it("dismisses a dismissible banner", () => {
        const { onDismiss, onRetry } = renderSaveBanner(createSaveBannerVm("transport"));

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(onDismiss).toHaveBeenCalledTimes(1);
        expect(onRetry).not.toHaveBeenCalled();
    });

    it("has no dismiss button on a banner that cannot be dismissed", () => {
        renderSaveBanner(createSaveBannerVm("duplicate"));

        expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    });
});

describe("OptionsFailureBanner", () => {
    it("shows the message and runs Try again", () => {
        const onRetry = vi.fn();
        renderWithAdminUi(<OptionsFailureBanner banner={createOptionsBannerVm()} onRetry={onRetry} />);

        expect(screen.getByTestId("options-banner")).toBeTruthy();
        expect(screen.getByText("Could not load the step options.")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(onRetry).toHaveBeenCalledTimes(1);
    });

    it("has no dismiss button", () => {
        renderWithAdminUi(<OptionsFailureBanner banner={createOptionsBannerVm()} onRetry={vi.fn()} />);

        expect(screen.queryByRole("button", { name: "Close" })).toBeNull();
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/components/useLeaveGuard.test.ts`:

```ts
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useLeaveGuard } from "./useLeaveGuard.js";

interface DirtyProps {
    dirty: boolean;
}

interface NameProps {
    name: string;
}

interface GuardConfig {
    guard(): boolean;
    onBlocked(): void;
}

interface DialogConfig {
    title: string;
    content: string;
    acceptLabel: string;
    cancelLabel: string;
    onAccept(): void;
    onClose(): void;
}

const router = vi.hoisted(() => ({
    addTransitionGuard: vi.fn(),
    confirmTransition: vi.fn(),
    cancelTransition: vi.fn()
}));

const dialogs = vi.hoisted(() => ({ showDialog: vi.fn() }));

vi.mock("@webiny/app", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app")>();
    return { ...actual, useRouter: () => router };
});

vi.mock("@webiny/app-admin", async importOriginal => {
    const actual = await importOriginal<typeof import("@webiny/app-admin")>();
    return { ...actual, useDialogs: () => dialogs };
});

const dispose = vi.fn();

const registeredGuard = (): GuardConfig => {
    return router.addTransitionGuard.mock.calls[0][0] as GuardConfig;
};

const shownDialog = (): DialogConfig => {
    return dialogs.showDialog.mock.calls[0][0] as DialogConfig;
};

const dispatchBeforeUnload = (): Event => {
    const event = new Event("beforeunload", { cancelable: true });
    window.dispatchEvent(event);
    return event;
};

describe("useLeaveGuard", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        router.addTransitionGuard.mockReturnValue(dispose);
    });

    it("registers one transition guard and disposes it on unmount", () => {
        const { rerender, unmount } = renderHook(
            (props: DirtyProps) => useLeaveGuard(props.dirty, "Article review"),
            { initialProps: { dirty: false } }
        );

        rerender({ dirty: true });
        rerender({ dirty: false });

        expect(router.addTransitionGuard).toHaveBeenCalledTimes(1);
        expect(dispose).not.toHaveBeenCalled();
        unmount();
        expect(dispose).toHaveBeenCalledTimes(1);
    });

    it("blocks a transition only while the latest draft is dirty", () => {
        const { rerender } = renderHook(
            (props: DirtyProps) => useLeaveGuard(props.dirty, "Article review"),
            { initialProps: { dirty: false } }
        );
        const config = registeredGuard();

        expect(config.guard()).toBe(false);
        rerender({ dirty: true });
        expect(config.guard()).toBe(true);
        rerender({ dirty: false });
        expect(config.guard()).toBe(false);
    });

    it("asks Discard unsaved changes? with the workflow's name", () => {
        renderHook(() => useLeaveGuard(true, "Article review"));

        registeredGuard().onBlocked();

        expect(dialogs.showDialog).toHaveBeenCalledTimes(1);
        const dialog = shownDialog();
        expect(dialog.title).toBe("Discard unsaved changes?");
        expect(dialog.content).toBe(
            "You have unsaved changes to “Article review”. If you leave this workflow now, they are lost."
        );
        expect(dialog.acceptLabel).toBe("Discard changes");
        expect(dialog.cancelLabel).toBe("Keep editing");
    });

    it("names an unnamed workflow as this workflow", () => {
        renderHook(() => useLeaveGuard(true, ""));

        registeredGuard().onBlocked();

        expect(shownDialog().content).toBe(
            "You have unsaved changes to “this workflow”. If you leave this workflow now, they are lost."
        );
    });

    it("uses the latest name in the dialog", () => {
        const { rerender } = renderHook(
            (props: NameProps) => useLeaveGuard(true, props.name),
            { initialProps: { name: "Article review" } }
        );
        rerender({ name: "Article sign-off" });

        registeredGuard().onBlocked();

        expect(shownDialog().content).toContain("“Article sign-off”");
    });

    it("confirms the transition on accept and does not cancel it when the dialog then closes", () => {
        renderHook(() => useLeaveGuard(true, "Article review"));
        registeredGuard().onBlocked();
        const dialog = shownDialog();

        dialog.onAccept();
        dialog.onClose();
        dialog.onClose();

        expect(router.confirmTransition).toHaveBeenCalledTimes(1);
        expect(router.cancelTransition).not.toHaveBeenCalled();
    });

    it("cancels the transition when the dialog closes without accepting", () => {
        renderHook(() => useLeaveGuard(true, "Article review"));
        registeredGuard().onBlocked();

        shownDialog().onClose();

        expect(router.cancelTransition).toHaveBeenCalled();
        expect(router.confirmTransition).not.toHaveBeenCalled();
    });

    it("asks the browser to confirm closing the tab only while dirty", () => {
        const { rerender } = renderHook(
            (props: DirtyProps) => useLeaveGuard(props.dirty, "Article review"),
            { initialProps: { dirty: false } }
        );

        expect(dispatchBeforeUnload().defaultPrevented).toBe(false);

        rerender({ dirty: true });
        expect(dispatchBeforeUnload().defaultPrevented).toBe(true);

        rerender({ dirty: false });
        expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });

    it("removes the beforeunload listener on unmount", () => {
        const { unmount } = renderHook(() => useLeaveGuard(true, "Article review"));

        expect(dispatchBeforeUnload().defaultPrevented).toBe(true);
        unmount();
        expect(dispatchBeforeUnload().defaultPrevented).toBe(false);
    });
});
```

Create `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutBanners.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { SortablePresenter } from "@webiny/app-admin/presentation/sortable/index.js";
import type { WorkflowEditorPresenter } from "~/editor/presentation/editor/abstractions.js";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createOptionsBannerVm } from "~/editor/testing/createBannerVm.js";
import { createSaveBannerVm } from "~/editor/testing/createBannerVm.js";
import { createEditorViewModel } from "~/editor/testing/createEditorViewModel.js";
import { createWorkflowHeaderVm } from "~/editor/testing/createEditorViewModel.js";
import { fakeViewApp } from "~/editor/testing/fakeViewApp.js";
import { createFakeEditorViewPresenter } from "~/editor/testing/fakeEditorViewPresenter.js";
import { createFakeSortable } from "~/editor/testing/fakeSortablePresenter.js";
import { WorkflowEditorLayout } from "./WorkflowEditorLayout.js";
import { useLeaveGuard } from "./useLeaveGuard.js";

vi.mock("./useLeaveGuard.js", () => {
    return { useLeaveGuard: vi.fn() };
});

const app = fakeViewApp;

const HEADER = createWorkflowHeaderVm({ dirty: true, canSave: true });

const renderLayout = (overrides: Partial<WorkflowEditorPresenter.ViewModel> = {}) => {
    const presenter = createFakeEditorViewPresenter(createEditorViewModel(overrides));
    const container = new Container();
    container.registerInstance(SortablePresenter, createFakeSortable());
    renderWithContainer(
        <WorkflowEditorLayout presenter={presenter} app={app} drawer={null} />,
        container
    );
    return presenter;
};

describe("WorkflowEditorLayout banners", () => {
    it("shows no banner while the view model has none", () => {
        renderLayout({ detail: "workflow", header: HEADER });

        expect(screen.queryByRole("alert")).toBeNull();
    });

    it("shows the save banner under the header of the open workflow", () => {
        renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("transport")
        });

        const header = screen.getByDisplayValue("Article review");
        const banner = screen.getByTestId("transport-banner");
        expect(
            header.compareDocumentPosition(banner) & Node.DOCUMENT_POSITION_FOLLOWING
        ).toBeTruthy();
        expect(screen.getByText("Could not save the workflow")).toBeTruthy();
    });

    it("sends the transport banner's retry and dismissal to the presenter", () => {
        const presenter = renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("transport")
        });

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retrySave).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(presenter.dismissBanner).toHaveBeenCalledTimes(1);
    });

    it("sends the duplicate banner's Reload to the presenter", () => {
        const presenter = renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("duplicate")
        });

        fireEvent.click(screen.getByRole("button", { name: "Reload" }));

        expect(presenter.reloadDuplicate).toHaveBeenCalledTimes(1);
    });

    it("shows an options failure under the header too, after the save banner", () => {
        const presenter = renderLayout({
            detail: "workflow",
            header: HEADER,
            saveBanner: createSaveBannerVm("message"),
            optionsBanner: createOptionsBannerVm()
        });

        const save = screen.getByTestId("message-banner");
        const options = screen.getByTestId("options-banner");
        expect(save.compareDocumentPosition(options) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("shows an options failure with no workflow open", () => {
        const presenter = renderLayout({ optionsBanner: createOptionsBannerVm() });

        expect(screen.getByText("Could not load the step options.")).toBeTruthy();
        fireEvent.click(screen.getByRole("button", { name: "Try again" }));
        expect(presenter.retryOptions).toHaveBeenCalledTimes(1);
    });

    it("shows the banner above the no-workflow state", () => {
        renderLayout({
            detail: "empty",
            optionsBanner: createOptionsBannerVm(),
            empty: {
                title: "Article has no workflow",
                description:
                    "Add a workflow to require a review before Article content can be published."
            }
        });

        const banner = screen.getByTestId("options-banner");
        const empty = screen.getByText("Article has no workflow");
        expect(banner.compareDocumentPosition(empty) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("guards leaving with the dirty flag and the name of the open workflow", () => {
        renderLayout({ detail: "workflow", header: HEADER });

        expect(useLeaveGuard).toHaveBeenLastCalledWith(true, "Article review");
    });

    it("does not guard leaving while the draft is clean", () => {
        renderLayout({ detail: "workflow", header: { ...HEADER, dirty: false } });

        expect(useLeaveGuard).toHaveBeenLastCalledWith(false, "Article review");
    });

    it("does not guard leaving without an open workflow", () => {
        renderLayout();

        expect(useLeaveGuard).toHaveBeenLastCalledWith(false, "");
    });
});
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx`: the layout now calls `useLeaveGuard`, which needs a router and a dialogs host that these tests do not mount. After the last `import` line of the file add

```tsx
vi.mock("./useLeaveGuard.js", () => {
    return { useLeaveGuard: vi.fn() };
});
```

and add `import { vi } from "vitest";` below `import { it } from "vitest";` if the file does not import `vi` yet.

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx`: after its last `import` line add the same

```tsx
vi.mock("./useLeaveGuard.js", () => {
    return { useLeaveGuard: vi.fn() };
});
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx`: after its `vi.mock("~/editor/presentation/stepDrawer/StepDrawer.js", ...)` block add

```tsx
vi.mock("./useLeaveGuard.js", () => {
    return { useLeaveGuard: vi.fn() };
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/banners/EditorBanners.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/useLeaveGuard.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutBanners.test.tsx 2>&1 | tail -30
```

Expected: `EditorBanners.test.tsx` fails with `Failed to resolve import` for `./SaveBanner.js` and `./OptionsFailureBanner.js`; `useLeaveGuard.test.ts` fails with `Failed to resolve import` for `./useLeaveGuard.js`; `WorkflowEditorLayoutBanners.test.tsx` fails the same way (`./useLeaveGuard.js` is mocked but does not exist) and, once it resolves, the banner cases fail because the layout renders no banner. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/editor/presentation/editor/components/banners/EditorBanner.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";

export interface EditorBannerProps {
    title: string | null;
    message: string;
    // The action button's text, or null for a banner without an action.
    actionLabel: string | null;
    dismissible: boolean;
    testId: string;
    onAction?(): void;
    onDismiss?(): void;
}

/*
 * The shell of every editor banner: a destructive alert under the header with an optional title,
 * the message, an optional action button and an optional dismiss button.
 */
export const EditorBanner = (props: EditorBannerProps) => {
    const { title, message, actionLabel, dismissible, testId, onAction, onDismiss } = props;

    let titleLine: React.ReactNode = null;
    if (title !== null) {
        titleLine = <div className="font-semibold">{title}</div>;
    }

    let actions: React.ReactElement | undefined = undefined;
    if (actionLabel !== null) {
        actions = <Alert.Action text={actionLabel} onClick={onAction} />;
    }

    return (
        <div className="px-lg pt-md">
            <Alert
                type="danger"
                variant="subtle"
                data-testid={testId}
                showCloseButton={dismissible}
                onClose={onDismiss}
                actions={actions}
            >
                {titleLine}
                <div>{message}</div>
            </Alert>
        </div>
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/banners/OptionsFailureBanner.tsx`:

```tsx
import React from "react";
import type { OptionsBannerVm } from "~/editor/presentation/editor/abstractions.js";
import { EditorBanner } from "./EditorBanner.js";

export interface OptionsFailureBannerProps {
    banner: OptionsBannerVm;
    onRetry(): void;
}

// A step option list failed to load while the editor loaded (Q43, R281); Try again reloads it.
export const OptionsFailureBanner = ({ banner, onRetry }: OptionsFailureBannerProps) => {
    return (
        <EditorBanner
            title={null}
            message={banner.message}
            actionLabel="Try again"
            dismissible={false}
            testId="options-banner"
            onAction={onRetry}
        />
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/banners/SaveBanner.tsx`:

```tsx
import React from "react";
import type { SaveBannerVm } from "~/editor/presentation/editor/abstractions.js";
import { EditorBanner } from "./EditorBanner.js";

export interface SaveBannerProps {
    banner: SaveBannerVm;
    onReload(): void;
    onRetry(): void;
    onDismiss(): void;
}

/*
 * The banner of a failed save (R276, Q43, QBZ-10, QBZ-18). The view model's flags drive it: Reload
 * when `canReload` (the duplicate-model banner), Try again when `canRetry` (the transport
 * failure), a dismiss button when `dismissible`; the test id is `{kind}-banner`.
 */
export const SaveBanner = ({ banner, onReload, onRetry, onDismiss }: SaveBannerProps) => {
    let actionLabel: string | null = null;
    let onAction = onDismiss;
    if (banner.canReload) {
        actionLabel = "Reload";
        onAction = onReload;
    } else if (banner.canRetry) {
        actionLabel = "Try again";
        onAction = onRetry;
    }

    return (
        <EditorBanner
            title={banner.title}
            message={banner.message}
            actionLabel={actionLabel}
            dismissible={banner.dismissible}
            testId={`${banner.kind}-banner`}
            onAction={onAction}
            onDismiss={onDismiss}
        />
    );
};
```

Create `packages/app-workflows/src/editor/presentation/editor/components/useLeaveGuard.ts`:

```ts
import { useEffect } from "react";
import { useRef } from "react";
import { useRouter } from "@webiny/app";
import { useDialogs } from "@webiny/app-admin";

const UNNAMED = "this workflow";

/*
 * Protects a dirty draft when the admin leaves the page (R279, QBZ-17). A router transition guard,
 * registered once, asks `Discard unsaved changes?` through the admin dialogs while `dirty` is true
 * (the `ContentModelEditor.tsx` pattern). While dirty, `beforeunload` raises the browser's own
 * prompt for closing the tab or reloading; its text cannot be customised.
 */
export const useLeaveGuard = (dirty: boolean, name: string): void => {
    const router = useRouter();
    const dialogs = useDialogs();

    const routerRef = useRef(router);
    routerRef.current = router;
    const dialogsRef = useRef(dialogs);
    dialogsRef.current = dialogs;
    const dirtyRef = useRef(dirty);
    dirtyRef.current = dirty;
    const nameRef = useRef(name);
    nameRef.current = name;

    useEffect(() => {
        return routerRef.current.addTransitionGuard({
            guard: () => dirtyRef.current,
            onBlocked: () => {
                let accepted = false;
                let label = nameRef.current;
                if (label === "") {
                    label = UNNAMED;
                }

                dialogsRef.current.showDialog({
                    title: "Discard unsaved changes?",
                    content: `You have unsaved changes to “${label}”. If you leave this workflow now, they are lost.`,
                    acceptLabel: "Discard changes",
                    cancelLabel: "Keep editing",
                    onAccept: () => {
                        accepted = true;
                        routerRef.current.confirmTransition();
                    },
                    // The admin dialogs also call `onClose` after `onAccept`.
                    onClose: () => {
                        if (!accepted) {
                            routerRef.current.cancelTransition();
                        }
                    }
                });
            }
        });
    }, []);

    useEffect(() => {
        if (!dirty) {
            return;
        }

        const onBeforeUnload = (event: BeforeUnloadEvent) => {
            event.preventDefault();
            event.returnValue = "";
        };
        window.addEventListener("beforeunload", onBeforeUnload);
        return () => {
            window.removeEventListener("beforeunload", onBeforeUnload);
        };
    }, [dirty]);
};
```

Modify `packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.tsx`. Add the imports after `import { ModelPanel } from "./ModelPanel.js";`:

```tsx
import { OptionsFailureBanner } from "./banners/OptionsFailureBanner.js";
import { SaveBanner } from "./banners/SaveBanner.js";
import { useLeaveGuard } from "./useLeaveGuard.js";
```

Replace the line

```tsx
    const vm = presenter.vm;
```

with

```tsx
    const vm = presenter.vm;

    let dirty = false;
    let workflowName = "";
    if (vm.header !== null) {
        dirty = vm.header.dirty;
        workflowName = vm.header.name;
    }
    useLeaveGuard(dirty, workflowName);
```

Replace the two lines

```tsx
    const header = vm.header;
    let content: React.ReactNode = null;
```

with

```tsx
    const header = vm.header;
    const inWorkflow = vm.detail === "workflow" && header !== null;

    let saveBanner: React.ReactNode = null;
    if (vm.saveBanner !== null) {
        saveBanner = (
            <SaveBanner
                banner={vm.saveBanner}
                onReload={() => presenter.reloadDuplicate()}
                onRetry={() => presenter.retrySave()}
                onDismiss={() => presenter.dismissBanner()}
            />
        );
    }

    let optionsBanner: React.ReactNode = null;
    if (vm.optionsBanner !== null) {
        optionsBanner = (
            <OptionsFailureBanner
                banner={vm.optionsBanner}
                onRetry={() => presenter.retryOptions()}
            />
        );
    }

    const banners = (
        <>
            {saveBanner}
            {optionsBanner}
        </>
    );

    let content: React.ReactNode = null;
```

Replace

```tsx
                    onDelete={() => presenter.requestDelete()}
                />
                <div className="grow overflow-y-auto p-lg">
```

with

```tsx
                    onDelete={() => presenter.requestDelete()}
                />
                {banners}
                <div className="grow overflow-y-auto p-lg">
```

Replace the line

```tsx
            <div className="flex flex-col min-w-0 overflow-hidden">{content}</div>
```

with

```tsx
            <div className="flex flex-col min-w-0 overflow-hidden">
                {inWorkflow ? null : banners}
                {content}
            </div>
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/banners/EditorBanners.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/useLeaveGuard.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutBanners.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: (a) the `vi.hoisted` `router` and `dialogs` objects are what the `vi.mock` factories return from `useRouter` and `useDialogs`, so the hook's refs see the same mocks on every render; (b) jsdom keeps `event.defaultPrevented` after a `cancelable` `beforeunload` `Event` is dispatched on `window`, which the tests read; (c) the `Alert` spreads `showCloseButton` and `onClose` onto its root `div`, so React may log an unknown-prop warning for them; no assertion depends on it, and it is not a failure.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/editor/presentation/editor/components/banners/EditorBanners.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/useLeaveGuard.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutBanners.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayout.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorLayoutFlow.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/editor/presentation/editor/components/WorkflowEditorView.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (the three older layout and view test files pass through the `useLeaveGuard` mock); no TypeScript errors. A type error on `vm.saveBanner`, `reloadDuplicate`, `retrySave`, `dismissBanner` or `retryOptions` means Tasks 9 and 10 expose another shape (Contract notes).

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
git commit -m "feat(app-workflows): add the editor banners and the leave guard" -m "The duplicate, server validation, transport failure and options failure banners show under the editor header with their action and dismiss buttons. The leave guard asks 'Discard unsaved changes?' before a router transition away from a dirty draft and raises the browser's own prompt on beforeunload while the draft is dirty." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: <CURRENT_SESSION_URL>"
```

If any step changes a file, fix it and rerun the chain from `git add .`. In the commit command, replace the literal `<CURRENT_SESSION_URL>` with the `https://claude.ai/code/session_...` URL of the session that runs the commit. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **No new DI feature, nothing to register.** The guard is a hook; the banners are components over `vm.saveBanner` and `vm.optionsBanner`.
- **Toasts moved out of this task** (contract review 2, I1): see the Toasts bullet above. The contract's Task 19 line ("the toasts through the 8a toast stack") is superseded by Task 5b's `IWorkflowEditorToasts`; nothing here depends on the 8a `ReviewToasts`.
- **Two banner view models, three components.** The contract names three banners (duplicate, transport failure, options failure); Task 10 adds a plain `message` kind for the generic server error. `SaveBanner` renders all save kinds from the flags (`canReload`, `canRetry`, `dismissible`) on the shared `EditorBanner`, and `OptionsFailureBanner` renders the options banner. `OptionsBannerVm` is Task 9's `{ message }`. Dismiss and the action buttons follow the flags Task 10 sets (`dismissible`, `canReload`, `canRetry`): duplicate and message banners are not dismissible, the transport banner is (QBZ-10).
- **The duplicate banner keeps the `Could not save the workflow — ` prefix on the WB wording** (QBZ-44 shows only the tail): R276 and Task 10 settle it as the presenter's text; the banner renders whatever message it gets.
- **Placement:** the save banner then the options banner sit under the header of the open workflow; with no open workflow (an options failure while no model is open, or a loading or empty detail) they sit at the top of the right column above the content. The design draws only the under-the-header case.
- **Leave guard and model switching:** the guard covers router transitions only (`addTransitionGuard`); switching the model in the panel is the presenter's `discardChanges` dialog (R279, Task 18). The guard is registered once through refs, so a changing `dirty` or name never re-registers it; the `accepted` flag guards against the admin dialogs' `onClose` after `onAccept`.
- **`beforeunload` text:** browsers ignore custom text; only the prompt appears (QBZ-17).
