import type { Breakpoint } from "~/types.js";

/**
 * Used until a theme is applied. Server rendering and Next.js builds rely on it,
 * so it has to cover the full width range.
 */
const fallbackBreakpoint: Breakpoint = {
    name: "desktop",
    title: "",
    description: "",
    icon: "",
    minWidth: 0,
    maxWidth: 4000
};

/**
 * Holds the active theme's breakpoints.
 *
 * This is deliberately kept out of `ViewportManager`. `ViewportManager` observes
 * the browser viewport, so it is a client module (`"use client"`), and a Server
 * Component that imports it receives a client reference rather than the real
 * object. Breakpoints are plain configuration that the server needs too, for
 * example to generate breakpoint-aware CSS while rendering, so they live here in
 * a module both sides can read and write.
 */
class BreakpointsStore {
    private breakpoints: Breakpoint[] = [fallbackBreakpoint];

    public setBreakpoints(breakpoints: Breakpoint[]): void {
        this.breakpoints = breakpoints;
    }

    public getBreakpoints(): Breakpoint[] {
        return this.breakpoints;
    }

    /**
     * Look up a single breakpoint by name. Returns `undefined` when the name is
     * not part of the active theme.
     */
    public getBreakpoint(name: string): Breakpoint | undefined {
        return this.breakpoints.find(breakpoint => breakpoint.name === name);
    }
}

export const breakpointsStore = new BreakpointsStore();
