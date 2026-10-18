import type { PickerOption } from "~/components/picker/PickerOption.js";

// A plain option with no description, warning, flag or icon; `overrides` win.
export const createPickerOption = (overrides: Partial<PickerOption> = {}): PickerOption => {
    return {
        id: "option-1",
        label: "Option",
        description: null,
        warning: null,
        muted: false,
        disabled: false,
        icon: null,
        ...overrides
    };
};
