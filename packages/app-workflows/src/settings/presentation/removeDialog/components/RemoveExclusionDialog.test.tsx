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
            screen.getByText(
                "This user no longer exists, so removing the entry changes nothing else."
            )
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
