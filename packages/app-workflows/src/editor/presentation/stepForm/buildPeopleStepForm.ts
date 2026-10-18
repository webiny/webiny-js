import type { FormModelFactory } from "@webiny/app-admin";
import { buildCommonFields } from "./buildCommonFields.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

/*
 * The People step form (R270): the common fields plus `teams`, one body, no tabs. The Assignment
 * and Test routing tabs arrive with 9b; until then `assignment` is carried unchanged by
 * `getPeopleStepPatch`.
 */
export const buildPeopleStepForm = (): FormModelFactory.Config => {
    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: STEP_FORM_MESSAGES.peopleDescriptionPlaceholder,
                readOnly: false
            });

            const teams = registry
                .text()
                .list()
                .label("Reviewing teams")
                .description(STEP_FORM_MESSAGES.teamsHint)
                .required(STEP_FORM_MESSAGES.teamsRequired)
                .renderer(STEP_FORM_RENDERER.teams)
                .afterChange(validateAfterChange("teams"));

            return {
                title: common.title,
                color: common.color,
                description: common.description,
                teams,
                notifications: common.notifications
            };
        }
    };
};
