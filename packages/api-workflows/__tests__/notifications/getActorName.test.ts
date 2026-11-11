import { describe, expect, it } from "vitest";
import { getActorName } from "~/domain/notifications/getActorName.js";
import type { Actor } from "~/domain/review/types.js";

describe("getActorName (D107, D126, R189a)", () => {
    it("is the display name of a user", () => {
        const actor: Actor = { type: "user", id: "user-1", displayName: "Rob Reviewer" };

        expect(getActorName(actor, "Legal review")).toBe("Rob Reviewer");
    });

    it("reads 'A user' for a blank or whitespace-only user name", () => {
        const blank: Actor = { type: "user", id: "user-1", displayName: "" };
        const spaces: Actor = { type: "user", id: "user-1", displayName: "   " };

        expect(getActorName(blank, "Legal review")).toBe("A user");
        expect(getActorName(spaces, "Legal review")).toBe("A user");
    });

    it("trims the display name of a user", () => {
        const actor: Actor = { type: "user", id: "user-1", displayName: "  Rob Reviewer " };

        expect(getActorName(actor, "Legal review")).toBe("Rob Reviewer");
    });

    it("is the step title for an AI actor, never the model's name (D107)", () => {
        const actor: Actor = { type: "ai", id: "user-requester", displayName: "claude-sonnet-5" };

        expect(getActorName(actor, "Brand check")).toBe("Brand check");
    });

    it("is the step title for an automation actor, never the automation's name (D126)", () => {
        const actor: Actor = {
            type: "automation",
            id: "user-requester",
            displayName: "Link checker v2"
        };

        expect(getActorName(actor, "Check links")).toBe("Check links");
    });
});
