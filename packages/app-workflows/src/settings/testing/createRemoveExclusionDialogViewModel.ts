import type { RemoveExclusionDialogVm } from "~/settings/presentation/removeDialog/abstractions.js";

// The Remove dialog of a found user, not removing; `overrides` win.
export const createRemoveExclusionDialogViewModel = (
    overrides: Partial<RemoveExclusionDialogVm> = {}
): RemoveExclusionDialogVm => {
    return {
        title: "Remove exclusion?",
        body: "Ana Kovač can be assigned automatically again. Nothing changes for work they already hold.",
        alert: null,
        removing: false,
        ...overrides
    };
};
