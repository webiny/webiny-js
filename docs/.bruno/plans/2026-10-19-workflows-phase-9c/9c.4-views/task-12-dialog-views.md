### Task 12: Dialog views

R234, R243, R318, R319, R324, R325, R326, R336, R337, R338; Q63, Q64, Q65, Q68.2, Q68.3; Copy gaps 5, 6; design DS:139-173, 226-251 (frames 05-08, 15, 17, 20), README 10; Review Focus 7, 9. The Add / Edit dialog and the Remove dialog render the Task 9 and Task 10 presenters. Each has a host that resolves its transient presenter with `useFeature`, calls `init` with the page presenter as `source` and `dispose` on unmount (the 8a `ReassignDialogHost` pattern). `ExclusionsPage` renders the host for `vm.dialog`, keyed by kind and user, so a switch from Edit to Remove (the `Remove entry` button, R324) unmounts one host and mounts the other.

- **Add / Edit dialog (R324):** admin-ui `Dialog` 500px wide (`className="w-[500px]"`; the stock `md` size is 520px), title `vm.title` (`Add exclusion` / `Edit exclusion`), the stock close button. Top: the alert (`vm.alert`, icon `error`, R325), then the one note slot (`vm.note`: icon `history` for `expired`, icon `person_off` for `deletedUser` plus the tertiary small `Remove entry` calling `removeEntry()`), then the fields:
  - `User` (required): `WorkflowPicker` with `placeholder` `Search users`, `value` / `selected` / `options` / `error` from `vm.user`, disabled when `vm.user.locked` or `vm.saving`; `onSearch` to `searchUsers(search)`, `onChange` to `setUser(id)`. Listed users arrive disabled with the note `In the list` (Task 6 renders the note; Task 9 builds the options).
  - `Reason`: admin-ui `Input` with `placeholder` `e.g. On leave`, the hint `Optional. Shown only to people with Manage workflows or Reassign and operate.` as the field note, `value` `vm.reason`, `onChange` to `setReason(value)`, and the native `maxlength` 500 (`REASON_MAX_LENGTH`). admin-ui `Input` turns its `maxLength` prop into the input's `size` attribute (`InputPrimitive.tsx`: `size={maxLength}`), so the view sets `maxlength` on the element through `inputRef` (see Contract notes).
  - `Until`: admin-ui `DatePicker type="date"` 200px wide, `value` `vm.date`, `minDate={vm.minDate}` (R337), no `placeholder` prop (Copy gap 6: admin-ui's default `Pick a date`), the error `vm.dateError` (`Pick today or a later date.`) as the field validation, `onChange` to `setDate(value)`; the ghost `Clear` button while `vm.showClear`, calling `clearDate()`; under the row the hint `vm.dateHint` (`Optional. The exclusion ends at the end of that day ({tz}). Leave empty to keep it until you remove it.`, composed by the presenter).
  - Footer: tertiary `Cancel` calling `cancel()`, primary `vm.confirmLabel` (`Add exclusion` / `Save`, `Saving…` while saving) calling `submit()`; both disabled while `vm.saving`. Every field is disabled while saving.
  - Close, Escape and the overlay call `cancel()`; while saving the dialog is not dismissible (`dismissible={!vm.saving}`, Escape and the overlay do nothing) and `cancel()` itself is a no-op (R325, Task 9).
- **Remove dialog (R326):** title `vm.title` (`Remove exclusion?`), body `vm.body`, the alert `vm.alert` (icon `error`), footer tertiary `Cancel` and destructive `Remove` (`Remove` while removing too, disabled; Copy gap 5), both disabled while `vm.removing`; close, Escape and the overlay call `cancel()`, not dismissible while removing.
- **Page:** `ExclusionsPage` renders `<ExclusionDialogHost>` for `kind` `add` / `edit` and `<RemoveExclusionDialogHost>` for `remove` (with a user id), keyed `` `${kind}:${userId}` ``, with `source={presenter}`.

**Files:**
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialog.tsx`
- Create: `packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialogHost.tsx`
- Create: `packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialog.tsx`
- Create: `packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialogHost.tsx`
- Create: `packages/app-workflows/src/settings/testing/createExclusionDialogViewModel.ts` (pure builder)
- Create: `packages/app-workflows/src/settings/testing/createRemoveExclusionDialogViewModel.ts` (pure builder)
- Create: `packages/app-workflows/src/settings/testing/fakeExclusionDialogPresenter.ts` (vitest fake)
- Create: `packages/app-workflows/src/settings/testing/fakeRemoveExclusionDialogPresenter.ts` (vitest fake)
- Modify: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.tsx`
- Test: `packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialog.test.tsx`
- Test: `packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialog.test.tsx`
- Test: `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPageDialogs.test.tsx`

**Interfaces:**
- Consumes: Task 1 (`DateOnlyPicker` passes `minDate` to `Calendar` as `disabled={[{ before: minDate }]}`; parses `yyyy-MM-dd` as a local date), Task 5 (`REASON_MAX_LENGTH` in `~/settings/model/constants.js`), Task 6 (`PickerOption.note`, `createPickerOption` with `note`), Task 7 (`ExclusionsSource`, `ExclusionDialogRequest`, `ExclusionsPagePresenter`), Task 9 (`ExclusionDialogPresenter` abstraction with `.Interface` in `~/settings/presentation/exclusionDialog/abstractions.js`, `ExclusionDialogVm`, `ExclusionDialogNoteVm`, `ExclusionDialogInitParams` there; `ExclusionDialogPresenterFeature` in `~/settings/presentation/exclusionDialog/feature.js` resolving `{ presenter }`), Task 10 (`RemoveExclusionDialogPresenter` with `.Interface`, `RemoveExclusionDialogVm` in `~/settings/presentation/removeDialog/abstractions.js`; `RemoveExclusionDialogPresenterFeature` in `~/settings/presentation/removeDialog/feature.js` resolving `{ presenter }`), Task 11 (`ExclusionsPage`, `createExclusionsPageViewModel`, `createFakeExclusionsPagePresenter`). Existing (verified): admin-ui `Dialog` (`open`, `onOpenChange`, `title`, `dismissible`, `actions`, `className` to the content; not dismissible prevents Escape and outside clicks), `DatePicker` (`type="date"`, `value`, `onChange`, `minDate`, `validation`, `label`, `disabled`), `Input` (`inputRef`, `note`, `placeholder`), `Alert` (`icon`), `Button`, `Icon`, `Text`; `react-day-picker` 10 renders each day cell as `td[data-day="yyyy-MM-dd"]` with `data-disabled="true"` when disabled and a `button` inside; `WorkflowPicker`; `renderWithAdminUi`, `renderWithContainer`; `useFeature`, `createReactiveComponent`.
- Produces: `ExclusionDialog`, `ExclusionDialogHost` (`ExclusionDialogHostProps { source: ExclusionsSource; mode: ExclusionDialogInitParams["mode"]; userId: string | null }`), `RemoveExclusionDialog`, `RemoveExclusionDialogHost` (`RemoveExclusionDialogHostProps { source: ExclusionsSource; userId: string }`), the page's dialog rendering, `createExclusionDialogViewModel`, `createRemoveExclusionDialogViewModel`, `createFakeExclusionDialogPresenter`, `createFakeRemoveExclusionDialogPresenter`.

**Test runner note:** admin package, `yarn test <path>` only. The date test fakes only `Date` (`vi.useFakeTimers({ toFake: ["Date"] })`) so Radix timers keep running.

- [ ] **Step 1: Write the failing tests**

Create `packages/app-workflows/src/settings/testing/createExclusionDialogViewModel.ts` (pure, no vitest):

```ts
import type { ExclusionDialogVm } from "~/settings/presentation/exclusionDialog/abstractions.js";

// An empty Add dialog in Zagreb on 20 Oct 2026, nothing picked, not saving; `overrides` win.
export const createExclusionDialogViewModel = (
    overrides: Partial<ExclusionDialogVm> = {}
): ExclusionDialogVm => {
    return {
        title: "Add exclusion",
        user: { value: null, selected: null, options: [], locked: false, error: null },
        reason: "",
        date: null,
        minDate: new Date(2026, 9, 20),
        dateError: null,
        dateHint:
            "Optional. The exclusion ends at the end of that day (Europe/Zagreb). Leave empty to keep it until you remove it.",
        showClear: false,
        note: null,
        alert: null,
        confirmLabel: "Add exclusion",
        saving: false,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/settings/testing/createRemoveExclusionDialogViewModel.ts` (pure, no vitest):

```ts
import type { RemoveExclusionDialogVm } from "~/settings/presentation/removeDialog/abstractions.js";

// The Remove dialog of a found user, not removing; `overrides` win.
export const createRemoveExclusionDialogViewModel = (
    overrides: Partial<RemoveExclusionDialogVm> = {}
): RemoveExclusionDialogVm => {
    return {
        title: "Remove exclusion?",
        body: "Ana Kovač can be assigned automatically again. Nothing changes for work they already hold.",
        alert: null,
        removing: false,
        ...overrides
    };
};
```

Create `packages/app-workflows/src/settings/testing/fakeExclusionDialogPresenter.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import type { ExclusionDialogVm } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { createExclusionDialogViewModel } from "./createExclusionDialogViewModel.js";

type DialogPresenter = ExclusionDialogPresenter.Interface;

export interface FakeExclusionDialogPresenter extends DialogPresenter {
    vm: ExclusionDialogVm;
    init: Mock<DialogPresenter["init"]>;
    searchUsers: Mock<DialogPresenter["searchUsers"]>;
    setUser: Mock<DialogPresenter["setUser"]>;
    setReason: Mock<DialogPresenter["setReason"]>;
    setDate: Mock<DialogPresenter["setDate"]>;
    clearDate: Mock<DialogPresenter["clearDate"]>;
    submit: Mock<DialogPresenter["submit"]>;
    removeEntry: Mock<DialogPresenter["removeEntry"]>;
    cancel: Mock<DialogPresenter["cancel"]>;
    dispose: Mock<DialogPresenter["dispose"]>;
}

// An Add / Edit dialog presenter that records every command and renders the given view model.
export const createFakeExclusionDialogPresenter = (
    vm: ExclusionDialogVm = createExclusionDialogViewModel()
): FakeExclusionDialogPresenter => {
    return {
        vm,
        init: vi.fn(),
        searchUsers: vi.fn(),
        setUser: vi.fn(),
        setReason: vi.fn(),
        setDate: vi.fn(),
        clearDate: vi.fn(),
        submit: vi.fn(),
        removeEntry: vi.fn(),
        cancel: vi.fn(),
        dispose: vi.fn()
    };
};
```

Create `packages/app-workflows/src/settings/testing/fakeRemoveExclusionDialogPresenter.ts`:

```ts
import { vi } from "vitest";
import type { Mock } from "vitest";
import type { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
import type { RemoveExclusionDialogVm } from "~/settings/presentation/removeDialog/abstractions.js";
import { createRemoveExclusionDialogViewModel } from "./createRemoveExclusionDialogViewModel.js";

type RemovePresenter = RemoveExclusionDialogPresenter.Interface;

export interface FakeRemoveExclusionDialogPresenter extends RemovePresenter {
    vm: RemoveExclusionDialogVm;
    init: Mock<RemovePresenter["init"]>;
    confirm: Mock<RemovePresenter["confirm"]>;
    cancel: Mock<RemovePresenter["cancel"]>;
    dispose: Mock<RemovePresenter["dispose"]>;
}

// A Remove dialog presenter that records every command and renders the given view model.
export const createFakeRemoveExclusionDialogPresenter = (
    vm: RemoveExclusionDialogVm = createRemoveExclusionDialogViewModel()
): FakeRemoveExclusionDialogPresenter => {
    return {
        vm,
        init: vi.fn(),
        confirm: vi.fn(),
        cancel: vi.fn(),
        dispose: vi.fn()
    };
};
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialog.test.tsx`:

```tsx
import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { createExclusionDialogViewModel } from "~/settings/testing/createExclusionDialogViewModel.js";
import { createFakeExclusionDialogPresenter } from "~/settings/testing/fakeExclusionDialogPresenter.js";
import type { ExclusionDialogVm } from "../abstractions.js";
import { ExclusionDialog } from "./ExclusionDialog.js";

const ANA = createPickerOption({ id: "user-1", label: "Ana Kovač" });

const LISTED = createPickerOption({
    id: "user-2",
    label: "Luka Perić",
    disabled: true,
    note: "In the list"
});

const IVAN = createPickerOption({ id: "user-3", label: "Ivan Horvat" });

const DELETED = createPickerOption({
    id: "user-9",
    label: "Deleted user",
    muted: true,
    icon: "person_off"
});

const renderDialog = (vm: ExclusionDialogVm) => {
    const presenter = createFakeExclusionDialogPresenter(vm);
    const result = renderWithAdminUi(<ExclusionDialog presenter={presenter} />);
    return { presenter, result };
};

const getDayCell = (date: string): HTMLElement => {
    const cell = document.querySelector<HTMLElement>(`td[data-day="${date}"]`);
    if (!cell) {
        throw new Error(`No calendar cell for ${date}.`);
    }
    return cell;
};

const openUserList = (): HTMLElement => {
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    return input;
};

describe("ExclusionDialog fields (R324)", () => {
    it("shows the Add title, the three fields, the hints and the footer buttons", () => {
        renderDialog(createExclusionDialogViewModel());

        expect(screen.getAllByText("Add exclusion")).toHaveLength(2);
        expect(screen.getAllByText("User").length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText("Search users")).toBeTruthy();
        expect(screen.getAllByText("Reason").length).toBeGreaterThan(0);
        expect(screen.getByPlaceholderText("e.g. On leave")).toBeTruthy();
        expect(
            screen.getByText(
                "Optional. Shown only to people with Manage workflows or Reassign and operate."
            )
        ).toBeTruthy();
        expect(screen.getAllByText("Until").length).toBeGreaterThan(0);
        expect(
            screen.getByText(
                "Optional. The exclusion ends at the end of that day (Europe/Zagreb). Leave empty to keep it until you remove it."
            )
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Add exclusion" })).toBeTruthy();
        expect(screen.queryByRole("button", { name: "Clear" })).toBeNull();
        expect(screen.queryByTestId("exclusion-dialog-note")).toBeNull();
        expect(screen.queryByTestId("exclusion-dialog-alert")).toBeNull();
    });

    it("limits the reason to 500 characters and sends what is typed", () => {
        const { presenter } = renderDialog(createExclusionDialogViewModel({ reason: "On leave" }));

        const input: HTMLInputElement = screen.getByPlaceholderText("e.g. On leave");
        expect(input.getAttribute("maxlength")).toBe("500");
        expect(input.value).toBe("On leave");

        fireEvent.change(input, { target: { value: "Sick leave" } });

        expect(presenter.setReason).toHaveBeenCalledWith("Sick leave");
    });

    it("sends the typed user search to the presenter", () => {
        const { presenter } = renderDialog(createExclusionDialogViewModel());

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "iv" } });

        expect(presenter.searchUsers).toHaveBeenCalledWith("iv");
    });

    it("sets the picked user", async () => {
        const { presenter } = renderDialog(
            createExclusionDialogViewModel({
                user: {
                    value: null,
                    selected: null,
                    options: [ANA, IVAN],
                    locked: false,
                    error: null
                }
            })
        );

        openUserList();
        fireEvent.click(await screen.findByText("Ivan Horvat"));

        expect(presenter.setUser).toHaveBeenCalledWith("user-3");
    });

    it("lists a user already in the list disabled with the note In the list (Q64)", async () => {
        renderDialog(
            createExclusionDialogViewModel({
                user: {
                    value: null,
                    selected: null,
                    options: [ANA, LISTED],
                    locked: false,
                    error: null
                }
            })
        );

        openUserList();
        const note = await screen.findByText("In the list");
        const item = note.closest("[cmdk-item]");

        expect(item?.getAttribute("aria-disabled")).toBe("true");
    });

    it("shows the user error under the field", () => {
        renderDialog(
            createExclusionDialogViewModel({
                user: { value: null, selected: null, options: [], locked: false, error: "Choose a user." }
            })
        );

        expect(screen.getByText("Choose a user.")).toBeTruthy();
    });

    it("locks the user on Edit and shows the chosen name", () => {
        renderDialog(
            createExclusionDialogViewModel({
                title: "Edit exclusion",
                confirmLabel: "Save",
                user: { value: "user-1", selected: ANA, options: [], locked: true, error: null }
            })
        );

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(screen.getByText("Edit exclusion")).toBeTruthy();
        expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
        expect(input.disabled).toBe(true);
        expect(input.value).toBe("Ana Kovač");
    });

    it("shows the deleted-user note with Remove entry, which asks for the Remove dialog (QBZ-91)", () => {
        const { presenter } = renderDialog(
            createExclusionDialogViewModel({
                title: "Edit exclusion",
                confirmLabel: "Save",
                user: { value: "user-9", selected: DELETED, options: [], locked: true, error: null },
                note: {
                    kind: "deletedUser",
                    text: "This user was deleted, so the entry has no effect. Remove it."
                }
            })
        );

        const note = screen.getByTestId("exclusion-dialog-note");
        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(note.textContent).toContain(
            "This user was deleted, so the entry has no effect. Remove it."
        );
        expect(note.querySelector('[data-icon="person_off"]')).not.toBeNull();
        expect(input.value).toBe("Deleted user");
        expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();

        fireEvent.click(screen.getByRole("button", { name: "Remove entry" }));

        expect(presenter.removeEntry).toHaveBeenCalledTimes(1);
    });

    it("shows the expired note with the history icon and no Remove entry (QBZ-30)", () => {
        renderDialog(
            createExclusionDialogViewModel({
                title: "Edit exclusion",
                confirmLabel: "Save",
                note: {
                    kind: "expired",
                    text: "This exclusion has expired. Keep the date to change only the reason, or pick a new date to make it active again."
                }
            })
        );

        const note = screen.getByTestId("exclusion-dialog-note");

        expect(note.textContent).toContain(
            "This exclusion has expired. Keep the date to change only the reason, or pick a new date to make it active again."
        );
        expect(note.querySelector('[data-icon="history"]')).not.toBeNull();
        expect(screen.queryByRole("button", { name: "Remove entry" })).toBeNull();
    });

    it("shows Clear while a date is set, which clears it", () => {
        const { presenter } = renderDialog(
            createExclusionDialogViewModel({ date: "2026-10-22", showClear: true })
        );

        fireEvent.click(screen.getByRole("button", { name: "Clear" }));

        expect(presenter.clearDate).toHaveBeenCalledTimes(1);
    });

    it("shows the date error under the field", () => {
        renderDialog(
            createExclusionDialogViewModel({
                date: "2026-10-19",
                showClear: true,
                dateError: "Pick today or a later date."
            })
        );

        expect(screen.getByText("Pick today or a later date.")).toBeTruthy();
    });

    it("shows the alert with the error icon (R325)", () => {
        renderDialog(
            createExclusionDialogViewModel({
                alert: "The server did not respond, so nothing was changed. Try again."
            })
        );

        const alert = screen.getByTestId("exclusion-dialog-alert");

        expect(alert.textContent).toContain(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(alert.querySelector('[data-icon="error"]')).not.toBeNull();
    });

    it("shows a server message in the alert and keeps the entered values", () => {
        renderDialog(
            createExclusionDialogViewModel({
                user: { value: "user-3", selected: IVAN, options: [IVAN], locked: false, error: null },
                reason: "On leave",
                date: "2026-10-22",
                showClear: true,
                alert: "Could not save: This user is already in the list. Edit it instead."
            })
        );

        const reason: HTMLInputElement = screen.getByPlaceholderText("e.g. On leave");
        const user: HTMLInputElement = screen.getByRole("combobox");

        expect(
            screen.getByText("Could not save: This user is already in the list. Edit it instead.")
        ).toBeTruthy();
        expect(reason.value).toBe("On leave");
        expect(user.value).toBe("Ivan Horvat");
    });
});

describe("ExclusionDialog actions (R325)", () => {
    it("submits with the confirm button and cancels with Cancel and Escape", () => {
        const { presenter } = renderDialog(createExclusionDialogViewModel());

        fireEvent.click(screen.getByRole("button", { name: "Add exclusion" }));
        expect(presenter.submit).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(presenter.cancel).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
        expect(presenter.cancel).toHaveBeenCalledTimes(2);
    });

    it("shows Saving… and disables every control while saving; Escape does nothing", () => {
        const { presenter } = renderDialog(
            createExclusionDialogViewModel({
                saving: true,
                confirmLabel: "Saving…",
                date: "2026-10-22",
                showClear: true
            })
        );

        const confirm: HTMLButtonElement = screen.getByRole("button", { name: "Saving…" });
        const cancel: HTMLButtonElement = screen.getByRole("button", { name: "Cancel" });
        const clear: HTMLButtonElement = screen.getByRole("button", { name: "Clear" });
        const reason: HTMLInputElement = screen.getByPlaceholderText("e.g. On leave");
        const user: HTMLInputElement = screen.getByRole("combobox");

        expect(confirm.disabled).toBe(true);
        expect(cancel.disabled).toBe(true);
        expect(clear.disabled).toBe(true);
        expect(reason.disabled).toBe(true);
        expect(user.disabled).toBe(true);

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        expect(presenter.cancel).not.toHaveBeenCalled();
    });
});

describe("ExclusionDialog date field (R319, R336, R337)", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("disables the days before minDate in the rendered calendar", () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));
        renderDialog(createExclusionDialogViewModel({ minDate: new Date(2026, 9, 20) }));

        fireEvent.click(screen.getByText("Pick a date"));

        expect(getDayCell("2026-10-19").getAttribute("data-disabled")).toBe("true");
        expect(getDayCell("2026-10-01").getAttribute("data-disabled")).toBe("true");
        expect(getDayCell("2026-10-20").getAttribute("data-disabled")).toBeNull();
        expect(getDayCell("2026-10-21").getAttribute("data-disabled")).toBeNull();
    });

    it("sends the picked day as yyyy-MM-dd", () => {
        vi.useFakeTimers({ toFake: ["Date"] });
        vi.setSystemTime(new Date(2026, 9, 20, 12, 0, 0));
        const { presenter } = renderDialog(
            createExclusionDialogViewModel({ minDate: new Date(2026, 9, 20) })
        );

        fireEvent.click(screen.getByText("Pick a date"));
        const day = getDayCell("2026-10-22").querySelector("button");
        if (!day) {
            throw new Error("No day button for 2026-10-22.");
        }
        fireEvent.click(day);

        expect(presenter.setDate).toHaveBeenCalledWith("2026-10-22");
    });
});
```

Create `packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialog.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createRemoveExclusionDialogViewModel } from "~/settings/testing/createRemoveExclusionDialogViewModel.js";
import { createFakeRemoveExclusionDialogPresenter } from "~/settings/testing/fakeRemoveExclusionDialogPresenter.js";
import type { RemoveExclusionDialogVm } from "../abstractions.js";
import { RemoveExclusionDialog } from "./RemoveExclusionDialog.js";

const renderDialog = (vm: RemoveExclusionDialogVm) => {
    const presenter = createFakeRemoveExclusionDialogPresenter(vm);
    renderWithAdminUi(<RemoveExclusionDialog presenter={presenter} />);
    return presenter;
};

describe("RemoveExclusionDialog (R326)", () => {
    it("shows the title, the body and Cancel and Remove", () => {
        renderDialog(createRemoveExclusionDialogViewModel());

        expect(screen.getByText("Remove exclusion?")).toBeTruthy();
        expect(
            screen.getByText(
                "Ana Kovač can be assigned automatically again. Nothing changes for work they already hold."
            )
        ).toBeTruthy();
        expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
        expect(screen.getByRole("button", { name: "Remove" })).toBeTruthy();
        expect(screen.queryByTestId("remove-exclusion-alert")).toBeNull();
    });

    it("shows the deleted-user body", () => {
        renderDialog(
            createRemoveExclusionDialogViewModel({
                body: "This user no longer exists, so removing the entry changes nothing else."
            })
        );

        expect(
            screen.getByText("This user no longer exists, so removing the entry changes nothing else.")
        ).toBeTruthy();
    });

    it("confirms with Remove and cancels with Cancel and Escape", () => {
        const presenter = renderDialog(createRemoveExclusionDialogViewModel());

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));
        expect(presenter.confirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(presenter.cancel).toHaveBeenCalledTimes(1);

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
        expect(presenter.cancel).toHaveBeenCalledTimes(2);
    });

    it("keeps Remove as the label, disables both buttons and ignores Escape while removing", () => {
        const presenter = renderDialog(createRemoveExclusionDialogViewModel({ removing: true }));

        const remove: HTMLButtonElement = screen.getByRole("button", { name: "Remove" });
        const cancel: HTMLButtonElement = screen.getByRole("button", { name: "Cancel" });

        expect(remove.disabled).toBe(true);
        expect(cancel.disabled).toBe(true);

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        expect(presenter.cancel).not.toHaveBeenCalled();
    });

    it("shows the alert with the error icon (QBZ-74)", () => {
        renderDialog(
            createRemoveExclusionDialogViewModel({
                alert: "The server did not respond, so nothing was changed. Try again."
            })
        );

        const alert = screen.getByTestId("remove-exclusion-alert");

        expect(alert.textContent).toContain(
            "The server did not respond, so nothing was changed. Try again."
        );
        expect(alert.querySelector('[data-icon="error"]')).not.toBeNull();
    });
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPageDialogs.test.tsx`:

```tsx
import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { act } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { Container } from "@webiny/di";
import { renderWithContainer } from "~/review/testing/renderWithContainer.js";
import { ExclusionDialogPresenter } from "~/settings/presentation/exclusionDialog/abstractions.js";
import { RemoveExclusionDialogPresenter } from "~/settings/presentation/removeDialog/abstractions.js";
import { createExclusionsPageViewModel } from "~/settings/testing/createExclusionsPageViewModel.js";
import { createExclusionRowVm } from "~/settings/testing/createExclusionRowVm.js";
import { createExclusionDialogViewModel } from "~/settings/testing/createExclusionDialogViewModel.js";
import { createFakeExclusionDialogPresenter } from "~/settings/testing/fakeExclusionDialogPresenter.js";
import { createFakeExclusionsPagePresenter } from "~/settings/testing/fakeExclusionsPagePresenter.js";
import { createFakeRemoveExclusionDialogPresenter } from "~/settings/testing/fakeRemoveExclusionDialogPresenter.js";
import type { ExclusionDialogRequest } from "../abstractions.js";
import { ExclusionsPagePresenter } from "../abstractions.js";
import { ExclusionsPage } from "./ExclusionsPage.js";

vi.mock("~/presentation/permissions/useWorkflowsPermission.js", () => {
    return {
        useWorkflowsPermission: () => {
            return { editor: true, reassign: false };
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

const renderPage = (dialog: ExclusionDialogRequest | null) => {
    const page = createFakeExclusionsPagePresenter(
        createExclusionsPageViewModel({ rows: [createExclusionRowVm()], dialog })
    );
    const editDialog = createFakeExclusionDialogPresenter(
        createExclusionDialogViewModel({ title: "Edit exclusion", confirmLabel: "Save" })
    );
    const removeDialog = createFakeRemoveExclusionDialogPresenter();
    const container = new Container();
    container.registerInstance(ExclusionsPagePresenter, page);
    container.registerInstance(ExclusionDialogPresenter, editDialog);
    container.registerInstance(RemoveExclusionDialogPresenter, removeDialog);
    renderWithContainer(<ExclusionsPage />, container);
    return { page, editDialog, removeDialog };
};

describe("ExclusionsPage dialogs (R234, R318)", () => {
    it("renders no dialog without a request", () => {
        const { editDialog, removeDialog } = renderPage(null);

        expect(editDialog.init).not.toHaveBeenCalled();
        expect(removeDialog.init).not.toHaveBeenCalled();
        expect(screen.queryByTestId("exclusion-dialog")).toBeNull();
    });

    it("mounts the Add dialog with the page as its source", () => {
        const { page, editDialog } = renderPage({ kind: "add", userId: null });

        expect(editDialog.init).toHaveBeenCalledWith({ source: page, mode: "add", userId: null });
        expect(screen.getByTestId("exclusion-dialog")).toBeTruthy();
    });

    it("mounts the Edit dialog for the row's user", () => {
        const { page, editDialog } = renderPage({ kind: "edit", userId: "user-1" });

        expect(editDialog.init).toHaveBeenCalledWith({
            source: page,
            mode: "edit",
            userId: "user-1"
        });
        expect(screen.getByText("Edit exclusion")).toBeTruthy();
    });

    it("mounts the Remove dialog for the row's user", () => {
        const { page, removeDialog } = renderPage({ kind: "remove", userId: "user-1" });

        expect(removeDialog.init).toHaveBeenCalledWith({ source: page, userId: "user-1" });
        expect(screen.getByText("Remove exclusion?")).toBeTruthy();
    });

    it("switches from Edit to Remove: the Edit presenter is disposed, the Remove one starts", () => {
        const { page, editDialog, removeDialog } = renderPage({ kind: "edit", userId: "user-1" });

        act(() => {
            page.setVm(
                createExclusionsPageViewModel({
                    rows: [createExclusionRowVm()],
                    dialog: { kind: "remove", userId: "user-1" }
                })
            );
        });

        expect(editDialog.dispose).toHaveBeenCalledTimes(1);
        expect(removeDialog.init).toHaveBeenCalledWith({ source: page, userId: "user-1" });
        expect(screen.getByText("Remove exclusion?")).toBeTruthy();
        expect(screen.queryByTestId("exclusion-dialog")).toBeNull();
    });

    it("disposes the dialog presenter when the page closes the dialog", () => {
        const { page, removeDialog } = renderPage({ kind: "remove", userId: "user-1" });

        act(() => {
            page.setVm(createExclusionsPageViewModel({ rows: [createExclusionRowVm()] }));
        });

        expect(removeDialog.dispose).toHaveBeenCalledTimes(1);
        expect(screen.queryByTestId("remove-exclusion-dialog")).toBeNull();
    });
});
```

- [ ] **Step 2: Run the tests, expect failure**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPageDialogs.test.tsx 2>&1 | tail -30
```

Expected: the first two fail with `Failed to resolve import "./ExclusionDialog.js"` / `"./RemoveExclusionDialog.js"`; `ExclusionsPageDialogs.test.tsx` fails its five cases with a request (no `init` call, no dialog in the DOM) and passes `renders no dialog without a request`. Record the RED output.

- [ ] **Step 3: Implement**

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialog.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { DatePicker } from "@webiny/admin-ui";
import type { DatePickerProps } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Icon } from "@webiny/admin-ui";
import { Input } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import { ReactComponent as HistoryIcon } from "@webiny/icons/history.svg";
import { ReactComponent as PersonOffIcon } from "@webiny/icons/person_off.svg";
import { WorkflowPicker } from "~/components/picker/WorkflowPicker.js";
import { REASON_MAX_LENGTH } from "~/settings/model/constants.js";
import type { ExclusionDialogNoteVm } from "../abstractions.js";
import type { ExclusionDialogPresenter } from "../abstractions.js";

export interface ExclusionDialogProps {
    presenter: ExclusionDialogPresenter.Interface;
}

const REASON_HINT = "Optional. Shown only to people with Manage workflows or Reassign and operate.";

const NOTE_ICONS: Record<ExclusionDialogNoteVm["kind"], React.ReactElement> = {
    expired: <HistoryIcon />,
    deletedUser: <PersonOffIcon />
};

const NOTE_ICON_NAMES: Record<ExclusionDialogNoteVm["kind"], string> = {
    expired: "history",
    deletedUser: "person_off"
};

/*
 * admin-ui `Input` turns its `maxLength` prop into the `size` attribute, so the native limit is set
 * on the element (R324); the presenter still trims and caps the reason on save (R328).
 */
const limitReasonLength = (element: HTMLInputElement | null): void => {
    if (element === null) {
        return;
    }
    const limit = String(REASON_MAX_LENGTH);
    element.setAttribute("maxlength", limit);
};

/*
 * The Add / Edit exclusion dialog (R324, R325). It renders the presenter's view model only: the
 * alert, the one note slot, the user picker, the reason, the end date with Clear, and the footer.
 * Nothing closes while saving.
 */
export const ExclusionDialog = createReactiveComponent(function ExclusionDialog(
    props: ExclusionDialogProps
) {
    const { presenter } = props;
    const vm = presenter.vm;

    let alert: React.ReactNode = null;
    if (vm.alert !== null) {
        alert = (
            <Alert
                type="danger"
                variant="subtle"
                icon={<ErrorIcon data-icon="error" />}
                data-testid="exclusion-dialog-alert"
            >
                <div>{vm.alert}</div>
            </Alert>
        );
    }

    let note: React.ReactNode = null;
    if (vm.note !== null) {
        let removeEntry: React.ReactNode = null;
        if (vm.note.kind === "deletedUser") {
            removeEntry = (
                <Button
                    variant="tertiary"
                    size="sm"
                    text="Remove entry"
                    disabled={vm.saving}
                    onClick={() => presenter.removeEntry()}
                />
            );
        }
        note = (
            <div
                data-testid="exclusion-dialog-note"
                className="flex items-center gap-sm rounded-md bg-neutral-subtle px-sm-extra py-sm text-sm text-neutral-strong"
            >
                <Icon
                    icon={NOTE_ICONS[vm.note.kind]}
                    label=""
                    size="sm"
                    color="neutral-light"
                    data-icon={NOTE_ICON_NAMES[vm.note.kind]}
                />
                <span className="flex-1">{vm.note.text}</span>
                {removeEntry}
            </div>
        );
    }

    let clear: React.ReactNode = null;
    if (vm.showClear) {
        clear = (
            <Button
                variant="ghost"
                size="sm"
                text="Clear"
                disabled={vm.saving}
                onClick={() => presenter.clearDate()}
            />
        );
    }

    const userDisabled = vm.user.locked || vm.saving;
    let dateValidation: DatePickerProps["validation"] = undefined;
    if (vm.dateError !== null) {
        dateValidation = { isValid: false, message: vm.dateError };
    }

    const actions = (
        <>
            <Button
                variant="tertiary"
                text="Cancel"
                disabled={vm.saving}
                onClick={() => presenter.cancel()}
            />
            <Button
                variant="primary"
                text={vm.confirmLabel}
                disabled={vm.saving}
                onClick={() => presenter.submit()}
            />
        </>
    );

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    presenter.cancel();
                }
            }}
            title={vm.title}
            dismissible={!vm.saving}
            className="w-[500px]"
            actions={actions}
        >
            <div data-testid="exclusion-dialog" className="flex flex-col gap-md">
                {alert}
                {note}
                <WorkflowPicker
                    label="User"
                    required={true}
                    placeholder="Search users"
                    value={vm.user.value}
                    selected={vm.user.selected}
                    options={vm.user.options}
                    disabled={userDisabled}
                    error={vm.user.error}
                    onSearch={search => presenter.searchUsers(search)}
                    onChange={id => presenter.setUser(id)}
                />
                <Input
                    label="Reason"
                    placeholder="e.g. On leave"
                    note={REASON_HINT}
                    value={vm.reason}
                    disabled={vm.saving}
                    inputRef={limitReasonLength}
                    onChange={(value: string) => presenter.setReason(value)}
                />
                <div className="flex flex-col gap-xs">
                    <div className="flex items-end gap-sm">
                        <div className="w-[200px]">
                            <DatePicker
                                type="date"
                                label="Until"
                                value={vm.date ?? undefined}
                                minDate={vm.minDate}
                                disabled={vm.saving}
                                validation={dateValidation}
                                onChange={value => presenter.setDate(value ?? null)}
                            />
                        </div>
                        {clear}
                    </div>
                    <Text size="sm" className="text-neutral-strong">
                        {vm.dateHint}
                    </Text>
                </div>
            </div>
        </Dialog>
    );
});
```

Create `packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialogHost.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import type { ExclusionDialogInitParams } from "../abstractions.js";
import { ExclusionDialogPresenterFeature } from "../feature.js";
import { ExclusionDialog } from "./ExclusionDialog.js";

export interface ExclusionDialogHostProps {
    source: ExclusionsSource;
    mode: ExclusionDialogInitParams["mode"];
    userId: string | null;
}

// One transient presenter per mounted dialog; the page is its source (R318, R337).
export const ExclusionDialogHost = ({ source, mode, userId }: ExclusionDialogHostProps) => {
    const { presenter } = useFeature(ExclusionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({ source, mode, userId });
        return () => {
            presenter.dispose();
        };
    }, [presenter, source, mode, userId]);

    return <ExclusionDialog presenter={presenter} />;
};
```

Create `packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialog.tsx`:

```tsx
import React from "react";
import { Alert } from "@webiny/admin-ui";
import { Button } from "@webiny/admin-ui";
import { Dialog } from "@webiny/admin-ui";
import { Text } from "@webiny/admin-ui";
import { createReactiveComponent } from "@webiny/app-admin";
import { ReactComponent as ErrorIcon } from "@webiny/icons/error.svg";
import type { RemoveExclusionDialogPresenter } from "../abstractions.js";

export interface RemoveExclusionDialogProps {
    presenter: RemoveExclusionDialogPresenter.Interface;
}

/*
 * The Remove exclusion dialog (R326): the body, the alert after a failure (the row stays, R325),
 * Cancel and the destructive Remove. Nothing closes while removing; Remove keeps its label
 * (Copy gap 5).
 */
export const RemoveExclusionDialog = createReactiveComponent(function RemoveExclusionDialog(
    props: RemoveExclusionDialogProps
) {
    const { presenter } = props;
    const vm = presenter.vm;

    let alert: React.ReactNode = null;
    if (vm.alert !== null) {
        alert = (
            <Alert
                type="danger"
                variant="subtle"
                icon={<ErrorIcon data-icon="error" />}
                data-testid="remove-exclusion-alert"
            >
                <div>{vm.alert}</div>
            </Alert>
        );
    }

    const actions = (
        <>
            <Button
                variant="tertiary"
                text="Cancel"
                disabled={vm.removing}
                onClick={() => presenter.cancel()}
            />
            <Button
                variant="destructive"
                text="Remove"
                disabled={vm.removing}
                onClick={() => presenter.confirm()}
            />
        </>
    );

    return (
        <Dialog
            open={true}
            onOpenChange={open => {
                if (!open) {
                    presenter.cancel();
                }
            }}
            title={vm.title}
            dismissible={!vm.removing}
            actions={actions}
        >
            <div data-testid="remove-exclusion-dialog" className="flex flex-col gap-md">
                {alert}
                <Text size="md">{vm.body}</Text>
            </div>
        </Dialog>
    );
});
```

Create `packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialogHost.tsx`:

```tsx
import React from "react";
import { useEffect } from "react";
import { useFeature } from "@webiny/app";
import type { ExclusionsSource } from "~/settings/presentation/exclusionsPage/ExclusionsSource.js";
import { RemoveExclusionDialogPresenterFeature } from "../feature.js";
import { RemoveExclusionDialog } from "./RemoveExclusionDialog.js";

export interface RemoveExclusionDialogHostProps {
    source: ExclusionsSource;
    userId: string;
}

// One transient presenter per mounted Remove dialog; the page is its source (R318).
export const RemoveExclusionDialogHost = ({ source, userId }: RemoveExclusionDialogHostProps) => {
    const { presenter } = useFeature(RemoveExclusionDialogPresenterFeature);

    useEffect(() => {
        presenter.init({ source, userId });
        return () => {
            presenter.dispose();
        };
    }, [presenter, source, userId]);

    return <RemoveExclusionDialog presenter={presenter} />;
};
```

Modify `packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.tsx` (as Task 11 wrote it). Replace

```tsx
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
import { resolveViewerTimeZone } from "~/settings/model/time/resolveViewerTimeZone.js";
```

with

```tsx
import { useWorkflowsPermission } from "~/presentation/permissions/useWorkflowsPermission.js";
import { resolveViewerTimeZone } from "~/settings/model/time/resolveViewerTimeZone.js";
import { ExclusionDialogHost } from "~/settings/presentation/exclusionDialog/components/ExclusionDialogHost.js";
import { RemoveExclusionDialogHost } from "~/settings/presentation/removeDialog/components/RemoveExclusionDialogHost.js";
```

Replace

```tsx
/*
 * The Reviewer exclusions page (R322, R329). The view passes the viewer's `editor` permission and
 * time zone to `init` (R337) and renders only the presenter's view model.
 */
```

with

```tsx
/*
 * The Reviewer exclusions page (R322, R329). The view passes the viewer's `editor` permission and
 * time zone to `init` (R337) and renders only the presenter's view model. The open dialog is
 * `vm.dialog`; its host is keyed by kind and user, so a switch (Remove entry) remounts it.
 */
```

Replace

```tsx
    return (
        <div data-testid="exclusions-page" className="flex flex-col gap-md p-lg">
            <ExclusionsHeader canAdd={vm.canAdd} onAdd={() => presenter.openAdd()} />
            {body}
        </div>
    );
```

with

```tsx
    const request = vm.dialog;
    let dialog: React.ReactNode = null;
    if (request !== null && request.kind === "remove" && request.userId !== null) {
        dialog = (
            <RemoveExclusionDialogHost
                key={`remove:${request.userId}`}
                source={presenter}
                userId={request.userId}
            />
        );
    } else if (request !== null && request.kind !== "remove") {
        dialog = (
            <ExclusionDialogHost
                key={`${request.kind}:${request.userId ?? ""}`}
                source={presenter}
                mode={request.kind}
                userId={request.userId}
            />
        );
    }

    return (
        <div data-testid="exclusions-page" className="flex flex-col gap-md p-lg">
            <ExclusionsHeader canAdd={vm.canAdd} onAdd={() => presenter.openAdd()} />
            {body}
            {dialog}
        </div>
    );
```

- [ ] **Step 4: Run the new tests, expect pass**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionDialog/components/ExclusionDialog.test.tsx 2>&1 | tail -40
yarn test packages/app-workflows/src/settings/presentation/removeDialog/components/RemoveExclusionDialog.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPageDialogs.test.tsx 2>&1 | tail -30
```

Expected: PASS. Notes for the first run: the calendar opens on the month of the faked `Date` (October 2026) because no date is selected; if `Pick a date` is not the trigger text, Task 1 changed the default placeholder and the test uses the new text. If the minDate test fails with every day enabled, Task 1's `DateOnlyPicker` is not passing `disabled` to `Calendar`: stop and report (do not work around it here, Review Focus 9). If the Escape tests do not reach the dialog, dispatch the key on `document.activeElement ?? document` instead of `document`; keep the assertion.

- [ ] **Step 5: Run the existing tests covering the changed code and type-check**

```bash
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsPage.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/settings/presentation/exclusionsPage/components/ExclusionsTable.test.tsx 2>&1 | tail -30
yarn test packages/app-workflows/src/components/picker/renderPickerOption.test.tsx 2>&1 | tail -30
yarn build -p @webiny/app-workflows --no-cache 2>&1 | tail -30
```

Expected: all pass; the build prints no TypeScript errors (`source={presenter}` type-checks only when `ExclusionsPagePresenter.Interface` extends `ExclusionsSource`, see Contract notes).

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
git commit -m "feat(app-workflows): add the exclusion dialogs" -m "The Add and Edit dialog renders the user picker with listed users disabled, the reason, the end date with today as the earliest day and Clear, the expired and deleted-user notes and the save alert; the Remove dialog renders its body and alert. The page mounts the dialog of its current request." -m "Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>" -m "Claude-Session: https://claude.ai/code/session_01QU3bD1HmkGqCv78zmBsUFW"
```

If any step changes a file, fix it and rerun the chain from `git add .`. Never commit `.gitleaks.toml`, `docs/.reports` or `.superpowers`; never push, amend or revert.

## Contract notes

- **`Close` accessible name:** R324 and R326 name the close button `Close`. admin-ui's `Dialog` renders its own close button (`Dialog/components/CloseDialogIconButton.tsx`: an `IconButton` with only the `close` icon and no `aria-label`), and base packages other than Task 1's files may not change. The dialogs keep the stock close button; it calls `onOpenChange(false)`, which the view maps to `cancel()`. Its accessible name stays as admin-ui renders it; a base fix is a separate item for the controller.
- **Reason `maxLength`:** admin-ui `InputPrimitive` destructures `maxLength` and renders `size={maxLength}` on the `<input>`, so `maxLength={500}` would only widen the field. The view sets the native `maxlength` through `inputRef` (`limitReasonLength`), tested by the attribute; `normaliseReason` (Task 5) still caps pasted or loaded text (R328).
- **Dialog width:** admin-ui's `md` dialog is 520px; the design's 500px comes from `className="w-[500px]"` on the content (tailwind-merge keeps the later width).
- **Hints:** the reason hint is the `Input` `note` (shown under the field); the date hint is a `Text` under the date row, because the date field is 200px wide and the hint would wrap in it. The texts are verbatim R324.
- **`confirmLabel` while saving (checked against Task 9, controller ruling):** the view renders `vm.confirmLabel` and disables the button on `vm.saving`; Task 9's presenter returns `Saving…` as `confirmLabel` while `saving`.
- **Remove dialog `Cancel` variant:** tertiary, as the design's shared dialog footer (DS:169) for every dialog; R326 names the buttons only.
- **Feature shapes (checked against Tasks 9 and 10, controller ruling):** the hosts read `{ presenter }` from `ExclusionDialogPresenterFeature` and `RemoveExclusionDialogPresenterFeature`; both features resolve `{ presenter: container.resolve(Abstraction) }`.
- **Namespace types (checked against Tasks 9 and 10, controller ruling):** both abstractions export the namespace types `Interface` and `ViewModel`; the views and fakes use `.Interface` (R238). Both presenters build a valid VM before `init` (the source is null-checked), so the host's first render before its `init` effect is safe.
- **Test support files** not in the contract's file list: the two VM builders and the two fakes in `[AWST]` (R243).
- Size: medium (four components, four test-support files, one page hunk, three test files).

## Review fixes (sub-phase review)

- Contract notes: the three "verify" items (`Saving…` from Task 9, the features' `{ presenter }` resolve key, the `.Interface` namespace types) are checked against the Task 9 and Task 10 files and the controller rulings, and restated as facts; added that both presenters render a valid VM before `init`.
