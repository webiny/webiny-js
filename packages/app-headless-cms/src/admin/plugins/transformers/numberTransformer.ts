import { CmsFieldValueTransformer } from "~/types";

export const createNumberTransformer = (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-number",
    fieldType: "number",
    transform: value => {
        if (Array.isArray(value) === true) {
            return (value as string[]).map(v => {
                if (v === null || v === undefined || v === "") {
                    return null;
                }
                return Number(v);
            });
        } else if (value === null || value === undefined || value === "") {
            return null;
        }
        return Number(value as string);
    }
});
