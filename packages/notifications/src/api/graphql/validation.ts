import zod from "zod";

export const listNotificationsValidation = zod.object({
    where: zod
        .object({
            archived: zod.boolean().optional(),
            read: zod.boolean().optional()
        })
        .optional(),
    limit: zod.number().optional(),
    after: zod.string().nullish()
});

export const idValidation = zod.object({
    id: zod.string().min(1, "ID is required.")
});
