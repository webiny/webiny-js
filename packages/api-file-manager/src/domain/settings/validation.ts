import zod from "zod";
import { ServiceDiscovery } from "@webiny/api-core/features/serviceDiscovery/index.js";

const MIN_FILE_SIZE = 0;
const MAX_FILE_SIZE = 10737418240;

const uploadMinFileSizeValidation = zod
    .number()
    .min(MIN_FILE_SIZE, {
        message: `Value needs to be greater than or equal to ${MIN_FILE_SIZE}.`
    })
    .max(MAX_FILE_SIZE, {
        message: `Value needs to be lesser than or equal to ${MAX_FILE_SIZE}.`
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

const isHttpUrl = (value: string): boolean => {
    try {
        const url = new URL(value);
        return url.protocol === "https:" || url.protocol === "http:";
    } catch {
        return false;
    }
};

const withTrailingSlash = (value: string): string => {
    return value.endsWith("/") ? value : value + "/";
};

/**
 * `optional()` wraps the transform, so a missing `srcPrefix` stays missing
 * and a partial update keeps the stored value. An empty string falls back to the API's URL.
 */
const srcPrefixValidation = zod
    .string()
    .refine(value => !value || isHttpUrl(value), {
        message: "Value needs to be an absolute http(s) URL."
    })
    .transform(async value => {
        if (!value) {
            const manifest = await ServiceDiscovery.load();
            const domain = manifest?.api?.cloudfront?.domain;
            if (!domain) {
                return "";
            }
            // The manifest domain already includes the protocol.
            return withTrailingSlash(`${domain}/files`);
        }
        return withTrailingSlash(value);
    })
    .optional();

export const updateSettingsValidation = zod.object({
    uploadMinFileSize: uploadMinFileSizeValidation,
    uploadMaxFileSize: uploadMaxFileSizeValidation,
    srcPrefix: srcPrefixValidation
});

/**
 * Validates the settings after the input has been merged with the stored settings,
 * so rules that span fields also hold for partial updates.
 */
export const mergedSettingsValidation = zod
    .object({
        uploadMinFileSize: zod.number(),
        uploadMaxFileSize: zod.number()
    })
    .refine(settings => settings.uploadMinFileSize <= settings.uploadMaxFileSize, {
        path: ["uploadMinFileSize"],
        message: "Value needs to be lesser than or equal to the maximum file upload size."
    });
