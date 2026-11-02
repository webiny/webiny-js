import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { CheckboxGroupPresenter } from "./CheckboxGroupPresenter.js";

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

describe("CheckboxGroupPresenter with a React node label", () => {
    it("keeps the label by reference and does not overflow the stack", () => {
        const label = createCyclicLabel();
        const presenter = new CheckboxGroupPresenter();

        const init = () => {
            presenter.init({
                items: [
                    { value: "a", label },
                    { value: "b", label: "Plain" }
                ],
                values: ["a"],
                onCheckedChange: vi.fn()
            });
        };

        const ticked = () => presenter.vm.items.map(item => item.checked);

        expect(init).not.toThrow();
        expect(ticked()).toEqual([true, false]);
        expect(presenter.vm.items[0].label).toBe(label);
    });

    it("toggles a value on and reports the next values", () => {
        const onCheckedChange = vi.fn();
        const presenter = new CheckboxGroupPresenter();
        presenter.init({
            items: [
                { value: "a", label: createCyclicLabel() },
                { value: "b", label: createCyclicLabel() }
            ],
            values: ["a"],
            onCheckedChange
        });

        presenter.changeChecked("b");

        const ticked = presenter.vm.items.map(item => item.checked);
        expect(onCheckedChange).toHaveBeenCalledWith(["a", "b"]);
        expect(ticked).toEqual([true, true]);
    });

    it("toggles a value off and reports the remaining values", () => {
        const onCheckedChange = vi.fn();
        const presenter = new CheckboxGroupPresenter();
        presenter.init({
            items: [
                { value: "a", label: createCyclicLabel() },
                { value: "b", label: createCyclicLabel() }
            ],
            values: ["a", "b"],
            onCheckedChange
        });

        presenter.changeChecked("a");

        const ticked = presenter.vm.items.map(item => item.checked);
        expect(onCheckedChange).toHaveBeenCalledWith(["b"]);
        expect(ticked).toEqual([false, true]);
    });
});
