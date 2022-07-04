import { PluginCollection } from "@webiny/plugins/types";
import { createMailerContext } from "~/context";
import { MailerConfig } from "~/types";
import { createDummySender, DummySender } from "~/senders/createDummySender";
import { createSmtpSender, SmtpSenderConfig, SmtpSender } from "~/senders/createSmtpSender";

export { createDummySender, createSmtpSender };
export type { SmtpSenderConfig, SmtpSender, DummySender };

export const createMailer = (config?: MailerConfig): PluginCollection => {
    return [createMailerContext(config)];
};
