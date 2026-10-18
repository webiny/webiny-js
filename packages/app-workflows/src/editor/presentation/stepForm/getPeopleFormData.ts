import type { EditorStep } from "~/editor/domain/types.js";
import { readReviewConfig } from "~/editor/model/readReviewConfig.js";
import type { PeopleFormValues } from "./StepFormData.js";
import { getCommonFormData } from "./getCommonFormData.js";

// The People step as form values: the common fields and the stored team ids (strings only).
export const getPeopleFormData = (step: EditorStep): PeopleFormValues => {
    const { teams } = readReviewConfig(step.config);
    const common = getCommonFormData(step);

    return { ...common, teams };
};
