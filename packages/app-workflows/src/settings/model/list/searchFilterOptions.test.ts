import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { searchFilterOptions } from "./searchFilterOptions.js";

const IVAN = createPickerOption({ id: "user-1", label: "Ivan Horvat" });
const ANA = createPickerOption({ id: "user-2", label: "Ana Kovač" });
const DELETED = createPickerOption({
    id: "user-9",
    label: "Deleted user",
    description: "user-9",
    muted: true,
    icon: "person_off"
});
const UNRESOLVED = createPickerOption({ id: "user-7", label: "user-7" });

const OPTIONS = [IVAN, ANA, DELETED, UNRESOLVED];

describe("searchFilterOptions (R332, Q64)", () => {
    it("returns every option, in order, for an empty or blank search", () => {
        const empty = searchFilterOptions(OPTIONS, "");
        const blank = searchFilterOptions(OPTIONS, "   ");

        expect(empty).toEqual(OPTIONS);
        expect(empty).not.toBe(OPTIONS);
        expect(blank).toEqual(OPTIONS);
    });

    it("keeps the options whose label contains the search, ignoring case", () => {
        expect(searchFilterOptions(OPTIONS, "IVAN")).toEqual([IVAN]);
        expect(searchFilterOptions(OPTIONS, "ko")).toEqual([ANA]);
        expect(searchFilterOptions(OPTIONS, " deleted ")).toEqual([DELETED]);
        expect(searchFilterOptions(OPTIONS, "an")).toEqual([IVAN, ANA]);
    });

    it("searches the label only, so a deleted user's id in the sub line does not match", () => {
        expect(searchFilterOptions(OPTIONS, "user-9")).toEqual([]);
        expect(searchFilterOptions(OPTIONS, "user-7")).toEqual([UNRESOLVED]);
    });
});
