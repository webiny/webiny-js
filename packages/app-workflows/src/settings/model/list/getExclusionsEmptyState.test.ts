import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { getExclusionsEmptyState } from "./getExclusionsEmptyState.js";

const NO_ONE_EXCLUDED = "Everyone in reviewing teams can be assigned automatically.";

describe("getExclusionsEmptyState (R322, design DS:241)", () => {
    it("says No exclusions with Add when the list is empty, on any tab", () => {
        const expected = {
            icon: "person_off",
            title: "No exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        };

        expect(getExclusionsEmptyState({ total: 0, tab: "active", userFiltered: false })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 0, tab: "expired", userFiltered: false })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 0, tab: "all", userFiltered: false })).toEqual(
            expected
        );
    });

    it("says No expired exclusions without Add on an empty Expired tab, with or without a user filter", () => {
        const expected = {
            icon: "history",
            title: "No expired exclusions",
            text: "Exclusions move here after their end date.",
            showAdd: false
        };

        expect(getExclusionsEmptyState({ total: 3, tab: "expired", userFiltered: false })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "expired", userFiltered: true })).toEqual(
            expected
        );
    });

    it("says No active exclusions with Add on an empty Active tab without a user filter", () => {
        expect(getExclusionsEmptyState({ total: 3, tab: "active", userFiltered: false })).toEqual({
            icon: "person_off",
            title: "No active exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        });
    });

    it("says No exclusions for this user without Add on an empty Active or All tab with a user filter", () => {
        const expected = {
            icon: "person_off",
            title: "No exclusions for this user",
            text: NO_ONE_EXCLUDED,
            showAdd: false
        };

        expect(getExclusionsEmptyState({ total: 3, tab: "active", userFiltered: true })).toEqual(
            expected
        );
        expect(getExclusionsEmptyState({ total: 3, tab: "all", userFiltered: true })).toEqual(
            expected
        );
    });

    it("says No active exclusions with Add on an empty All tab without a user filter", () => {
        expect(getExclusionsEmptyState({ total: 3, tab: "all", userFiltered: false })).toEqual({
            icon: "person_off",
            title: "No active exclusions",
            text: NO_ONE_EXCLUDED,
            showAdd: true
        });
    });
});
