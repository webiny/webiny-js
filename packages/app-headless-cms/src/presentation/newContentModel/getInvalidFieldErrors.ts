import type { FormModel } from "@webiny/app-admin/features/formModel/abstractions.js";
import { CmsModelError } from "~/features/model/CmsModelError.js";

interface InvalidField {
    message: string;
}

/**
 * Reads the `invalidFields` the API returns with a `Cms/Model/ValidationError` and turns them
 * into form errors keyed by the field path.
 */
export const getInvalidFieldErrors = (error: unknown): FormModel.FormError[] => {
    if (!(error instanceof CmsModelError)) {
        return [];
    }

    const invalidFields: Record<string, InvalidField> | undefined = error.data?.invalidFields;
    if (!invalidFields) {
        return [];
    }

    return Object.entries(invalidFields).map(([path, invalidField]) => ({
        path,
        message: invalidField.message
    }));
};
