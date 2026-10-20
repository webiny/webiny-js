import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";
import type { ShownCardError } from "./ShownCardError.js";

/*
 * The card's lines without what the strip already says (R299, R303): the line identical to the
 * strip text, and, when the strip is a rule's error, the live `error` lines of that rule (the strip
 * is the rule's current error, so a live line worded differently does not double it). A `warning`
 * line of that rule and the lines of other rules stay.
 */
export const omitShownError = (
    lines: StepWarningLine[],
    shown: ShownCardError | null
): StepWarningLine[] => {
    if (shown === null) {
        return lines;
    }
    return lines.filter(line => {
        if (line.text === shown.text) {
            return false;
        }
        if (shown.rulePrefix !== null && line.severity === "error") {
            return !line.text.startsWith(shown.rulePrefix);
        }
        return true;
    });
};
