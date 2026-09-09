import { describe, it, expect, beforeEach } from "vitest";
import { breakpointsStore } from "@webiny/website-builder-sdk";
import { createGridClass, createGridStackingCss } from "./gridStyles.js";

const makeBreakpoint = (name: string, maxWidth: number) => ({
    name,
    title: "",
    description: "",
    icon: "",
    minWidth: 0,
    maxWidth
});

describe("createGridClass", () => {
    it("scopes the class to the element id", () => {
        expect(createGridClass("51ymnzews569243uf6wy1")).toBe("wb-grid-51ymnzews569243uf6wy1");
    });

    it("replaces characters that are not valid in a class name", () => {
        expect(createGridClass("abc#0001.x")).toBe("wb-grid-abc-0001-x");
    });
});

describe("createGridStackingCss", () => {
    beforeEach(() => {
        breakpointsStore.setBreakpoints([
            makeBreakpoint("desktop", 4000),
            makeBreakpoint("tablet", 991),
            makeBreakpoint("mobile", 430)
        ]);
    });

    it("returns nothing when no stacking breakpoint is configured", () => {
        expect(createGridStackingCss({ gridClass: "wb-grid-a" })).toBe("");
    });

    it("returns nothing when the breakpoint is not part of the theme", () => {
        expect(createGridStackingCss({ gridClass: "wb-grid-a", stackAtBreakpoint: "watch" })).toBe(
            ""
        );
    });

    it("stacks at the width the theme defines for that breakpoint", () => {
        const css = createGridStackingCss({
            gridClass: "wb-grid-a",
            stackAtBreakpoint: "mobile"
        });

        expect(css).toContain("@media (max-width: 430px)");
        expect(css).toContain(".wb-grid-a { flex-direction: column !important; }");
        expect(css).toContain(".wb-grid-a > .wb-grid-col { flex: 0 0 100% !important;");
    });

    it("uses the tablet width when stacking at tablet", () => {
        const css = createGridStackingCss({
            gridClass: "wb-grid-a",
            stackAtBreakpoint: "tablet"
        });

        expect(css).toContain("@media (max-width: 991px)");
    });

    it("reverses the column order when asked", () => {
        const css = createGridStackingCss({
            gridClass: "wb-grid-a",
            stackAtBreakpoint: "mobile",
            reverseWhenStacked: true
        });

        expect(css).toContain("flex-direction: column-reverse !important;");
    });

    it("scopes every rule to the given grid class", () => {
        const css = createGridStackingCss({
            gridClass: "wb-grid-b",
            stackAtBreakpoint: "mobile"
        });

        expect(css).not.toContain("wb-grid-a");
        expect(css.match(/\.wb-grid-b/g)).toHaveLength(2);
    });
});
