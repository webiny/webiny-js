import type { ExclusionTab } from "./ExclusionTab.js";

export interface EmptyStateParams {
    // How many entries the whole list has, on every tab.
    total: number;
    tab: ExclusionTab;
    // A user filter is set.
    userFiltered: boolean;
}
