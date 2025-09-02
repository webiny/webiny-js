import zod from "zod";

export const createSettingsValidation = zod.object({
    domain: zod.string().optional().default(""),
    reCaptcha: zod
        .object({
            enabled: zod.boolean().optional().nullish().default(null),
            siteKey: zod.string().max(100).optional().nullish().default(null),
            secretKey: zod.string().max(100).optional().nullish().default(null)
        })
        .passthrough()
        .default({
            enabled: null,
            siteKey: null,
            secretKey: null
        })
});

export const updateSettingsValidation = zod.object({
    domain: zod.string().optional().default(""),
    reCaptcha: zod
        .object({
            enabled: zod.boolean().optional().nullish().default(null),
            siteKey: zod.string().max(100).optional().nullish().default(null),
            secretKey: zod.string().max(100).optional().nullish().default(null)
        })
        .passthrough()
});
