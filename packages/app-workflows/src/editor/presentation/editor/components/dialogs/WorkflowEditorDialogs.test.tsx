import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { waitFor } from "@testing-library/react";
import { within } from "@testing-library/react";
import type { WorkflowEditorDialogKind } from "~/editor/presentation/editor/abstractions.js";
import type { WorkflowEditorDialogVm } from "~/editor/presentation/editor/abstractions.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createDialogVm } from "~/editor/testing/createDialogVm.js";
import { WorkflowEditorDialogs } from "./WorkflowEditorDialogs.js";

const renderDialog = (dialog: WorkflowEditorDialogVm | null) => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const result = renderWithAdminUi(
        <WorkflowEditorDialogs dialog={dialog} onConfirm={onConfirm} onCancel={onCancel} />
    );
    return { ...result, onConfirm, onCancel };
};

interface KindCase {
    kind: WorkflowEditorDialogKind;
    testId: string;
}

const KINDS: KindCase[] = [
    { kind: "discardChanges", testId: "discard-changes-dialog" },
    { kind: "conflict", testId: "conflict-dialog" },
    { kind: "deleted", testId: "deleted-dialog" },
    { kind: "deleteWorkflow", testId: "delete-workflow-dialog" },
    { kind: "blockedDelete", testId: "blocked-delete-dialog" },
    { kind: "deleteStep", testId: "delete-step-dialog" },
    { kind: "reloadWorkflow", testId: "reload-workflow-dialog" }
];

const wait = () => new Promise(resolve => setTimeout(resolve, 20));

