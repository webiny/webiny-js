import { CmsDynamicZoneTemplate, CmsModelFieldInput } from "~/types";

const nestedErrorRegex = /^(nested|dz)([A-Za-z]+)$/;
export const isNestedError = (error: FieldError): boolean => {
    return error.fieldId.match(nestedErrorRegex) !== null;
};

export interface FieldError {
    error: string;
    id: string;
    fieldId: string;
    parents: string[];
}

export const createFieldErrors = (
    fields: Pick<CmsModelFieldInput, "id" | "fieldId" | "settings" | "type">[]
) => {
    return fields.reduce<FieldError[]>((errors, field) => {
        /**
         * We always push the default one.
         */
        errors.push(createError(field));
        /**
         * Object field.
         */
        if (field.type === "object" && field.settings?.fields?.length) {
            errors.push(...createFieldErrors(field.settings.fields));
        }
        // Dynamic Zone field.
        else if (field.type === "dynamicZone" && field.settings?.templates?.length) {
            const templates = field.settings.templates as CmsDynamicZoneTemplate[];
            const templateFieldErrors = templates.reduce<FieldError[]>((output, template) => {
                output.push(...createFieldErrors(template.fields));
                return output;
            }, []);
            errors.push(...templateFieldErrors);
        }

        return errors;
    }, []);
};

interface CreateErrorParams extends Pick<CmsModelFieldInput, "id" | "fieldId" | "settings"> {
    parents?: string[];
    error?: string;
}

export const createError = (params: CreateErrorParams): FieldError => {
    const { error, id, fieldId, parents } = params;
    return {
        error: error || expect.any(String),
        id,
        fieldId,
        parents: parents || expect.any(Array)
    };
};
