import WebinyError from "@webiny/error";
import type { CmsEntryOpenSearchValueSearch } from "~/features/CmsEntryOpenSearchValueSearch/index.js";
import type { OpenSearchQuerySearchValuePlugins } from "../types.js";

interface Params {
    valueSearches: CmsEntryOpenSearchValueSearch.Interface[];
}
export const createSearchPluginList = ({ valueSearches }: Params): OpenSearchQuerySearchValuePlugins => {
    return valueSearches.reduce<OpenSearchQuerySearchValuePlugins>((result, item) => {
        if (result[item.fieldType]) {
            throw new WebinyError(
                "There is a OpenSearchValueSearch defined for the field type.",
                "VALUE_SEARCH_ALREADY_EXISTS",
                {
                    fieldType: item.fieldType
                }
            );
        }
        result[item.fieldType] = item;
        return result;
    }, {});
};
