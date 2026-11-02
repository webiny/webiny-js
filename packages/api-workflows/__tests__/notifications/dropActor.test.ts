import { describe, expect, it } from "vitest";
import { dropActor } from "~/domain/notifications/dropActor.js";
import { aiActor, requester, reviewer } from "~tests/__helpers/fixtures.js";
import type { Actor } from "~/domain/review/types.js";

interface Recipient {
    id: string;
    displayName: string;
}

const RITA: Recipient = { id: requester.id, displayName: requester.displayName };
const ROB: Recipient = { id: reviewer.id, displayName: reviewer.displayName };

describe("dropActor (R184)", () => {
    it("drops the recipient who is the acting user", () => {
        expect(dropActor([RITA, ROB], reviewer)).toEqual([RITA]);
    });

    it("keeps everybody when the acting user is not a recipient", () => {
        expect(dropActor([RITA], reviewer)).toEqual([RITA]);
    });

    it("keeps the requester when an AI actor carries the requester's id (D58)", () => {
        expect(aiActor.id).toBe(requester.id);

        expect(dropActor([RITA, ROB], aiActor)).toEqual([RITA, ROB]);
    });

    it("keeps the requester when an automation actor carries the requester's id (D58)", () => {
        const automation: Actor = {
            type: "automation",
            id: requester.id,
            displayName: "Link checker"
        };

        expect(dropActor([RITA, ROB], automation)).toEqual([RITA, ROB]);
    });

    it("drops the requester when the requester acts as a user", () => {
        expect(dropActor([RITA, ROB], requester)).toEqual([ROB]);
    });

    it("returns a new array and leaves the input alone", () => {
        const recipients = [RITA, ROB];

        const kept = dropActor(recipients, aiActor);
        const dropped = dropActor(recipients, reviewer);

        expect(kept).not.toBe(recipients);
        expect(dropped).not.toBe(recipients);
        expect(recipients).toEqual([RITA, ROB]);
    });

    it("keeps the shape of the recipients", () => {
        const withExtra = [{ id: "user-1", displayName: "One", extra: true }];

        const kept = dropActor(withExtra, reviewer);

        expect(kept[0].extra).toBe(true);
    });

    it("returns an empty list for no recipients", () => {
        expect(dropActor([], reviewer)).toEqual([]);
    });
});
