import zod from "zod";

export const CreateDataModel = () => {
    return zod.object({
        domain: zod.string().default(""),
        reCaptcha: zod
            .object({
                enabled: zod.boolean().nullish().default(null),
                siteKey: zod.string().max(100).nullish().default(null),
                secretKey: zod.string().max(100).nullish().default(null)
            })
            .default({
                enabled: null,
                siteKey: null,
                secretKey: null
            })
    });
};

export const UpdateDataModel = () => {
    return zod.object({
        domain: zod.string().default(""),
        reCaptcha: zod
            .object({
                enabled: zod.boolean().nullish().default(null),
                siteKey: zod.string().max(100).nullish().default(null),
                secretKey: zod.string().max(100).nullish().default(null)
            })
            .nullish()
            .default({
                enabled: null,
                siteKey: null,
                secretKey: null
            })
    });
};
