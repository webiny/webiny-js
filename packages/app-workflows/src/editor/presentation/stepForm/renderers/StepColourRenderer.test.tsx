import React from "react";
import { afterEach } from "vitest";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { cleanup } from "@testing-library/react";
import { fireEvent } from "@testing-library/react";
import { screen } from "@testing-library/react";
import { renderStepFormField } from "~/editor/testing/renderStepFormField.js";
import { createTestFormModelFactory } from "~/editor/testing/createTestFormModelFactory.js";
import { buildCommonFields } from "../buildCommonFields.js";
import { StepColourRenderer } from "./StepColourRenderer.js";

const LABELS = [
    "Orange",
    "Rust",
    "Amber",
    "Olive",
    "Teal",
    "Green",
    "Red",
    "Maroon",
    "Gray",
    "Ink"
];

const createColourForm = (colour: string, readOnly = false) => {
    const form = createTestFormModelFactory().create({
        fields: registry => {
            const common = buildCommonFields({ registry, descriptionPlaceholder: "", readOnly });
            return { color: common.color };
        }
    });
    form.setData({ color: colour }, { dirty: false });
    return form;
};

const renderColour = (colour: string, readOnly = false) => {
    const form = createColourForm(colour, readOnly);
    renderStepFormField({ form, name: "color", Renderer: StepColourRenderer });
    return form;
};

const hexInput = (): HTMLInputElement => {
    const input = screen.getByLabelText("Hex colour");
    return input as HTMLInputElement;
};

describe("StepColourRenderer (R273)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the hex input in its own row below the swatches", () => {
        renderColour("var(--color-primary-500)");

        const swatchRow = screen.getByRole("button", { name: "Orange" }).parentElement;

        expect(swatchRow).not.toBeNull();
        expect(swatchRow?.contains(hexInput())).toBe(false);
        expect(hexInput().parentElement).not.toBe(swatchRow);
    });

    it("lists the ten presets in order as buttons named by their label", () => {
        renderColour("var(--color-primary-500)");

        const presets = LABELS.map(label => screen.getByRole("button", { name: label }));

        expect(presets).toHaveLength(10);
        expect(screen.getAllByRole("button")).toEqual(presets);
    });

    it("marks only the stored preset as pressed", () => {
        renderColour("var(--color-warning-600)");

        expect(screen.getByRole("button", { name: "Amber" }).getAttribute("aria-pressed")).toBe(
            "true"
        );
        expect(screen.getByRole("button", { name: "Orange" }).getAttribute("aria-pressed")).toBe(
            "false"
        );
    });

    it("stores the preset's token string when a swatch is clicked", () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.click(screen.getByRole("button", { name: "Amber" }));

        expect(form.field("color").getValue()).toBe("var(--color-warning-600)");
    });

    it("types a custom hex, prepending # when it is missing", () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.change(hexInput(), { target: { value: "3B6FD4" } });

        expect(form.field("color").getValue()).toBe("#3B6FD4");
        expect(hexInput().value).toBe("#3B6FD4");
    });

    it("keeps an unfinished hex in the field and shows the error", async () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.change(hexInput(), { target: { value: "#3B6" } });

        expect(form.field("color").getValue()).toBe("#3B6");
        expect(hexInput().value).toBe("#3B6");
        expect(await screen.findByText("Enter a hex colour, e.g. #3B6FD4.")).toBeDefined();
    });

    it("takes the colour of the native colour input as an upper-case hex", () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.change(screen.getByLabelText("Custom colour"), { target: { value: "#3b6fd4" } });

        expect(form.field("color").getValue()).toBe("#3B6FD4");
    });

    it("shows a stored custom hex in the hex box and presses no preset", () => {
        renderColour("#3B6FD4");

        expect(hexInput().value).toBe("#3B6FD4");
        LABELS.forEach(label => {
            expect(screen.getByRole("button", { name: label }).getAttribute("aria-pressed")).toBe(
                "false"
            );
        });
    });

    it("shows a loaded colour that is neither as no selection with an empty hex box", () => {
        renderColour("blue");

        expect(hexInput().value).toBe("");
        expect(screen.getByRole("button", { name: "Orange" }).getAttribute("aria-pressed")).toBe(
            "false"
        );
    });

    it("disables the swatches and the inputs when read-only", () => {
        renderColour("var(--color-primary-500)", true);

        expect((screen.getByRole("button", { name: "Orange" }) as HTMLButtonElement).disabled).toBe(
            true
        );
        expect(hexInput().disabled).toBe(true);
    });
});
