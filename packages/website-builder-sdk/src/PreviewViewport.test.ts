// @vitest-environment jsdom
import { describe, it, expect, afterEach } from "vitest";
import { PreviewViewport } from "./PreviewViewport.js";

afterEach(() => {
    document.body.innerHTML = "";
});

describe("PreviewViewport", () => {
    it("reports the page root and the globals in layout order, whether or not they render anything", () => {
        // The dialog renders nothing while it's closed, so it has no box, but it still has a place.
        document.body.innerHTML = `
            <div data-element-id="$global:Demo/Header"><header>Header</header></div>
            <div data-element-id="root">
                <div data-element-id="hero" data-parent-id="root"><section>Hero</section></div>
            </div>
            <div data-element-id="$global:Demo/Footer"><footer>Footer</footer></div>
            <div data-element-id="$global:Demo/LoginDialog"></div>
        `;

        const viewport = new PreviewViewport();

        expect(viewport.getLayout()).toEqual([
            "$global:Demo/Header",
            "root",
            "$global:Demo/Footer",
            "$global:Demo/LoginDialog"
        ]);
        expect(viewport.getBoxes()["$global:Demo/LoginDialog"]).toBeUndefined();
    });
});
