import type { ExclusionDialogVm } from "~/settings/presentation/exclusionDialog/abstractions.js";

// An empty Add dialog in Zagreb on 20 Oct 2026, nothing picked, not saving; `overrides` win.
export const createExclusionDialogViewModel = (
    overrides: Partial<ExclusionDialogVm> = {}
): ExclusionDialogVm => {
    return {
        title: "Add exclusion",
        user: { value: null, selected: null, options: [], locked: false, error: null },
        reason: "",
        date: null,
        minDate: new Date(2026, 9, 20),
        dateError: null,
        dateHint:
            "Optional. The exclusion ends at the end of that day (Europe/Zagreb). Leave empty to keep it until you remove it.",
        showClear: false,
        note: null,
        alert: null,
        confirmLabel: "Add exclusion",
        saving: false,
        ...overrides
    };
};
