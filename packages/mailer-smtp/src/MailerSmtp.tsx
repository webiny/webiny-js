import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { ExtensionDefinitions } from "@webiny/project/extensions/index.js";
import { Api } from "@webiny/project-extensions";
import { Admin } from "@webiny/project-extensions";
import { MailerSmtpParamsSchema } from "./SmtpParamsSchema.js";

/**
 * Sends mail over SMTP. Without props, the settings come from the Mailer settings screen. With
 * them, they come from code and the screen shows them read-only.
 *
 * A transport the project registers itself takes over from SMTP when it is configured.
 */
export const MailerSmtp = defineExtension({
    type: "Project/MailerSmtp",
    tags: { runtimeContext: "project", hosting: "all" },
    description:
        "Send mail over SMTP. Pass host, port, user, password and from to set the settings in code, or leave them out to set them in the Mailer settings screen. Always pass the password through a build-time env var, e.g. `password={process.env.SMTP_PASSWORD!}`: the value is serialized into the build artifact, so hard-coding it would commit the secret to source control.",
    paramsSchema: MailerSmtpParamsSchema,
    render(params) {
        return (
            <>
                <ExtensionDefinitions src={import.meta.dirname + "/definitions.js"} />
                {/* Api extensions. */}
                <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
                {params.host ? (
                    <Api.BuildParam
                        paramName={"Mailer.SmtpSettings"}
                        value={{
                            host: params.host,
                            port: params.port,
                            user: params.user,
                            password: params.password,
                            from: params.from,
                            replyTo: params.replyTo
                        }}
                    />
                ) : null}

                {/* Admin extensions. */}
                <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
            </>
        );
    }
});
