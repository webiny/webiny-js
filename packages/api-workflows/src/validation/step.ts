import zod from "zod";
import type { NonEmptyArray } from "@webiny/api/types.js";
import type { IWorkflowStepTeam } from "~/types.js";

export const stepValidation = zod.object({
    id: zod.string().min(1, "ID is required."),
    title: zod.string().min(1, "Title is required."),
    color: zod.string().min(1, "Color is required."),
    description: zod
        .string()
        .nullish()
        .optional()
        .transform(value => {
            return value || undefined;
        }),
    teams: zod
        .array(
            zod.object({
                id: zod.string().min(1, "Team ID is required.")
            })
        )
        .min(1, "You must select at least one team.")
        .transform(value => {
            return value as NonEmptyArray<IWorkflowStepTeam>;
        }),
    notifications: zod
        .array(
            zod.object({
                id: zod.string().min(1, "Notification ID is required.")
            })
        )
        .nullish()
        .optional()
        .transform(value => {
            return value || undefined;
        })
});
