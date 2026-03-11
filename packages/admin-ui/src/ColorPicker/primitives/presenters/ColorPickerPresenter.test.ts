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
});
