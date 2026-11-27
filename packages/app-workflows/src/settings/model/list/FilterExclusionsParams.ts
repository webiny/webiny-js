import type { ExclusionTab } from "./ExclusionTab.js";

export interface FilterExclusionsParams {
    tab: ExclusionTab;
    // The time the VM is computed at (R319).
    now: number;
}
