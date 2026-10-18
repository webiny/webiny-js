import type { PickerOption } from "./PickerOption.js";
import { PICKER_MORE_MATCHES_TEXT } from "./pickerTexts.js";
import { PICKER_UNKNOWN_ITEM_WARNING } from "./pickerTexts.js";

export interface PickerCommandOption {
    label: string;
    value: string;
    disabled?: boolean;
    item?: PickerOption;
}

const MORE_MATCHES_VALUE_PREFIX = "picker-more-matches:";

// An unknown item is listed (so the input finds its label) but cannot be picked again.
const toCommandOption = (option: PickerOption): PickerCommandOption => {
    const disabled = option.warning === PICKER_UNKNOWN_ITEM_WARNING;
    return { label: option.label, value: option.id, disabled, item: option };
};

/*
 * The options the admin-ui list shows: the chosen items that the current search does not contain
 * first (so a chip or the input keeps its label), then the search results, then, when the search
 * was cut, a disabled line with the "More matches" hint. The list (cmdk 1.1.1) filters its items
 * by the typed text with a fuzzy score of `value` plus keywords, and a constant value scores 0 and
 * disappears while typing, so the hint's value ends with the query. This relies on cmdk's scoring;
 * a sturdier fix (`forceMount` or `shouldFilter` through admin-ui) is an admin-ui change.
 */
export const toPickerCommandOptions = (
    chosen: PickerOption[],
    shown: PickerOption[],
    hasMore: boolean,
    query: string
): PickerCommandOption[] => {
    const shownIds = new Set(shown.map(option => option.id));
    const missing = chosen.filter(option => !shownIds.has(option.id));
    const commandOptions = [...missing, ...shown].map(toCommandOption);

    if (hasMore) {
        const value = `${MORE_MATCHES_VALUE_PREFIX}${query}`;
        commandOptions.push({ label: PICKER_MORE_MATCHES_TEXT, value, disabled: true });
    }

    return commandOptions;
};
