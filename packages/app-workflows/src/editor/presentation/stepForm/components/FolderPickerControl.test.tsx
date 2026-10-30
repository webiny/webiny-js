import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import type { PickerOption } from "~/components/picker/PickerOption.js";
import { createAppFolder } from "~/editor/testing/editorFixtures.js";
import { createReferenceLabel } from "~/editor/testing/ruleFixtures.js";
import { createFoldersSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { createReferencesSlice } from "~/editor/testing/stepFormOptionsFixtures.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { FolderPickerControl } from "./FolderPickerControl.js";
import type { FolderPickerControlProps } from "./FolderPickerControl.js";

vi.mock("~/components/picker/WorkflowPicker.js", async () => {
    const stub = await import("~/editor/testing/workflowPickerStub.js");
    return { WorkflowPicker: stub.WorkflowPickerStub };
});

const CAMPAIGNS = createAppFolder({ id: "folder-1", path: "/Campaigns" });
const PARTNERS = createAppFolder({ id: "folder-2", path: "/Partners" });
const HINT = "You can't see this folder. The condition stays as it is unless you remove it.";

const createProps = (
    overrides: Partial<FolderPickerControlProps> = {}
): FolderPickerControlProps => {
    return {
        label: "Content is in folder",
        placeholder: "Search folders",
        anyLabel: "Any folder",
        value: null,
        folders: createFoldersSlice({ items: [CAMPAIGNS, PARTNERS], folderType: "cms:article" }),
        references: createReferencesSlice(),
        disabled: false,
        error: null,
        onRemove: null,
        onChange: vi.fn(),
        ...overrides
    };
};

const getPicker = () => {
    return screen.getByTestId("picker-Content is in folder");
};

const getOptionDetails = (): PickerOption[] => {
    return JSON.parse(getPicker().getAttribute("data-option-details") ?? "[]");
};

const restrictedReferences = () => {
    return createReferencesSlice({
        folders: [
            createReferenceLabel({ id: "f9", label: "Restricted folder", state: "restricted" })
        ]
    });
};

describe("FolderPickerControl (R292, R307, QBZ-15)", () => {
    afterEach(() => {
        cleanup();
    });

    it("lists the folder paths in order with the folder icon and passes the clear row", () => {
        renderWithAdminUi(<FolderPickerControl {...createProps()} />);

        const details = getOptionDetails();
        expect(details.map(option => option.label)).toEqual(["/Campaigns", "/Partners"]);
        expect(details.map(option => option.icon)).toEqual(["folder", "folder"]);
        expect(getPicker().getAttribute("data-any-label")).toBe("Any folder");
        expect(getPicker().getAttribute("data-placeholder")).toBe("Search folders");
    });

    it("filters the complete list by the typed text on the client", () => {
        renderWithAdminUi(<FolderPickerControl {...createProps()} />);

        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: search" }));

        expect(getPicker().getAttribute("data-options")).toBe("folder-1");
    });

    it("shows a saved folder the list contains", () => {
        renderWithAdminUi(<FolderPickerControl {...createProps({ value: "folder-2" })} />);

        expect(getPicker().getAttribute("data-selected")).toBe("/Partners");
        expect(getPicker().getAttribute("data-selected-icon")).toBe("folder");
        expect(getPicker().getAttribute("data-disabled")).toBe("false");
    });

    it("reports the picked folder id and null for the clear row", () => {
        const onChange = vi.fn();
        renderWithAdminUi(<FolderPickerControl {...createProps({ onChange })} />);

        fireEvent.click(
            screen.getByRole("button", { name: "Content is in folder: choose /Partners" })
        );
        fireEvent.click(screen.getByRole("button", { name: "Content is in folder: clear" }));

        expect(onChange).toHaveBeenNthCalledWith(1, "folder-2");
        expect(onChange).toHaveBeenNthCalledWith(2, null);
    });

    it("shows a restricted folder as a disabled picker with Restricted folder, Remove and the hint", () => {
        const onRemove = vi.fn();
        renderWithAdminUi(
            <FolderPickerControl
                {...createProps({ references: restrictedReferences(), value: "f9", onRemove })}
            />
        );

        const picker = getPicker();
        expect(picker.getAttribute("data-selected")).toBe("Restricted folder");
        expect(picker.getAttribute("data-selected-muted")).toBe("true");
        expect(picker.getAttribute("data-selected-disabled")).toBe("true");
        expect(picker.getAttribute("data-selected-icon")).toBe("lock");
        expect(picker.getAttribute("data-disabled")).toBe("true");
        expect(screen.getByText(HINT)).toBeDefined();
        expect(screen.getByTitle("Remove the folder condition")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Remove" }));

        expect(onRemove).toHaveBeenCalledTimes(1);
    });

    it("shows the hint but no Remove for a restricted folder when the control has no remove callback", () => {
        renderWithAdminUi(
            <FolderPickerControl
                {...createProps({ references: restrictedReferences(), value: "f9" })}
            />
        );

        expect(screen.getByText(HINT)).toBeDefined();
        expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    });

    it("disables Remove when the control is disabled", () => {
        renderWithAdminUi(
            <FolderPickerControl
                {...createProps({
                    references: restrictedReferences(),
                    value: "f9",
                    onRemove: vi.fn(),
                    disabled: true
                })}
            />
        );

        const remove: HTMLButtonElement = screen.getByRole("button", { name: "Remove" });
        expect(remove.disabled).toBe(true);
    });

    it("does not treat a listed folder as restricted, whatever the references say", () => {
        const references = createReferencesSlice({
            folders: [
                createReferenceLabel({
                    id: "folder-1",
                    label: "Restricted folder",
                    state: "restricted"
                })
            ]
        });
        renderWithAdminUi(
            <FolderPickerControl
                {...createProps({ references, value: "folder-1", onRemove: vi.fn() })}
            />
        );

        expect(getPicker().getAttribute("data-selected")).toBe("/Campaigns");
        expect(screen.queryByText(HINT)).toBeNull();
        expect(screen.queryByRole("button", { name: "Remove" })).toBeNull();
    });

    it("shows a deleted folder as Deleted folder: not muted, no icon, not disabled, no hint", () => {
        const references = createReferencesSlice({
            folders: [createReferenceLabel({ id: "f8", label: "Deleted folder", state: "deleted" })]
        });
        renderWithAdminUi(
            <FolderPickerControl {...createProps({ references, value: "f8", onRemove: vi.fn() })} />
        );

        const picker = getPicker();
        expect(picker.getAttribute("data-selected")).toBe("Deleted folder");
        expect(picker.getAttribute("data-selected-muted")).toBe("false");
        expect(picker.getAttribute("data-selected-icon")).toBe("");
        expect(picker.getAttribute("data-disabled")).toBe("false");
        expect(screen.queryByText(HINT)).toBeNull();
    });

    it("shows the neutral Searching label for an unresolved folder while resolving", () => {
        const references = createReferencesSlice({}, { loading: true });
        renderWithAdminUi(<FolderPickerControl {...createProps({ references, value: "f7" })} />);

        expect(getPicker().getAttribute("data-selected")).toBe("Searching…");
    });

    it("passes the error and the disabled flag to the picker", () => {
        renderWithAdminUi(
            <FolderPickerControl {...createProps({ error: "Pick a folder.", disabled: true })} />
        );

        expect(getPicker().getAttribute("data-error")).toBe("Pick a folder.");
        expect(getPicker().getAttribute("data-disabled")).toBe("true");
    });

    it("shows the options failure with Try again in place of the picker", () => {
        const retry = vi.fn();
        const folders = createFoldersSlice({ failed: true, retry });
        renderWithAdminUi(<FolderPickerControl {...createProps({ folders })} />);

        expect(screen.queryByTestId("picker-Content is in folder")).toBeNull();
        expect(screen.getByText("Could not load the step options.")).toBeDefined();

        fireEvent.click(screen.getByRole("button", { name: "Try again" }));

        expect(retry).toHaveBeenCalledTimes(1);
    });
});
