import { createSchema } from "../index";
import { PluginsContainer } from "@webiny/plugins/PluginsContainer";

export const setupSchema = async plugins => {
    const pluginsContainer = new PluginsContainer([plugins]);

    const schema = await createSchema({ plugins: pluginsContainer });

    const context = { plugins: pluginsContainer };

    return {
        schema,
        context
    };
};
