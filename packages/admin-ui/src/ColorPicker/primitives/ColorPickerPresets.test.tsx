// @vitest-environment jsdom
/*
 * The swatches the color picker shows for its presets: nothing without presets, one button per
 * preset otherwise, and the selected one marked.
 */
import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { ColorPickerPresets } from "./ColorPickerPresets.js";

afterEach(cleanup);

const presets = [
    { id: "primary", label: "Primary", value: "var(--brand-primary)", selected: true },
    { id: "accent", label: "Accent", value: "#ff6600", selected: false }
];

describe("ColorPickerPresets", () => {
    it("renders nothing without presets", () => {
        const { container } = render(<ColorPickerPresets presets={[]} onSelect={vi.fn()} />);
        expect(container.innerHTML).toBe("");
    });

    it("renders a labelled swatch per preset and marks the selected one", () => {
        render(<ColorPickerPresets presets={presets} onSelect={vi.fn()} />);
        const primary = screen.getByRole("button", { name: "Primary" });
        const accent = screen.getByRole("button", { name: "Accent" });
        expect(primary.getAttribute("aria-pressed")).toBe("true");
        expect(accent.getAttribute("aria-pressed")).toBe("false");
        expect(primary.style.backgroundColor).toBe("var(--brand-primary)");
    });

    it("selects a preset by id", () => {
        const onSelect = vi.fn();
        render(<ColorPickerPresets presets={presets} onSelect={onSelect} />);
        fireEvent.click(screen.getByRole("button", { name: "Accent" }));
        expect(onSelect).toHaveBeenCalledWith("accent");
    });
});
