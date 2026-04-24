import type { TransportSettings } from "~/types.js";

const getPort = (value: any): number => {
    const port = Number(value);
    if (!!value && isNaN(port) === false) {
        return port;
    }
    return 25;
};

export const getDefaultSettingsFromEnv = (): TransportSettings | null => {
    const input: Partial<TransportSettings> = {
        host: process.env.WEBINY_API_MAILER_HOST,
        port: getPort(process.env.WEBINY_API_MAILER_PORT),
        user: process.env.WEBINY_API_MAILER_USER,
        password: process.env.WEBINY_API_MAILER_PASSWORD,
        replyTo: process.env.WEBINY_API_MAILER_REPLY_TO,
        from: process.env.WEBINY_API_MAILER_FROM
    };

    // No need to do the validation if there is not at least one variable defined
    const hasAtLeastOneValue = Object.values(input).some(value => !!String(value).trim());
    if (!hasAtLeastOneValue) {
        return null;
    }

    // Basic validation - require essential fields
    if (!input.host || !input.user || !input.from) {
        return null;
    }

    return input as TransportSettings;
};
