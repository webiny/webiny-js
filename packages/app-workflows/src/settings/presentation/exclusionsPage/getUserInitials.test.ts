import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getUserInitials } from "./getUserInitials.js";

describe("getUserInitials", () => {
    it("takes the first letters of the first and the last word", () => {
        expect(getUserInitials("Marko Babić")).toBe("MB");
        expect(getUserInitials("ana maria kovač")).toBe("AK");
    });

    it("takes the first two letters of a one-word name", () => {
        expect(getUserInitials("admin")).toBe("AD");
    });

    it("has none for an empty name", () => {
        expect(getUserInitials("   ")).toBeNull();
    });
});
