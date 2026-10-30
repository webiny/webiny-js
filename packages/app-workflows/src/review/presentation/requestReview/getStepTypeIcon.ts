import { StepTypeId } from "~/editor/domain/StepTypeId.js";

export type StepTypeIconName = "group" | "auto_awesome" | "bolt";

// One map for the type tag icon of a step (design README 3); a "review" step is a People step.
const ICON_BY_TYPE: Record<string, StepTypeIconName> = {
    [StepTypeId.Ai]: "auto_awesome",
    [StepTypeId.Automation]: "bolt"
};

export const getStepTypeIcon = (type: string): StepTypeIconName => {
    return ICON_BY_TYPE[type] ?? "group";
};
