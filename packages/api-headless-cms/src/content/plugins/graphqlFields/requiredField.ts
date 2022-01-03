import { CmsModelField } from "~/types";

export const attachRequiredFieldValue = (def: string, field: CmsModelField): string => {
    if (!field.validation || field.validation.length === 0) {
        return def;
    }
    const isRequired = field.validation.some(validation => {
        return validation.name === "required";
    });
    if (!isRequired) {
        return def;
    }
    return `${def}!`;
};