describe("WorkflowEditorDialogs", () => {
    it("renders nothing without a dialog", () => {
        renderDialog(null);

        expect(screen.queryByRole("dialog")).toBeNull();
    });

    for (const { kind, testId } of KINDS) {
        it(`renders the ${kind} dialog with its title and body from the view model`, () => {
            const dialog = createDialogVm(kind);
            renderDialog(dialog);

            expect(screen.getByRole("dialog")).toBeTruthy();
            expect(screen.getByText(dialog.title)).toBeTruthy();
            expect(screen.getByText(dialog.body)).toBeTruthy();
            expect(screen.getByTestId(testId)).toBeTruthy();
        });
    }

    it("shows the discard dialog's buttons and routes them", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("discardChanges"));

        fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("shows the conflict dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("conflict"));

        fireEvent.click(screen.getByRole("button", { name: "Reload workflow" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("shows the delete workflow dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("deleteWorkflow"));

        fireEvent.click(screen.getByRole("button", { name: "Delete workflow" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("shows the delete step dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("deleteStep"));

        fireEvent.click(screen.getByRole("button", { name: "Delete step" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("shows the reload dialog's buttons", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("reloadWorkflow"));

        fireEvent.click(screen.getByRole("button", { name: "Reload" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it("routes the deleted dialog's two decisions: Discard changes cancels, Save as new confirms", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("deleted"));

        fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();

        fireEvent.click(screen.getByRole("button", { name: "Save as new workflow" }));
        expect(onConfirm).toHaveBeenCalledTimes(1);
    });

    it("cannot dismiss the deleted dialog with Escape and has no close button", async () => {
        const { onCancel, onConfirm } = renderDialog(createDialogVm("deleted"));

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
        await wait();

        expect(onCancel).not.toHaveBeenCalled();
        expect(onConfirm).not.toHaveBeenCalled();
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("cancels a dismissible dialog on Escape", async () => {
        const { onCancel, onConfirm } = renderDialog(createDialogVm("discardChanges"));

        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });

        await waitFor(() => expect(onCancel).toHaveBeenCalledTimes(1));
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("disables both buttons and ignores Escape while busy", async () => {
        const { onCancel, onConfirm } = renderDialog(
            createDialogVm("deleteWorkflow", { busy: true })
        );

        const confirm = screen.getByRole("button", { name: "Delete workflow" });
        const cancel = screen.getByRole("button", { name: "Cancel" });
        expect(confirm.hasAttribute("disabled")).toBe(true);
        expect(cancel.hasAttribute("disabled")).toBe(true);

        fireEvent.click(confirm);
        fireEvent.click(cancel);
        fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
        await wait();

        expect(onConfirm).not.toHaveBeenCalled();
        expect(onCancel).not.toHaveBeenCalled();
    });

    it("marks the confirm button destructive for a destructive dialog only", () => {
        const { unmount } = renderDialog(createDialogVm("deleteWorkflow"));
        expect(
            screen.getByRole("button", { name: "Delete workflow" }).getAttribute("data-variant")
        ).toBe("destructive");
        unmount();

        renderDialog(createDialogVm("conflict"));
        expect(
            screen.getByRole("button", { name: "Reload workflow" }).getAttribute("data-variant")
        ).toBe("primary");
    });

    it("marks the cancel button destructive when the presenter says so", () => {
        renderDialog(createDialogVm("deleted"));

        expect(
            screen.getByRole("button", { name: "Discard changes" }).getAttribute("data-variant")
        ).toBe("destructive");
        expect(
            screen
                .getByRole("button", { name: "Save as new workflow" })
                .getAttribute("data-variant")
        ).toBe("primary");
    });

    it("lists the blocking reviews with their position and a link, and offers only Close", () => {
        const { onConfirm, onCancel } = renderDialog(createDialogVm("blockedDelete"));

        const list = screen.getByTestId("blocked-reviews");
        const links = within(list).getAllByRole("link");
        expect(links).toHaveLength(2);
        expect(within(links[0]).getByText("Spring campaign")).toBeTruthy();
        expect(within(links[0]).getByText("Step 2 of 3 · Legal sign-off")).toBeTruthy();
        expect(links[0].getAttribute("href")).toBe(
            "/cms/content-entries/article?id=entry-1%230001"
        );
        expect(links[0].getAttribute("target")).toBe("_blank");
        expect(within(links[1]).getByText("Summer sale")).toBeTruthy();

        expect(screen.queryByRole("button", { name: "Delete workflow" })).toBeNull();
        fireEvent.click(screen.getByRole("button", { name: "Close" }));
        expect(onCancel).toHaveBeenCalledTimes(1);
        expect(onConfirm).not.toHaveBeenCalled();
    });

    it("shows the closing note below the review list", () => {
        renderDialog(createDialogVm("blockedDelete", { note: "Try again later." }));

        const list = screen.getByTestId("blocked-reviews");
        const note = screen.getByText("Try again later.");
        expect(list.compareDocumentPosition(note) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it("shows the icon of the view model in the header", () => {
        renderDialog(createDialogVm("deleted"));

        const icon = screen.getByRole("dialog").querySelector("[data-dialog-icon]");
        expect(icon?.getAttribute("data-dialog-icon")).toBe("delete_forever");
    });

    it("renders the icon for the dialog, without a colour class of ours", () => {
        renderDialog(createDialogVm("discardChanges"));

        const icon = screen.getByRole("dialog").querySelector("[data-dialog-icon]");
        expect(icon?.getAttribute("data-dialog-icon")).toBe("warning");
        expect(icon?.getAttribute("class") ?? "").not.toMatch(/fill-(warning|destructive)/);
    });

    it("renders no close button: the buttons decide", () => {
        renderDialog(createDialogVm("deleteWorkflow"));

        expect(screen.queryByRole("button", { name: /close/i })).toBeNull();
        expect(screen.getAllByRole("button")).toHaveLength(2);
    });

    it("renders Cancel as a tertiary button", () => {
        renderDialog(createDialogVm("deleteWorkflow"));

        const cancel = screen.getByRole("button", { name: "Cancel" });
        expect(cancel.className).toContain("bg-neutral-base");
        expect(cancel.className).toContain("border-neutral-muted");
    });

    it("renders a destructive cancel button red", () => {
        renderDialog(createDialogVm("deleted"));

        expect(screen.getByRole("button", { name: "Discard changes" }).className).toContain(
            "bg-destructive"
        );
    });

    it("lists one item per blocking review, each with an open icon", () => {
        renderDialog(createDialogVm("blockedDelete"));

        const list = screen.getByTestId("blocked-reviews");
        expect(list.querySelectorAll("a")).toHaveLength(2);
        expect(list.querySelectorAll("[data-icon='open_in_new']")).toHaveLength(2);
    });

    it("shows no note when the view model has none", () => {
        renderDialog(createDialogVm("deleteWorkflow"));

        expect(screen.queryByTestId("dialog-note")).toBeNull();
    });

    it("shows five blocking reviews as given", () => {
        const reviews = [1, 2, 3, 4, 5].map(number => {
            return {
                reviewId: `review-${number}`,
                title: `Review ${number}`,
                position: `Step 1 of 2 · Check ${number}`,
                url: `/content/${number}`
            };
        });
        renderDialog(createDialogVm("blockedDelete", { reviews }));

        expect(within(screen.getByTestId("blocked-reviews")).getAllByRole("link")).toHaveLength(5);
    });

    it("shows no review list when the dialog has no reviews", () => {
        renderDialog(createDialogVm("blockedDelete", { reviews: [] }));

        expect(screen.queryByTestId("blocked-reviews")).toBeNull();
    });
});
