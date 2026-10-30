import type { PickerOption } from "./PickerOption.js";

// What the admin-ui picker shows for a chosen item: its id, label and warning as one string.
export const toPickerChosenEntry = (option: PickerOption): string => {
    return JSON.stringify([option.id, option.label, option.warning]);
};
