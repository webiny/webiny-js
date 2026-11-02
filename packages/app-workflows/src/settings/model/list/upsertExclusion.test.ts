import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { upsertExclusion } from "./upsertExclusion.js";

const first = createExclusion({ userId: "user-1", reason: "On leave" });
const second = createExclusion({ userId: "user-2", endsOn: "2020-01-01T00:00:00.000Z" });
const third = createExclusion({ userId: "user-3" });

describe("upsertExclusion (R318)", () => {
    it("appends a new user's entry and keeps every other entry and its order", () => {
        const list = [first, second];
        const added = createExclusion({ userId: "user-9", reason: "Busy" });

        const result = upsertExclusion(list, added);

        expect(result).toEqual([first, second, added]);
        expect(result[0]).toBe(first);
        expect(result[1]).toBe(second);
        expect(result[2]).toBe(added);
    });

    it("replaces the entry with the same user in place and keeps every other entry", () => {
        const list = [first, second, third];
        const edited = createExclusion({ userId: "user-2", reason: "Back on Monday" });

        const result = upsertExclusion(list, edited);

        expect(result).toEqual([first, edited, third]);
        expect(result[0]).toBe(first);
        expect(result[1]).toBe(edited);
        expect(result[2]).toBe(third);
    });

    it("does not change the given list", () => {
        const list = [first, second];
        const edited = createExclusion({ userId: "user-1", reason: "Changed" });

        const result = upsertExclusion(list, edited);

        expect(result).not.toBe(list);
        expect(list).toEqual([first, second]);
        expect(list[0]).toBe(first);
    });

    it("adds to an empty list", () => {
        expect(upsertExclusion([], first)).toEqual([first]);
    });
});
