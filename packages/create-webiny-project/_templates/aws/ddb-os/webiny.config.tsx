import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";
import { MailerSmtp } from "@webiny/mailer-smtp";

export const Extensions = () => {
    return (
        <>
            <Infra.Aws.DefaultRegion name={"{REGION}"} />
            <Infra.OpenSearch enabled={true} />
            {/* Encryption MUST always be configured for production environments. */}
            <Infra.Env.IsProd>
                <Infra.Encryption passphrase={process.env.WEBINY_ENCRYPTION_PASSPHRASE || ""} />
            </Infra.Env.IsProd>
            <Cognito />
            {/* Mail: SMTP, set in Settings > Mailer. To set it in code, pass host, port, user,
                password and from. Replace it with <MailerResend />, <MailerSendGrid /> or
                <MailerSes /> to send through one of those instead. */}
            <MailerSmtp />
        </>
    );
};
