import type { EditorStep } from "~/editor/domain/types.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

/*
 * The People step as form values: the common fields, the stored team ids (strings only) and the
 * assignment read into typed values (R293). What the editor does not edit stays in the
 * `preserved` records of the typed value, which `getPeopleStepPatch` reads again from the step.
 */
export const getPeopleFormData = (step: EditorStep): PeopleFormValues => {
    const { teams, assignment } = readReviewConfig(step.config);
    const common = getCommonFormData(step);
    const stored = readAssignment(assignment);

    return {
        ...common,
        teams,
        assignment: {
            strategy: stored.strategy,
            allowManualPick: stored.allowManualPick,
            rules: stored.rules
        }
    };
};
