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
                user: {
                    value: null,
                    selected: null,
                    options: [],
                    locked: false,
                    error: "Choose a user."
                }
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
                user: {
                    value: "user-9",
                    selected: DELETED,
                    options: [],
                    locked: true,
                    error: null
                },
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
                user: {
                    value: "user-3",
                    selected: IVAN,
                    options: [IVAN],
                    locked: false,
                    error: null
                },
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
