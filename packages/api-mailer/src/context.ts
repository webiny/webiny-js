import { ContextPlugin } from "@webiny/api";
import { MailerContext } from "./types";
import { createTransporterCrud } from "~/crud/transporter.crud";
import { createSettingsCrud } from "~/crud/settings.crud";

export const createMailerContext = () => {
    return new ContextPlugin<MailerContext>(async context => {
        context.mailer = {
            ...(await createTransporterCrud(context)),
            ...(await createSettingsCrud(context))
        };
    });
};
