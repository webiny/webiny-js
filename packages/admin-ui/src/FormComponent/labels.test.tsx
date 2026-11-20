// @vitest-environment jsdom
/**
 * A form component's visible label names its control: `getByLabelText` (and any
 * label-based lookup — assistive tech, a scripted UI check) finds the element
 * that takes focus, not a wrapper and not the value it currently shows.
 */
import React from "react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { AdminUiContext, type AdminUiContextValue } from "~/AdminUiProvider/AdminUiProvider.js";
import { Select } from "~/Select/index.js";
import { MultiSelect } from "~/MultiSelect/index.js";
import { RadioGroup } from "~/RadioGroup/index.js";
import { CheckboxGroup } from "~/CheckboxGroup/index.js";
import { Slider } from "~/Slider/index.js";
import { RangeSlider } from "~/RangeSlider/index.js";
import { DatePicker } from "~/DatePicker/index.js";
import { ToggleGroup } from "~/ToggleGroup/index.js";
import { SegmentedControl } from "~/SegmentedControl/index.js";
import { IconPicker } from "~/IconPicker/index.js";
import { ColorPicker } from "~/ColorPicker/index.js";
import { FilePicker } from "~/FilePicker/index.js";

/* No SVG transform in the test runner: the icons these controls render become empty components. */
vi.mock("@webiny/icons/add.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/calendar_month.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/check.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/chevron_left.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/chevron_right.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/close.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/content_copy.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/delete.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/edit.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/file_upload.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/format_align_center.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/format_align_left.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/format_align_right.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/format_bold.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/format_italic.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/format_underlined.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/image.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/info.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/keyboard_arrow_down.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/keyboard_arrow_up.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/notifications.svg", () => ({
    ReactComponent: () => null
}));
vi.mock("@webiny/icons/person.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/schedule.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/search.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/settings.svg", () => ({ ReactComponent: () => null }));

const context = {
    compileMarkdown: (markdown: React.ReactNode) => markdown
} as unknown as AdminUiContextValue;

const renderIn = (ui: React.ReactElement) =>
    render(<AdminUiContext.Provider value={context}>{ui}</AdminUiContext.Provider>);

beforeAll(() => {
    /* Radix measures its parts; jsdom has no ResizeObserver. */
    globalThis.ResizeObserver ??= class {
        observe() {}
        unobserve() {}
        disconnect() {}
    } as unknown as typeof ResizeObserver;
});

afterEach(cleanup);

const options = [
    { label: "Main layout", value: "main" },
    { label: "Landing", value: "landing" }
];

describe("form component labels name their controls", () => {
    it("Select — the combobox trigger, whatever value it shows", () => {
        renderIn(<Select label={"Layout"} value={"main"} options={options} />);
        const control = screen.getByLabelText("Layout");
        expect(control.getAttribute("role")).toBe("combobox");
        expect(screen.getByRole("combobox", { name: "Layout" })).toBe(control);
    });

    it("Select — a caller's id is kept", () => {
        renderIn(<Select id={"layout-select"} label={"Layout"} options={options} />);
        expect(screen.getByLabelText("Layout").id).toBe("layout-select");
    });

    it("MultiSelect — the trigger button", () => {
        renderIn(<MultiSelect label={"Languages"} options={options} value={["main"]} />);
        expect(screen.getByLabelText("Languages").tagName).toBe("BUTTON");
    });

    it("RadioGroup — the radiogroup", () => {
        renderIn(<RadioGroup label={"Page type"} items={options} value={"main"} />);
        expect(screen.getByRole("radiogroup", { name: "Page type" })).toBeTruthy();
    });

    it("CheckboxGroup — the group", () => {
        renderIn(<CheckboxGroup label={"Channels"} items={options} value={["main"]} />);
        expect(screen.getByRole("group", { name: "Channels" })).toBeTruthy();
    });

    it("Slider — the thumb, with the label on top or at the side", () => {
        renderIn(
            <Slider label={"Opacity"} value={20} min={0} max={100} onValueChange={() => {}} />
        );
        /* On top, the label carries the current value too: `Opacity 20`. */
        expect(screen.getByRole("slider", { name: /^Opacity/ })).toBeTruthy();
        cleanup();
        renderIn(
            <Slider
                label={"Opacity"}
                labelPosition={"side"}
                value={20}
                onValueChange={() => {}}
                min={0}
                max={100}
            />
        );
        expect(screen.getByRole("slider", { name: "Opacity" })).toBeTruthy();
    });

    it("RangeSlider — both thumbs", () => {
        renderIn(
            <RangeSlider
                label={"Price"}
                values={[10, 90]}
                min={0}
                max={100}
                onValuesChange={() => {}}
            />
        );
        expect(screen.getAllByRole("slider", { name: "Price" })).toHaveLength(2);
    });

    it("DatePicker — the trigger, for a date and for a time", () => {
        renderIn(<DatePicker label={"Publish on"} type={"date"} />);
        expect(screen.getByRole("button", { name: "Publish on" })).toBeTruthy();
        cleanup();
        renderIn(<DatePicker label={"Starts at"} type={"time"} />);
        expect(screen.getByLabelText("Starts at").tagName).toBe("INPUT");
    });

    it("ToggleGroup and SegmentedControl — the group", () => {
        /* Radix renders a single-choice toggle group as a radiogroup; a multiple one has no group role, but its root is still named. */
        renderIn(<ToggleGroup label={"Format"} items={options} type={"single"} value={"main"} />);
        expect(screen.getByRole("radiogroup", { name: "Format" })).toBeTruthy();
        cleanup();
        renderIn(
            <ToggleGroup label={"Styles"} items={options} type={"multiple"} value={["main"]} />
        );
        expect(screen.getByLabelText("Styles").querySelectorAll("button")).toHaveLength(2);
        cleanup();
        renderIn(<SegmentedControl label={"View"} items={options} value={"main"} />);
        expect(screen.getByRole("radiogroup", { name: "View" })).toBeTruthy();
    });

    it("IconPicker, ColorPicker and FilePicker — their triggers", () => {
        renderIn(<IconPicker label={"Icon"} icons={[]} />);
        expect(screen.getByLabelText("Icon").tagName).toBe("BUTTON");
        cleanup();
        renderIn(<ColorPicker label={"Colour"} />);
        expect(screen.getByRole("button", { name: "Colour" })).toBeTruthy();
        cleanup();
        renderIn(<FilePicker label={"Image"} type={"compact"} onSelectItem={() => {}} />);
        expect(screen.getByLabelText("Image").tagName).toBe("BUTTON");
    });
});
