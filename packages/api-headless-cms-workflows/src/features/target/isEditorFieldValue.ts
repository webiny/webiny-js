/**
 * Whether `value` has the JavaScript type the CMS field type stores. The CMS update path validates
 * validators, required and datetime formats but does not type-check (the GraphQL schema does that
 * for API writes), so the editor does it before writing (R172). `null` clears a field and is
 * always accepted, so the model's own `required` validator decides. Pure.
 */
export const isEditorFieldValue = (type: string, value: unknown): boolean => {
    if (value === null) {
        return true;
    }
    switch (type) {
        case "text":
        case "long-text":
        case "datetime":
            return typeof value === "string";
        case "number":
            return typeof value === "number" && Number.isFinite(value);
        case "boolean":
            return typeof value === "boolean";
        default:
            return false;
    }
};

/** What the model should send for a writable field type, for the error text. Pure. */
export const describeEditorFieldValue = (type: string): string => {
    switch (type) {
        case "number":
            return "a number";
        case "boolean":
            return "true or false";
        case "datetime":
            return "a date or time string";
        default:
            return "a string";
    }
};
