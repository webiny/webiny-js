import { CmsContentModelField } from "@webiny/api-headless-cms/types";
import { ElasticsearchQuerySearchValuePlugins } from "./searchPluginsList";

interface Args {
    plugins: ElasticsearchQuerySearchValuePlugins;
    field: CmsContentModelField;
    value: any;
}

export const transformValueForSearch = ({ field, plugins, value }: Args) => {
    const plugin = plugins[field.type];
    if (!plugin) {
        return value;
    }
    return plugin.transform(field, value);
};
