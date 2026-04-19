import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

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
        from: z.string().email().describe("Default 'from' address."),
        replyTo: z.string().email().optional().describe("Default 'reply-to' address.")
    }),
    render(params) {
        return <BuildParam paramName="Mailer.SmtpSettings" value={params} />;
    }
});
