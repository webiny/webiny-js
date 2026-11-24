import React from "react";
import { Api } from "webiny/extensions";
import { Infra } from "webiny/extensions";

/**
 * Sends Webiny's mail (password reset codes, workflow notifications, the test email) through
 * Amazon SES. Render it in place of `<MailerSmtp />`.
 *
 * No stored credentials: on AWS the deploy lets the API functions' IAM role send as the sender,
 * and the AWS SDK uses that role. Configured with environment variables, read when mail is sent
 * and on deploy.
 */
export const SesMailer = () => {
    return (
        <>
            <Api.Extension src={"/extensions/mailer/ses/api/SesMailTransportFactory.ts"} />
            {/* A standalone project has no Pulumi; the AWS SDK finds credentials on its own there. */}
            {process.env.WEBINY_HOSTING_TYPE === "standalone" ? null : (
                <Infra.Api.Pulumi src={"/extensions/mailer/ses/pulumi/SesSendPermission.ts"} />
            )}
        </>
    );
};
