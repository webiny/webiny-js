import zod from "zod";
import { isMailboxAddress } from "~/utils/isMailboxAddress.js";

const password = zod.string().describe("Password");

const mailboxAddress = zod.string().refine(isMailboxAddress, { message: "Invalid email address." });

const common = {
    from: mailboxAddress.describe("Mail from"),
    port: zod.number().optional().nullish().describe("Port"),
    replyTo: zod
        .preprocess(
            // We need to set empty strings to `null` before address validation kicks in.
            value => (value === "" ? null : value),
            mailboxAddress.optional().nullish()
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
