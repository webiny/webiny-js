import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { isToastInteraction } from "./isToastInteraction.js";

describe("isToastInteraction", () => {
    it("is true for a click inside the toast stack", () => {
        const toaster = document.createElement("section");
        toaster.setAttribute("data-sonner-toaster", "");
        const close = document.createElement("button");
        toaster.appendChild(close);
        document.body.appendChild(toaster);

        expect(isToastInteraction(close)).toBe(true);
        toaster.remove();
    });

    it("is false for a click anywhere else and for no target", () => {
        const page = document.createElement("div");
        document.body.appendChild(page);

        expect(isToastInteraction(page)).toBe(false);
        expect(isToastInteraction(null)).toBe(false);
        page.remove();
    });
});
