import type { TransportSettings } from "~/types.js";
import type SMTPTransport from "nodemailer/lib/smtp-transport";

export type SmtpTransportConfig = SMTPTransport.Options;

const configDefaults: Partial<SmtpTransportConfig> = {
    socketTimeout: 15000,
    connectionTimeout: 15000,
    greetingTimeout: 15000
};

export class SmtpConfig {
    static fromTransportSettings(settings: TransportSettings): SmtpTransportConfig {
        const baseConfig: SmtpTransportConfig = {
            host: settings.host,
            port: settings.port,
            auth: {
                user: settings.user,
                pass: settings.password
            }
        };

        // Apply defaults
        return Object.keys(configDefaults).reduce<SmtpTransportConfig>((config, key) => {
            const configKey = key as keyof SmtpTransportConfig;
            if (config[configKey] === undefined || config[configKey] === null) {
                // @ts-expect-error
                config[configKey] = configDefaults[configKey];
            }
            return config;
        }, baseConfig);
    }
}
