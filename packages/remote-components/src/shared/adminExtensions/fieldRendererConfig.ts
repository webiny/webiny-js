import { z } from "zod";
import { FIELD_RENDERER_FIELD_TYPES } from "./fieldRendererRuntime.js";

/** What a stored field renderer's `config` holds. Parsed on write by the API and on load by the admin. */
export const FieldRendererConfigSchema = z
    .object({
        fieldType: z.enum(FIELD_RENDERER_FIELD_TYPES),
        // Whether it renders a list field (`field.list`) rather than a single value.
        multipleValues: z.boolean()
    })
    .strict();

export type FieldRendererConfig = z.infer<typeof FieldRendererConfigSchema>;
