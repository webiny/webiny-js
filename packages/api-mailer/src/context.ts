import { ContextPlugin } from "@webiny/api";
import { MailerConfig, MailerContext } from "./types";
import { createMailerCrud } from "~/crud/mailer.crud";

export const createMailerContext = (config?: MailerConfig) => {
    return new ContextPlugin<MailerContext>(async context => {
        context.mailer = createMailerCrud(config);
    });
};
