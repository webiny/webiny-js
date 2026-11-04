import type { ExclusionTab } from "./ExclusionTab.js";

export interface FilterExclusionsParams {
    tab: ExclusionTab;
    // The user filter; `null` for all users.
    userId: string | null;
    // The time the VM is computed at (R319).
    now: number;
}
