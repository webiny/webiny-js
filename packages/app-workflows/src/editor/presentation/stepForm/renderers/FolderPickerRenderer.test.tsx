import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createStepFormOptions } from "~/editor/testing/createStepFormOptions.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { STEP_FORM_RENDERER } from "../stepFormRendererNames.js";
import { FolderPickerRenderer } from "./FolderPickerRenderer.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const CAMPAIGNS = createAppFolder({ id: "folder-1", path: "/Campaigns" });
const PARTNERS = createAppFolder({ id: "folder-2", path: "/Partners" });

const createForm = (folder: string | null) => {
    const form = createTestFormModelFactory().create({
        fields: registry => {
            return {
                folder: registry.text().label("Folder").renderer(STEP_FORM_RENDERER.folderPicker)
            };
        }
    });
    form.setData({ folder }, { dirty: false });
    return form;
};

describe("FolderPickerRenderer (R292, R307)", () => {
    afterEach(() => {
        cleanup();
    });

    it("shows the saved folder id as its path and offers the folders and the Any folder row", () => {
        const form = createForm("folder-2");
        renderStepFormField({
            form,
            name: "folder",
            Renderer: FolderPickerRenderer,
            options: createStepFormOptions({
                folders: createFoldersSlice({ items: [CAMPAIGNS, PARTNERS] })
            })
        });

        const picker = screen.getByTestId("picker-Folder");
        expect(picker.getAttribute("data-selected")).toBe("/Partners");
        expect(picker.getAttribute("data-options")).toBe("folder-1,folder-2");
        expect(picker.getAttribute("data-any-label")).toBe("Any folder");
        expect(picker.getAttribute("data-placeholder")).toBe("Search folders");
    });

    it("writes the picked folder id and null for the clear row", () => {
        const form = createForm(null);
        renderStepFormField({
            form,
            name: "folder",
            Renderer: FolderPickerRenderer,
            options: createStepFormOptions({
                folders: createFoldersSlice({ items: [CAMPAIGNS, PARTNERS] })
            })
        });

        fireEvent.click(screen.getByRole("button", { name: "Folder: choose /Campaigns" }));

        expect(form.field("folder").getValue()).toBe("folder-1");

        fireEvent.click(screen.getByRole("button", { name: "Folder: clear" }));

        expect(form.field("folder").getValue()).toBeNull();
    });

    it("clears the field when Remove is pressed on a restricted folder", () => {
        const form = createForm("f9");
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })
            ]
        });
        renderStepFormField({
            form,
            name: "folder",
            Renderer: FolderPickerRenderer,
            options: createStepFormOptions({ references })
        });

        expect(screen.getByTestId("picker-Folder").getAttribute("data-selected")).toBe(
            "Restricted folder"
        );

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(form.field("folder").getValue()).toBeNull();
    });
});
