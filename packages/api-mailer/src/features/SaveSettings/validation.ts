import zod from "zod";

const password = zod.string().describe("Password");

const common = {
    from: zod.string().email().describe("Mail from"),
    port: zod.number().optional().nullish().describe("Port"),
    replyTo: zod.string().email().optional().describe("Mail reply-to"),
    host: zod.string().describe("Hostname"),
    user: zod.string().describe("User")
};

export const saveValidation = zod
    .object({
        ...common,
        password: password.optional()
    })
    .required();
