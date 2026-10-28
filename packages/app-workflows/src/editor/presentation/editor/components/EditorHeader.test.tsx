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

        expect(screen.getByText("Article review")).toBeTruthy();
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

    it("commits an edited name from the editable title", () => {
        const props = createProps();
        renderWithAdminUi(<EditorHeader {...props} />);

        fireEvent.click(screen.getByText("Article review"));
        const input = screen.getByDisplayValue("Article review");
        fireEvent.change(input, { target: { value: "New name" } });
        fireEvent.keyDown(input, { key: "Enter" });

        expect(props.onNameChange).toHaveBeenCalledWith("New name");
    });

    it("shows the name error below the title", () => {
        const props = createProps({ name: "Draft", nameError: "Enter a workflow name." });
        renderWithAdminUi(<EditorHeader {...props} />);

        expect(screen.getByText("Enter a workflow name.").className).toContain(
            "text-destructive-primary"
        );
    });

    it("shows the save icon on the Save button", () => {
        renderWithAdminUi(<EditorHeader {...createProps()} />);

        expect(screen.getByRole("button", { name: "Save" }).querySelector("svg")).not.toBeNull();
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

    it("does not enter name editing while saving", () => {
        renderWithAdminUi(<EditorHeader {...createProps({ saving: true })} />);

        fireEvent.click(screen.getByText("Article review"));

        expect(screen.queryByDisplayValue("Article review")).toBeNull();
    });
});
