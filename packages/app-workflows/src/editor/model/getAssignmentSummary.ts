import type { EditorStep } from "~/editor/domain/types.js";
import type { AssignmentStrategy } from "./assignment/AssignmentStrategy.js";
import { readAssignment } from "./assignment/readAssignment.js";
import { readReviewConfig } from "./readReviewConfig.js";

const STRATEGY_NAMES: Record<AssignmentStrategy, string> = {
    none: "Team pool",
    roundRobin: "Round-robin",
    leastLoaded: "Least-loaded"
};

/*
 * The assignment part of a People step's summary: `{Team pool|Round-robin|Least-loaded}[ · n
 * routing rule(s)][ · requester can pick]`. Empty when the step has none of them. Pure.
 */
export const getAssignmentSummary = (step: EditorStep): string => {
    const config = readReviewConfig(step.config);
    const assignment = readAssignment(config.assignment);
    const parts: string[] = [];
    if (assignment.strategy !== null) {
        parts.push(STRATEGY_NAMES[assignment.strategy]);
    }
    const count = assignment.rules.length;
    if (count > 0) {
        const noun = count === 1 ? "rule" : "rules";
        parts.push(`${count} routing ${noun}`);
    }
    if (assignment.allowManualPick) {
        parts.push("requester can pick");
    }
    return parts.join(" · ");
};
