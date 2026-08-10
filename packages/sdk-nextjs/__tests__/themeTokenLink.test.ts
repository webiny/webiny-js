// @vitest-environment happy-dom
import { describe, it, expect, beforeEach } from "vitest";
import { ensureThemeTokenLink } from "../src/themeTokenLink.js";

// A detached document (no browsing context) so adding a stylesheet <link> doesn't trigger a real
// network fetch — we're testing the DOM bookkeeping, not resource loading.
let doc: Document;

const stylesheetHrefs = () =>
    Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).map(link =>
        link.getAttribute("href")
    );

describe("ensureThemeTokenLink", () => {
    beforeEach(() => {
        doc = document.implementation.createHTMLDocument("test");
    });

    it("adds a stylesheet link when none for that href exists", () => {
        const cleanup = ensureThemeTokenLink(doc, "/_webiny/theme/tokens.css");

        expect(stylesheetHrefs()).toEqual(["/_webiny/theme/tokens.css"]);
        expect(cleanup).toBeTypeOf("function");
    });

    it("is a no-op when a link to the same href already exists (host layout provided it)", () => {
        const existing = doc.createElement("link");
        existing.rel = "stylesheet";
        existing.setAttribute("href", "/_webiny/theme/tokens.css");
        doc.head.appendChild(existing);

        const cleanup = ensureThemeTokenLink(doc, "/_webiny/theme/tokens.css");

        expect(stylesheetHrefs()).toEqual(["/_webiny/theme/tokens.css"]);
        expect(cleanup).toBeUndefined();
    });

    it("adds its own link for a previewed-theme href even when the active one is present", () => {
        const active = doc.createElement("link");
        active.rel = "stylesheet";
        active.setAttribute("href", "/_webiny/theme/tokens.css");
        doc.head.appendChild(active);

        ensureThemeTokenLink(doc, "/_webiny/theme/preview/abc/2/tokens.css");

        // Both present; the previewed one is appended last, so its :root values win the cascade.
        expect(stylesheetHrefs()).toEqual([
            "/_webiny/theme/tokens.css",
            "/_webiny/theme/preview/abc/2/tokens.css"
        ]);
    });

    it("cleanup removes only the link it added", () => {
        const cleanup = ensureThemeTokenLink(doc, "/_webiny/theme/tokens.css");
        expect(stylesheetHrefs()).toHaveLength(1);

        cleanup?.();
        expect(stylesheetHrefs()).toHaveLength(0);
    });
});
