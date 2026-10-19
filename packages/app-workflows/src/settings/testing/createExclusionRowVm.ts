import type { ExclusionRowVm } from "~/settings/presentation/exclusionsPage/abstractions.js";

// An active row of a found user with a reason and an end date in Zagreb; `overrides` win.
export const createExclusionRowVm = (overrides: Partial<ExclusionRowVm> = {}): ExclusionRowVm => {
    return {
        userId: "user-1",
        label: "Ana Kovač",
        muted: false,
        subLine: null,
        reason: "On leave",
        reasonMuted: false,
        untilLabel: "End of 20 Oct 2026",
        untilTitle: "Tue 20 Oct 2026, 23:59 CEST (Europe/Zagreb)",
        status: "active",
        statusLabel: "Active",
        editLabel: "Edit exclusion for Ana Kovač",
        removeLabel: "Remove exclusion for Ana Kovač",
        ...overrides
    };
};
