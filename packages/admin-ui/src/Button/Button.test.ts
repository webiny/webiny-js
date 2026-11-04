import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buttonVariants } from "./Button.js";

describe("buttonVariants destructive", () => {
    it("uses the destructive colours for the normal, hover, active and disabled states", () => {
        const tokens = buttonVariants({ variant: "destructive" }).split(" ");

        expect(tokens).toContain("bg-destructive");
        expect(tokens).toContain("hover:bg-destructive-strong");
        expect(tokens).toContain("active:bg-destructive-xstrong");
        expect(tokens).toContain("aria-disabled:bg-destructive-disabled");
    });

    it("shows a destructive focus ring like the other variants", () => {
        const tokens = buttonVariants({ variant: "destructive" }).split(" ");

        expect(tokens).toContain("focus-visible:ring-lg");
        expect(tokens).toContain("focus-visible:ring-destructive-subtle");
    });

    it("keeps the primary variant free of destructive colours", () => {
        const tokens = buttonVariants({ variant: "primary" }).split(" ");

        expect(tokens).not.toContain("bg-destructive");
    });
});
