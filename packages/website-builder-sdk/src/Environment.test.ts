import { afterEach, describe, expect, it, vi } from "vitest";
import { Environment } from "./Environment.js";

const stubWindow = (search: string, inIframe: boolean) => {
    const window: Record<string, unknown> = { location: { search } };
    window.parent = inIframe ? {} : window;
    vi.stubGlobal("window", window);
};

describe("Environment", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("is not editing on the server", () => {
        expect(new Environment().isEditing()).toBe(false);
    });

    it("is not editing outside an iframe", () => {
        stubWindow("?wb.editing=true", false);
        expect(new Environment().isEditing()).toBe(false);
    });

    it("is editing in the Website Builder editor's preview", () => {
        stubWindow("?wb.editing=true&wb.type=page", true);
        expect(new Environment().isEditing()).toBe(true);

        stubWindow("?wb.editing=true&wb.type=layout", true);
        expect(new Environment().isEditing()).toBe(true);
    });

    it("is not editing in the CMS entry editor's live preview", () => {
        stubWindow("?wb.editing=true&wb.type=entry&wb.id=abc", true);
        expect(new Environment().isEditing()).toBe(false);
    });
});
