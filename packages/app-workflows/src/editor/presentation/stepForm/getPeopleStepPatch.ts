import { toJS } from "mobx";
import type { EditorStep } from "~/editor/domain/types.js";
import type { AssignmentValue } from "~/editor/model/assignment/AssignmentValue.js";
import { assignmentToConfig } from "~/editor/model/assignment/assignmentToConfig.js";
import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";
import { readAssignment } from "~/editor/model/assignment/readAssignment.js";
import type { EditorStepPatch } from "~/editor/model/EditorStepPatch.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonStepPatch } from "./getCommonStepPatch.js";

/*
 * What Done writes for a People step: the common fields and the config `{ teams, assignment }`
 * (R293, R295, R314, Review Focus 2). The assignment starts from the stored one read into typed
 * values and only `strategy`, `allowManualPick` and `rules` are replaced by the form's values, so
 * every key the editor does not edit (unknown assignment keys, the `preserved` data of a rule, an
 * unknown strategy while none was picked) is written back as stored. A step with no assignment
 * gets the review defaults.
 */
export const getPeopleStepPatch = (step: EditorStep, values: PeopleFormValues): EditorStepPatch => {
    const { assignment } = readReviewConfig(step.config);
    const stored = readAssignment(assignment);
    const common = getCommonStepPatch(step, values);

    // The rules come from the form field, which holds observable data.
    const rules: RuleValue[] = toJS(values.assignment.rules);
    const edited: AssignmentValue = {
        ...stored,
        strategy: values.assignment.strategy,
        allowManualPick: values.assignment.allowManualPick,
        rules
    };
    const config = assignmentToConfig(edited);

    return { ...common, config: { teams: values.teams ?? [], assignment: config } };
};
