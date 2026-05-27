import { z } from "zod";
import { BACKGROUND_TASK_MAX_RETENTION_DAYS } from "~/api/domain/constants.js";

export const UpdateBackgroundTaskSettingsInputSchema = z.object({
    retentionDays: z.number().int().min(0).max(BACKGROUND_TASK_MAX_RETENTION_DAYS).optional()
});
