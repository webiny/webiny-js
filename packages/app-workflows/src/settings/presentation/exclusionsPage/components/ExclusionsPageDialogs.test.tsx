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
