import type { RuleValue } from "~/editor/model/assignment/RuleValue.js";

/*
 * Moves the rule at `from` to position `to`. An index outside the list, or the same index, returns
 * the same array (the buttons at the first and last card are disabled, so this is a safety net).
 * The rules themselves are not copied, so their ids stay.
 */
export const moveRule = (rules: RuleValue[], from: number, to: number): RuleValue[] => {
    const last = rules.length - 1;
    // NaN and fractions are no index: nothing moves.
    if (!Number.isInteger(from) || !Number.isInteger(to)) {
        return rules;
    }
    if (from === to || from < 0 || to < 0 || from > last || to > last) {
        return rules;
    }

    const next = [...rules];
    const moved = next.splice(from, 1);
    next.splice(to, 0, ...moved);
    return next;
};
