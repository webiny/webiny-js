const SETTINGS_PREFIX = "config.settings.";
const TEAMS_PREFIX = "config.teams.";
const RULES_FIELD = "config.assignment.rules";

const CONFIG_FIELDS: Record<string, string> = {
    "config.teams": "teams",
    "config.automationId": "automationId",
    "config.instructions": "instructions",
    "config.model": "model",
    "config.tools": "tools",
    "config.assignment.strategy": "assignment.strategy",
    "config.assignment.allowManualPick": "assignment.allowManualPick"
};

const STEP_FIELDS = new Set(["title", "color", "notifications"]);

/*
 * The form field a step error's `field` (R267, R288) belongs to, or null when the forms have none
 * (`id`, `type`, `config.settings` itself, another zod path, `config.assignment` itself, an empty
 * field): the drawer then shows the message at the top. Every rule field maps to `assignment.rules`,
 * the field that carries the Assignment tab's error mark; the rule and its field come from
 * `getRuleErrorField` and the error's `ruleId` (R303).
 */
export const getFormFieldPath = (field: string | null): string | null => {
    if (field === null) {
        return null;
    }
    if (STEP_FIELDS.has(field)) {
        return field;
    }
    // A zod issue of a review config path, e.g. `config.teams.0` (R267).
    if (field.startsWith(TEAMS_PREFIX)) {
        return "teams";
    }
    if (field.startsWith(SETTINGS_PREFIX)) {
        return `settings.${field.slice(SETTINGS_PREFIX.length)}`;
    }
    if (field === RULES_FIELD || field.startsWith(`${RULES_FIELD}.`)) {
        return "assignment.rules";
    }
    return CONFIG_FIELDS[field] ?? null;
};
