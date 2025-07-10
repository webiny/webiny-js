import zod from "zod";

const createDataSchema = (type: string) => {
    return zod.object({
        bucket: zod.string().min(1, `${type} Bucket is required.`),
        region: zod.string().min(1, `${type} Region is required.`)
    });
};
export const createDeleteFileSchema = () => {
    return zod.object({
        action: zod.enum(["deleteFile"]),
        key: zod.string().min(1, "Key is required."),
        source: createDataSchema("Source"),
        target: createDataSchema("Target")
    });
};
