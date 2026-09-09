import { describe, it, expect } from "vitest";
import { breakpointsStore } from "./BreakpointsStore.js";
import { viewportManager } from "./ViewportManager.js";
import type { Breakpoint } from "~/types.js";

const makeBreakpoint = (name: string, maxWidth: number): Breakpoint => ({
    name,
    title: "",
    description: "",
    icon: "",
    minWidth: 0,
    maxWidth
});

const themeBreakpoints = [
    makeBreakpoint("desktop", 4000),
    makeBreakpoint("tablet", 991),
    makeBreakpoint("mobile", 430)
];

describe("breakpointsStore", () => {
    // Runs first on purpose: the store is a module singleton, so the fallback is
    // only observable before a theme is applied.
    it("falls back to a full-width desktop breakpoint before a theme is applied", () => {
        expect(breakpointsStore.getBreakpoints()).toEqual([
            expect.objectContaining({ name: "desktop", maxWidth: 4000 })
        ]);
    });

    it("returns the breakpoints it was given", () => {
        breakpointsStore.setBreakpoints(themeBreakpoints);

        expect(breakpointsStore.getBreakpoints()).toEqual(themeBreakpoints);
    });

    it("looks a breakpoint up by name", () => {
        breakpointsStore.setBreakpoints(themeBreakpoints);

        expect(breakpointsStore.getBreakpoint("mobile")?.maxWidth).toBe(430);
        expect(breakpointsStore.getBreakpoint("tablet")?.maxWidth).toBe(991);
    });

    it("returns undefined for a name the theme does not define", () => {
        breakpointsStore.setBreakpoints(themeBreakpoints);

        expect(breakpointsStore.getBreakpoint("watch")).toBeUndefined();
    });

    it("is what ViewportManager reports, so both sides agree", () => {
        breakpointsStore.setBreakpoints(themeBreakpoints);

        expect(viewportManager.getViewport().breakpoints).toEqual(themeBreakpoints);
    });

    it("still accepts writes through the deprecated ViewportManager method", () => {
        const single = [makeBreakpoint("desktop", 4000)];
        viewportManager.setBreakpoints(single);

        expect(breakpointsStore.getBreakpoints()).toEqual(single);

        breakpointsStore.setBreakpoints(themeBreakpoints);
    });
});
