import type { EditorStep } from "~/editor/domain/types.js";
import { createDefaultAssignment } from "~/editor/model/createDefaultAssignment.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for a People step: the common fields and the config `{ teams, assignment }`
 * (R270, Review Focus 3). The assignment is carried unchanged, 9a does not edit it; a step with
 * none gets the review defaults.
 */
export const getPeopleStepPatch = (step: EditorStep, values: PeopleFormValues): EditorStepPatch => {
    const { assignment } = readReviewConfig(step.config);
    const common = getCommonStepPatch(step, values);

    return {
        ...common,
        config: { teams: values.teams ?? [], assignment: assignment ?? createDefaultAssignment() }
    };
};
