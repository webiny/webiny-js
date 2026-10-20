import { afterEach, beforeEach, describe, it, expect, vi } from "vitest";
import React from "react";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { AdminUiProvider } from "@webiny/admin-ui";
import type { IFieldVM } from "~/features/formModel/abstractions.js";
import { DateTimeFieldBuilder } from "~/features/formModel/fieldTypes/DateTimeFieldType.js";
import { BirthdayInputRenderer } from "./BirthdayInputRenderer.js";

// Tests don't turn SVG files into components, so the picker's icons are stubbed.
vi.mock("@webiny/icons/calendar_month.svg", () => ({ ReactComponent: () => null }));
vi.mock("@webiny/icons/close.svg", () => ({ ReactComponent: () => null }));

/** A date-only field of 18 or older, as `datetime()` hands it to the renderer. */
const createAdultField = (): IFieldVM => {
    const config = new DateTimeFieldBuilder()
        .dateOnly()
        .dateLte({ expression: "today-18y" })
        .renderer("birthdayInput")
        .build("dob");

    return {
        name: "dob",
        qualifiedName: "dob",
        type: "datetime",
        label: "Date of birth",
        value: undefined,
        validation: { isValid: null },
        validating: false,
        required: false,
        visible: true,
        disabled: false,
        renderer: config.renderer,
        rendererSettings: config.rendererSettings,
        onChange: vi.fn(),
        onBlur: vi.fn(),
        addItem: vi.fn(),
        removeItem: vi.fn(),
        focusRequested: false,
        clearFocusRequest: vi.fn(),
        context: {}
    };
};

/**
 * A step's grid. The header segments carry `data-step` too, so only the grid `div` matches.
 * Only the current step's grid is visible, so the cells are looked up as hidden as well.
 */
const cell = (step: "day" | "month" | "year", name: string) => {
    const panel = document.querySelector<HTMLElement>(`div[data-step="${step}"]`)!;
    return within(panel).getByRole<HTMLButtonElement>("button", { name, hidden: true });
};

const years = () => {
    const panel = document.querySelector<HTMLElement>(`div[data-step="year"]`)!;
    return within(panel)
        .getAllByRole("button", { hidden: true })
        .map(button => Number(button.textContent));
};

const renderField = (field: IFieldVM) =>
    render(
        <AdminUiProvider>
            <BirthdayInputRenderer field={field} />
        </AdminUiProvider>
    );

const openPicker = () => {
    fireEvent.click(screen.getByRole("button", { expanded: false }));
};

/**
 * The renderer works the limits out from the editor's local date on every render. Only `Date`
 * is frozen, so the picker's own timers and animation frames run as usual.
 */
describe("BirthdayInputRenderer with a relative limit", () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ["Date"] });
        // Polyfilled per test: jsdom has no ResizeObserver, which the popover and scroll area use.
        vi.stubGlobal(
            "ResizeObserver",
            class {
                observe() {}
                unobserve() {}
                disconnect() {}
            }
        );
    });

    afterEach(() => {
        cleanup();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it("starts the year list at the cut-off year", () => {
        vi.setSystemTime(new Date(2026, 9, 19, 12));
        renderField(createAdultField());
        openPicker();

        expect(years()[0]).toBe(2008);
        expect(years().some(year => year > 2008)).toBe(false);
    });

    it("dims the cut-off year for a day after the cut-off", () => {
        vi.setSystemTime(new Date(2026, 9, 19, 12));
        renderField(createAdultField());
        openPicker();

        fireEvent.click(cell("day", "20"));
        fireEvent.click(cell("month", "October"));

        expect(cell("year", "2008").disabled).toBe(true);
        expect(cell("year", "2007").disabled).toBe(false);
    });

    it("allows the cut-off day itself", () => {
        vi.setSystemTime(new Date(2026, 9, 19, 12));
        const field = createAdultField();
        renderField(field);
        openPicker();

        fireEvent.click(cell("day", "19"));
        fireEvent.click(cell("month", "October"));
        expect(cell("year", "2008").disabled).toBe(false);

        fireEvent.click(cell("year", "2008"));
        expect(field.onChange).toHaveBeenLastCalledWith("2008-10-19");
    });

    it("moves the cut-off with the date", () => {
        vi.setSystemTime(new Date(2026, 9, 20, 12));
        renderField(createAdultField());
        openPicker();

        fireEvent.click(cell("day", "20"));
        fireEvent.click(cell("month", "October"));

        expect(cell("year", "2008").disabled).toBe(false);
    });

    it("moves the year list on 1 January", () => {
        vi.setSystemTime(new Date(2027, 0, 1, 12));
        renderField(createAdultField());
        openPicker();

        expect(years()[0]).toBe(2009);
    });
});
