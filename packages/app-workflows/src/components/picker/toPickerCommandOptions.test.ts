import { describe } from "vitest";
import { expect } from "vitest";
import { it } from "vitest";
import { createPickerOption } from "~/editor/testing/createPickerOption.js";
import { toPickerCommandOptions } from "./toPickerCommandOptions.js";
import { PICKER_ANY_VALUE } from "./pickerTexts.js";

const legal = createPickerOption({ id: "t1", label: "Legal" });
const press = createPickerOption({ id: "t2", label: "Press" });
const sales = createPickerOption({ id: "t3", label: "Sales" });

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
        const unknown = createPickerOption({
            id: "t9",
            label: "Unknown item",
            warning: "This item no longer exists."
        });

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

    it("puts the clear row first when anyLabel is given, with the any value and no icon", () => {
        const commandOptions = toPickerCommandOptions([], [legal], false, "", "Any folder");

        expect(commandOptions[0]).toEqual({
            label: "Any folder",
            value: PICKER_ANY_VALUE,
            disabled: false,
            item: createPickerOption({ id: PICKER_ANY_VALUE, label: "Any folder" })
        });
        expect(commandOptions.map(option => option.value)).toEqual([PICKER_ANY_VALUE, "t1"]);
    });

    it("keeps the clear row ahead of a chosen item the search does not contain", () => {
        const commandOptions = toPickerCommandOptions([sales], [legal], false, "", "Any folder");

        expect(commandOptions.map(option => option.value)).toEqual([PICKER_ANY_VALUE, "t3", "t1"]);
    });

    it("does not count the clear row toward the hint line", () => {
        const commandOptions = toPickerCommandOptions([], [legal], true, "le", "Any folder");

        expect(commandOptions.map(option => option.label)).toEqual([
            "Any folder",
            "Legal",
            "More matches. Keep typing to narrow the list."
        ]);
    });

    it("has no clear row without anyLabel or with a null one", () => {
        const without = toPickerCommandOptions([], [legal], false, "");
        const withNull = toPickerCommandOptions([], [legal], false, "", null);

        expect(without.map(option => option.value)).toEqual(["t1"]);
        expect(withNull.map(option => option.value)).toEqual(["t1"]);
    });

    it("lists a disabled option as disabled and keeps muted and icon on the item", () => {
        const locked = createPickerOption({
            id: "f9",
            label: "Restricted folder",
            muted: true,
            disabled: true,
            icon: "lock"
        });

        const commandOptions = toPickerCommandOptions([locked], [legal], false, "");

        expect(commandOptions[0].disabled).toBe(true);
        expect(commandOptions[0].item).toEqual(locked);
        expect(commandOptions[1].disabled).toBe(false);
    });
});
