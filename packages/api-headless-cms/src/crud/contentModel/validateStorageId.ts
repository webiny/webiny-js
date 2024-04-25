import lodashCamelCase from "lodash/camelCase";
import WebinyError from "@webiny/error";

// We allow "@" because that's we use it with the `createModelField` function.
const VALID_STORAGE_ID_REGEX = /^([@a-zA-Z-0-9]+)$/;

export const validateStorageId = (storageId: string) => {
    if (!storageId.match(VALID_STORAGE_ID_REGEX)) {
        const message = [
            `Invalid storageId provided ("${storageId}").`,
            'Only alphanumeric characters and "@" are allowed.'
        ].join(" ");

        throw new WebinyError(message, "STORAGE_ID_NOT_ALPHANUMERIC_ERROR");
    }

    // We must do this because in the process of camel casing, Lodash removes the `@`
    // character from the string. For example, if we received `text@productName`, we
    // would be doing the `text@productName` vs. `textProductName` (camel cased) comparison.
    storageId = storageId.replace("@", "");

    if (storageId !== lodashCamelCase(storageId)) {
        const message = [
            `Invalid storageId provided ("${storageId}").`,
            "Must be a camelCased string."
        ].join(" ");

        throw new WebinyError(message, "STORAGE_ID_NOT_CAMEL_CASED_ERROR");
    }
};
