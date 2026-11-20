import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createExclusion } from "~/settings/testing/settingsFixtures.js";
import { searchExclusionsByName } from "./searchExclusionsByName.js";

const ana = createExclusion({ userId: "user-1" });
const ben = createExclusion({ userId: "user-2" });
const LIST = [ana, ben];
const LABELS = new Map([
    ["user-1", "Ana Kovač"],
    ["user-2", "Ben Babić"]
]);

describe("searchExclusionsByName", () => {
    it("keeps every row for a blank search", () => {
        expect(searchExclusionsByName(LIST, LABELS, "")).toEqual(LIST);
        expect(searchExclusionsByName(LIST, LABELS, "   ")).toEqual(LIST);
    });

    it("matches the display name, ignoring case", () => {
        expect(searchExclusionsByName(LIST, LABELS, "BEN")).toEqual([ben]);
        expect(searchExclusionsByName(LIST, LABELS, " kov ")).toEqual([ana]);
    });

    it("returns nothing when no name matches", () => {
        expect(searchExclusionsByName(LIST, LABELS, "zed")).toEqual([]);
    });
});
