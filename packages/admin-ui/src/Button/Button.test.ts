import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { buttonVariants } from "./Button.js";

describe("buttonVariants destructive", () => {
    it("uses the destructive colours for the normal, hover, active and disabled states", () => {
        const className = buttonVariants({ variant: "destructive" });

        expect(className).toContain("bg-destructive");
        expect(className).toContain("hover:bg-destructive-strong");
        expect(className).toContain("active:bg-destructive-xstrong");
        expect(className).toContain("aria-disabled:bg-destructive-disabled");
    });

    it("keeps the primary variant free of destructive colours", () => {
        expect(buttonVariants({ variant: "primary" })).not.toContain("bg-destructive");
    });
});
