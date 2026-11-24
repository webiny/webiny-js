import React from "react";
import { Infra } from "webiny/extensions";
import { Cognito } from "@webiny/cognito";
import { MailerSmtp } from "@webiny/mailer-smtp";

export const Extensions = () => {
    return (
        <>
            <Infra.Aws.DefaultRegion name={"{REGION}"} />

            {/* Postgres runs inside a VPC: the core app creates the VPC (with NAT gateways) and an
                Aurora PostgreSQL Serverless v2 database in it, and every API function joins it.
                The database also brings the Postgres CMS storage and the folder catalog. */}
            <Infra.Vpc enabled={true} />
            <Infra.AuroraPostgres />
            {/* Or put an RDS Proxy in front of the database, to pool the API functions' connections: */}
            {/* <Infra.AuroraPostgres rdsProxy /> */}

            {/* Encryption MUST always be configured for production environments. */}
            <Infra.Env.IsProd>
                <Infra.Crypto.Encryption
                    passphrase={process.env.WEBINY_ENCRYPTION_PASSPHRASE || ""}
                />
            </Infra.Env.IsProd>
            <Cognito />
            {/* Mail: SMTP, set in Settings > Mailer. To set it in code, pass host, port, user,
                password and from. For Resend, SendGrid or Amazon SES, run
                `yarn webiny extension mailer/resend` (or mailer/sendgrid, mailer/ses) and remove
                <MailerSmtp />. */}
            <MailerSmtp />
        </>
    );
};
