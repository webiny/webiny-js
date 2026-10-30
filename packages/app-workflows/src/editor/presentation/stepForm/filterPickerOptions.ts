import type { PickerOption } from "~/components/picker/PickerOption.js";

/*
 * Client-side search over a complete list (R292): the options whose label contains the text,
 * case-insensitively, in their order; a blank text returns the list.
 */
export const filterPickerOptions = (options: PickerOption[], query: string): PickerOption[] => {
    const needle = query.trim().toLowerCase();
    if (needle === "") {
        return options;
    }
    return options.filter(option => option.label.toLowerCase().includes(needle));
};
