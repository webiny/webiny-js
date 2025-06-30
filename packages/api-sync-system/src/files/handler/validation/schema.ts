import zod from "zod";

const createDataSchema = (type: string) => {
    return zod.object({
        key: zod.string().min(1, `${type} Key is required.`),
        bucket: zod.string().min(1, `${type} Bucket is required.`),
        region: zod.string().min(1, `${type} Region is required.`)
    });
};
export const createValidationSchema = () => {
    return zod.object({
        action: zod.enum(["copy", "delete"]),
        key: zod.string().min(1, "Key is required."),
        source: createDataSchema("Source"),
        target: createDataSchema("Target")
    });
};
