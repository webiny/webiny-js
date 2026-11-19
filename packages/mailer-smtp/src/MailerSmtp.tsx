import React from "react";
import { Api } from "@webiny/project-extensions";
import { Admin } from "@webiny/project-extensions";

/**
 * Sends mail over SMTP. The settings come from `Api.Mailer.Smtp` in code or from the Mailer
 * settings screen. A transport the project registers itself takes over from SMTP when it is
 * configured.
 */
export const MailerSmtp = () => {
    return (
        <>
            {/* Api extensions */}
            <Api.Extension src={import.meta.dirname + "/api/Extension.js"} />

            {/* Admin extensions */}
            <Admin.Extension src={import.meta.dirname + "/admin/Extension.js"} />
        </>
    );
};
