import { ColorPickerPresenter } from "./ColorPickerPresenter.js";
import { describe, expect, it, vi } from "vitest";

describe("ColorPickerPresenter", () => {
    const presenter = new ColorPickerPresenter();
    const onValueChange = vi.fn();

    it("should return the compatible `vm` based on params", () => {
        // `value`
        {
            presenter.init({ value: "#ff0000", onValueChange });
            expect(presenter.vm.value).toBe("#ff0000");
        }

        {
            // default: no params
            presenter.init({ onValueChange });
            expect(presenter.vm.value).toEqual("");
            expect(presenter.vm.open).toEqual(false);
        }
    });

    it("should set the color", () => {
        presenter.init({ onValueChange });
        presenter.setColor({ hex: "#ff0000" });
        expect(presenter.vm.value).toBe("#ff0000");
        expect(onValueChange).toHaveBeenCalledWith("#ff0000");
    });

    it("should commit the color", () => {
        const onValueCommit = vi.fn();
        presenter.init({ onValueChange, onValueCommit });
        presenter.commitColor({ hex: "#00ff00" });
        expect(presenter.vm.value).toBe("#00ff00");
        expect(onValueCommit).toHaveBeenCalledWith("#00ff00");
    });

    it("should set the open state", () => {
        const onOpenChange = vi.fn();
        presenter.init({ onValueChange, onOpenChange });
        presenter.setOpen(true);
        expect(presenter.vm.open).toBe(true);
        expect(onOpenChange).toHaveBeenCalledWith(true);
    });

    const presets = [
        { id: "primary", label: "Primary", value: "var(--brand-primary)" },
        { id: "accent", label: "Accent", value: "#ff6600" }
    ];

    it("should list no presets by default", () => {
        presenter.init({ onValueChange });
        expect(presenter.vm.presets).toEqual([]);
    });

    it("should mark the preset matching the value as selected", () => {
        presenter.init({ value: "var(--brand-primary)", presets, onValueChange });
        expect(presenter.vm.presets.map(preset => preset.selected)).toEqual([true, false]);
    });

    it("should emit a preset's value exactly as given", () => {
        const change = vi.fn();
        const commit = vi.fn();
        presenter.init({ presets, onValueChange: change, onValueCommit: commit });
        presenter.selectPreset("primary");
        expect(presenter.vm.value).toBe("var(--brand-primary)");
        expect(change).toHaveBeenCalledWith("var(--brand-primary)");
        expect(commit).toHaveBeenCalledWith("var(--brand-primary)");
        expect(presenter.vm.presets.find(preset => preset.id === "primary")?.selected).toBe(true);
    });

    it("should ignore an unknown preset", () => {
        const change = vi.fn();
        presenter.init({ value: "#000000", presets, onValueChange: change });
        presenter.selectPreset("missing");
        expect(presenter.vm.value).toBe("#000000");
        expect(change).not.toHaveBeenCalled();
    });
});
