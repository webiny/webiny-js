import {
    MailerContext,
    Transport,
    OnTransportAfterSendParams,
    OnTransportBeforeSendParams,
    OnTransportErrorParams,
    TransportSettings,
    MailerTransporterContext
} from "~/types";
import { createTopic } from "@webiny/pubsub";
import { attachOnTransportBeforeSend } from "~/crud/transport/onTransportBeforeSend";
import { CreateTransportPlugin } from "~/plugins";
import WebinyError from "@webiny/error";
import { createValidation } from "./settings/validation";

interface BuildMailerParams {
    plugins: CreateTransportPlugin[];
    settings: TransportSettings | null;
    context: MailerContext;
}

const buildTransporter = async (params: BuildMailerParams): Promise<Transport> => {
    const { settings, context, plugins } = params;

    for (const plugin of plugins) {
        try {
            return await plugin.buildMailerTransport({
                settings,
                context
            });
        } catch (ex) {
            console.log(`Could not build mailer with plugin "${plugin.name}".`);
            console.log(ex.message);
        }
    }
    throw new WebinyError(
        "Could not build mailer via any of the available plugins.",
        "MAILER_PLUGINS_ERROR"
    );
};

const getPort = (value: any): number => {
    const port = Number(value);
    if (!!value && isNaN(port) === false) {
        return port;
    }
    return 25;
};

const getDefaultSettings = (): TransportSettings | null => {
    const input: Partial<TransportSettings> = {
        host: process.env.WEBINY_MAILER_HOST,
        port: getPort(process.env.WEBINY_MAILER_PORT),
        user: process.env.WEBINY_MAILER_USER,
        password: process.env.WEBINY_MAILER_PASSWORD,
        replyTo: process.env.WEBINY_MAILER_REPLY_TO,
        from: process.env.WEBINY_MAILER_FROM
    };
    /**
     * No need to do the validation if there is not at least one variable defined.
     */
    const hasAtLeastOneValue = Object.values(input).some(value => !!String(value).trim());
    if (!hasAtLeastOneValue) {
        return null;
    }

    const result = createValidation.safeParse(input);

    return result.success ? (result.data as TransportSettings) : null;
};

export const createTransporterCrud = async (
    context: MailerContext
): Promise<MailerTransporterContext> => {
    const transporters: Record<string, Transport> = {};

    const defaultSettings: TransportSettings | null = getDefaultSettings();
    /**
     * We need the last possible plugin which is defined.
     * The last plugins are our default ones with the default configurations.
     * If users wants to override them, they just need to add new plugin with their own configuration and it will be constructed first.
     */
    const plugins = context.plugins
        .byType<CreateTransportPlugin>(CreateTransportPlugin.type)
        .reverse();

    /**
     * We define possible events to be hooked into.
     */
    const onTransportBeforeSend = createTopic<OnTransportBeforeSendParams>(
        "mailer.onTransportBeforeSend"
    );
    const onTransportAfterSend = createTopic<OnTransportAfterSendParams>(
        "mailer.onTransportAfterSend"
    );
    const onTransportError = createTopic<OnTransportErrorParams>("mailer.onTransportError");
    /**
     * We attach our default ones.
     */
    attachOnTransportBeforeSend({
        onTransportBeforeSend
    });

    const getTransport = async (): Promise<Transport | null> => {
        const tenant = context.tenancy.getCurrentTenant().id;

        if (transporters[tenant]) {
            return transporters[tenant];
        }

        let settings: TransportSettings | null = null;
        try {
            settings = await context.mailer.getSettings();
        } catch (ex) {
            if (ex.code !== "PASSWORD_SECRET_ERROR") {
                console.log(ex.message);
                console.log(ex.code);
            }
        }
        if (!settings && !defaultSettings) {
            console.log(`There are no Mailer transport settings for tenant "${tenant}".`);
        }
        const transporter = await buildTransporter({
            settings: settings || defaultSettings,
            plugins,
            context
        });

        transporters[tenant] = transporter;

        return transporter;
    };

    return {
        onTransportBeforeSend,
        onTransportAfterSend,
        onTransportError,
        getTransport,
        sendMail: async data => {
            const transport = await getTransport();
            if (!transport) {
                return {
                    result: null,
                    error: {
                        message: "There is no transport available.",
                        code: "NO_TRANSPORT_DEFINED"
                    }
                };
            }
            try {
                await onTransportBeforeSend.publish({
                    data,
                    transport
                });
                const response = await transport.send(data);
                await onTransportAfterSend.publish({
                    data,
                    transport
                });

                return {
                    result: response.result,
                    error: response.error
                };
            } catch (ex) {
                await onTransportError.publish({
                    error: ex,
                    data,
                    transport
                });
                return {
                    result: null,
                    error: {
                        message: ex.message,
                        code: ex.code,
                        data: {
                            data,
                            ...ex.data
                        }
                    }
                };
            }
        }
    };
};
