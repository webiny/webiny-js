import React from "react";
import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { vi } from "vitest";
import { RadioGroupPresenter } from "./RadioGroupPresenter.js";

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

describe("RadioGroupPresenter with a React node label", () => {
    it("keeps the label by reference and does not overflow the stack", () => {
        const label = createCyclicLabel();
        const presenter = new RadioGroupPresenter();

        const init = () => {
            presenter.init({
                onValueChange: vi.fn(),
                items: [
                    { value: "a", label },
                    { value: "b", label: "Plain" }
                ]
            });
        };

        expect(init).not.toThrow();
        expect(presenter.vm.items).toHaveLength(2);
        expect(presenter.vm.items[0].label).toBe(label);
        expect(presenter.vm.items[1].label).toBe("Plain");
    });

    it("still reports a value change", () => {
        const onValueChange = vi.fn();
        const label = createCyclicLabel();
        const presenter = new RadioGroupPresenter();
        presenter.init({ onValueChange, items: [{ value: "a", label }] });

        presenter.changeValue("a");

        expect(onValueChange).toHaveBeenCalledWith("a");
    });

    it("recomputes the view model when init is called again", () => {
        const first = createCyclicLabel();
        const second = createCyclicLabel();
        const presenter = new RadioGroupPresenter();
        presenter.init({ items: [{ value: "a", label: first }] });
        presenter.init({
            items: [
                { value: "a", label: first },
                { value: "b", label: second }
            ]
        });

        expect(presenter.vm.items.map(item => item.value)).toEqual(["a", "b"]);
        expect(presenter.vm.items[1].label).toBe(second);
    });
});
