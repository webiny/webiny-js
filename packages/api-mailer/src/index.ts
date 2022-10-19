import { PluginCollection } from "@webiny/plugins/types";
import { createMailerContext } from "~/context";
import { createDummyMailer, DummyMailer } from "~/mailers/createDummyMailer";
import { createSmtpMailer, SmtpMailerConfig, SmtpMailer } from "~/mailers/createSmtpMailer";
import { createBuildMailerPlugin } from "~/plugins/CreateBuildMailerPlugin";

export { createDummyMailer, createSmtpMailer };
export type { SmtpMailerConfig, SmtpMailer, DummyMailer };

export {
    CreateBuildMailerPlugin,
    createBuildMailerPlugin
} from "~/plugins/CreateBuildMailerPlugin";

export const createMailer = (): PluginCollection => {
    return [
        /**
         * If something is wrong with the smtp mailer, we will initialize the dummy one.
         */
        createBuildMailerPlugin(async () => {
            return createDummyMailer();
        }),
        /**
         * Smtp mailer goes into the plugins after the dummy one because plugins are loaded in reverse.
         */
        createBuildMailerPlugin(async () => {
            return createSmtpMailer();
        }),
        createMailerContext()
    ];
};
