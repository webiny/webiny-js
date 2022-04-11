import { ElasticsearchIndexTemplatePlugin } from "~/plugins/definition/ElasticsearchIndexTemplatePlugin";
import { PluginsContainer } from "@webiny/plugins/types";
import WebinyError from "@webiny/error";

const validateTemplates = (plugins: ElasticsearchIndexTemplatePlugin[], type: string): void => {
    const names: string[] = [];
    for (const plugin of plugins) {
        const name = plugin.template.name;
        if (names.includes(name) === false) {
            names.push(name);
            continue;
        }
        throw new WebinyError(
            `Duplicate "${type}" template name.`,
            "DUPLICATE_ELASTICSEARCH_INDEX_TEMPLATE_NAME",
            {
                name
            }
        );
    }
};

export const listTemplatePlugins = <T extends ElasticsearchIndexTemplatePlugin>(
    container: PluginsContainer,
    type: string
): T[] => {
    const plugins = container.byType<T>(type);
    validateTemplates(plugins, type);
    return plugins;
};
