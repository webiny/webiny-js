import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getExclusionsEmptyState } from "./getExclusionsEmptyState.js";

const NO_EXCLUSIONS = {
    title: "No exclusions",
    text: "Everyone in the reviewing teams can be assigned automatically.",
    showAdd: true,
    showClearSearch: false
};

const NO_EXPIRED_EXCLUSIONS = {
    title: "No expired exclusions",
    text: "Exclusions move here after their end date.",
    showAdd: false,
    showClearSearch: false
};

describe("getExclusionsEmptyState (R322, design DS:241, B27)", () => {
    it("says No exclusions with Add on an empty Active or All tab, whatever the list holds", () => {
        expect(getExclusionsEmptyState({ total: 0, tab: "active", search: "" })).toEqual(
            NO_EXCLUSIONS
        );
        expect(getExclusionsEmptyState({ total: 0, tab: "all", search: "" })).toEqual(
            NO_EXCLUSIONS
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "active", search: "" })).toEqual(
            NO_EXCLUSIONS
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "all", search: "" })).toEqual(
            NO_EXCLUSIONS
        );
    });

    it("says No expired exclusions without Add on an empty Expired tab", () => {
        expect(getExclusionsEmptyState({ total: 3, tab: "expired", search: "" })).toEqual(
            NO_EXPIRED_EXCLUSIONS
        );
        expect(getExclusionsEmptyState({ total: 0, tab: "expired", search: "" })).toEqual(
            NO_EXPIRED_EXCLUSIONS
        );
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

    it("says No exclusions, not No one matches, when there is nothing to search", () => {
        expect(getExclusionsEmptyState({ total: 0, tab: "active", search: "ana" })).toEqual(
            NO_EXCLUSIONS
        );
    });
});
