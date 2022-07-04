import { PluginCollection } from "@webiny/plugins/types";
import { createMailerContext } from "~/context";
import { MailerConfig } from "~/types";

export const createMailer = (config: MailerConfig): PluginCollection => {
    return [createMailerContext(config)];
};
