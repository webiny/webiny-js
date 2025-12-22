import zod from "zod";
import { MAX_FILE_SIZE, MIN_FILE_SIZE } from "./constants.js";

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
    srcPrefix: zod
        .string()
        .optional()
        .nullish()
        .transform(value => {
            if (!value) {
                return "";
            } else if (typeof value === "string") {
                return value.endsWith("/") ? value : value + "/";
            }
            return value;
        })
});
