import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CheckboxPresenter } from "./CheckboxPresenter.js";

/*
 * A React element created during a render points at its owner fiber, and a fiber points back at
 * its parent and children. A deep observable walks that whole cycle and overflows the stack.
 */
const createCyclicLabel = () => {
    const fiber: Record<string, unknown> = { tag: 0 };
    fiber.return = fiber;
    fiber.child = fiber;
    const element = React.createElement("span", null, "Card");
    return { ...element, _owner: fiber };
};

describe("CheckboxPresenter with a React node label", () => {
    it("keeps the label by reference and does not overflow the stack", () => {
        const label = createCyclicLabel();
        const presenter = new CheckboxPresenter();

        const init = () => {
            presenter.init({ onCheckedChange: vi.fn(), id: "box", label, checked: true });
        };

        expect(init).not.toThrow();
        expect(presenter.vm.item?.label).toBe(label);
        expect(presenter.vm.item?.hasLabel).toBe(true);
        expect(presenter.vm.item?.checked).toBe(true);
    });

    it("still reports a change", () => {
        const onCheckedChange = vi.fn();
        const label = createCyclicLabel();
        const presenter = new CheckboxPresenter();
        presenter.init({ onCheckedChange, label });

        presenter.changeChecked(true);

        expect(onCheckedChange).toHaveBeenCalledWith(true);
    });

    it("recomputes the item when init is called again", () => {
        const label = createCyclicLabel();
        const presenter = new CheckboxPresenter();
        presenter.init({ onCheckedChange: vi.fn(), label, checked: false });
        presenter.init({ onCheckedChange: vi.fn(), label, checked: true });

        expect(presenter.vm.item?.checked).toBe(true);
    });
});
