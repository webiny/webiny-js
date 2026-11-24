import React from "react";
import { defineExtension } from "@webiny/project/defineExtension/index.js";
import { ExtensionDefinitions } from "@webiny/project/extensions/index.js";
import { Api } from "@webiny/project-extensions";

/**
 * Sends mail through SendGrid's HTTP API. Configured with environment variables, read when mail is
 * sent, so the API key never goes into the build.
 */
export const MailerSendGrid = defineExtension({
    type: "Project/MailerSendGrid",
    tags: { runtimeContext: "project", hosting: "all" },
    description:
        "Send mail through SendGrid. Set WEBINY_API_SENDGRID_API_KEY and WEBINY_API_SENDGRID_FROM (and optionally WEBINY_API_SENDGRID_REPLY_TO) in the API's environment.",
    render() {
        return (
            <>
                <ExtensionDefinitions src={import.meta.dirname + "/definitions.js"} />
                <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />
            </>
        );
    }
});
