import { PEOPLE_TAB } from "~/editor/presentation/stepForm/peopleTabs.js";
import type { StepErrorTab } from "~/editor/model/getStepErrorTab.js";

export type { StepErrorTab };

// The ids of the People step's layout tabs (Task 18), owned by `peopleTabs.ts`.
export const STEP_DRAWER_TAB = PEOPLE_TAB;

export const STEP_ERROR_TAB_LABELS: Record<StepErrorTab, string> = {
    general: "General",
    assignment: "Assignment"
};
