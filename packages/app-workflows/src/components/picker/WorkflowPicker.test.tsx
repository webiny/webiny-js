import React from "react";
import { useState } from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { WorkflowPicker } from "./WorkflowPicker.js";
import type { WorkflowPickerProps } from "./WorkflowPicker.js";
import type { PickerOption } from "./PickerOption.js";
import { renderWithAdminUi } from "~/review/testing/renderWithAdminUi.js";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";

const LEGAL = createPickerOption({ id: "t1", label: "Legal", description: "4 members" });
const PRESS = createPickerOption({
    id: "t2",
    label: "Press",
    description: "0 members",
    warning: "This team has no members"
});
const SALES = createPickerOption({ id: "t3", label: "Sales" });

const createProps = (overrides: Partial<WorkflowPickerProps> = {}): WorkflowPickerProps => {
    return {
        value: null,
        selected: null,
        options: [LEGAL, PRESS, SALES],
        onSearch: vi.fn(),
        onChange: vi.fn(),
        placeholder: "Search teams",
        disabled: false,
        error: null,
        label: "Team",
        ...overrides
    };
};

const openList = () => {
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    return input;
};

describe("WorkflowPicker", () => {
    it("renders the label, the description and the placeholder", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ description: "Pick one." })} />);

        expect(screen.getAllByText("Team").length).toBeGreaterThan(0);
        expect(screen.getByText("Pick one.")).toBeTruthy();
        expect(screen.getByPlaceholderText("Search teams")).toBeTruthy();
    });

    it("lists the options with the label, the sub line and the warning", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps()} />);

        openList();

        expect(await screen.findByText("Legal")).toBeTruthy();
        expect(screen.getByText("4 members")).toBeTruthy();
        expect(screen.getByText("Press")).toBeTruthy();
        expect(screen.getByText("This team has no members")).toBeTruthy();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("calls onChange with the id of the picked option", async () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onChange).toHaveBeenCalledWith("t3");
    });

    it("calls onSearch with the typed text", () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowPicker {...props} />);

        const input = screen.getByRole("combobox");
        fireEvent.change(input, { target: { value: "leg" } });

        expect(props.onSearch).toHaveBeenCalledWith("leg");
    });

    it("tells the parent to start the search over after a pick from a typed search", async () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "sal" } });
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onSearch).toHaveBeenLastCalledWith("");
    });

    it("does not search again on a pick when nothing was typed", async () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onSearch).not.toHaveBeenCalled();
    });

    it("shows the selected item's label although the search results do not contain it", () => {
        const finance = createPickerOption({ id: "t9", label: "Finance" });
        const props = createProps({ value: "t9", selected: finance, options: [LEGAL] });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.value).toBe("Finance");
    });

    it("keeps the same input element after a pick, so focus stays", async () => {
        const Controlled = () => {
            const [value, setValue] = useState<string | null>(null);
            return <WorkflowPicker {...createProps({ value, onChange: setValue })} />;
        };
        renderWithAdminUi(<Controlled />);

        const input = openList();
        fireEvent.click(await screen.findByText("Sales"));

        const after: HTMLInputElement = screen.getByRole("combobox");
        expect(after).toBe(input);
        expect(after.value).toBe("Sales");
    });

    it("shows the label of the search result when no selected item is given", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "t1" })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.value).toBe("Legal");
    });

    it("shows an id nobody knows as Unknown item with its warning under the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "t9", options: [LEGAL] })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.value).toBe("Unknown item");
        expect(screen.getByText("This item no longer exists.")).toBeTruthy();
    });

    it("shows the warning of the selected item under the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "t2", selected: PRESS })} />);

        expect(screen.getByText("This team has no members")).toBeTruthy();
    });

    it("updates the input when the selected item's label arrives later", () => {
        const { rerender } = renderWithAdminUi(
            <WorkflowPicker {...createProps({ value: "t9", options: [] })} />
        );
        const first: HTMLInputElement = screen.getByRole("combobox");
        expect(first.value).toBe("Unknown item");

        const resolved = createPickerOption({ id: "t9", label: "Finance" });
        rerender(
            <AdminUiProvider>
                <WorkflowPicker
                    {...createProps({ value: "t9", selected: resolved, options: [] })}
                />
            </AdminUiProvider>
        );

        const second: HTMLInputElement = screen.getByRole("combobox");
        expect(second.value).toBe("Finance");
        expect(screen.queryByText("This item no longer exists.")).toBeNull();
    });

    it("starts the search over when the chosen item's label arrives while the user types", () => {
        const props = createProps({ value: "t9", options: [] });
        const { rerender } = renderWithAdminUi(<WorkflowPicker {...props} />);
        fireEvent.change(screen.getByRole("combobox"), { target: { value: "le" } });
        expect(props.onSearch).toHaveBeenLastCalledWith("le");

        // The label arrives: the picker remounts, which resets its input to the label.
        const resolved = createPickerOption({ id: "t9", label: "Finance" });
        rerender(
            <AdminUiProvider>
                <WorkflowPicker {...props} selected={resolved} />
            </AdminUiProvider>
        );

        const input: HTMLInputElement = screen.getByRole("combobox");
        expect(input.value).toBe("Finance");
        expect(props.onSearch).toHaveBeenLastCalledWith("");
    });

    it("shows at most 50 options and the More matches line", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
        });
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: many })} />);

        openList();

        expect(await screen.findByText("Team 0")).toBeTruthy();
        expect(screen.getByText("Team 49")).toBeTruthy();
        expect(screen.queryByText("Team 50")).toBeNull();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("keeps the More matches line while the user types", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
        });
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: many })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "Team 1" } });

        expect(await screen.findByText("Team 10")).toBeTruthy();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("shows no More matches line for 50 options or fewer", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps()} />);

        openList();
        await screen.findByText("Legal");

        expect(screen.queryByText("More matches. Keep typing to narrow the list.")).toBeNull();
    });

    it("says nothing matches the search when the list is empty", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: [] })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "zzz" } });

        expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();
    });

    it("forgets the search text when the list closes", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: [] })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "zzz" } });
        expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();

        fireEvent.keyDown(input, { key: "Escape" });
        fireEvent.keyDown(input, { key: "ArrowDown" });

        expect(screen.queryByText("Nothing matches “zzz”.")).toBeNull();
    });

    it("shows the error under the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ error: "Choose an AI model." })} />);

        expect(screen.getByText("Choose an AI model.")).toBeTruthy();
    });

    it("disables the input", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ disabled: true })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.disabled).toBe(true);
    });

    it("shows anyLabel as the placeholder text, ahead of placeholder, while nothing is chosen (R307)", () => {
        renderWithAdminUi(
            <WorkflowPicker
                {...createProps({ anyLabel: "Any folder", placeholder: "Search folders" })}
            />
        );

        expect(screen.getByPlaceholderText("Any folder")).toBeTruthy();
        expect(screen.queryByPlaceholderText("Search folders")).toBeNull();
    });

    it("keeps the placeholder when there is no anyLabel", () => {
        renderWithAdminUi(<WorkflowPicker {...createProps({ placeholder: "Search folders" })} />);

        expect(screen.getByPlaceholderText("Search folders")).toBeTruthy();
    });

    it("lists the clear row first and gives null when it is picked (R307)", async () => {
        const props = createProps({ anyLabel: "Any folder" });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        const rows = await screen.findAllByRole("option");
        const labels = rows.map(row => row.textContent ?? "").filter(text => text !== "");

        expect(labels[0]).toBe("Any folder");

        fireEvent.click(screen.getByText("Any folder"));

        expect(props.onChange).toHaveBeenCalledTimes(1);
        expect(props.onChange).toHaveBeenCalledWith(null);
    });

    it("finds the clear row by typing its label while a value is chosen (the list filters by the input text)", async () => {
        const props = createProps({ anyLabel: "Any folder", value: "t1", selected: LEGAL });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "Any" } });
        fireEvent.click(await screen.findByText("Any folder"));

        expect(props.onChange).toHaveBeenCalledWith(null);
    });

    it("lists no clear row without anyLabel", async () => {
        renderWithAdminUi(<WorkflowPicker {...createProps()} />);

        openList();
        await screen.findByText("Legal");

        const rows = screen.getAllByRole("option");
        const labels = rows.map(row => row.textContent ?? "").filter(text => text !== "");
        expect(labels).toHaveLength(3);
        expect(labels.join("|")).not.toContain("Any folder");
    });

    it("does not pick a disabled option", async () => {
        const locked = createPickerOption({
            id: "f9",
            label: "Restricted folder",
            muted: true,
            disabled: true,
            icon: "lock"
        });
        const props = createProps({ options: [LEGAL, locked] });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Restricted folder"));

        expect(props.onChange).not.toHaveBeenCalled();
    });

    it("shows the icon and the muted label of an option in the list", async () => {
        const gone = createPickerOption({
            id: "u9",
            label: "Deleted user",
            muted: true,
            icon: "person_off"
        });
        renderWithAdminUi(<WorkflowPicker {...createProps({ options: [gone] })} />);

        openList();
        const label = await screen.findByText("Deleted user");

        expect(label.className).toContain("text-neutral-strong");
        expect(document.querySelector('[data-picker-icon="person_off"]')).not.toBeNull();
    });

    it("shows a chosen deleted item in the closed input with its muted icon (D117)", () => {
        const gone = createPickerOption({
            id: "u9",
            label: "Deleted user",
            muted: true,
            icon: "person_off"
        });
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "u9", selected: gone })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");
        const icon = document.querySelector('[data-picker-icon="person_off"]');

        expect(input.value).toBe("Deleted user");
        expect(icon).not.toBeNull();
        expect(icon?.getAttribute("class")).toContain("fill-neutral-strong");
    });

    it("shows no icon in the closed input for a chosen item that is not muted", () => {
        const person = createPickerOption({ id: "u1", label: "Ivan Horvat", icon: "person" });
        renderWithAdminUi(<WorkflowPicker {...createProps({ value: "u1", selected: person })} />);

        expect(document.querySelector("[data-picker-icon]")).toBeNull();
    });

    it("lists a disabled option with its note in the row's text and does not pick it (R332)", async () => {
        const listed = createPickerOption({
            id: "u1",
            label: "Ivan Horvat",
            disabled: true,
            note: "In the list"
        });
        const props = createProps({ options: [LEGAL, listed] });
        renderWithAdminUi(<WorkflowPicker {...props} />);

        openList();
        const label = await screen.findByText("Ivan Horvat");
        const rows = screen.getAllByRole("option");
        const row = rows.find(candidate => candidate.contains(label));

        expect(row?.textContent).toContain("Ivan Horvat");
        expect(row?.textContent).toContain("In the list");
        expect(row?.getAttribute("aria-disabled")).toBe("true");
        fireEvent.click(label);
        expect(props.onChange).not.toHaveBeenCalled();
    });
});
