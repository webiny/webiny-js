import type { FormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import type { CmsDynamicZoneTemplate, CmsModel, CmsModelField } from "~/types.js";
import { CmsEntryError } from "~/features/contentEntry/CmsEntryError.js";

interface ApiFieldError {
    fieldId: string;
    error: string;
    parents?: (string | number)[];
}

const isApiFieldError = (value: unknown): value is ApiFieldError => {
    const item = value as ApiFieldError;
    return typeof item?.fieldId === "string" && typeof item.error === "string";
};

const isIndex = (value: unknown): boolean => /^\d+$/.test(String(value));

/**
 * The API lists the parents of a nested field as `fieldId`, then the item index for list
 * fields, then the template's `gqlTypeName` for dynamic zones. Form paths have no template
 * segment, so walk the model to drop it: `blocks.0.PageHero.title` → `blocks.0.title`.
 */
const toFieldPath = (model: CmsModel, error: ApiFieldError): string => {
    const parents = error.parents ?? [];
    const path: string[] = [];
    let fields: CmsModelField[] = model.fields;

    for (let i = 0; i < parents.length; i++) {
        const field = fields.find(f => f.fieldId === String(parents[i]));
        if (!field) {
            return [...parents, error.fieldId].join(".");
        }
        path.push(field.fieldId);

        if (field.list && isIndex(parents[i + 1])) {
            path.push(String(parents[++i]));
        }

        if (field.type === "dynamicZone") {
            const templates = (field.settings?.templates ?? []) as CmsDynamicZoneTemplate[];
            const template = templates.find(t => t.gqlTypeName === String(parents[i + 1]));
            i++;
            fields = template?.fields ?? [];
        } else {
            fields = (field.settings?.fields ?? []) as CmsModelField[];
        }
    }

    return [...path, error.fieldId].join(".");
};

/**
 * Converts a rejected save into form errors: per-field validation errors from the API are
 * placed on their fields, anything else is shown as a form-level error.
 */
export const toFormErrors = (error: unknown, model: CmsModel): FormModel.FormError[] => {
    if (error instanceof CmsEntryError && Array.isArray(error.data)) {
        const fieldErrors = error.data.filter(isApiFieldError);
        if (fieldErrors.length > 0) {
            return fieldErrors.map(item => ({
                path: toFieldPath(model, item),
                message: item.error
            }));
        }
    }

    const message = error instanceof Error ? error.message : "Could not save the entry.";
    return [{ path: "", message }];
};
