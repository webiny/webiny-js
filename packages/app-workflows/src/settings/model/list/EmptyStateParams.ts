import type { ExclusionTab } from "./ExclusionTab.js";

export interface EmptyStateParams {
    // How many entries the whole list has, on every tab.
    total: number;
    tab: ExclusionTab;
    // The search text, trimmed; empty when there is none.
    search: string;
}
