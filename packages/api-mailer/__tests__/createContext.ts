import { MailerConfig, MailerContext } from "~/types";
import { createMailer } from "~/index";
import { Context, ContextPlugin } from "@webiny/handler";

export const createContext = async (config?: MailerConfig): Promise<MailerContext> => {
    const context = new Context({
        WEBINY_VERSION: process.env.WEBINY_VERSION || "unknown",
        plugins: createMailer(config)
    }) as unknown as MailerContext;

    for (const plugin of context.plugins.byType<ContextPlugin>(ContextPlugin.type)) {
        await plugin.apply(context);
    }

    return context;
};
