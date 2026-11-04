import { StepTypeId } from "~/editor/domain/StepTypeId.js";
import type { StepKind } from "./abstractions.js";

export const getStepKind = (type: string): StepKind => {
    if (type === StepTypeId.Review) {
        return "review";
    }
    if (type === StepTypeId.Automation) {
        return "automation";
    }
    if (type === StepTypeId.Ai) {
        return "ai";
    }
    return "unknown";
};
