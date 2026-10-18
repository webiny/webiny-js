import type { PickerOptionIcon } from "./PickerOptionIcon.js";

export interface PickerOption {
    id: string;
    label: string;
    description: string | null;
    warning: string | null;
    // A saved reference that no longer resolves (a deleted user or team): the label shows in muted text (R307).
    muted: boolean;
    // The row cannot be picked (a restricted folder, an unknown item).
    disabled: boolean;
    // The icon column of the row (R307); null for none.
    icon: PickerOptionIcon | null;
}
