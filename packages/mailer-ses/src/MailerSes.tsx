import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { ExtensionDefinitions } from "@webiny/project/extensions/index.js";
import { Api } from "@webiny/project-extensions";
import { Infra } from "@webiny/project-extensions";

/**
 * Sends mail through Amazon SES. On AWS there are no credentials to store: the deploy grants the
 * API functions' IAM role permission to send as the sender, and the AWS SDK uses that role.
 * Configured with environment variables, read when mail is sent and on deploy.
 */
export const MailerSes = defineExtension({
    type: "Project/MailerSes",
    tags: { runtimeContext: "project", hosting: "all" },
    description:
        "Send mail through Amazon SES. Set WEBINY_API_SES_FROM (and optionally WEBINY_API_SES_REGION, WEBINY_API_SES_REPLY_TO and WEBINY_API_SES_CONFIGURATION_SET). On AWS the deploy grants the API functions permission to send; elsewhere the AWS SDK's default credential chain is used.",
    render() {
        return (
            <>
                <ExtensionDefinitions src={import.meta.dirname + "/definitions.js"} />
                <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
                {/* A standalone project has no Pulumi; the SDK finds credentials on its own there. */}
                {process.env.WEBINY_HOSTING_TYPE === "standalone" ? null : (
                    <Infra.Api.Pulumi src={import.meta.dirname + "/infra/SesSendPermission.js"} />
                )}
            </>
        );
    }
});
