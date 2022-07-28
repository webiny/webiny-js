import { PluginCollection } from "@webiny/plugins/types";
import { createMailerContext } from "~/context";
import { MailerConfig } from "~/types";
import { createDummyMailer, DummyMailer } from "~/mailers/createDummyMailer";
import { createSmtpMailer, SmtpMailerConfig, SmtpMailer } from "~/mailers/createSmtpMailer";

export { createDummyMailer, createSmtpMailer };
export type { SmtpMailerConfig, SmtpMailer, DummyMailer };

export const createMailer = (config?: MailerConfig): PluginCollection => {
    return [createMailerContext(config)];
};
