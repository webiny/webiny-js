import type { ICmsEntryState } from "~/types/index.js";
import zod from "zod";

const schema = zod.object({
    name: zod
        .string()
        .optional()
        .nullish()
        .transform(value => value || null),
    comment: zod
        .string()
        .optional()
        .nullish()
        .transform(value => value || null)
});

export const createState = (input: unknown): ICmsEntryState | null => {
    if (!input) {
        return null;
    }

    const parsed = schema.safeParse(input);
    if (!parsed.success) {
        return null;
    }
    return parsed.data;
};
