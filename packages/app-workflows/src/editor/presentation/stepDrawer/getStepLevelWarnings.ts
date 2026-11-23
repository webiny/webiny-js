import type { StepWarningLine } from "~/editor/model/StepWarningLine.js";

/*
 * The step's own warning lines that mark no field (e.g. `Legal has no members.`), for the alerts at
 * the end of the Assignment tab. A rule's lines (they carry a `ruleId`) show in their rule card, and
 * an `error` line never shows as a warning. Pure.
 */
export const getStepLevelWarnings = (lines: StepWarningLine[]): string[] => {
    return lines
        .filter(line => line.severity === "warning" && line.ruleId === undefined)
        .map(line => line.text);
};
