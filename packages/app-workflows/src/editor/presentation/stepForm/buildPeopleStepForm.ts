import { z } from "zod";
import type { FormModelFactory } from "@webiny/app-admin";
import { ASSIGNMENT_FORM_MESSAGES } from "./assignmentFormMessages.js";
import { buildCommonFields } from "./buildCommonFields.js";
import { PEOPLE_TAB } from "./peopleTabs.js";
import { PEOPLE_TABS_ID } from "./peopleTabs.js";
import { STEP_FORM_MESSAGES } from "./stepFormMessages.js";
import { STEP_FORM_RENDERER } from "./stepFormRendererNames.js";
import { validateAfterChange } from "./validateAfterChange.js";

// The rules are `RuleValue`s, plain JSON: the field takes any list of records, and an empty list is valid (R293).
const rulesSchema = z.array(z.record(z.string(), z.unknown()));

export interface PeopleStepFormParams {
    /*
     * A People step that cannot be edited (the `review` type is unavailable, teams are off, R309):
     * every field is disabled and the form has no tabs.
     */
    readOnly: boolean;
}

const EDITABLE: PeopleStepFormParams = { readOnly: false };

function buildAssignmentField(
    registry: FormModelFactory.FieldBuilderRegistry,
    readOnly: boolean
): FormModelFactory.FieldBuilder {
    return registry
        .object()
        .label(ASSIGNMENT_FORM_MESSAGES.tabAssignment)
        .renderer("objectAccordionSingle", { container: false })
        .fields(nested => {
            const afterStrategyChange = validateAfterChange("assignment.strategy");
            const afterAllowManualPickChange = validateAfterChange("assignment.allowManualPick");
            const afterRulesChange = validateAfterChange("assignment.rules");

            const strategy = nested
                .text()
                .label(ASSIGNMENT_FORM_MESSAGES.strategyLabel)
                .renderer(STEP_FORM_RENDERER.assignmentStrategy)
                .afterChange(afterStrategyChange)
                .disabled(readOnly);

            const allowManualPick = nested
                .boolean()
                .label(ASSIGNMENT_FORM_MESSAGES.allowManualPickLabel)
                .note(ASSIGNMENT_FORM_MESSAGES.allowManualPickHint)
                .renderer(STEP_FORM_RENDERER.requesterPick)
                .afterChange(afterAllowManualPickChange)
                .disabled(readOnly);

            const rules = nested
                .permissions()
                .label(ASSIGNMENT_FORM_MESSAGES.rulesLabel)
                .schema(rulesSchema)
                .renderer(STEP_FORM_RENDERER.routingRules)
                .afterChange(afterRulesChange)
                .disabled(readOnly);

            return { strategy, allowManualPick, rules };
        });
}

/*
 * The People step form (R270, R293, R302, R308): the common fields, the reviewing teams and the
 * `assignment` object (strategy, the requester-pick toggle and the routing rules) in layout tabs
 * `General`, `Assignment` and `Test routing`. A read-only step has the General rows and no tabs.
 */
export const buildPeopleStepForm = (
    params: PeopleStepFormParams = EDITABLE
): FormModelFactory.Config => {
    const { readOnly } = params;

    return {
        fields: registry => {
            const common = buildCommonFields({
                registry,
                descriptionPlaceholder: STEP_FORM_MESSAGES.peopleDescriptionPlaceholder,
                readOnly
            });

            const teams = registry
                .text()
                .list()
                .label("Reviewing teams")
                .description(STEP_FORM_MESSAGES.teamsHint)
                .required(STEP_FORM_MESSAGES.teamsRequired)
                .renderer(STEP_FORM_RENDERER.teams)
                .afterChange(validateAfterChange("teams"))
                .disabled(readOnly);

            return {
                title: common.title,
                color: common.color,
                description: common.description,
                teams,
                notifications: common.notifications,
                assignment: buildAssignmentField(registry, readOnly)
            };
        },
        layout: layout => {
            if (readOnly) {
                return [
                    layout.row("title"),
                    layout.row("color"),
                    layout.row("description"),
                    layout.row("teams"),
                    layout.row("notifications")
                ];
            }

            const tabs = layout
                .tabs(PEOPLE_TABS_ID)
                .tab(PEOPLE_TAB.general, tab => {
                    tab.label(ASSIGNMENT_FORM_MESSAGES.tabGeneral).layout(general => [
                        general.row("title"),
                        general.row("color"),
                        general.row("description"),
                        general.row("teams"),
                        general.row("notifications")
                    ]);
                })
                .tab(PEOPLE_TAB.assignment, tab => {
                    tab.label(ASSIGNMENT_FORM_MESSAGES.tabAssignment).layout(assignment => [
                        assignment.row("assignment")
                    ]);
                })
                .tab(PEOPLE_TAB.testRouting, tab => {
                    tab.label(ASSIGNMENT_FORM_MESSAGES.tabTestRouting).layout(testRouting => [
                        testRouting.element(STEP_FORM_RENDERER.testRouting)
                    ]);
                });

            return [tabs];
        }
    };
};
