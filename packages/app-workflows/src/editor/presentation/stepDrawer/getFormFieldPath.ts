const SETTINGS_PREFIX = "config.settings.";
const TEAMS_PREFIX = "config.teams.";

const CONFIG_FIELDS: Record<string, string> = {
    "config.teams": "teams",
    "config.automationId": "automationId",
    "config.instructions": "instructions",
    "config.model": "model",
    "config.tools": "tools"
};

const STEP_FIELDS = new Set(["title", "color", "notifications"]);

/*
 * The form field a step error's `field` (R267) belongs to, or null when 9a's forms have none
 * (`id`, `type`, `config.assignment.rules`, `config.settings` itself, another zod path, an empty field):
 * the drawer then shows the message at the top.
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
    return CONFIG_FIELDS[field] ?? null;
};
