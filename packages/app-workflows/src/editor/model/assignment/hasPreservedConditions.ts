import { isRecord } from "~/editor/model/isRecord.js";
import type { RuleValue } from "./RuleValue.js";

/*
 * True when the rule holds a stored condition the editor cannot show (R313): `modelId`, an unknown
 * key or a malformed editable condition. A summary must not read `Always` for such a rule.
 */
export const hasPreservedConditions = (rule: RuleValue): boolean => {
    const conditions = rule.preserved.conditions;
    return isRecord(conditions) && Object.keys(conditions).length > 0;
};
