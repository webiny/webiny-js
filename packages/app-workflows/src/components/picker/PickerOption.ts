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
    /*
     * A short note on the right of the row (R332), e.g. `In the list`: muted small text, cut at
     * about half the row with the full text in `title`, part of the row's text; null for none.
     */
    note: string | null;
}
