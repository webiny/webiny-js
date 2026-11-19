import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getExclusionsEmptyState } from "./getExclusionsEmptyState.js";

const NO_ONE_EXCLUDED = "Everyone in reviewing teams can be assigned automatically.";

describe("getExclusionsEmptyState (R322, design DS:241)", () => {
    it("says No exclusions with Add when the list is empty, on any tab", () => {
        const expected = {
            title: "No exclusions",
            text: "Everyone in the reviewing teams can be assigned automatically.",
            showAdd: true,
            showClearSearch: false
        };

        expect(getExclusionsEmptyState({ total: 0, tab: "active", search: "" })).toEqual(expected);
        expect(getExclusionsEmptyState({ total: 0, tab: "expired", search: "" })).toEqual(expected);
        expect(getExclusionsEmptyState({ total: 0, tab: "all", search: "" })).toEqual(expected);
    });

    it("says No expired exclusions without Add on an empty Expired tab", () => {
        const expected = {
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false,
            showClearSearch: false
        };

        expect(getExclusionsEmptyState({ total: 3, tab: "expired", search: "" })).toEqual(expected);
    });

    it("says No active exclusions with Add on an empty Active tab without a user filter", () => {
        expect(getExclusionsEmptyState({ total: 3, tab: "active", search: "" })).toEqual({
            title: "No active exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true,
            showClearSearch: false
        });
    });

    it("says No one matches the query without text or Add, with Clear search, on any tab", () => {
        const expected = {
            title: "No one matches \u201cana\u201d",
            text: null,
            showAdd: false,
            showClearSearch: true
        };

        expect(getExclusionsEmptyState({ total: 3, tab: "active", search: "ana" })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "expired", search: "ana" })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "all", search: "ana" })).toEqual(expected);
    });

    it("says No active exclusions with Add on an empty All tab without a user filter", () => {
        expect(getExclusionsEmptyState({ total: 3, tab: "all", search: "" })).toEqual({
            title: "No active exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true,
            showClearSearch: false
        });
    });
});
