/**
 * We use any for input and output because they really can be anything.
 * Plugin, if exists, makes sure that response value is correct.
 */
import type { CmsModelField } from "@webiny/api-headless-cms/types/index.js";
import type { OpenSearchQuerySearchValuePlugins } from "./types.js";
import { getBaseFieldType } from "@webiny/api-headless-cms/utils/getBaseFieldType.js";

interface Params {
    plugins: OpenSearchQuerySearchValuePlugins;
    field: CmsModelField;
    value: any;
}

/**
 * Transformed value can be anything.
 */
export const transformValueForSearch = (params: Params): any => {
    const { field, plugins, value } = params;
    const fieldType = getBaseFieldType(field);
    const plugin = plugins[fieldType];
    if (!plugin) {
        return value;
    }
    return plugin.transform({ field, value });
};
