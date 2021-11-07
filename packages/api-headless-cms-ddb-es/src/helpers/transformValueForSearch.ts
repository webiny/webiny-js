import { ElasticsearchQuerySearchValuePlugins } from "./searchPluginsList";
import { CmsContentModelField } from "@webiny/api-headless-cms/types";

interface Params {
    plugins: ElasticsearchQuerySearchValuePlugins;
    field: CmsContentModelField;
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
