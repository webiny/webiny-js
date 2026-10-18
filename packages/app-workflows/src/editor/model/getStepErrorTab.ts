import type { StepFieldError } from "./StepFieldError.js";

export type StepErrorTab = "general" | "assignment";

const GENERAL_FIELDS = new Set([
    "title",
    "color",
    "notifications",
    "config.teams",
    "config.automationId",
    "config.instructions",
    "config.model",
    "config.tools"
]);

const ASSIGNMENT_FIELDS = new Set([
    "config.assignment.strategy",
    "config.assignment.allowManualPick"
]);
const RULES_FIELD = "config.assignment.rules";

function getTab(field: string): StepErrorTab | null {
    // The same fields `getFormFieldPath` maps to the assignment form fields (R303).
    if (
        ASSIGNMENT_FIELDS.has(field) ||
        field === RULES_FIELD ||
        field.startsWith(`${RULES_FIELD}.`)
    ) {
        return "assignment";
    }
    if (GENERAL_FIELDS.has(field)) {
        return "general";
    }
    // A zod path under `config.teams` and a setting of the automation form.
    if (field.startsWith("config.teams.") || field.startsWith("config.settings.")) {
        return "general";
    }
    return null;
}

/*
 * The tab of the drawer that holds the first error that has a form field (R302): rule and
 * assignment fields on `Assignment`, every other field with a form field on `General`. An error with
 * no form field (shown at the top of the drawer) and the Test routing tab never carry one. Pure.
 */
export const getStepErrorTab = (errors: StepFieldError[]): StepErrorTab | null => {
    for (const error of errors) {
        const tab = getTab(error.field);
        if (tab !== null) {
            return tab;
        }
    }
    return null;
};
