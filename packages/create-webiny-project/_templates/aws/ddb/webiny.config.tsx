import React from "react";
import { Infra } from "webiny/extensions";
import { Api } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";

export const Extensions = () => {
    return (
        <>
            <Infra.Aws.DefaultRegion name={"{REGION}"} />
            {/* Encryption MUST always be configured for production environments. */}
            <Infra.Env.IsProd>
                <Infra.Encryption passphrase={process.env.WEBINY_ENCRYPTION_PASSPHRASE || ""} />
            </Infra.Env.IsProd>
            <Cognito />
            {/* Mail: SMTP, set in Settings > Mailer. To set it in code, pass host, port, user,
                password and from. For Resend, SendGrid or Amazon SES, run
                `yarn webiny extension mailer/resend` (or mailer/sendgrid, mailer/ses) and remove
                <Api.Mailer.Smtp />. */}
            <Api.Mailer.Smtp />
        </>
    );
};
