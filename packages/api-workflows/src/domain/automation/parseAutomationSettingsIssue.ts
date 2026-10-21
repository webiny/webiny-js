import { Result } from "@webiny/feature/api";
import type { ZodType } from "zod";

/** The first problem of a step's automation settings (R267): where it is and what is wrong. */
export interface AutomationSettingsIssue {
    /** The zod issue path joined by dots; empty when the issue has no path. */
    path: string;
    message: string;
}

/**
 * Parses a step's settings with the definition's `settingsSchema`, like `parseAutomationSettings`,
 * but fails with the first issue split into its path and message, so the save-time validation can
 * name the settings field (R267). Ok is the parsed value (defaults applied).
 */
export const parseAutomationSettingsIssue = (
    schema: ZodType,
    settings: unknown
): Result<unknown, AutomationSettingsIssue> => {
    const parsed = schema.safeParse(settings);
    if (parsed.success) {
        return Result.ok(parsed.data);
    }
    const [issue] = parsed.error.issues;
    const path = issue?.path.map(String).join(".") ?? "";
    const message = issue?.message ?? "unknown error";
    return Result.fail({ path, message });
};
