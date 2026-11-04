import { Result } from "@webiny/feature/api";
import { WorkflowSettingsValidationError } from "./errors.js";
import type { WorkflowExclusion, WorkflowSettings } from "./types.js";

const fail = (message: string, userId: string) => {
    return Result.fail(new WorkflowSettingsValidationError(message, { userId }));
};

/** One entry per user (D105); end dates are stored as UTC instants (D43, D110). */
export class WorkflowSettingsValidator {
    public static validate(
        settings: WorkflowSettings
    ): Result<WorkflowSettings, WorkflowSettingsValidationError> {
        const userIds = new Set<string>();
        const exclusions: WorkflowExclusion[] = [];

        for (const exclusion of settings.exclusions) {
            const userId = (exclusion.userId ?? "").trim();
            if (!userId) {
                return fail("Every exclusion needs a user.", "");
            }
            if (userIds.has(userId)) {
                return fail("This user is already in the list. Edit it instead.", userId);
            }
            userIds.add(userId);

            let endsOn: string | undefined;
            if (exclusion.endsOn) {
                const time = Date.parse(exclusion.endsOn);
                if (Number.isNaN(time)) {
                    return fail(`The end date "${exclusion.endsOn}" is not a valid date.`, userId);
                }
                endsOn = new Date(time).toISOString();
            }

            const reason = exclusion.reason?.trim();
            exclusions.push({
                userId,
                ...(reason ? { reason } : {}),
                ...(endsOn ? { endsOn } : {})
            });
        }

        return Result.ok({ exclusions });
    }
}
