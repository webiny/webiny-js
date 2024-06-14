import WebinyError from "@webiny/error";

// We allow "@" because that's how we construct storageIds with `createModelField` utility.
const VALID_STORAGE_ID_REGEX = /^([@a-zA-Z-0-9]+)$/;

export const validateStorageId = (storageId: string) => {
    if (!storageId.match(VALID_STORAGE_ID_REGEX)) {
        const message = [
            `Invalid storageId provided ("${storageId}").`,
            'Only alphanumeric characters and "@" are allowed.'
        ].join(" ");

        throw new WebinyError(message, "STORAGE_ID_NOT_ALPHANUMERIC_ERROR");
    }
};
