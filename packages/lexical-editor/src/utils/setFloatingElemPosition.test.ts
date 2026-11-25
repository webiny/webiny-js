// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setFloatingElemPosition } from "./setFloatingElemPosition.js";

// A selection 20px tall at (100, 300) in a 1000x800 viewport; the element is 200x40.
const range = (top: number) =>
    ({
        getBoundingClientRect: () => ({ left: 100, top, bottom: top + 20, right: 160 })
    }) as unknown as Range;

const element = () => {
    const el = document.createElement("div");
    Object.defineProperty(el, "offsetWidth", { value: 200 });
    Object.defineProperty(el, "offsetHeight", { value: 40 });
    return el;
};

describe("setFloatingElemPosition", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        Object.assign(window, { innerWidth: 1000, innerHeight: 800 });
    });
    afterEach(() => vi.useRealTimers());

    it("places the element below the range by default, as before", () => {
        const el = element();
        setFloatingElemPosition(range(300), el);
        vi.runAllTimers();
        expect(el.style.top).toBe("330px");
        expect(el.style.left).toBe("100px");
    });

    it("places the element above the range when asked", () => {
        const el = element();
        setFloatingElemPosition(range(300), el, { placement: "above" });
        vi.runAllTimers();
        expect(el.style.top).toBe("250px");
    });

    it("places it below when there's no room above", () => {
        const el = element();
        setFloatingElemPosition(range(30), el, { placement: "above" });
        vi.runAllTimers();
        expect(el.style.top).toBe("60px");
    });
});
