import React from "react";
import { useState } from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import { WorkflowMultiPicker } from "./WorkflowMultiPicker.js";
import type { WorkflowMultiPickerProps } from "./WorkflowMultiPicker.js";
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

const createProps = (
    overrides: Partial<WorkflowMultiPickerProps> = {}
): WorkflowMultiPickerProps => {
    return {
        values: [],
        selected: [],
        options: [LEGAL, PRESS, SALES],
        onSearch: vi.fn(),
        onChange: vi.fn(),
        placeholder: "Search teams",
        disabled: false,
        error: null,
        label: "Reviewing teams",
        ...overrides
    };
};

// A parent that owns the chosen ids and the chosen items, like a field renderer does.
interface ControlledPickerProps {
    initial: string[];
    options: PickerOption[];
}

const ControlledPicker = (props: ControlledPickerProps) => {
    const [values, setValues] = useState(props.initial);
    const selected = props.options.filter(option => values.includes(option.id));
    return (
        <WorkflowMultiPicker
            {...createProps({ options: props.options })}
            values={values}
            selected={selected}
            onChange={setValues}
        />
    );
};

const openList = () => {
    const input = screen.getByRole("combobox");
    fireEvent.focus(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    return input;
};

describe("WorkflowMultiPicker", () => {
    it("renders the label, the description and the placeholder", () => {
        renderWithAdminUi(
            <WorkflowMultiPicker {...createProps({ description: "Members can review." })} />
        );

        expect(screen.getAllByText("Reviewing teams").length).toBeGreaterThan(0);
        expect(screen.getByText("Members can review.")).toBeTruthy();
        expect(screen.getByPlaceholderText("Search teams")).toBeTruthy();
    });

    it("shows a chip with the label for each selected item", () => {
        const props = createProps({ values: ["t1", "t3"], selected: [LEGAL, SALES], options: [] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        expect(screen.getByText("Legal")).toBeTruthy();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("keeps the chips when the search results do not contain the selected items", () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL], options: [SALES] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        expect(screen.getByText("Legal")).toBeTruthy();
    });

    it("shows an id nobody knows as an Unknown item chip with its warning", () => {
        const props = createProps({ values: ["t9"], selected: [], options: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        const chip = screen.getByText("Unknown item");

        expect(chip.closest("[title]")?.getAttribute("title")).toBe("This item no longer exists.");
    });

    it("shows the warning of a selected item on its chip", () => {
        const props = createProps({ values: ["t2"], selected: [PRESS], options: [] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        const chip = screen.getByText("Press");

        expect(chip.closest("[title]")?.getAttribute("title")).toBe("This team has no members");
    });

    it("lists the options with the label, the sub line and the warning", async () => {
        renderWithAdminUi(<WorkflowMultiPicker {...createProps()} />);

        openList();

        expect(await screen.findByText("Legal")).toBeTruthy();
        expect(screen.getByText("4 members")).toBeTruthy();
        expect(screen.getByText("Press")).toBeTruthy();
        expect(screen.getByText("This team has no members")).toBeTruthy();
    });

    it("calls onChange with the ids including the picked option", async () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onChange).toHaveBeenCalledWith(["t1", "t3"]);
    });

    it("calls onSearch with the typed text", () => {
        const props = createProps();
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        fireEvent.change(screen.getByRole("combobox"), { target: { value: "leg" } });

        expect(props.onSearch).toHaveBeenCalledWith("leg");
    });

    it("removes a chip through its dismiss button", () => {
        renderWithAdminUi(<ControlledPicker initial={["t1", "t3"]} options={[LEGAL, SALES]} />);

        const dismiss = screen.getAllByRole("button", { name: "Close" });
        fireEvent.click(dismiss[0]);

        expect(screen.queryByText("Legal")).toBeNull();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("puts the keyboard focus back on the input after removing a chip", () => {
        renderWithAdminUi(<ControlledPicker initial={["t1", "t3"]} options={[LEGAL, SALES]} />);
        const dismiss = screen.getAllByRole("button", { name: "Close" })[0];
        dismiss.focus();

        fireEvent.click(dismiss);

        expect(screen.getAllByRole("button", { name: "Close" })).toHaveLength(1);
        expect(document.activeElement).toBe(screen.getByRole("combobox"));
    });

    it("leaves the focus alone when a chip goes while the picker is not focused", () => {
        const first = createProps({ values: ["t1", "t3"], selected: [LEGAL, SALES] });
        const { rerender } = renderWithAdminUi(<WorkflowMultiPicker {...first} />);

        rerender(
            <AdminUiProvider>
                <WorkflowMultiPicker {...first} values={["t3"]} selected={[SALES]} />
            </AdminUiProvider>
        );

        expect(document.activeElement).toBe(document.body);
    });

    it("calls onChange without the removed id", () => {
        const props = createProps({ values: ["t1", "t3"], selected: [LEGAL, SALES] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        fireEvent.click(screen.getAllByRole("button", { name: "Close" })[0]);

        expect(props.onChange).toHaveBeenCalledWith(["t3"]);
    });

    it("drops a chip when the values change from outside", () => {
        const first = createProps({ values: ["t1", "t3"], selected: [LEGAL, SALES] });
        const { rerender } = renderWithAdminUi(<WorkflowMultiPicker {...first} />);
        expect(screen.getByText("Legal")).toBeTruthy();

        const second = createProps({ values: ["t3"], selected: [SALES] });
        rerender(
            <AdminUiProvider>
                <WorkflowMultiPicker {...second} />
            </AdminUiProvider>
        );

        expect(screen.queryByText("Legal")).toBeNull();
        expect(screen.getByText("Sales")).toBeTruthy();
    });

    it("updates a chip when the selected item's label arrives later", () => {
        const first = createProps({ values: ["t9"], selected: [], options: [] });
        const { rerender } = renderWithAdminUi(<WorkflowMultiPicker {...first} />);
        expect(screen.getByText("Unknown item")).toBeTruthy();

        const finance = createPickerOption({ id: "t9", label: "Finance" });
        const second = createProps({ values: ["t9"], selected: [finance], options: [] });
        rerender(
            <AdminUiProvider>
                <WorkflowMultiPicker {...second} />
            </AdminUiProvider>
        );

        expect(screen.queryByText("Unknown item")).toBeNull();
        expect(screen.getByText("Finance")).toBeTruthy();
    });

    it("adds a chip for a picked option", async () => {
        renderWithAdminUi(<ControlledPicker initial={["t1"]} options={[LEGAL, SALES]} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(screen.getAllByText("Sales").length).toBeGreaterThan(0);
        expect(screen.getAllByText("Legal").length).toBeGreaterThan(0);
    });

    it("does not offer an item that is already chosen, so no duplicate can be picked", async () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        openList();
        await screen.findByText("Sales");

        expect(screen.getAllByText("Legal")).toHaveLength(1);
    });

    it("never reports an id twice", async () => {
        const props = createProps({ values: ["t1", "t1"], selected: [LEGAL] });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        openList();
        fireEvent.click(await screen.findByText("Sales"));

        expect(props.onChange).toHaveBeenCalledWith(["t1", "t3"]);
    });

    it("keeps the More matches line while the user types", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
        });
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: many })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "Team 1" } });

        expect(await screen.findByText("Team 10")).toBeTruthy();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("does not remove a chip of a disabled picker", () => {
        const props = createProps({ values: ["t1"], selected: [LEGAL], disabled: true });
        renderWithAdminUi(<WorkflowMultiPicker {...props} />);

        fireEvent.click(screen.getByRole("button", { name: "Close" }));

        expect(props.onChange).not.toHaveBeenCalled();
    });

    it("shows at most 50 options and the More matches line", async () => {
        const many = Array.from({ length: 60 }, (_, index): PickerOption => {
            return createPickerOption({ id: `id-${index}`, label: `Team ${index}` });
        });
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: many })} />);

        openList();

        expect(await screen.findByText("Team 0")).toBeTruthy();
        expect(screen.getByText("Team 49")).toBeTruthy();
        expect(screen.queryByText("Team 50")).toBeNull();
        expect(screen.getByText("More matches. Keep typing to narrow the list.")).toBeTruthy();
    });

    it("says nothing matches the search when the list is empty", async () => {
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ options: [] })} />);

        const input = openList();
        fireEvent.change(input, { target: { value: "zzz" } });

        expect(await screen.findByText("Nothing matches “zzz”.")).toBeTruthy();
    });

    it("shows the error under the input", () => {
        renderWithAdminUi(
            <WorkflowMultiPicker
                {...createProps({ error: "Choose at least one reviewing team." })}
            />
        );

        expect(screen.getByText("Choose at least one reviewing team.")).toBeTruthy();
    });

    it("disables the input", () => {
        renderWithAdminUi(<WorkflowMultiPicker {...createProps({ disabled: true })} />);

        const input: HTMLInputElement = screen.getByRole("combobox");

        expect(input.disabled).toBe(true);
    });
});
