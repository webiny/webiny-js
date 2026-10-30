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

const renderColourWithContainer = (colour: string) => {
    const form = createColourForm(colour);
    return renderStepFormField({ form, name: "color", Renderer: StepColourRenderer });
};

const hexInput = (): HTMLInputElement => {
    const input = screen.getByLabelText("Hex colour");
    return input as HTMLInputElement;
};

describe("StepColourRenderer (R273)", () => {
    afterEach(() => {
        cleanup();
    });

    it("renders the custom colour picker and the hex input outside the preset group", () => {
        renderColour("var(--color-primary-500)");

        const presetGroup = screen.getByRole("radiogroup", { name: "Preset colour" });

        expect(presetGroup.contains(hexInput())).toBe(false);
        expect(screen.getByText("Custom colour")).toBeDefined();
    });

    it("lists the ten presets in order as radios named by their label", () => {
        renderColour("var(--color-primary-500)");

        const presets = LABELS.map(label => screen.getByRole("radio", { name: label }));

        expect(presets).toHaveLength(10);
        expect(screen.getAllByRole("radio")).toEqual(presets);
    });

    it("marks only the stored preset as checked", () => {
        renderColour("var(--color-warning-600)");

        expect(screen.getByRole("radio", { name: "Amber" }).getAttribute("aria-checked")).toBe(
            "true"
        );
        expect(screen.getByRole("radio", { name: "Orange" }).getAttribute("aria-checked")).toBe(
            "false"
        );
    });

    it("stores the preset's token string when a swatch is clicked", () => {
        const form = renderColour("var(--color-primary-500)");

        fireEvent.click(screen.getByRole("radio", { name: "Amber" }));

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

    it("shows a stored custom hex in the hex box and presses no preset", () => {
        renderColour("#3B6FD4");

        expect(hexInput().value).toBe("#3B6FD4");
        LABELS.forEach(label => {
            expect(screen.getByRole("radio", { name: label }).getAttribute("aria-checked")).toBe(
                "false"
            );
        });
    });

    it("shows a loaded colour that is neither as no selection with an empty hex box", () => {
        renderColour("blue");

        expect(hexInput().value).toBe("");
        expect(screen.getByRole("radio", { name: "Orange" }).getAttribute("aria-checked")).toBe(
            "false"
        );
    });

    it("gives the picker the stored colour, never an unrelated fallback", () => {
        const { container } = renderColourWithContainer("var(--color-warning-600)");

        const swatch = container.querySelector("[data-disabled] > div") as HTMLElement;
        expect(swatch.getAttribute("style")).toContain("var(--color-warning-600)");
    });

    it("leaves the hex box placeholder empty, so it never shows an unrelated colour", () => {
        renderColour("var(--color-primary-500)");

        expect(hexInput().getAttribute("placeholder")).toBeNull();
    });

    it("disables the swatches and the inputs when read-only", () => {
        renderColour("var(--color-primary-500)", true);

        expect((screen.getByRole("radio", { name: "Orange" }) as HTMLButtonElement).disabled).toBe(
            true
        );
        expect(hexInput().disabled).toBe(true);
    });
});
