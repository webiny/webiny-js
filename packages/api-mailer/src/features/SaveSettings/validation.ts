import zod from "zod";

const password = zod.string().describe("Password");

const common = {
    from: zod.string().email().describe("Mail from"),
    port: zod.number().optional().nullish().describe("Port"),
    replyTo: zod
        .preprocess(
            // We need to set empty strings to `null` before email validation kicks in
            value => (value === "" ? null : value),
            zod.string().email().optional().nullish()
        )
        .describe("Mail reply-to"),
    host: zod.string().describe("Hostname"),
    user: zod.string().describe("User")
};

export const saveValidation = zod.object({
    ...common,
    password: password
        .nullish()
        .optional()
        .transform(value => {
            return value === undefined ? null : value;
        })
});
