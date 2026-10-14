import { Result } from "@webiny/feature/api";
import type { AutomationDefinition } from "~/features/automation/AutomationDefinition/abstractions.js";

/**
 * Parses a step's settings with the definition's `settingsSchema` (R133, R137, R148). Ok is the
 * parsed value (defaults applied); fail is the first issue as `"<path>: <message>"`, the path
 * dot-joined and omitted when empty. Save, reach and restart word their own reasons around it.
 */
export const parseAutomationSettings = (
    definition: AutomationDefinition.Interface,
    settings: unknown
): Result<unknown, string> => {
    const parsed = definition.settingsSchema.safeParse(settings);
    if (parsed.success) {
        return Result.ok(parsed.data);
    }
    const [issue] = parsed.error.issues;
    const path = issue?.path.map(String).join(".") ?? "";
    const message = issue?.message ?? "unknown error";
    return Result.fail(path ? `${path}: ${message}` : message);
};
