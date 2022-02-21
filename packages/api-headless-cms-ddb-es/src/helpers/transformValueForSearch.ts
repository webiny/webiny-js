import { ElasticsearchQuerySearchValuePlugins } from "./searchPluginsList";
import { CmsModelField } from "@webiny/api-headless-cms/types";

interface TransformValueForSearchParams {
    plugins: ElasticsearchQuerySearchValuePlugins;
    field: CmsModelField;
    value: any;
}

/**
 * Transformed can be anything.
 */
export const transformValueForSearch = (args: TransformValueForSearchParams): any => {
    const { field, plugins, value } = args;
    const plugin = plugins[field.type];
    if (!plugin) {
        return value;
    }
    return plugin.transform({ field, value });
};
