export interface RuleWithoutTarget {
    /** The rule's id; null when the rule has none. */
    ruleId: string | null;
}

type UnknownRecord = Record<string, unknown>;

const isRecord = (value: unknown): value is UnknownRecord => {
    return typeof value === "object" && value !== null && !Array.isArray(value);
};

/**
 * The first routing rule of a raw review step config that is an object without an object
 * `target` (R288). Runs on the config as received, before the schema, because the schema reports
 * the same rule by index and without its id. A rule that is not an object is left to the schema.
 */
export const findRuleWithoutTarget = (config: unknown): RuleWithoutTarget | null => {
    if (!isRecord(config) || !isRecord(config.assignment)) {
        return null;
    }
    const rules = Array.isArray(config.assignment.rules) ? config.assignment.rules : [];
    for (const rule of rules) {
        if (isRecord(rule) && !isRecord(rule.target)) {
            const ruleId = typeof rule.id === "string" && rule.id !== "" ? rule.id : null;
            return { ruleId };
        }
    }
    return null;
};
