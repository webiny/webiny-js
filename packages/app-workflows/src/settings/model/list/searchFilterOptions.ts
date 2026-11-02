import type { PickerOption } from "~/components/picker/PickerOption.js";

/*
 * The user filter's options for a typed search (R332, Q64): the users in the list whose label
 * contains the trimmed search, ignoring case; every option for an empty search. Only the label is
 * searched. In order; a new list.
 */
export const searchFilterOptions = (options: PickerOption[], search: string): PickerOption[] => {
    const needle = search.trim().toLowerCase();
    if (needle === "") {
        return [...options];
    }
    return options.filter(option => option.label.toLowerCase().includes(needle));
};
