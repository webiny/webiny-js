import zod from "zod";
import type {
    CmsEntryListSortAsc,
    CmsEntryListSortDesc
} from "@webiny/api-headless-cms/types/index.js";

export const listWorkflowsValidation = zod.object({
    limit: zod.number().min(1).max(10000).optional(),
    sort: zod
        .array(
            zod
                .string()
                .min(1, "Sort array cannot contain empty values.")
                .transform(value => {
                    const [field, order] = value.split("_");
                    if (order.toLowerCase() === "desc") {
                        return `${field}_DESC` as CmsEntryListSortDesc;
                    }
                    return `${field}_ASC` as CmsEntryListSortAsc;
                })
        )
        .optional(),
    after: zod
        .string()
        .optional()
        .nullish()
        .transform(value => {
            return value || undefined;
        }),
    where: zod
        .object({
            id: zod.string().min(1, "ID is required.").optional(),
            id_in: zod.array(zod.string().min(1, "ID cannot contain empty values.")).optional(),
            app: zod.string().min(1, "App is required.").optional(),
            app_in: zod.array(zod.string().min(1, "App cannot contain empty values.")).optional()
        })
        .optional()
});
