import { describe, expect, it } from "vitest";
import { describeActor, initialsOf } from "~/timeline/describeActor.js";

/**
 * "Not everything is a person", which is the design's fifth screen and the subtlest requirement in
 * it: a reader must not have to guess whether someone was actually sitting there.
 *
 * The load-bearing case is a background task. Tasks impersonate whoever started them, so identity
 * alone cannot tell a scheduled publish from a hand-clicked one — that is exactly why the recorder
 * captures `source` separately, and exactly what these tests pin.
 */

const person = { id: "u-1", type: "admin", displayName: "Nina Kovač" };

describe("initialsOf", () => {
    it("takes the first and last name", () => {
        expect(initialsOf("Nina Kovač")).toBe("NK");
        expect(initialsOf("Ada Byron King")).toBe("AK");
    });

    it("takes two letters from a single word", () => {
        expect(initialsOf("webiny")).toBe("WE");
    });

    it("returns nothing for an empty name rather than a stray letter", () => {
        expect(initialsOf("   ")).toBe("");
    });
});

describe("a person at a keyboard", () => {
    it("gets initials and no qualifier", () => {
        const actor = describeActor({ actor: person, source: "admin" });

        expect(actor.kind).toBe("person");
        expect(actor.initials).toBe("NK");
        expect(actor.badge).toBeNull();
        // No badge and no second line: a person is the default, and badging it would put a label
        // on nearly every row.
        expect(actor.via).toBeNull();
    });
});

describe("a background task", () => {
    it("keeps the person's name and says what actually ran", () => {
        // The case identity cannot answer. A scheduled publish and a hand-clicked publish arrive
        // with the same identity of the same type, because the task impersonates the initiator.
        const actor = describeActor({ actor: person, source: "task:cmsEntriesScheduledPublish" });

        expect(actor.kind).toBe("person");
        expect(actor.name).toBe("Nina Kovač");
        expect(actor.badge).toBe("Automated");
        expect(actor.via).toContain("background task");
        expect(actor.via).toContain("Nina Kovač");
        expect(actor.via).toContain("cms entries scheduled publish");
    });

    it("still qualifies the row when the task has no definition id", () => {
        const actor = describeActor({ actor: person, source: "task:" });

        expect(actor.badge).toBe("Automated");
        expect(actor.via).toBe("Ran as a background task on Nina Kovač's behalf");
    });
});

describe("an API key", () => {
    it("reads as a machine, and says the actor is the key", () => {
        // An agent using a token is indistinguishable from any other token holder, by design.
        const actor = describeActor({
            actor: { id: "key-1", type: "api-key", displayName: "content-sync" },
            source: "api-key"
        });

        expect(actor.kind).toBe("machine");
        expect(actor.machineIcon).toBe("key");
        expect(actor.badge).toBe("API key");
        expect(actor.via).toContain("key's name is recorded");
    });
});

describe("an internal write", () => {
    it("says there was no signed-in user", () => {
        const actor = describeActor({
            actor: { id: "system", type: "system", displayName: "" },
            source: "system"
        });

        expect(actor.kind).toBe("machine");
        expect(actor.machineIcon).toBe("system");
        expect(actor.badge).toBe("System");
        expect(actor.name).toBe("system");
    });
});

describe("an actor the reader may not see", () => {
    it("says Someone, not Unknown", () => {
        // The system knows who it was; the reader is not permitted to. Those are different
        // statements, and "Unknown" would claim the wrong one.
        const actor = describeActor({
            actor: { id: "", type: "", displayName: "" },
            source: "admin"
        });

        expect(actor.kind).toBe("redacted");
        expect(actor.name).toBe("Someone");
        expect(actor.initials).toBe("");
        expect(actor.badge).toBeNull();
    });

    it("stays redacted even for a task, which would otherwise name the person", () => {
        const actor = describeActor({
            actor: { id: "", type: "", displayName: "" },
            source: "task:scheduledPublish"
        });

        expect(actor.kind).toBe("redacted");
        expect(actor.via).toBeNull();
    });
});

describe("an identity with no display name", () => {
    it("falls back to the id rather than rendering blank", () => {
        const actor = describeActor({
            actor: { id: "u-9", type: "admin", displayName: "" },
            source: "admin"
        });

        expect(actor.name).toBe("u-9");
    });
});
