import { ElasticsearchQuerySearchValuePlugins } from "./searchPluginsList";
import { CmsModelField } from "@webiny/api-headless-cms/types";

interface Params {
    plugins: ElasticsearchQuerySearchValuePlugins;
    field: CmsModelField;
    value: any;
}

export const transformValueForSearch = (args: Params) => {
    const { field, plugins, value } = args;
    const plugin = plugins[field.type];
    if (!plugin) {
        return value;
    }
    return plugin.transform({ field, value });
};
