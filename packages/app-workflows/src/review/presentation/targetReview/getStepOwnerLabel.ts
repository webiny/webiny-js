import type { ReviewStep } from "~/review/domain/types.js";
import { StepState } from "~/review/domain/StepState.js";
import { getTeamNames } from "./getTeamNames.js";

/*
 * Who holds a step, as the bar, the popover and the drawer name them. AI and automation owners
 * are named by the step title, never by a model or an automation (R216, QBZ-79).
 */
export const getStepOwnerLabel = (step: ReviewStep): string => {
    const owner = step.owner;
    if (owner) {
        if (owner.type !== "user") {
            return step.title;
        }
        const name = owner.displayName.trim();
        if (name === "") {
            return "A user";
        }
        return name;
    }

    if (step.state === StepState.Pending) {
        return "Not reached yet";
    }

    const names = getTeamNames(step);
    if (names === "") {
        return "Team pool";
    }
    return `Team pool (${names})`;
};
