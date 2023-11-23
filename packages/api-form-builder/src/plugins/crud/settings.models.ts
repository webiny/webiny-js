import zod from "zod";

export const CreateDataModel = () => {
    return zod.object({
        domain: zod.string(),
        reCaptcha: zod.object({
            enabled: zod.boolean(),
            siteKey: zod.string().max(100),
            secretKey: zod.string().max(100)
        })
    });
};

export const UpdateDataModel = () => {
    return zod.object({
        domain: zod.string(),
        reCaptcha: zod.object({
            enabled: zod.boolean(),
            siteKey: zod.string().max(100),
            secretKey: zod.string().max(100)
        })
    });
};
