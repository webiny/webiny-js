### Task 11: Page view

R234, R243, R319 (`now` is the presenter's), R320 (Until label and `title` come from the VM), R321 (names banner), R322, R323, R329, R332, R337, R340; Q61, Q64, Q66, Q68.1, Q68.6; Copy gaps 2, 3, 4, 7; design DS:50-99 (frames 01-11), README 10; Review Focus 1, 4, 6. The page is a reactive component over the transient `ExclusionsPagePresenter` (Tasks 7, 8). It resolves the presenter with `useFeature(ExclusionsPagePresenterFeature)`, calls `init({ canManage, timeZone })` with `useWorkflowsPermission().editor` and `resolveViewerTimeZone()` (R337) and `dispose()` on unmount, then renders only the VM. Dialogs are Task 12; the route and menu are Task 13.

- **Always:** the header with the h1 `Reviewer exclusions` and the sub `Take people out of automatic assignment for a while, e.g. during leave or when their workload is too high.`; the primary `Add exclusion` button (icon `person_off`) only when `vm.canAdd` (R329), calling `openAdd()`.
- **`status: "loading"`:** five skeleton rows (R322, frame 09). No rules card, no toolbar.
- **`status: "failed"`:** icon `cloud_off` (destructive), `Could not load exclusions`, `The server did not respond. Try again in a moment.`, tertiary `Try again` with icon `refresh` calling `reload()` (R322; a server error shows the same, Copy gap 3).
- **`status: "noAccess"`:** icon `lock`, `You don't have access to reviewer exclusions`, `Managing exclusions needs the Manage workflows permission. Ask an administrator to add it to your role.` (R329, frame 11). No rules card, toolbar or button.
- **`status: "ready"`:** the names banner when `vm.namesFailed` (`Could not load user names.` with `Try again` calling `retryNames()`, R321, Copy gap 4); the rules card (four lines with the icons `block`, `person_off`, `assignment_ind`, `front_hand` and the R329 texts); the toolbar; then the empty state when `vm.empty !== null`, else the table.
- **Toolbar (R322, R332, R340, Copy gap 7):** the user filter is a `WorkflowPicker` 280px wide with `label` `Filter by user` (shown), `placeholder` `Filter by user`, `anyLabel` `All users`, `value` / `selected` / `options` from `vm.filter`, `onSearch` to `searchUserFilter(search)` and `onChange` to `setUserFilter(id)`; the tabs are a `SegmentedControl` from `vm.tabs` (`Active`, `Expired`, `All`) with `value` `vm.tab`, calling `setTab(tab)` with the `ExclusionTab` of the clicked item.
- **Empty (R322, R329):** the design icon (`person_off` or `history` from `vm.empty.icon`) with admin-ui `Icon` above an `EmptyState` with `illustration={false}`, `vm.empty.title`, `vm.empty.text`, and the primary `Add exclusion` (icon `person_off`) only when `vm.empty.showAdd`, calling `openAdd()`.
- **Table (R323, Copy gap 2):** admin-ui `Table`, columns `User`, `Reason`, `Until`, `Status` and an empty actions header. User cell: `row.label` in weight 500; a muted row (a deleted user) shows the `person_off` icon before the muted label; `row.subLine` under it when not null (`This user no longer exists`). Reason: `row.reason`, muted when `row.reasonMuted` (`No reason given`). Until: `row.untilLabel` with `title={row.untilTitle}`. Status: an `Active` `Tag` with `className` `bg-warning-subtle text-warning-xstrong`, an `Expired` `Tag` with `variant="neutral-light"`, each with a dot span before the label; an expired row has `opacity-60`. Actions: ghost icon buttons `edit` (`title` `Edit`, `aria-label` `row.editLabel`) and `delete` (`title` `Remove`, `aria-label` `row.removeLabel`), both always enabled (Q64: a deleted user's entry can be edited and removed); they stop the click from reaching the row. A row click calls `openEdit(row.userId)` (mouse convenience; the Edit button is the keyboard path).
- **Copy:** the fixed page strings live in `exclusionsCopy.ts` (one `export const` per string, the `pickerTexts.ts` style); labels computed by the presenter (rows, empty states, tabs) come from the VM.

**Files:**
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/exclusionsCopy.ts`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsHeader.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsRulesCard.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsToolbar.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsTable.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsLoading.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsLoadError.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsEmpty.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsNoAccess.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsNamesBanner.tsx`
- Create: `packages/app-workflows/src/settings/testing/createExclusionsPageViewModel.ts` (pure builder)
- Create: `packages/app-workflows/src/settings/testing/createExclusionRowVm.ts` (pure builder)
- Create: `packages/app-workflows/src/settings/testing/fakeExclusionsPagePresenter.ts` (vitest fake)
- Test: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx`
- Test: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsTable.test.tsx`

**Interfaces:**
- Consumes: Task 7 (`ExclusionsPagePresenter` abstraction with `.Interface` and `.ViewModel` in `~/settings/presentation/exclusionsPage/abstractions.js`; the types `ExclusionsPageVm`, `ExclusionRowVm`, `ExclusionTabVm`, `ExclusionFilterVm` there; `ExclusionsSource` in `ExclusionsSource.js`; `ExclusionsPagePresenterFeature` in `~/settings/presentation/exclusionsPage/feature.js`, resolving `{ presenter }`), Task 8 (`retryNames(): Promise<void>` on the interface), Task 4 (`resolveViewerTimeZone` in `~/settings/model/time/resolveViewerTimeZone.js`), Task 5 (`ExclusionTab` in `~/settings/model/list/ExclusionTab.js`, `ExclusionsEmptyVm` in `~/settings/model/list/ExclusionsEmptyVm.js`), Task 6 (`createPickerOption` in `~/editor/testing/createPickerOption.js` carries `note: null`). Existing (verified with codegraph and the sources): `WorkflowPicker` / `WorkflowPickerProps` (`~/components/picker/WorkflowPicker.js`, props `value, selected, options, onSearch, onChange, placeholder, disabled, error, label, description?, required?, anyLabel?`), `useWorkflowsPermission` (`~/presentation/permissions/useWorkflowsPermission.js`), `renderWithAdminUi` and `renderWithContainer` (`~/review/testing/`), `useFeature` (`@webiny/app`), `createReactiveComponent` (`@webiny/app-admin`), admin-ui `Alert` (`Alert.Action`), `Button` (`icon`), `EmptyState` (`illustration`, `title`, `description`, `actions`), `Heading` (`level`, `as`), `Icon` (`label`, `icon`, `size`, `color`, rest props reach the svg), `IconButton`, `SegmentedControl` (`items`, `value`, `onChange`, items render as `role="radio"` buttons), `Skeleton`, `Table` (`Table.Header/Row/Head/Body/Cell`, HTML attributes pass through), `Tag` (`content`, `variant`, `className`, root HTML attributes), `Text`, `cn`; icons `@webiny/icons/{person_off,block,assignment_ind,front_hand,cloud_off,refresh,lock,edit,delete}.svg` (present in `packages/icons/dist`; the app-workflows vitest config stubs every svg as `<svg data-testid="svg-icon" {...props} />`).
- Produces: `ExclusionsPage` (no props; Task 12 adds the dialog hosts, Task 13 mounts it), the `exclusionsCopy.ts` constants, the page sub-components, `createExclusionsPageViewModel(overrides)`, `createExclusionRowVm(overrides)`, `createFakeExclusionsPagePresenter(vm)` / `FakeExclusionsPagePresenter` (with `setVm(vm)` for re-renders; Task 12 reuses all three).

**Test runner note:** admin package, `yarn test <path>` only; `.tsx` tests import `React`. The type check is `yarn build -p @webiny/app-workflows --no-cache` (R243).

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/testing/createExclusionRowVm.ts` (pure, no vitest):

```ts
import type { ExclusionRowVm } from "~/settings/presentation/exclusionsPage/abstractions.js";

// An active row of a found user with a reason and an end date in Zagreb; `overrides` win.
export const createExclusionRowVm = (overrides: Partial<ExclusionRowVm> = {}): ExclusionRowVm => {
    return {
        userId: "user-1",
        label: "Ana Kovač",
        muted: false,
        subLine: null,
        reason: "On leave",
        reasonMuted: false,
        untilLabel: "End of 20 Oct 2026",
        untilTitle: "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)",
        status: "active",
        statusLabel: "Active",
        editLabel: "Edit exclusion for Ana Kovač",
        removeLabel: "Remove exclusion for Ana Kovač",
        ...overrides
    };
};
```

Create `packages/app-workflows/src/settings/testing/createExclusionsPageViewModel.ts` (pure, no vitest):

```ts
import type { ExclusionsPageVm } from "~/settings/presentation/exclusionsPage/abstractions.js";

// A ready page on the Active tab with no rows, no filter and no dialog; `overrides` win.
export const createExclusionsPageViewModel = (
    overrides: Partial<ExclusionsPageVm> = {}
): ExclusionsPageVm => {
    return {
        status: "ready",
        canAdd: true,
        tab: "active",
        tabs: [
            { id: "active", label: "Active" },
            { id: "expired", label: "Expired" },
            { id: "all", label: "All" }
        ],
        filter: { value: null, selected: null, options: [] },
        rows: [],
        empty: null,
        namesFailed: false,
        dialog: null,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/settings/testing/fakeExclusionsPagePresenter.ts` (vitest fake; the VM sits in a MobX box so a reactive component re-renders on `setVm`):

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import { observable } from "mobx";
import { runInAction } from "mobx";
import type { ExclusionsPagePresenter } from "~/settings/presentation/exclusionsPage/abstractions.js";
import type { ExclusionsPageVm } from "~/settings/presentation/exclusionsPage/abstractions.js";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { createExclusionsPageViewModel } from "./createExclusionsPageViewModel.js";

type PagePresenter = ExclusionsPagePresenter.Interface;

export interface FakeExclusionsPagePresenter extends PagePresenter {
    init: Mock<PagePresenter["init"]>;
    reload: Mock<PagePresenter["reload"]>;
    retryNames: Mock<PagePresenter["retryNames"]>;
    setTab: Mock<PagePresenter["setTab"]>;
    setUserFilter: Mock<PagePresenter["setUserFilter"]>;
    searchUserFilter: Mock<PagePresenter["searchUserFilter"]>;
    openAdd: Mock<PagePresenter["openAdd"]>;
    openEdit: Mock<PagePresenter["openEdit"]>;
    openRemove: Mock<ExclusionsSource["openRemove"]>;
    closeDialog: Mock<ExclusionsSource["closeDialog"]>;
    dispose: Mock<PagePresenter["dispose"]>;
    getExclusions: Mock<ExclusionsSource["getExclusions"]>;
    getTimeZone: Mock<ExclusionsSource["getTimeZone"]>;
    getUserName: Mock<ExclusionsSource["getUserName"]>;
    applySaved: Mock<ExclusionsSource["applySaved"]>;
    // Replaces the view model; reactive components re-render.
    setVm(vm: ExclusionsPageVm): void;
}

// A page presenter that records every command and renders the given view model.
export const createFakeExclusionsPagePresenter = (
    vm: ExclusionsPageVm = createExclusionsPageViewModel()
): FakeExclusionsPagePresenter => {
    const state = observable.box(vm, { deep: false });

    const setVm = (next: ExclusionsPageVm): void => {
        runInAction(() => {
            state.set(next);
        });
    };

    return {
        get vm() {
            return state.get();
        },
        setVm,
        init: vi.fn(),
        reload: vi.fn(),
        retryNames: vi.fn(),
        setTab: vi.fn(),
        setUserFilter: vi.fn(),
        searchUserFilter: vi.fn(),
        openAdd: vi.fn(),
        openEdit: vi.fn(),
        openRemove: vi.fn(),
        closeDialog: vi.fn(),
        dispose: vi.fn(),
        getExclusions: vi.fn(),
        getTimeZone: vi.fn(),
        getUserName: vi.fn(),
        applySaved: vi.fn()
    };
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsTable.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createExclusionRowVm } from "~/settings/testing/createExclusionRowVm.js";
import { createFakeExclusionsPagePresenter } from "~/settings/testing/fakeExclusionsPagePresenter.js";
import type { ExclusionRowVm } from "../abstractions.js";
import { ExclusionsTable } from "./ExclusionsTable.js";

const ANA = createExclusionRowVm();

const DELETED = createExclusionRowVm({
    userId: "user-9",
    label: "Deleted user",
    muted: true,
    subLine: "This user no longer exists",
    reason: "No reason given",
    reasonMuted: true,
    untilLabel: "Until removed",
    untilTitle: "Until removed",
    editLabel: "Edit exclusion for Deleted user",
    removeLabel: "Remove exclusion for Deleted user"
});

const EXPIRED = createExclusionRowVm({
    userId: "user-2",
    label: "Luka Perić",
    reason: "Workload",
    untilLabel: "3 Sep 2026, 06:59",
    untilTitle: "Thu 3 Sep 2026, 06:59 CEST (Europe/Zagreb)",
    status: "expired",
    statusLabel: "Expired",
    editLabel: "Edit exclusion for Luka Perić",
    removeLabel: "Remove exclusion for Luka Perić"
});

const UNRESOLVED = createExclusionRowVm({
    userId: "user-77",
    label: "user-77",
    editLabel: "Edit exclusion for user-77",
    removeLabel: "Remove exclusion for user-77"
});

const renderTable = (rows: ExclusionRowVm[]) => {
    const presenter = createFakeExclusionsPagePresenter();
    const result = renderWithAdminUi(<ExclusionsTable rows={rows} presenter={presenter} />);
    return { presenter, result };
};

const getRow = (container: HTMLElement, userId: string): HTMLElement => {
    const row = container.querySelector<HTMLElement>(`[data-user-id="${userId}"]`);
    if (!row) {
        throw new Error(`No row for ${userId}.`);
    }
    return row;
};

describe("ExclusionsTable (R323)", () => {
    it("shows the column headers User, Reason, Until, Status and an empty actions header", () => {
        renderTable([ANA]);

        const headers = screen.getAllByRole("columnheader").map(header => header.textContent);

        expect(headers).toEqual(["User", "Reason", "Until", "Status", ""]);
    });

    it("shows the name, the reason and the until label with the full time as its title", () => {
        renderTable([ANA]);

        expect(screen.getByText("Ana Kovač")).toBeTruthy();
        expect(screen.getByText("On leave")).toBeTruthy();
        const until = screen.getByText("End of 20 Oct 2026");
        expect(until.getAttribute("title")).toBe("Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)");
    });

    it("shows a deleted user with the person_off icon, the muted label and the sub line", () => {
        const { result } = renderTable([DELETED]);

        const row = getRow(result.container, "user-9");
        const label = screen.getByText("Deleted user");

        expect(row.querySelector('[data-icon="person_off"]')).not.toBeNull();
        expect(label.className).toContain("text-neutral-muted");
        expect(screen.getByText("This user no longer exists")).toBeTruthy();
    });

    it("keeps both actions enabled on a deleted user's row (Q64)", () => {
        const { presenter } = renderTable([DELETED]);

        const edit: HTMLButtonElement = screen.getByRole("button", {
            name: "Edit exclusion for Deleted user"
        });
        const remove: HTMLButtonElement = screen.getByRole("button", {
            name: "Remove exclusion for Deleted user"
        });

        expect(edit.disabled).toBe(false);
        expect(remove.disabled).toBe(false);
        fireEvent.click(remove);
        expect(presenter.openRemove).toHaveBeenCalledWith("user-9");
    });

    it("shows an unresolved user by the raw id without the deleted-user marker", () => {
        const { result } = renderTable([UNRESOLVED]);

        const row = getRow(result.container, "user-77");

        expect(screen.getByText("user-77")).toBeTruthy();
        expect(row.querySelector('[data-icon="person_off"]')).toBeNull();
    });

    it("shows a missing reason muted", () => {
        renderTable([DELETED]);

        const reason = screen.getByText("No reason given");

        expect(reason.className).toContain("text-neutral-muted");
    });

    it("shows Active as a warning tag and Expired as a neutral tag, each with a dot", () => {
        const { result } = renderTable([ANA, EXPIRED]);

        const active = getRow(result.container, "user-1").querySelector<HTMLElement>(
            '[data-status="active"]'
        );
        const expired = getRow(result.container, "user-2").querySelector<HTMLElement>(
            '[data-status="expired"]'
        );

        expect(active?.textContent).toBe("Active");
        expect(active?.className).toContain("bg-warning-subtle");
        expect(active?.className).toContain("text-warning-xstrong");
        expect(active?.querySelector('[data-testid="exclusion-status-dot"]')).not.toBeNull();
        expect(expired?.textContent).toBe("Expired");
        expect(expired?.className).toContain("bg-neutral-light");
        expect(expired?.querySelector('[data-testid="exclusion-status-dot"]')).not.toBeNull();
    });

    it("dims an expired row and not an active one", () => {
        const { result } = renderTable([ANA, EXPIRED]);

        expect(getRow(result.container, "user-2").className).toContain("opacity-60");
        expect(getRow(result.container, "user-1").className).not.toContain("opacity-60");
    });

    it("names the row actions for screen readers and titles them Edit and Remove (Q68.6)", () => {
        renderTable([ANA]);

        const edit = screen.getByRole("button", { name: "Edit exclusion for Ana Kovač" });
        const remove = screen.getByRole("button", { name: "Remove exclusion for Ana Kovač" });

        expect(edit.getAttribute("title")).toBe("Edit");
        expect(remove.getAttribute("title")).toBe("Remove");
    });

    it("opens Edit from the Edit button once, without the row click", () => {
        const { presenter } = renderTable([ANA]);

        fireEvent.click(screen.getByRole("button", { name: "Edit exclusion for Ana Kovač" }));

        expect(presenter.openEdit).toHaveBeenCalledTimes(1);
        expect(presenter.openEdit).toHaveBeenCalledWith("user-1");
    });

    it("opens Remove from the Remove button and not Edit", () => {
        const { presenter } = renderTable([ANA]);

        fireEvent.click(screen.getByRole("button", { name: "Remove exclusion for Ana Kovač" }));

        expect(presenter.openRemove).toHaveBeenCalledWith("user-1");
        expect(presenter.openEdit).not.toHaveBeenCalled();
    });

    it("opens Edit on a row click", () => {
        const { presenter } = renderTable([ANA, EXPIRED]);

        fireEvent.click(screen.getByText("Workload"));

        expect(presenter.openEdit).toHaveBeenCalledWith("user-2");
    });

    it("renders the rows in the order of the view model", () => {
        const { result } = renderTable([EXPIRED, ANA, DELETED]);

        const ids = Array.from(result.container.querySelectorAll("[data-user-id]")).map(row =>
            row.getAttribute("data-user-id")
        );

        expect(ids).toEqual(["user-2", "user-1", "user-9"]);
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx`:

```tsx
import React from "react";
import { beforeEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createExclusionRowVm } from "~/settings/testing/createExclusionRowVm.js";
import { createExclusionsPageViewModel } from "~/settings/testing/createExclusionsPageViewModel.js";
import { createFakeExclusionsPagePresenter } from "~/settings/testing/fakeExclusionsPagePresenter.js";
import type { ExclusionsPageVm } from "../abstractions.js";
import { ExclusionsPagePresenter } from "../abstractions.js";
import { ExclusionsPage } from "./ExclusionsPage.js";

const permission = vi.hoisted(() => {
    return { editor: true };
});

vi.mock("~/presentation/permissions/useWorkflowsPermission.js", () => {
    return {
        useWorkflowsPermission: () => {
            return { editor: permission.editor, reassign: false };
        }
    };
});

vi.mock("~/settings/model/time/resolveViewerTimeZone.js", () => {
    return {
        resolveViewerTimeZone: () => {
            return "Europe/Zagreb";
        }
    };
});

const renderPage = (vm: ExclusionsPageVm) => {
    const presenter = createFakeExclusionsPagePresenter(vm);
    const container = new Container();
    container.registerInstance(ExclusionsPagePresenter, presenter);
    const result = renderWithContainer(<ExclusionsPage />, container);
    return { presenter, result };
};

const LOADING = createExclusionsPageViewModel({ status: "loading", canAdd: false });
const FAILED = createExclusionsPageViewModel({ status: "failed", canAdd: false });
const NO_ACCESS = createExclusionsPageViewModel({ status: "noAccess", canAdd: false });
const READY = createExclusionsPageViewModel({ rows: [createExclusionRowVm()] });

const queryAddButtons = () => {
    return screen.queryAllByRole("button", { name: "Add exclusion" });
};

describe("ExclusionsPage presenter wiring (R337)", () => {
    beforeEach(() => {
        permission.editor = true;
    });

    it("initialises the presenter with the editor permission and the viewer's zone, and disposes it", () => {
        const { presenter, result } = renderPage(READY);

        expect(presenter.init).toHaveBeenCalledTimes(1);
        expect(presenter.init).toHaveBeenCalledWith({
            canManage: true,
            timeZone: "Europe/Zagreb"
        });
        expect(presenter.dispose).not.toHaveBeenCalled();

        result.unmount();
        expect(presenter.dispose).toHaveBeenCalledTimes(1);
    });

    it("passes canManage false without the editor permission", () => {
        permission.editor = false;

        const { presenter } = renderPage(NO_ACCESS);

        expect(presenter.init).toHaveBeenCalledWith({
            canManage: false,
            timeZone: "Europe/Zagreb"
        });
    });
});

describe("ExclusionsPage states (R322, R329)", () => {
    beforeEach(() => {
        permission.editor = true;
    });

    it("always shows the title and the sub line", () => {
        [LOADING, FAILED, NO_ACCESS, READY].forEach(vm => {
            const { result } = renderPage(vm);

            expect(
                screen.getByRole("heading", { level: 1, name: "Reviewer exclusions" })
            ).toBeTruthy();
            expect(
                screen.getByText(
                    "Take people out of automatic assignment for a while, e.g. during leave or when their workload is too high."
                )
            ).toBeTruthy();
            result.unmount();
        });
    });

    it("shows five skeleton rows while loading, without the Add button, rules or toolbar", () => {
        renderPage(LOADING);

        expect(screen.getAllByTestId("exclusions-loading-row")).toHaveLength(5);
        expect(queryAddButtons()).toHaveLength(0);
        expect(screen.queryByTestId("exclusions-rules")).toBeNull();
        expect(screen.queryByTestId("exclusions-toolbar")).toBeNull();
    });

    it("shows the load error with Try again, which reloads, and no Add button", () => {
        const { presenter, result } = renderPage(FAILED);

        expect(screen.getByText("Could not load exclusions")).toBeTruthy();
        expect(
            screen.getByText("The server did not respond. Try again in a moment.")
        ).toBeTruthy();
        expect(result.container.querySelector('[data-icon="cloud_off"]')).not.toBeNull();
        expect(queryAddButtons()).toHaveLength(0);

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(presenter.reload).toHaveBeenCalledTimes(1);
    });

    it("shows the no-access view with the lock icon and nothing else", () => {
        const { result } = renderPage(NO_ACCESS);

        expect(screen.getByText("You don't have access to reviewer exclusions")).toBeTruthy();
        expect(
            screen.getByText(
                "Managing exclusions needs the Manage workflows permission. Ask an administrator to add it to your role."
            )
        ).toBeTruthy();
        expect(result.container.querySelector('[data-icon="lock"]')).not.toBeNull();
        expect(queryAddButtons()).toHaveLength(0);
        expect(screen.queryByTestId("exclusions-rules")).toBeNull();
        expect(screen.queryByTestId("exclusions-toolbar")).toBeNull();
        expect(screen.queryByTestId("exclusions-table")).toBeNull();
    });

    it("shows the Add button when the list is loaded, and it opens Add", () => {
        const { presenter } = renderPage(READY);

        const buttons = queryAddButtons();
        expect(buttons).toHaveLength(1);

        fireEvent.click(buttons[0]);

        expect(presenter.openAdd).toHaveBeenCalledTimes(1);
    });

    it("hides the Add button whenever canAdd is false", () => {
        renderPage(createExclusionsPageViewModel({ canAdd: false, rows: [createExclusionRowVm()] }));

        expect(queryAddButtons()).toHaveLength(0);
    });

    it("shows the four rules with their icons when ready", () => {
        const { result } = renderPage(READY);

        expect(screen.getByText("Automatic assignment skips excluded people.")).toBeTruthy();
        expect(screen.getByText("Reviewer pickers show them as Unavailable.")).toBeTruthy();
        expect(screen.getByText("Work they already hold stays with them.")).toBeTruthy();
        expect(screen.getByText("They can still start or take over work themselves.")).toBeTruthy();
        const rules = result.container.querySelector('[data-testid="exclusions-rules"]');
        const icons = Array.from(rules?.querySelectorAll("[data-icon]") ?? []).map(icon =>
            icon.getAttribute("data-icon")
        );
        expect(icons).toEqual(["block", "person_off", "assignment_ind", "front_hand"]);
    });

    it("shows the table with the rows when ready and not empty", () => {
        renderPage(READY);

        expect(screen.getByTestId("exclusions-table")).toBeTruthy();
        expect(screen.getByText("Ana Kovač")).toBeTruthy();
        expect(screen.queryByTestId("exclusions-empty")).toBeNull();
    });

    it("shows the empty state with its icon, texts and Add exclusion", () => {
        const { presenter, result } = renderPage(
            createExclusionsPageViewModel({
                empty: {
                    icon: "person_off",
                    title: "No exclusions",
                    text: "Everyone in reviewing teams can be assigned automatically.",
                    showAdd: true
                }
            })
        );

        const empty = screen.getByTestId("exclusions-empty");
        expect(screen.getByText("No exclusions")).toBeTruthy();
        expect(
            screen.getByText("Everyone in reviewing teams can be assigned automatically.")
        ).toBeTruthy();
        expect(empty.querySelector('[data-icon="person_off"]')).not.toBeNull();
        expect(screen.queryByTestId("exclusions-table")).toBeNull();
        expect(result.container.querySelector('[data-testid="exclusions-toolbar"]')).not.toBeNull();

        const buttons = queryAddButtons();
        expect(buttons).toHaveLength(2);
        fireEvent.click(buttons[1]);
        expect(presenter.openAdd).toHaveBeenCalledTimes(1);
    });

    it("shows the Expired empty state with the history icon and no button", () => {
        renderPage(
            createExclusionsPageViewModel({
                tab: "expired",
                empty: {
                    icon: "history",
                    title: "No expired exclusions",
                    text: "Exclusions move here after their end date.",
                    showAdd: false
                }
            })
        );

        const empty = screen.getByTestId("exclusions-empty");
        expect(screen.getByText("No expired exclusions")).toBeTruthy();
        expect(screen.getByText("Exclusions move here after their end date.")).toBeTruthy();
        expect(empty.querySelector('[data-icon="history"]')).not.toBeNull();
        expect(queryAddButtons()).toHaveLength(1);
    });

    it("shows the user-filter empty state without its button", () => {
        renderPage(
            createExclusionsPageViewModel({
                empty: {
                    icon: "person_off",
                    title: "No exclusions for this user",
                    text: "Everyone in reviewing teams can be assigned automatically.",
                    showAdd: false
                }
            })
        );

        expect(screen.getByText("No exclusions for this user")).toBeTruthy();
        expect(queryAddButtons()).toHaveLength(1);
    });

    it("shows the names banner with Try again, which retries the names (Q68.1)", () => {
        const { presenter } = renderPage(
            createExclusionsPageViewModel({
                namesFailed: true,
                rows: [createExclusionRowVm({ userId: "user-77", label: "user-77" })]
            })
        );

        expect(screen.getByText("Could not load user names.")).toBeTruthy();
        expect(screen.getByText("user-77")).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(presenter.retryNames).toHaveBeenCalledTimes(1);
    });

    it("shows no names banner when the names resolved", () => {
        renderPage(READY);

        expect(screen.queryByText("Could not load user names.")).toBeNull();
    });
});

describe("ExclusionsPage toolbar (R322, R332, R340)", () => {
    beforeEach(() => {
        permission.editor = true;
    });

    it("shows the Active, Expired and All tabs with the current one checked", () => {
        renderPage(createExclusionsPageViewModel({ tab: "expired", rows: [createExclusionRowVm()] }));

        const tabs = screen.getAllByRole("radio").map(tab => tab.textContent);
        const expired = screen.getByRole("radio", { name: "Expired" });

        expect(tabs).toEqual(["Active", "Expired", "All"]);
        expect(expired.getAttribute("aria-checked")).toBe("true");
    });

    it("switches the tab through the presenter", () => {
        const { presenter } = renderPage(READY);

        fireEvent.click(screen.getByRole("radio", { name: "All" }));

        expect(presenter.setTab).toHaveBeenCalledWith("all");
    });

    it("labels the user filter Filter by user and shows All users while no user is chosen", () => {
        renderPage(READY);

        expect(screen.getAllByText("Filter by user").length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText("All users")).toBeTruthy();
    });

    it("lists the filter options and sets the picked user", async () => {
        const options = [
            createPickerOption({ id: "user-1", label: "Ana Kovač" }),
            createPickerOption({
                id: "user-9",
                label: "Deleted user",
                description: "user-9",
                muted: true,
                icon: "person_off"
            })
        ];
        const { presenter } = renderPage(
            createExclusionsPageViewModel({
                rows: [createExclusionRowVm()],
                filter: { value: null, selected: null, options }
            })
        );

        const input = screen.getByRole("combobox");
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });
        fireEvent.click(await screen.findByText("user-9"));

        expect(presenter.setUserFilter).toHaveBeenCalledWith("user-9");
    });

    it("sends the typed filter text to the presenter", () => {
        const { presenter } = renderPage(READY);

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "ana" } });

        expect(presenter.searchUserFilter).toHaveBeenCalledWith("ana");
    });

    it("clears the filter through the All users row", async () => {
        const selected = createPickerOption({ id: "user-1", label: "Ana Kovač" });
        const { presenter } = renderPage(
            createExclusionsPageViewModel({
                rows: [createExclusionRowVm()],
                filter: { value: "user-1", selected, options: [selected] }
            })
        );

        const input = screen.getByRole("combobox");
        fireEvent.focus(input);
        fireEvent.keyDown(input, { key: "ArrowDown" });
        // With a user chosen the input shows its name and the list filters by it, so type the
        // clear row's label first (as `WorkflowPicker.test.tsx` does).
        fireEvent.change(input, { target: { value: "All" } });
        fireEvent.click(await screen.findByText("All users"));

        expect(presenter.setUserFilter).toHaveBeenCalledWith(null);
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsTable.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx 2>&1 | tail -30
```

Expected: both fail with `Failed to resolve import "./ExclusionsTable.js"` / `"./ExclusionsPage.js"`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/exclusionsCopy.ts`:

```ts
// The fixed texts of the Reviewer exclusions page (design DS:50-99, R322, R323, R329, R340, Q68.1).
export const EXCLUSIONS_PAGE_TITLE = "Reviewer exclusions";

export const EXCLUSIONS_PAGE_SUB =
    "Take people out of automatic assignment for a while, e.g. during leave or when their workload is too high.";

export const EXCLUSIONS_ADD_LABEL = "Add exclusion";

export const EXCLUSIONS_RULE_SKIPPED = "Automatic assignment skips excluded people.";

export const EXCLUSIONS_RULE_UNAVAILABLE = "Reviewer pickers show them as Unavailable.";

export const EXCLUSIONS_RULE_HELD_WORK = "Work they already hold stays with them.";

export const EXCLUSIONS_RULE_OWN_WORK = "They can still start or take over work themselves.";

// The filter's visible label (R340, Copy gap 7) and its placeholder; `anyLabel` wins over the placeholder.
export const EXCLUSIONS_FILTER_LABEL = "Filter by user";

export const EXCLUSIONS_FILTER_PLACEHOLDER = "Filter by user";

export const EXCLUSIONS_FILTER_ANY_LABEL = "All users";

export const EXCLUSIONS_COLUMN_USER = "User";

export const EXCLUSIONS_COLUMN_REASON = "Reason";

export const EXCLUSIONS_COLUMN_UNTIL = "Until";

export const EXCLUSIONS_COLUMN_STATUS = "Status";

export const EXCLUSIONS_EDIT_TITLE = "Edit";

export const EXCLUSIONS_REMOVE_TITLE = "Remove";

export const EXCLUSIONS_LOAD_ERROR_TITLE = "Could not load exclusions";

export const EXCLUSIONS_LOAD_ERROR_TEXT = "The server did not respond. Try again in a moment.";

// The load error's button and the names banner's button (Copy gap 4).
export const EXCLUSIONS_TRY_AGAIN = "Try again";

export const EXCLUSIONS_NO_ACCESS_TITLE = "You don't have access to reviewer exclusions";

export const EXCLUSIONS_NO_ACCESS_TEXT =
    "Managing exclusions needs the Manage workflows permission. Ask an administrator to add it to your role.";

export const EXCLUSIONS_NAMES_FAILED = "Could not load user names.";
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsHeader.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { Heading } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import { EXCLUSIONS_ADD_LABEL } from "../exclusionsCopy.js";
import { EXCLUSIONS_PAGE_SUB } from "../exclusionsCopy.js";
import { EXCLUSIONS_PAGE_TITLE } from "../exclusionsCopy.js";

export interface ExclusionsHeaderProps {
    canAdd: boolean;
    onAdd(): void;
}

// The page title and sub line, always shown; Add exclusion only once a list is loaded (R329).
export const ExclusionsHeader = ({ canAdd, onAdd }: ExclusionsHeaderProps) => {
    let add: React.ReactNode = null;
    if (canAdd) {
        add = (
            <Button
                variant="primary"
                text={EXCLUSIONS_ADD_LABEL}
                icon={<PersonOffIcon />}
                onClick={() => onAdd()}
            />
        );
    }

    return (
        <div className="flex items-start justify-between gap-md">
            <div className="flex flex-col gap-xs">
                <Heading level={4} as="h1">
                    {EXCLUSIONS_PAGE_TITLE}
                </Heading>
                <Text size="md" className="text-neutral-strong">
                    {EXCLUSIONS_PAGE_SUB}
                </Text>
            </div>
            {add}
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsRulesCard.tsx`:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { ReactComponent as AssignmentIndIcon } from "@webiny/icons/assignment_ind.svg";
import { ReactComponent as BlockIcon } from "@webiny/icons/block.svg";
import { ReactComponent as FrontHandIcon } from "@webiny/icons/front_hand.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import { EXCLUSIONS_RULE_HELD_WORK } from "../exclusionsCopy.js";
import { EXCLUSIONS_RULE_OWN_WORK } from "../exclusionsCopy.js";
import { EXCLUSIONS_RULE_SKIPPED } from "../exclusionsCopy.js";
import { EXCLUSIONS_RULE_UNAVAILABLE } from "../exclusionsCopy.js";

interface ExclusionsRuleLine {
    iconName: string;
    icon: React.ReactElement;
    text: string;
}

const RULES: ExclusionsRuleLine[] = [
    { iconName: "block", icon: <BlockIcon />, text: EXCLUSIONS_RULE_SKIPPED },
    { iconName: "person_off", icon: <PersonOffIcon />, text: EXCLUSIONS_RULE_UNAVAILABLE },
    { iconName: "assignment_ind", icon: <AssignmentIndIcon />, text: EXCLUSIONS_RULE_HELD_WORK },
    { iconName: "front_hand", icon: <FrontHandIcon />, text: EXCLUSIONS_RULE_OWN_WORK }
];

// What an exclusion does, four lines with their icons (R329, design DS:63).
export const ExclusionsRulesCard = () => {
    return (
        <div
            data-testid="exclusions-rules"
            className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-x-lg gap-y-sm rounded-md border-sm border-solid border-neutral-dimmed bg-neutral-base px-md py-sm-extra"
        >
            {RULES.map(rule => (
                <div key={rule.iconName} className="flex items-start gap-sm">
                    <Icon
                        icon={rule.icon}
                        label=""
                        size="sm"
                        color="neutral-light"
                        data-icon={rule.iconName}
                    />
                    <Text size="sm" className="text-neutral-strong">
                        {rule.text}
                    </Text>
                </div>
            ))}
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsToolbar.tsx`:

```tsx
import React from "react";
import { SegmentedControl } from "@webiny/admin-ui";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import type { ExclusionTab } from "~/settings/model/list/ExclusionTab.js";
import type { ExclusionFilterVm } from "../abstractions.js";
import type { ExclusionTabVm } from "../abstractions.js";
import type { ExclusionsPagePresenter } from "../abstractions.js";
import { EXCLUSIONS_FILTER_ANY_LABEL } from "../exclusionsCopy.js";
import { EXCLUSIONS_FILTER_LABEL } from "../exclusionsCopy.js";
import { EXCLUSIONS_FILTER_PLACEHOLDER } from "../exclusionsCopy.js";

export interface ExclusionsToolbarProps {
    tab: ExclusionTab;
    tabs: ExclusionTabVm[];
    filter: ExclusionFilterVm;
    presenter: ExclusionsPagePresenter.Interface;
}

interface ExclusionsTabItem {
    label: string;
    value: string;
}

/*
 * The user filter (the users in the list, searched on the client, R332) and the Active / Expired /
 * All tabs (R322). Both only forward to the presenter.
 */
export const ExclusionsToolbar = ({ tab, tabs, filter, presenter }: ExclusionsToolbarProps) => {
    const items: ExclusionsTabItem[] = tabs.map(item => {
        return { label: item.label, value: item.id };
    });

    const onTabChange = (value: string) => {
        const picked = tabs.find(item => item.id === value);
        if (picked) {
            presenter.setTab(picked.id);
        }
    };

    return (
        <div data-testid="exclusions-toolbar" className="flex flex-wrap items-end gap-md">
            <div className="w-[280px]">
                <WorkflowPicker
                    label={EXCLUSIONS_FILTER_LABEL}
                    placeholder={EXCLUSIONS_FILTER_PLACEHOLDER}
                    anyLabel={EXCLUSIONS_FILTER_ANY_LABEL}
                    value={filter.value}
                    selected={filter.selected}
                    options={filter.options}
                    disabled={false}
                    error={null}
                    onSearch={search => presenter.searchUserFilter(search)}
                    onChange={id => presenter.setUserFilter(id)}
                />
            </div>
            <div className="shrink-0">
                <SegmentedControl items={items} value={tab} onChange={onTabChange} />
            </div>
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsTable.tsx`:

```tsx
import React from "react";
import { Icon } from "@webiny/admin-ui";
import { IconButton } from "@webiny/admin-ui";
import { Table } from "@webiny/admin-ui";
import { Tag } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { cn } from "@webiny/admin-ui";
import { ReactComponent as DeleteIcon } from "@webiny/icons/delete.svg";
import { ReactComponent as EditIcon } from "@webiny/icons/edit.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import type { ExclusionRowVm } from "../abstractions.js";
import type { ExclusionsPagePresenter } from "../abstractions.js";
import { EXCLUSIONS_COLUMN_REASON } from "../exclusionsCopy.js";
import { EXCLUSIONS_COLUMN_STATUS } from "../exclusionsCopy.js";
import { EXCLUSIONS_COLUMN_UNTIL } from "../exclusionsCopy.js";
import { EXCLUSIONS_COLUMN_USER } from "../exclusionsCopy.js";
import { EXCLUSIONS_EDIT_TITLE } from "../exclusionsCopy.js";
import { EXCLUSIONS_REMOVE_TITLE } from "../exclusionsCopy.js";

export interface ExclusionsTableProps {
    rows: ExclusionRowVm[];
    presenter: ExclusionsPagePresenter.Interface;
}

interface ExclusionRowProps {
    row: ExclusionRowVm;
    presenter: ExclusionsPagePresenter.Interface;
}

interface ExclusionCellProps {
    row: ExclusionRowVm;
}

/*
 * The user cell: a muted row is a deleted user, marked with the person_off icon (QBZ-91; not an
 * avatar, so Q64 keeps it); the sub line is "This user no longer exists". An unresolved user shows
 * the raw id as its label.
 */
const ExclusionUserCell = ({ row }: ExclusionCellProps) => {
    let icon: React.ReactNode = null;
    if (row.muted) {
        icon = (
            <Icon
                icon={<PersonOffIcon />}
                label=""
                size="sm"
                color="neutral-light"
                data-icon="person_off"
            />
        );
    }

    let subLine: React.ReactNode = null;
    if (row.subLine !== null) {
        subLine = (
            <Text size="sm" className="text-neutral-muted">
                {row.subLine}
            </Text>
        );
    }

    const labelClass = cn("font-medium", row.muted && "text-neutral-muted");

    return (
        <div className="flex items-center gap-sm">
            {icon}
            <div className="flex flex-col">
                <Text className={labelClass}>{row.label}</Text>
                {subLine}
            </div>
        </div>
    );
};

// Active in the warning colours, Expired neutral, each with a dot (R323, QBZ-76).
const ExclusionStatusTag = ({ row }: ExclusionCellProps) => {
    const content = (
        <>
            <span
                data-testid="exclusion-status-dot"
                aria-hidden="true"
                className="mr-xs inline-block size-[6px] rounded-full bg-current"
            />
            {row.statusLabel}
        </>
    );

    if (row.status === "active") {
        return (
            <Tag
                content={content}
                className="bg-warning-subtle text-warning-xstrong"
                data-status="active"
            />
        );
    }

    return <Tag variant="neutral-light" content={content} data-status="expired" />;
};

// Edit and Remove, always enabled (Q64); the click stops here so the row does not open Edit too.
const ExclusionRowActions = ({ row, presenter }: ExclusionRowProps) => {
    const onEdit = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        presenter.openEdit(row.userId);
    };

    const onRemove = (event: React.MouseEvent<HTMLButtonElement>) => {
        event.stopPropagation();
        presenter.openRemove(row.userId);
    };

    return (
        <div className="flex items-center justify-end gap-xxs">
            <IconButton
                variant="ghost"
                size="sm"
                icon={<EditIcon />}
                aria-label={row.editLabel}
                title={EXCLUSIONS_EDIT_TITLE}
                onClick={onEdit}
            />
            <IconButton
                variant="ghost"
                size="sm"
                icon={<DeleteIcon />}
                aria-label={row.removeLabel}
                title={EXCLUSIONS_REMOVE_TITLE}
                onClick={onRemove}
            />
        </div>
    );
};

const ExclusionRow = ({ row, presenter }: ExclusionRowProps) => {
    const rowClass = cn("cursor-pointer", row.status === "expired" && "opacity-60");
    const reasonClass = cn(row.reasonMuted && "text-neutral-muted");

    return (
        <Table.Row
            data-user-id={row.userId}
            className={rowClass}
            onClick={() => presenter.openEdit(row.userId)}
        >
            <Table.Cell>
                <ExclusionUserCell row={row} />
            </Table.Cell>
            <Table.Cell>
                <span className={reasonClass}>{row.reason}</span>
            </Table.Cell>
            <Table.Cell className="whitespace-nowrap">
                <span title={row.untilTitle}>{row.untilLabel}</span>
            </Table.Cell>
            <Table.Cell>
                <ExclusionStatusTag row={row} />
            </Table.Cell>
            <Table.Cell>
                <ExclusionRowActions row={row} presenter={presenter} />
            </Table.Cell>
        </Table.Row>
    );
};

// Every entry of the current tab and filter, in the presenter's order (R322, R323).
export const ExclusionsTable = ({ rows, presenter }: ExclusionsTableProps) => {
    return (
        <div data-testid="exclusions-table" className="overflow-x-auto">
            <Table bordered className="min-w-[760px]">
                <Table.Header>
                    <Table.Row>
                        <Table.Head>{EXCLUSIONS_COLUMN_USER}</Table.Head>
                        <Table.Head>{EXCLUSIONS_COLUMN_REASON}</Table.Head>
                        <Table.Head>{EXCLUSIONS_COLUMN_UNTIL}</Table.Head>
                        <Table.Head>{EXCLUSIONS_COLUMN_STATUS}</Table.Head>
                        <Table.Head />
                    </Table.Row>
                </Table.Header>
                <Table.Body>
                    {rows.map(row => (
                        <ExclusionRow key={row.userId} row={row} presenter={presenter} />
                    ))}
                </Table.Body>
            </Table>
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsLoading.tsx`:

```tsx
import React from "react";
import { Skeleton } from "@webiny/admin-ui";

const ROWS = [0, 1, 2, 3, 4];

// Five skeleton rows while the list loads (R322, frame 09).
export const ExclusionsLoading = () => {
    return (
        <div
            data-testid="exclusions-loading"
            className="flex flex-col rounded-md border-sm border-solid border-neutral-dimmed bg-neutral-base"
        >
            {ROWS.map(row => (
                <div
                    key={row}
                    data-testid="exclusions-loading-row"
                    className="p-md border-b-sm border-solid border-neutral-dimmed"
                >
                    <Skeleton type="text" />
                </div>
            ))}
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsLoadError.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as CloudOffIcon } from "@webiny/icons/cloud_off.svg";
import { ReactComponent as RefreshIcon } from "@webiny/icons/refresh.svg";
import { EXCLUSIONS_LOAD_ERROR_TEXT } from "../exclusionsCopy.js";
import { EXCLUSIONS_LOAD_ERROR_TITLE } from "../exclusionsCopy.js";
import { EXCLUSIONS_TRY_AGAIN } from "../exclusionsCopy.js";

export interface ExclusionsLoadErrorProps {
    onRetry(): void;
}

/*
 * The list did not load (R322, frame 10; a server error shows the same, Copy gap 3). EmptyState
 * has no icon slot, so the design icon sits above it (R329).
 */
export const ExclusionsLoadError = ({ onRetry }: ExclusionsLoadErrorProps) => {
    return (
        <div data-testid="exclusions-load-error" className="flex flex-col items-center pt-xl">
            <Icon
                icon={<CloudOffIcon />}
                label=""
                size="lg"
                className="fill-destructive"
                data-icon="cloud_off"
            />
            <EmptyState
                illustration={false}
                title={EXCLUSIONS_LOAD_ERROR_TITLE}
                description={EXCLUSIONS_LOAD_ERROR_TEXT}
                actions={
                    <Button
                        variant="tertiary"
                        text={EXCLUSIONS_TRY_AGAIN}
                        icon={<RefreshIcon />}
                        onClick={() => onRetry()}
                    />
                }
            />
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsEmpty.tsx`:

```tsx
import React from "react";
import { Button } from "@webiny/admin-ui";
import { EmptyState } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import type { ExclusionsEmptyVm } from "~/settings/model/list/ExclusionsEmptyVm.js";
import { EXCLUSIONS_ADD_LABEL } from "../exclusionsCopy.js";

export interface ExclusionsEmptyProps {
    empty: ExclusionsEmptyVm;
    onAdd(): void;
}

const ICONS: Record<ExclusionsEmptyVm["icon"], React.ReactElement> = {
    person_off: <PersonOffIcon />,
    history: <HistoryIcon />
};

// The empty states of R322: the icon above EmptyState (R329), Add exclusion when the VM says so.
export const ExclusionsEmpty = ({ empty, onAdd }: ExclusionsEmptyProps) => {
    let actions: React.ReactNode = null;
    if (empty.showAdd) {
        actions = (
            <Button
                variant="primary"
                text={EXCLUSIONS_ADD_LABEL}
                icon={<PersonOffIcon />}
                onClick={() => onAdd()}
            />
        );
    }

    return (
        <div data-testid="exclusions-empty" className="flex flex-col items-center pt-xl">
            <Icon
                icon={ICONS[empty.icon]}
                label=""
                size="lg"
                color="neutral-light"
                data-icon={empty.icon}
            />
            <EmptyState
                illustration={false}
                title={empty.title}
                description={empty.text}
                actions={actions}
            />
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsNoAccess.tsx`:

```tsx
import React from "react";
import { EmptyState } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { ReactComponent as LockIcon } from "@webiny/icons/lock.svg";
import { EXCLUSIONS_NO_ACCESS_TEXT } from "../exclusionsCopy.js";
import { EXCLUSIONS_NO_ACCESS_TITLE } from "../exclusionsCopy.js";

// Without the editor permission, or after a NotAuthorized answer (R329, frame 11, Q68.4).
export const ExclusionsNoAccess = () => {
    return (
        <div data-testid="exclusions-no-access" className="flex flex-col items-center pt-xl">
            <Icon
                icon={<LockIcon />}
                label=""
                size="lg"
                color="neutral-light"
                data-icon="lock"
            />
            <EmptyState
                illustration={false}
                title={EXCLUSIONS_NO_ACCESS_TITLE}
                description={EXCLUSIONS_NO_ACCESS_TEXT}
            />
        </div>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsNamesBanner.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { EXCLUSIONS_NAMES_FAILED } from "../exclusionsCopy.js";
import { EXCLUSIONS_TRY_AGAIN } from "../exclusionsCopy.js";

export interface ExclusionsNamesBannerProps {
    onRetry(): void;
}

// The user name lookup failed; the rows show the ids until Try again resolves them (R321, Q68.1).
export const ExclusionsNamesBanner = ({ onRetry }: ExclusionsNamesBannerProps) => {
    return (
        <Alert
            type="danger"
            variant="subtle"
            data-testid="exclusions-names-banner"
            actions={<Alert.Action text={EXCLUSIONS_TRY_AGAIN} onClick={() => onRetry()} />}
        >
            <div>{EXCLUSIONS_NAMES_FAILED}</div>
        </Alert>
    );
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import { createReactiveComponent } from "@webiny/app-admin";
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
import { resolveViewerTimeZone } from "~/settings/model/time/resolveViewerTimeZone.js";
import { ExclusionsPagePresenterFeature } from "../feature.js";
import { ExclusionsEmpty } from "./ExclusionsEmpty.js";
import { ExclusionsHeader } from "./ExclusionsHeader.js";
import { ExclusionsLoadError } from "./ExclusionsLoadError.js";
import { ExclusionsLoading } from "./ExclusionsLoading.js";
import { ExclusionsNamesBanner } from "./ExclusionsNamesBanner.js";
import { ExclusionsNoAccess } from "./ExclusionsNoAccess.js";
import { ExclusionsRulesCard } from "./ExclusionsRulesCard.js";
import { ExclusionsTable } from "./ExclusionsTable.js";
import { ExclusionsToolbar } from "./ExclusionsToolbar.js";

/*
 * The Reviewer exclusions page (R322, R329). The view passes the viewer's `editor` permission and
 * time zone to `init` (R337) and renders only the presenter's view model.
 */
export const ExclusionsPage = createReactiveComponent(function ExclusionsPage() {
    const { presenter } = useFeature(ExclusionsPagePresenterFeature);
    const permission = useWorkflowsPermission();
    const canManage = permission.editor;

    useEffect(() => {
        const timeZone = resolveViewerTimeZone();
        void presenter.init({ canManage, timeZone });
        return () => {
            presenter.dispose();
        };
    }, [presenter, canManage]);

    const vm = presenter.vm;

    let body: React.ReactNode = null;
    if (vm.status === "loading") {
        body = <ExclusionsLoading />;
    } else if (vm.status === "failed") {
        body = <ExclusionsLoadError onRetry={() => presenter.reload()} />;
    } else if (vm.status === "noAccess") {
        body = <ExclusionsNoAccess />;
    } else {
        let namesBanner: React.ReactNode = null;
        if (vm.namesFailed) {
            namesBanner = <ExclusionsNamesBanner onRetry={() => presenter.retryNames()} />;
        }

        let list: React.ReactNode = <ExclusionsTable rows={vm.rows} presenter={presenter} />;
        if (vm.empty !== null) {
            list = <ExclusionsEmpty empty={vm.empty} onAdd={() => presenter.openAdd()} />;
        }

        body = (
            <>
                {namesBanner}
                <ExclusionsRulesCard />
                <ExclusionsToolbar
                    tab={vm.tab}
                    tabs={vm.tabs}
                    filter={vm.filter}
                    presenter={presenter}
                />
                {list}
            </>
        );
    }

    return (
        <div data-testid="exclusions-page" className="flex flex-col gap-md p-lg">
            <ExclusionsHeader canAdd={vm.canAdd} onAdd={() => presenter.openAdd()} />
            {body}
        </div>
    );
});
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsTable.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx 2>&1 | tail -40
```

Expected: PASS. Notes for the first run: the `Filter by user` label text can appear twice (the label and, inside the picker, nowhere else since `anyLabel` replaces the placeholder), hence `getAllByText`. If the AutoComplete renders the `All users` row only after a search, the clear-row test types nothing and opens with `ArrowDown` as `WorkflowPicker.test.tsx` does; keep that pattern rather than changing the component. If `Table.Head` with no children does not render as a `columnheader` with empty text, compare against the rendered header texts instead and keep the five-column assertion.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.rows.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/ExclusionsPagePresenter.dialogs.test.ts 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/WorkflowPicker.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass (the page presenter's row and dialog tests are unchanged by this task; the view only reads their VM); the build prints no TypeScript errors.

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
git commit -m "feat(app-workflows): add the reviewer exclusions page view" -m "The page renders the exclusions presenter: header with Add exclusion once a list is loaded, the rules card, the user filter and the Active, Expired and All tabs, the table with deleted and unresolved users, and the loading, load error, empty, names banner and no-access states." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **Feature shape (checked against Task 7, controller ruling):** the page reads `const { presenter } = useFeature(ExclusionsPagePresenterFeature)`; Task 7's `feature.ts` resolves `{ presenter: container.resolve(Abstraction) }`.
- **`ExclusionsPagePresenter.Interface` (checked against Tasks 7 and 8, controller ruling):** Task 7's `IExclusionsPagePresenter extends ExclusionsSource` and Task 8 adds `retryNames(): Promise<void>`; the fake types `retryNames` from the interface and the six `ExclusionsSource` methods from `ExclusionsSource`, and Task 12's `source={presenter}` type-checks.
- **Deleted-user marker (controller ruling):** `ExclusionRowVm` has no `deleted` flag. The view shows `person_off` when `row.muted` is true; Task 7's `buildExclusionRowVm` sets `muted: deleted` (`name.state === "deleted"`), so an unresolved user (raw id) is not muted.
- **Rules card and toolbar only when ready:** R329 lists them under "When ready"; the design (DS:61-66) also shows them while loading and after an error. R329 wins.
- **Test support files** not in the contract's file list: `createExclusionsPageViewModel.ts`, `createExclusionRowVm.ts` (pure builders) and `fakeExclusionsPagePresenter.ts` (vitest fake, MobX box for `setVm`) in `[AWST]` per R243; Task 12 reuses them.
- **Names banner type:** `Alert type="danger"`, the 9b `OptionsFailureBanner` precedent (no design frame exists for it).
- **Heading:** `Heading level={4} as="h1"` keeps the admin page-title size while the element is the design's h1.
- Size: medium (eleven small components, three test-support files, two test files).

## Review fixes (sub-phase review)

- Step 5 ran the whole `packages/app-workflows/src/settings` folder; replaced by the page presenter's row and dialog test files by path (targeted tests, one file per command).
- `ExclusionsToolbar`: admin-ui `SegmentedControl` wraps itself in a `w-full` div, which pushed the tabs onto their own line under the filter; the control now sits in a `shrink-0` wrapper so the filter and the tabs share the toolbar row.
- Contract notes: the three "verify" items (feature resolve key, `Interface extends ExclusionsSource` with `retryNames`, `muted` only for deleted users) are checked against the Task 7 and Task 8 files and the controller rulings, and restated as facts.
