import { Result } from "@webiny/feature/api";
import type { ZodType } from "zod";
import { parseAutomationSettingsIssue } from "./parseAutomationSettingsIssue.js";

/**
 * Parses a step's settings with the definition's `settingsSchema` (R133, R137, R148). Ok is the
 * parsed value (defaults applied); fail is the first issue as `"<path>: <message>"`, the path
 * dot-joined and omitted when empty. Save, reach and restart word their own reasons around it.
 */
export const parseAutomationSettings = (
    settingsSchema: ZodType,
    settings: unknown
): Result<unknown, string> => {
    const parsed = parseAutomationSettingsIssue(settingsSchema, settings);
    if (parsed.isOk()) {
        return Result.ok(parsed.value);
    }
    const { path, message } = parsed.error;
    return Result.fail(path ? `${path}: ${message}` : message);
};
