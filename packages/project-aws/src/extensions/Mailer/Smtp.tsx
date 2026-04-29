import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { BuildParam } from "@webiny/project/extensions/index.js";
import { SmtpParamsSchema } from "./SmtpParamsSchema.js";

export const Smtp = defineExtension({
    type: "Api/Mailer/Smtp",
    tags: { runtimeContext: "project" },
    description:
        "Configure mailer SMTP transport settings via code. Always pass the password through a build-time env var, e.g. `password={process.env.SMTP_PASSWORD!}` — the value is serialized into the build artifact, so hard-coding it would commit the secret to source control.",
    paramsSchema: SmtpParamsSchema,
    render(params) {
        return <BuildParam paramName="Mailer.SmtpSettings" value={params} />;
    }
});
