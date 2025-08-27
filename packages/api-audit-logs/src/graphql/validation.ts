import zod from "zod";

export const getValidationSchema = zod.object({
    id: zod.string().min(1, "ID is required.")
});

export const listValidationSchema = zod.object({
    app: zod.string().min(1, "App is required."),
    entryId: zod.string().min(1, "Entry ID is required."),
    after: zod.string().optional(),
    order: zod.enum(["ASC", "DESC"]).optional(),
    version: zod.never().optional(),
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
    limit: zod
        .preprocess(input => {
            if (typeof input == "string") {
                return parseInt(input);
            }
            return input;
        }, zod.number().min(1).max(100).optional())
        .default(25),
    createdBy: zod.string().optional(),
    action: zod.string().optional()
});
