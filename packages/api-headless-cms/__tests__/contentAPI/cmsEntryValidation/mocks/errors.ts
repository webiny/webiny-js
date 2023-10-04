import { CmsDynamicZoneTemplate, CmsModelFieldInput } from "~/types";

const nestedErrorRegex = /^(nested|dz)([A-Za-z]+)$/;
export const isNestedError = (error: FieldError): boolean => {
    return error.fieldId.match(nestedErrorRegex) !== null;
};

export interface FieldError {
    error: string;
    id: string;
    fieldId: string;
    storageId: string;
    parents: string[];
}

export const createFieldErrors = (
    fields: Pick<CmsModelFieldInput, "id" | "fieldId" | "settings">[]
) => {
    return fields.reduce<FieldError[]>((errors, field) => {
        /**
         * We always push the default one.
         */
        errors.push(createError(field));
        /**
         * Object field.
         */
        if (field.settings?.fields?.length) {
            errors.push(...createFieldErrors(field.settings.fields));
        }
        // Dynamic Zone field.
        else if (field.settings?.templates?.length) {
            const templates = field.settings.templates as CmsDynamicZoneTemplate[];
            const templateFieldErrors = templates
                .reduce<FieldError[]>((output, template) => {
                    output.push(...createFieldErrors(template.fields));
                    return output;
                }, [])
                .map(error => {
                    // @ts-expect-error
                    delete error["storageId"];
                    return error;
                });
            errors.push(...templateFieldErrors);
        }

        return errors;
    }, []);
};

export const createError = (
    field: Pick<CmsModelFieldInput, "id" | "fieldId" | "settings">
): FieldError => {
    return {
        error: expect.any(String),
        id: field.id,
        fieldId: field.fieldId,
        storageId: expect.stringMatching(`@`),
        parents: expect.any(Array)
    };
};
