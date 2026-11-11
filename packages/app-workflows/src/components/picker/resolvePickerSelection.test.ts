import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import type { PickerOption } from "./PickerOption.js";
import { resolvePickerSelection } from "./resolvePickerSelection.js";

const legal = createPickerOption({ id: "t1", label: "Legal" });
const press = createPickerOption({
    id: "t2",
    label: "Press",
    description: "3 members",
    warning: "This team has no members"
});

describe("resolvePickerSelection", () => {
    it("returns nothing for no ids", () => {
        expect(resolvePickerSelection([], [legal], [press])).toEqual([]);
    });

    it("prefers the selected item over the search result with the same id", () => {
        const renamed: PickerOption = { ...legal, label: "Legal team" };

        const chosen = resolvePickerSelection(["t1"], [legal], [renamed]);

        expect(chosen).toEqual([legal]);
    });

    it("falls back to the search result", () => {
        expect(resolvePickerSelection(["t2"], [legal], [press])).toEqual([press]);
    });

    it("returns an unknown item for an id nobody knows", () => {
        expect(resolvePickerSelection(["t9"], [legal], [press])).toEqual([
            createPickerOption({
                id: "t9",
                label: "Unknown item",
                warning: "This item no longer exists."
            })
        ]);
    });

    it("keeps the order of the ids", () => {
        const chosen = resolvePickerSelection(["t2", "t9", "t1"], [legal], [press]);

        expect(chosen.map(option => option.id)).toEqual(["t2", "t9", "t1"]);
    });
});
