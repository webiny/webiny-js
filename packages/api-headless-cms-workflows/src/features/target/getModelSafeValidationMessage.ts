import type { CmsModel, CmsModelField } from "@webiny/api-headless-cms/types/index.js";

/** What the model reads when a field failed validation with a message it must not see. */
export const GENERIC_VALIDATION_MESSAGE = "The value could not be validated.";

const PREDEFINED_VALUE_MESSAGE =
    "Value sent does not match any of the available predefined values.";
const DATETIME_FORMAT_MESSAGE =
    /^Invalid (date|time|dateTime) format for field "[^"]*"\. Expected [^"]*\.$/;

const findField = (fields: CmsModelField[], path: string[]): CmsModelField | null => {
    let current: CmsModelField[] = fields;
    let found: CmsModelField | null = null;
    for (const segment of path) {
        found = current.find(item => item.fieldId === segment) ?? null;
        if (!found) {
            return null;
        }
        const children = found.settings?.fields;
        current = Array.isArray(children) ? children : [];
    }
    return found;
};

/**
 * The CMS validation turns a validator that THREW into its raw `ex.message`, and a validator
 * nobody registered into `There are no "<name>" validators defined.` Neither may reach the model
 * (R87). A message is safe to show when it is one the model author configured on that field
 * (`validation[].message`, `listValidation[].message`) or one of the CMS's own fixed datetime and
 * predefined-value texts. Returns the message when safe, otherwise `null`. Pure.
 */
export const getModelSafeValidationMessage = (
    model: Pick<CmsModel, "fields">,
    path: string[],
    error: unknown
): string | null => {
    if (typeof error !== "string") {
        return null;
    }
    if (error === PREDEFINED_VALUE_MESSAGE || DATETIME_FORMAT_MESSAGE.test(error)) {
        return error;
    }
    const field = findField(model.fields, path);
    if (!field) {
        return null;
    }
    const configured = [...(field.validation ?? []), ...(field.listValidation ?? [])].map(
        item => item.message
    );
    return configured.includes(error) ? error : null;
};
