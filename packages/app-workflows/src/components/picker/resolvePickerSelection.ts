import type { PickerOption } from "./PickerOption.js";
import { PICKER_UNKNOWN_ITEM_LABEL } from "./pickerTexts.js";
import { PICKER_UNKNOWN_ITEM_WARNING } from "./pickerTexts.js";

/*
 * The option of every chosen id, in order: the `selected` item with that id (it keeps its label
 * when a search narrows the list), else the search result with that id, else an unknown item.
 */
export const resolvePickerSelection = (
    ids: string[],
    selected: PickerOption[],
    options: PickerOption[]
): PickerOption[] => {
    return ids.map(id => {
        const known = selected.find(option => option.id === id);
        if (known) {
            return known;
        }
        const found = options.find(option => option.id === id);
        if (found) {
            return found;
        }
        return {
            id,
            label: PICKER_UNKNOWN_ITEM_LABEL,
            description: null,
            warning: PICKER_UNKNOWN_ITEM_WARNING
        };
    });
};
