import zod from "zod";

const MIN_FILE_SIZE = 0;
const MAX_FILE_SIZE = 10737418240;

const uploadMinFileSizeValidation = zod
    .number()
    .min(MIN_FILE_SIZE, {
        message: `Value needs to be greater than or equal to ${MIN_FILE_SIZE}.`
    })
    .nullish()
    .transform(value => {
        return value || MIN_FILE_SIZE;
    })
    .optional();

const uploadMaxFileSizeValidation = zod
    .number()
    .max(MAX_FILE_SIZE, {
        message: `Value needs to be lesser than or equal to ${MAX_FILE_SIZE}.`
    })
    .nullish()
    .transform(value => {
        return value || MAX_FILE_SIZE;
    })
    .optional();

export const updateSettingsValidation = zod.object({
    uploadMinFileSize: uploadMinFileSizeValidation,
    uploadMaxFileSize: uploadMaxFileSizeValidation,
    /*
     * Omitted stays omitted, so a partial update keeps the stored prefix. An empty value is kept
     * as empty: UpdateSettingsUseCase stores it as "no custom prefix".
     */
    srcPrefix: zod
        .string()
        .optional()
        .transform(value => {
            if (!value) {
                return value;
            }
            return value.endsWith("/") ? value : value + "/";
        })
});
