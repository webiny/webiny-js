import { describe } from "vitest";
import { it } from "vitest";
import { expect } from "vitest";
import { UserDisplayName } from "~/domain/users/UserDisplayName.js";

describe("UserDisplayName", () => {
    it("uses the display name first", () => {
        const name = UserDisplayName.from({
            id: "u1",
            displayName: " Ada L. ",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@webiny.com"
        });

        expect(name.toString()).toBe("Ada L.");
    });

    it("falls back to the first and last name", () => {
        const name = UserDisplayName.from({
            id: "u1",
            displayName: "  ",
            firstName: "Ada",
            lastName: "Lovelace",
            email: "ada@webiny.com"
        });

        expect(name.toString()).toBe("Ada Lovelace");
    });

    it("falls back to the e-mail address", () => {
        const name = UserDisplayName.from({ id: "u1", email: "ada@webiny.com" });

        expect(name.toString()).toBe("ada@webiny.com");
    });

    it("falls back to the user ID", () => {
        const name = UserDisplayName.from({ id: "u1", email: "" });

        expect(name.toString()).toBe("u1");
    });
});
