import type { PickerOption } from "./PickerOption.js";

export const PICKER_OPTION_LIMIT = 50;

export interface LimitedPickerOptions {
    options: PickerOption[];
    hasMore: boolean;
}

// At most 50 options are visible (design UI-3); `hasMore` says some were cut.
export const limitPickerOptions = (options: PickerOption[]): LimitedPickerOptions => {
    if (options.length <= PICKER_OPTION_LIMIT) {
        return { options, hasMore: false };
    }
    return { options: options.slice(0, PICKER_OPTION_LIMIT), hasMore: true };
};
