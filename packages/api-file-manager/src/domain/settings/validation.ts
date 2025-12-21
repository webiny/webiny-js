import zod from "zod";

const MIN_FILE_SIZE = 0;
const MAX_FILE_SIZE = 10737418240;

const uploadMinFileSizeValidation = zod
    .number()
    .min(MIN_FILE_SIZE, {
        message: `Value needs to be greater than or equal to ${MIN_FILE_SIZE}.`
    })
    .optional();

const uploadMaxFileSizeValidation = zod
    .number()
    .max(MAX_FILE_SIZE, {
        message: `Value needs to be lesser than or equal to ${MAX_FILE_SIZE}.`
    })
    .optional();

export const updateSettingsValidation = zod.object({
    uploadMinFileSize: uploadMinFileSizeValidation,
    uploadMaxFileSize: uploadMaxFileSizeValidation,
    srcPrefix: zod
        .string()
        .optional()
        .transform(value => {
            if (typeof value === "string") {
                return value.endsWith("/") ? value : value + "/";
            }
            return value;
        })
});
