import zod from "zod";

const createDataSchema = (type: string) => {
    return zod.object({
        userPoolId: zod.string().min(1, `${type} UserPoolId is required.`),
        region: zod.string().min(1, `${type} Region is required.`)
    });
};
export const createDeleteUserSchema = () => {
    return zod.object({
        action: zod.enum(["deleteUser"]),
        username: zod.string().min(1, "Username is required."),
        target: createDataSchema("Target")
    });
};
