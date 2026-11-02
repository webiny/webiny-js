import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { sortExclusions } from "./sortExclusions.js";

describe("sortExclusions (R322, Q66)", () => {
    it("sorts by the name label, ignoring case", () => {
        const list = [
            createExclusion({ userId: "user-c" }),
            createExclusion({ userId: "user-a" }),
            createExclusion({ userId: "user-b" })
        ];
        const labels = new Map([
            ["user-a", "bea Novak"],
            ["user-b", "Cedo Ilić"],
            ["user-c", "Ana Kovač"]
        ]);

        const result = sortExclusions(list, labels);

        const ids = result.map(exclusion => exclusion.userId);
        expect(ids).toEqual(["user-c", "user-a", "user-b"]);
    });

    it("breaks a tie of equal labels by user id, deleted users included", () => {
        const list = [
            createExclusion({ userId: "user-z" }),
            createExclusion({ userId: "user-y" }),
            createExclusion({ userId: "user-x" })
        ];
        const labels = new Map([
            ["user-z", "Deleted user"],
            ["user-y", "Deleted user"],
            ["user-x", "deleted user"]
        ]);

        const result = sortExclusions(list, labels);

        const ids = result.map(exclusion => exclusion.userId);
        expect(ids).toEqual(["user-x", "user-y", "user-z"]);
    });

    it("sorts a user without a known label by the raw user id", () => {
        const list = [
            createExclusion({ userId: "b-raw-id" }),
            createExclusion({ userId: "user-1" })
        ];
        const labels = new Map([["user-1", "Ana"]]);

        const result = sortExclusions(list, labels);

        const ids = result.map(exclusion => exclusion.userId);
        expect(ids).toEqual(["user-1", "b-raw-id"]);
    });

    it("returns a new list and leaves the given one as it was", () => {
        const first = createExclusion({ userId: "user-b" });
        const second = createExclusion({ userId: "user-a" });
        const list = [first, second];
        const labels = new Map([
            ["user-a", "Ana"],
            ["user-b", "Bea"]
        ]);

        const result = sortExclusions(list, labels);

        expect(result).not.toBe(list);
        expect(result[0]).toBe(second);
        expect(list[0]).toBe(first);
    });
});
