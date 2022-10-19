import { ContextPlugin } from "@webiny/api";
import { Mailer, MailerContext } from "./types";
import { createMailerCrud } from "~/crud/mailer.crud";
import WebinyError from "@webiny/error";
import { CreateBuildMailerPlugin } from "./plugins/CreateBuildMailerPlugin";

interface BuildMailerParams {
    plugins: CreateBuildMailerPlugin[];
    context: MailerContext;
}
const buildMailer = async (params: BuildMailerParams): Promise<Mailer> => {
    const { context, plugins } = params;

    for (const plugin of plugins) {
        try {
            return await plugin.buildMailer({
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

export const createMailerContext = () => {
    return new ContextPlugin<MailerContext>(async context => {
        /**
         * We need the last possible plugin which is defined.
         * The last plugins are our default ones with the default configurations.
         * If users wants to override them, they just need to add new plugin with their own configuration and it will be constructed first.
         */
        const plugins = context.plugins
            .byType<CreateBuildMailerPlugin>(CreateBuildMailerPlugin.type)
            .reverse();

        const mailer = await buildMailer({
            plugins,
            context
        });

        context.mailer = createMailerCrud({
            mailer
        });
    });
};
