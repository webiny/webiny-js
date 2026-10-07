import zod from "zod";

const widgetName = zod.string().min(1).max(200);

// Bounds match the admin dashboard (2 to 4 columns), and keep the stored entry small.
export const saveValidationSchema = zod.object({
    data: zod.object({
        columns: zod.array(zod.array(widgetName).max(100)).max(4),
        hidden: zod.array(widgetName).max(200),
        columnCount: zod.number().int().min(2).max(4)
    })
});
