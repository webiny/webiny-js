import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import type { PickerOption } from "./PickerOption.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";

const legal: PickerOption = { id: "t1", label: "Legal", description: null, warning: null };
const press: PickerOption = { id: "t2", label: "Press", description: null, warning: null };
const sales: PickerOption = { id: "t3", label: "Sales", description: null, warning: null };

describe("toPickerCommandOptions", () => {
    it("lists the search results with their option as the item", () => {
        const commandOptions = toPickerCommandOptions([], [legal, press], false, "");

        expect(commandOptions).toEqual([
            { label: "Legal", value: "t1", disabled: false, item: legal },
            { label: "Press", value: "t2", disabled: false, item: press }
        ]);
    });

    it("puts a chosen item the search does not contain first", () => {
        const commandOptions = toPickerCommandOptions([sales], [legal, press], false, "");

        expect(commandOptions.map(option => option.value)).toEqual(["t3", "t1", "t2"]);
    });

    it("does not repeat a chosen item the search contains", () => {
        const commandOptions = toPickerCommandOptions([press], [legal, press], false, "");

        expect(commandOptions.map(option => option.value)).toEqual(["t1", "t2"]);
    });

    it("lists an unknown item as disabled so it cannot be picked again", () => {
        const unknown: PickerOption = {
            id: "t9",
            label: "Unknown item",
            description: null,
            warning: "This item no longer exists."
        };

        const commandOptions = toPickerCommandOptions([unknown], [legal], false, "");

        expect(commandOptions[0].disabled).toBe(true);
        expect(commandOptions[1].disabled).toBe(false);
    });

    it("adds a disabled hint line when the search was cut", () => {
        const commandOptions = toPickerCommandOptions([], [legal], true, "le");

        expect(commandOptions).toHaveLength(2);
        expect(commandOptions[1].label).toBe("More matches. Keep typing to narrow the list.");
        expect(commandOptions[1].disabled).toBe(true);
        expect(commandOptions[1].item).toBeUndefined();
    });

    it("ends the hint's value with the query so the list's own filter keeps it", () => {
        const commandOptions = toPickerCommandOptions([], [legal], true, "le");

        expect(commandOptions[1].value.endsWith("le")).toBe(true);
    });

    it("adds no hint line when the search was not cut", () => {
        const commandOptions = toPickerCommandOptions([], [legal], false, "le");

        expect(commandOptions).toHaveLength(1);
    });
});
