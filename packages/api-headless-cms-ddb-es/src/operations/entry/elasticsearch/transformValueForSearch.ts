/**
 * We use any for input and output because they really can be anything.
 * Plugin, if exists, makes sure that response value is correct.
 */
import { CmsModelField } from "@webiny/api-headless-cms/types";
import { ElasticsearchQuerySearchValuePlugins } from "./types";

interface Params {
    plugins: ElasticsearchQuerySearchValuePlugins;
    field: CmsModelField;
    value: any;
}

/**
 * Transformed value can be anything.
 */
export const transformValueForSearch = (params: Params): any => {
    const { field, plugins, value } = params;
    const plugin = plugins[field.type];
    if (!plugin) {
        return value;
    }
    return plugin.transform({ field, value });
};
