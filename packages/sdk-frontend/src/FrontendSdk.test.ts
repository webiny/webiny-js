// @vitest-environment jsdom
import { afterEach, describe, expect, it } from "vitest";
import { sdk } from "./FrontendSdk.js";

const topWindow = window;

// Opens the page at `search`, framed by another window or not.
function openPage(search: string, framed: boolean) {
    window.history.replaceState(null, "", `/page${search}`);
    Object.defineProperty(window, "parent", {
        configurable: true,
        value: framed ? ({} as Window) : topWindow
    });
}

afterEach(() => {
    openPage("", false);
});

describe("FrontendSdk.isEditing", () => {
    it("is editing in the page editor's preview", () => {
        openPage("?wb.editing=true&wb.type=page&wb.id=1", true);
        expect(sdk.isEditing()).toBe(true);
    });

    it("is editing in the CMS entry editor's live preview", () => {
        openPage("?wb.type=entry&wb.id=1", true);
        expect(sdk.isEditing()).toBe(true);
    });

    it("is not editing in a page framed as a preview (wb.preview)", () => {
        openPage("?wb.preview=true&wb.type=page&wb.id=1", true);
        expect(sdk.isEditing()).toBe(false);
    });

    it("is not editing on its own", () => {
        openPage("?wb.type=page", false);
        expect(sdk.isEditing()).toBe(false);
    });
});
