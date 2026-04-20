import React from "react";
import { z } from "zod";
import emailAddresses from "email-addresses";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

// Accept both addr-spec ("foo@bar.com") and name-addr ("Foo <foo@bar.com>") forms.
const isMailboxAddress = (value: string): boolean => {
    return emailAddresses.parseOneAddress(value) !== null;
};

const mailboxAddress = z.string().refine(isMailboxAddress, { message: "Invalid email address." });

export const Smtp = defineExtension({
    type: "Infra/Mailer/Smtp",
    tags: { runtimeContext: "project" },
    description:
        "Configure mailer SMTP transport settings via code. Always pass the password through a build-time env var, e.g. `password={process.env.SMTP_PASSWORD!}` — the value is serialized into the build artifact, so hard-coding it would commit the secret to source control.",
    paramsSchema: z.object({
        host: z.string().min(1).describe("SMTP server hostname."),
        port: z.number().int().positive().describe("SMTP server port."),
        user: z.string().min(1).describe("SMTP authentication username."),
        password: z
            .string()
            .min(1)
            .describe(
                "SMTP authentication password. Pass via env var (e.g. `process.env.SMTP_PASSWORD!`), never hard-code."
            ),
        from: mailboxAddress.describe("Default 'from' address."),
        replyTo: mailboxAddress.optional().describe("Default 'reply-to' address.")
    }),
    render(params) {
        return <BuildParam paramName="Mailer.SmtpSettings" value={params} />;
    }
});
