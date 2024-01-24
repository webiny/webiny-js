import { PluginCollection } from "@webiny/plugins/types";
import { createMailerContext as createMailerContextPlugin } from "~/context";
import { createDummyTransport } from "~/transports/createDummyTransport";
import { createSmtpTransport, SmtpTransportConfig } from "~/transports/createSmtpTransport";
import { createTransport } from "~/plugins";
import { createSettingsModel } from "~/crud/settings/model";
import { createGraphQL } from "~/graphql";

export * from "~/plugins";
export * from "~/transports";

export const createMailerContext = (): PluginCollection => {
    return [
        /**
         * Models to use via the CMS
         */
        createSettingsModel(),
        /**
         * If something is wrong with the smtp mailer, we will initialize the dummy one.
         */
        createTransport(async () => {
            const plugin = await createDummyTransport();
            plugin.name = "mailer.dummy-default";
            return plugin;
        }),
        /**
         * Smtp mailer goes into the plugins after the dummy one because plugins are loaded in reverse.
         */
        createTransport(async ({ settings }) => {
            /**
             * We need to map our settings to the required settings for the SMTP NodeMailer transport.
             */
            const config: SmtpTransportConfig = {
                ...(settings || {})
            };
            if (settings) {
                config.auth = {
                    user: settings.user,
                    pass: settings.password
                };
            }
            const plugin = await createSmtpTransport(config);
            plugin.name = "mailer.smtp-default";
            return plugin;
        }),
        createMailerContextPlugin()
    ];
};

export const createMailerGraphQL = () => {
    return [...createGraphQL()];
};
