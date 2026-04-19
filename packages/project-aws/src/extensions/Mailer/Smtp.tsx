import React from "react";
import { z } from "zod";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";

export const Smtp = defineExtension({
    type: "Infra/Mailer/Smtp",
    tags: { runtimeContext: "project" },
    description: "Configure mailer SMTP transport settings via code.",
    paramsSchema: z.object({
        host: z.string().min(1).describe("SMTP server hostname."),
        port: z.number().int().positive().describe("SMTP server port."),
        user: z.string().min(1).describe("SMTP authentication username."),
        password: z.string().min(1).describe("SMTP authentication password."),
        from: z.string().email().describe("Default 'from' address."),
        replyTo: z.string().email().optional().describe("Default 'reply-to' address.")
    }),
    render(params) {
        return <BuildParam paramName="Mailer.SmtpSettings" value={params} />;
    }
});
