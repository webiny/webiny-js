import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { removeExclusion } from "./removeExclusion.js";

const first = createExclusion({ userId: "user-1", reason: "On leave" });
const second = createExclusion({ userId: "user-2", endsOn: "2020-01-01T00:00:00.000Z" });
const third = createExclusion({ userId: "user-3" });

describe("removeExclusion (R318)", () => {
    it("drops only the user's entry and keeps every other entry and its order", () => {
        const result = removeExclusion([first, second, third], "user-2");

        expect(result).toEqual([first, third]);
        expect(result[0]).toBe(first);
        expect(result[1]).toBe(third);
    });

    it("keeps an expired entry of another user", () => {
        const result = removeExclusion([first, second], "user-1");

        expect(result).toEqual([second]);
        expect(result[0]).toBe(second);
    });

    it("returns an equal new list for a user who is not in it", () => {
        const list = [first, second];

        const result = removeExclusion(list, "user-9");

        expect(result).toEqual(list);
        expect(result).not.toBe(list);
    });

    it("does not change the given list", () => {
        const list = [first, second];

        removeExclusion(list, "user-1");

        expect(list).toEqual([first, second]);
    });
});
