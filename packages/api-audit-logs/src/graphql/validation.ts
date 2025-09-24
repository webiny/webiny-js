import zod from "zod";

export const getValidationSchema = zod.object({
    id: zod.string().min(1, "ID is required.")
});

export const listValidationSchema = zod.object({
    where: zod.object({
        app: zod.string().min(1, "App is required.").optional(),
        entity: zod.string().optional(),
        entityId: zod.string().min(1, "Entity ID is required.").optional(),
        createdOn_gte: zod.preprocess(input => {
            if (typeof input == "string" || input instanceof Date) {
                return new Date(input);
            }
            return undefined;
        }, zod.date().optional()),
        createdOn_lte: zod.preprocess(input => {
            if (typeof input == "string" || input instanceof Date) {
                return new Date(input);
            }
            return undefined;
        }, zod.date().optional()),
        createdBy: zod.string().optional(),
        action: zod.string().optional()
    }),
    after: zod.string().optional(),
    sort: zod.enum(["ASC", "DESC"]).optional(),
    limit: zod
        .preprocess(input => {
            if (typeof input == "string") {
                return parseInt(input);
            }
            return input;
        }, zod.number().min(1).max(100).optional())
        .default(25)
});
