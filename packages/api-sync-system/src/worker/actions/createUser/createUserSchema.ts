import zod from "zod";

const createDataSchema = (type: string) => {
    return zod.object({
        userPoolId: zod.string().min(1, `${type} UserPoolId is required.`),
        region: zod.string().min(1, `${type} Region is required.`)
    });
};
export const createCreateUserSchema = () => {
    return zod.object({
        action: zod.enum(["createUser"]),
        username: zod.string().min(1, "Username is required."),
        source: createDataSchema("Source"),
        target: createDataSchema("Target")
    });
};
