import type { ExclusionsPageVm } from "~/settings/presentation/exclusionsPage/abstractions.js";

// A ready page on the Active tab with no rows, no search and no dialog; `overrides` win.
export const createExclusionsPageViewModel = (
    overrides: Partial<ExclusionsPageVm> = {}
): ExclusionsPageVm => {
    return {
        status: "ready",
        canAdd: true,
        tab: "active",
        tabs: [
            { id: "active", label: "Active" },
            { id: "expired", label: "Expired" },
            { id: "all", label: "All" }
        ],
        search: "",
        sortDirection: "asc",
        rows: [],
        empty: null,
        namesFailed: false,
        dialog: null,
        ...overrides
    };
};
