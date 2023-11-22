import { CmsFieldValueTransformer } from "~/types";
import { prepareFormData } from "@webiny/app-headless-cms-common";

export const createObjectTransformer = (): CmsFieldValueTransformer => ({
    type: "cms-field-value-transformer",
    name: "cms-field-value-transformer-object",
    fieldType: "object",
    transform: (value, field) => {
        const childFields = field.settings?.fields || [];

        if (!value || childFields.length === 0) {
            return value;
        }

        return prepareFormData(value, childFields);
    }
});
