import { CmsContentModelField, CmsContext } from "../../../../../types";
import { ElasticsearchQuerySearchValuePlugins } from "./searchPluginsList";

interface Args {
    plugins: ElasticsearchQuerySearchValuePlugins;
    field: CmsContentModelField;
    value: any;
    context: CmsContext;
}

export const transformValueForSearch = (args: Args) => {
    const { field, plugins, value, context } = args;
    const plugin = plugins[field.type];
    if (!plugin) {
        return value;
    }
    return plugin.transform({ field, value, context });
};
