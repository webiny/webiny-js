import { PluginCollection } from "@webiny/plugins/types";
import { createMailerContext as createMailerContextPlugin } from "~/context";
import { createDummyTransport, DummyTransport } from "~/transports/createDummyTransport";
import {
    createSmtpTransport,
    SmtpTransport,
    SmtpTransportConfig
} from "~/transports/createSmtpTransport";
import { createTransport } from "~/plugins";
import { createSettingsModel } from "~/crud/settings/model";
import { createGroup } from "~/crud/group";
import { createGraphQL } from "~/graphql";

export { createDummyTransport, createSmtpTransport, createTransport };
export type { SmtpTransport, SmtpTransportConfig, DummyTransport };

export const createMailerContext = (): PluginCollection => {
    const group = createGroup();
    return [
        group,
        /**
         * Groups and models to use via the CMS
         */
        createSettingsModel(group),
        /**
         * If something is wrong with the smtp mailer, we will initialize the dummy one.
         */
        createTransport(async () => {
            const plugin = await createDummyTransport();
            plugin.name = "dummy-default";
            return plugin;
        }),
        /**
         * Smtp mailer goes into the plugins after the dummy one because plugins are loaded in reverse.
         */
        createTransport(async params => {
            const plugin = await createSmtpTransport(params.settings);
            plugin.name = "smtp-default";
            return plugin;
        }),
        createMailerContextPlugin()
    ];
};

export const createMailerGraphQL = () => {
    return [...createGraphQL()];
};
