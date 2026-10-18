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

const LEGAL: PickerOption = { id: "t1", label: "Legal", description: "4 members", warning: null };
const PRESS: PickerOption = {
    id: "t2",
    label: "Press",
    description: "0 members",
    warning: "This team has no members"
};
const SALES: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };

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

    it("shows the selected item's label although the search results do not contain it", () => {
        const finance: PickerOption = {
            id: "t9",
            label: "Finance",
            description: null,
            warning: null
        };
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

        const resolved: PickerOption = {
            id: "t9",
            label: "Finance",
            description: null,
            warning: null
        };
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

    it("shows at most 50 options and the More matches line", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
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
            return { id: `id-${index}`, label: `Team ${index}`, description: null, warning: null };
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
});
