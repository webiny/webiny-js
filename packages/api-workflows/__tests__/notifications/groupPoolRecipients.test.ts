import { describe, expect, it } from "vitest";
import { groupPoolRecipients } from "~/domain/notifications/groupPoolRecipients.js";

describe("groupPoolRecipients", () => {
    it("returns no groups for no recipients", () => {
        expect(groupPoolRecipients([])).toEqual([]);
    });

    it("groups recipients by team set, in the order the groups first appear", () => {
        const anna = { id: "anna", displayName: "Anna", teamIds: ["legal"] };
        const bob = { id: "bob", displayName: "Bob", teamIds: ["legal", "marketing"] };
        const cara = { id: "cara", displayName: "Cara", teamIds: ["legal"] };
        const dan = { id: "dan", displayName: "Dan", teamIds: [] };

        expect(groupPoolRecipients([anna, bob, cara, dan])).toEqual([
            { teamIds: ["legal"], recipients: [anna, cara] },
            { teamIds: ["legal", "marketing"], recipients: [bob] },
            { teamIds: [], recipients: [dan] }
        ]);
    });

    it("treats a set in another order or with a repeated id as the same set", () => {
        const anna = { id: "anna", teamIds: ["legal", "marketing"] };
        const bob = { id: "bob", teamIds: ["marketing", "legal", "legal"] };

        expect(groupPoolRecipients([anna, bob])).toEqual([
            { teamIds: ["legal", "marketing"], recipients: [anna, bob] }
        ]);
    });

    it("does not change its input", () => {
        const recipients = [{ id: "anna", teamIds: ["b", "a"] }];
        const copy = structuredClone(recipients);

        groupPoolRecipients(recipients);

        expect(recipients).toEqual(copy);
    });
});
