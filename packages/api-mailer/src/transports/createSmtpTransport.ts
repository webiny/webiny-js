/**
 * Nodemailer docs
 * https://nodemailer.com/about/
 */
import { Transport } from "~/types";
import WebinyError from "@webiny/error";
import nodemailer, { Transporter } from "nodemailer";
import SMTPTransport, { Options } from "nodemailer/lib/smtp-transport";

export type SmtpTransportConfig = Options;

export interface SmtpTransport extends Transport {
    transporter: Transporter<SMTPTransport.SentMessageInfo>;
}

const configDefaults: Partial<SmtpTransportConfig> = {
    socketTimeout: 15000,
    connectionTimeout: 15000,
    greetingTimeout: 15000
};

const applyDefaults = (
    initialConfig: Partial<SmtpTransportConfig>
): Partial<SmtpTransportConfig> => {
    return Object.keys(configDefaults).reduce<Partial<SmtpTransportConfig>>(
        (config, key) => {
            const configKey = key as unknown as keyof SmtpTransportConfig;
            if (config[configKey] === undefined || config[configKey] === null) {
                // @ts-expect-error
                config[configKey] = configDefaults[configKey];
            }

            return config;
        },
        { ...initialConfig }
    );
};

export const createSmtpTransport = (
    initialConfig?: Partial<SmtpTransportConfig> | null
): SmtpTransport => {
    if (
        !initialConfig ||
        typeof initialConfig !== "object" ||
        Object.keys(initialConfig).length === 0
    ) {
        throw new WebinyError("There is no configuration for the SMTP transport.");
    }

    const config = applyDefaults(initialConfig);

    const transporter = nodemailer.createTransport(config);

    return {
        name: "smtp-default",
        transporter,
        send: async params => {
            const { replyTo, text, html, to, bcc, cc, from, subject } = params;

            try {
                const result = await transporter.sendMail({
                    replyTo,
                    bcc,
                    cc,
                    from,
                    text,
                    html,
                    to,
                    subject
                });
                if (result.messageId) {
                    return {
                        result: result.response,
                        error: null
                    };
                }

                throw new WebinyError({
                    message:
                        "nodemailer.sendMail does not have a messageId in the result. Something went wrong...",
                    code: "MAILER_ERROR",
                    data: {
                        ...result
                    }
                });
            } catch (ex) {
                return {
                    result: null,
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: {
                            ...params,
                            ...ex.data
                        }
                    }
                };
            }
        }
    };
};
